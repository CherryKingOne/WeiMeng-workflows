"""Doubao Seedream 5.0 260128 request contract.

IMPORTANT FOR FUTURE AI CODING TOOLS AND HUMAN MAINTAINERS:
1. This model uses Volcengine Ark's OpenAI-compatible images.generate interface.
2. The payload format is not interchangeable with chat completions or DashScope's multimodal-generation body.
3. Official invocation shape is based on client.images.generate(...) with fields such as:
   model, prompt, size, output_format, response_format, stream, and extra_body.
4. Runtime API keys must come from persisted user data, never from code or registry JSON.
5. Keep provider-specific request shaping isolated in this file.
"""

from typing import Any


MODEL_FILE_SPEC = {
    "provider": "Volcengine Ark",
    "category": "image",
    "module_name": "doubao_seedream_5_0_260128",
    "default_model_id": "doubao-seedream-5-0-260128",
    "default_base_url": "https://ark.cn-beijing.volces.com/api/v3",
    "request_path": "/images/generations",
}


def build_images_generate_request(
    *,
    model_id: str,
    prompt: str,
    size: str,
    output_format: str = "png",
    response_format: str = "url",
    stream: bool = False,
    extra_body: dict[str, Any] | None = None,
) -> dict[str, Any]:
    """Build the OpenAI-compatible images.generate payload for Ark."""
    payload: dict[str, Any] = {
        "model": model_id,
        "prompt": prompt,
        "size": size,
        "output_format": output_format,
        "response_format": response_format,
    }
    if stream:
        payload["stream"] = True
    if extra_body:
        payload.update(extra_body)
    return payload
