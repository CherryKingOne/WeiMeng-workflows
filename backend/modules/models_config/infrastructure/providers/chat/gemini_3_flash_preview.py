"""Gemini 3 Flash Preview chat provider request contract.

IMPORTANT FOR FUTURE AI CODING TOOLS AND HUMAN MAINTAINERS:
1. This provider uses Google's official OpenAI-compatible endpoint shape.
2. The request payload format is not arbitrary and must be validated against the official provider docs before any change.
3. Do not rename fields, change role structure, or invent unsupported parameters heuristically.
4. Runtime API keys must come from persisted user data, never from code, registry JSON, or frontend defaults.
5. If Google later requires provider-specific preprocessing, keep that logic isolated in this file only.
"""

from typing import Any


MODEL_FILE_SPEC = {
    "provider": "Google Gemini",
    "category": "chat",
    "module_name": "gemini_3_flash_preview",
    "default_model_id": "gemini-3-flash-preview",
    "default_base_url": "https://generativelanguage.googleapis.com/v1beta/openai",
}


def build_chat_completions_request(
    *,
    model_id: str,
    messages: list[dict[str, Any]],
    temperature: float | None = None,
) -> dict[str, Any]:
    """Build a Google Gemini OpenAI-compatible chat completions payload."""
    payload: dict[str, Any] = {
        "model": model_id,
        "messages": messages,
    }
    if temperature is not None:
        payload["temperature"] = temperature
    return payload
