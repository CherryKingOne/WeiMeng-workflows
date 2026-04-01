"""HTTP connectivity testing for OpenAI-compatible model endpoints."""

from __future__ import annotations

import json
import socket
from dataclasses import dataclass
from urllib import error, parse, request


@dataclass(frozen=True, slots=True)
class ConnectionTestResult:
    """Low-level connection test result."""

    ok: bool
    status_code: int | None
    tested_url: str
    message: str


class OpenAICompatibleConnectionTester:
    """Test connectivity by requesting the OpenAI-compatible /models endpoint."""

    def test(self, *, base_url: str, api_key: str) -> ConnectionTestResult:
        tested_url = self._build_models_url(base_url)
        headers = {
            "Accept": "application/json",
            "User-Agent": "WeiMeng-Workflows/1.0",
        }
        if api_key:
            headers["Authorization"] = f"Bearer {api_key}"

        http_request = request.Request(
            tested_url,
            method="GET",
            headers=headers,
        )

        try:
            with request.urlopen(http_request, timeout=8) as response:
                status_code = response.getcode()
                body = response.read()
                payload = self._try_parse_json(body)
                count = self._extract_model_count(payload)
                suffix = f"，返回 {count} 个模型" if count is not None else ""
                return ConnectionTestResult(
                    ok=True,
                    status_code=status_code,
                    tested_url=tested_url,
                    message=f"连接成功{suffix}",
                )
        except error.HTTPError as exc:
            payload = self._try_parse_json(exc.read())
            message = self._extract_error_message(payload) or exc.reason or "HTTP 请求失败"
            return ConnectionTestResult(
                ok=False,
                status_code=exc.code,
                tested_url=tested_url,
                message=f"连接失败: {message}",
            )
        except (error.URLError, ValueError, socket.timeout) as exc:
            reason = getattr(exc, "reason", None)
            message = str(reason or exc) or "网络连接失败"
            return ConnectionTestResult(
                ok=False,
                status_code=None,
                tested_url=tested_url,
                message=f"连接失败: {message}",
            )

    def _build_models_url(self, base_url: str) -> str:
        normalized_base_url = base_url.strip().rstrip("/")
        if not normalized_base_url:
            raise ValueError("BASE URL 不能为空")

        parsed = parse.urlparse(normalized_base_url)
        if parsed.scheme not in {"http", "https"} or not parsed.netloc:
            raise ValueError("BASE URL 必须是有效的 http/https 地址")

        if normalized_base_url.endswith("/models"):
            return normalized_base_url
        return f"{normalized_base_url}/models"

    def _try_parse_json(self, raw_body: bytes) -> object | None:
        if not raw_body:
            return None
        try:
            return json.loads(raw_body.decode("utf-8"))
        except (UnicodeDecodeError, json.JSONDecodeError):
            return None

    def _extract_model_count(self, payload: object | None) -> int | None:
        if not isinstance(payload, dict):
            return None
        data = payload.get("data")
        if isinstance(data, list):
            return len(data)
        return None

    def _extract_error_message(self, payload: object | None) -> str | None:
        if not isinstance(payload, dict):
            return None

        error_payload = payload.get("error")
        if isinstance(error_payload, dict):
            message = error_payload.get("message")
            if isinstance(message, str) and message.strip():
                return message.strip()

        message = payload.get("message")
        if isinstance(message, str) and message.strip():
            return message.strip()
        return None
