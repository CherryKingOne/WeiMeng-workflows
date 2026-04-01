"""Runtime image generation client for configured image models."""

from __future__ import annotations

import base64
import importlib
from dataclasses import dataclass, field
from pathlib import PurePosixPath
from typing import Any
from urllib.parse import urlparse

import requests

from modules.models_config.domain.entities import ConfiguredModel


DEFAULT_IMAGE_MIME_TYPE = "image/png"


@dataclass(slots=True)
class ImageGenerationInputImage:
    """Normalized input image payload received from the frontend."""

    base64: str | None = None
    url: str | None = None
    file_name: str | None = None
    mime_type: str | None = None
    file_size: int | None = None


@dataclass(slots=True)
class GeneratedImageAsset:
    """A generated image that is ready for the frontend to render."""

    base64: str | None = None
    url: str | None = None
    mime_type: str = DEFAULT_IMAGE_MIME_TYPE
    file_name: str = "generated-image.png"
    file_size: int = 0
    source_url: str | None = None


@dataclass(slots=True)
class ImageGenerationResult:
    """Normalized image generation result."""

    request_id: str | None = None
    images: list[GeneratedImageAsset] = field(default_factory=list)


class ImageGenerationClient:
    """Call the provider-specific image generation HTTP API."""

    def generate(
        self,
        *,
        model: ConfiguredModel,
        prompt: str,
        input_images: list[ImageGenerationInputImage],
        size: str,
        image_count: int,
    ) -> ImageGenerationResult:
        module = self._load_provider_module(model)
        model_spec = getattr(module, "MODEL_FILE_SPEC", {})
        request_path = str(model_spec.get("request_path", "")).strip()
        if not request_path:
            raise ValueError(f'模型 "{model.display_name}" 缺少请求路径配置')

        payload = self._build_request_payload(
            module=module,
            model=model,
            prompt=prompt,
            input_images=input_images,
            size=size,
            image_count=image_count,
        )
        response = requests.post(
            self._join_url(model.base_url, request_path),
            headers={
                "Content-Type": "application/json",
                "Authorization": f"Bearer {model.api_key}",
            },
            json=payload,
            timeout=(10, 180),
        )
        response_payload = self._parse_json_response(response)

        if not response.ok:
            raise RuntimeError(self._extract_error_message(response_payload, response.text))

        images = self._extract_generated_images(response_payload)
        if not images:
            raise RuntimeError("模型返回成功，但未包含可用图片结果。")

        return ImageGenerationResult(
            request_id=self._extract_request_id(response_payload, response),
            images=images,
        )

    def _load_provider_module(self, model: ConfiguredModel):
        import_path = f"modules.models_config.infrastructure.providers.{model.category}.{model.module_name}"
        return importlib.import_module(import_path)

    def _build_request_payload(
        self,
        *,
        module: Any,
        model: ConfiguredModel,
        prompt: str,
        input_images: list[ImageGenerationInputImage],
        size: str,
        image_count: int,
    ) -> dict[str, Any]:
        if hasattr(module, "build_multimodal_generation_request"):
            content: list[dict[str, str]] = []
            for input_image in input_images[:3]:
                image_value = input_image.base64 or input_image.url
                if image_value:
                    content.append({"image": image_value})

            if prompt.strip():
                content.append({"text": prompt.strip()})

            if not content:
                raise ValueError("请输入提示词，或至少连接一张输入图片后再生成。")

            return module.build_multimodal_generation_request(
                model_id=model.model_id,
                messages=[{"role": "user", "content": content}],
                parameters={
                    "n": image_count,
                    "size": size,
                    "watermark": False,
                },
            )

        if hasattr(module, "build_images_generate_request"):
            if input_images:
                raise ValueError(f'当前模型 "{model.display_name}" 暂不支持参考图输入。')
            if not prompt.strip():
                raise ValueError("请输入提示词后再生成图片。")

            return module.build_images_generate_request(
                model_id=model.model_id,
                prompt=prompt.strip(),
                size=size,
                extra_body={"n": image_count},
            )

        raise ValueError(f'模型 "{model.display_name}" 暂未接入图片生成请求构造器。')

    def _join_url(self, base_url: str, request_path: str) -> str:
        normalized_base_url = base_url.rstrip("/")
        normalized_path = request_path if request_path.startswith("/") else f"/{request_path}"
        return f"{normalized_base_url}{normalized_path}"

    def _parse_json_response(self, response: requests.Response) -> dict[str, Any]:
        try:
            payload = response.json()
        except ValueError:
            payload = {}
        return payload if isinstance(payload, dict) else {}

    def _extract_error_message(self, payload: dict[str, Any], fallback_text: str) -> str:
        candidate_messages = [
            payload.get("message"),
            payload.get("error"),
        ]
        nested_error = payload.get("error")
        if isinstance(nested_error, dict):
            candidate_messages.extend(
                [
                    nested_error.get("message"),
                    nested_error.get("code"),
                ]
            )

        for message in candidate_messages:
            if isinstance(message, str) and message.strip():
                return message.strip()

        return fallback_text.strip() or "模型服务调用失败。"

    def _extract_request_id(
        self,
        payload: dict[str, Any],
        response: requests.Response,
    ) -> str | None:
        candidate_values = [
            payload.get("request_id"),
            response.headers.get("x-request-id"),
            response.headers.get("X-Request-Id"),
        ]
        for value in candidate_values:
            if isinstance(value, str) and value.strip():
                return value.strip()
        return None

    def _extract_generated_images(self, payload: dict[str, Any]) -> list[GeneratedImageAsset]:
        images: list[GeneratedImageAsset] = []

        output = payload.get("output")
        if isinstance(output, dict):
            choices = output.get("choices")
            if isinstance(choices, list):
                for choice in choices:
                    if not isinstance(choice, dict):
                        continue
                    message = choice.get("message")
                    if not isinstance(message, dict):
                        continue
                    content = message.get("content")
                    if not isinstance(content, list):
                        continue
                    for item in content:
                        if not isinstance(item, dict):
                            continue
                        image_value = item.get("image")
                        if isinstance(image_value, str) and image_value.strip():
                            asset = self._asset_from_image_value(image_value.strip())
                            if asset:
                                images.append(asset)

        data_items = payload.get("data")
        if isinstance(data_items, list):
            for index, item in enumerate(data_items):
                if not isinstance(item, dict):
                    continue

                b64_json = item.get("b64_json")
                if isinstance(b64_json, str) and b64_json.strip():
                    mime_type = self._resolve_mime_type(item.get("mime_type"))
                    binary = base64.b64decode(b64_json)
                    images.append(
                        GeneratedImageAsset(
                            base64=f"data:{mime_type};base64,{b64_json}",
                            mime_type=mime_type,
                            file_name=f"generated-image-{index + 1}.{self._extension_for_mime_type(mime_type)}",
                            file_size=len(binary),
                        )
                    )
                    continue

                for key in ("url", "image_url"):
                    image_value = item.get(key)
                    if isinstance(image_value, str) and image_value.strip():
                        asset = self._asset_from_image_value(image_value.strip())
                        if asset:
                            images.append(asset)
                        break

        return images

    def _asset_from_image_value(self, image_value: str) -> GeneratedImageAsset | None:
        if image_value.startswith("data:"):
            return self._asset_from_data_url(image_value)

        if image_value.startswith("http://") or image_value.startswith("https://"):
            try:
                return self._asset_from_remote_url(image_value)
            except Exception:
                file_name = self._guess_filename_from_url(image_value, "generated-image.png")
                return GeneratedImageAsset(
                    url=image_value,
                    mime_type=DEFAULT_IMAGE_MIME_TYPE,
                    file_name=file_name,
                    file_size=0,
                    source_url=image_value,
                )

        return None

    def _asset_from_data_url(self, data_url: str) -> GeneratedImageAsset:
        header, _, encoded = data_url.partition(",")
        mime_type = DEFAULT_IMAGE_MIME_TYPE
        if header.startswith("data:"):
            mime_type = header[5:].split(";", 1)[0] or DEFAULT_IMAGE_MIME_TYPE

        binary = base64.b64decode(encoded) if encoded else b""
        return GeneratedImageAsset(
            base64=data_url,
            mime_type=mime_type,
            file_name=f"generated-image.{self._extension_for_mime_type(mime_type)}",
            file_size=len(binary),
        )

    def _asset_from_remote_url(self, image_url: str) -> GeneratedImageAsset:
        response = requests.get(image_url, timeout=(10, 180))
        response.raise_for_status()

        mime_type = self._resolve_mime_type(response.headers.get("Content-Type"))
        encoded = base64.b64encode(response.content).decode("utf-8")
        file_name = self._guess_filename_from_url(
            image_url,
            f"generated-image.{self._extension_for_mime_type(mime_type)}",
        )
        return GeneratedImageAsset(
            base64=f"data:{mime_type};base64,{encoded}",
            url=image_url,
            mime_type=mime_type,
            file_name=file_name,
            file_size=len(response.content),
            source_url=image_url,
        )

    def _resolve_mime_type(self, raw_content_type: Any) -> str:
        if isinstance(raw_content_type, str) and raw_content_type.strip():
            return raw_content_type.split(";", 1)[0].strip() or DEFAULT_IMAGE_MIME_TYPE
        return DEFAULT_IMAGE_MIME_TYPE

    def _extension_for_mime_type(self, mime_type: str) -> str:
        mapping = {
            "image/jpeg": "jpg",
            "image/jpg": "jpg",
            "image/png": "png",
            "image/webp": "webp",
        }
        return mapping.get(mime_type.lower(), "png")

    def _guess_filename_from_url(self, image_url: str, fallback_name: str) -> str:
        parsed = urlparse(image_url)
        candidate = PurePosixPath(parsed.path).name
        return candidate or fallback_name
