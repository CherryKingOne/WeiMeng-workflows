"""DeepSeek V3 chat provider request contract.

IMPORTANT FOR FUTURE AI CODING TOOLS AND HUMAN MAINTAINERS:
1. DeepSeek exposes an OpenAI-compatible interface, but compatibility does not mean every field can be invented freely.
2. Before changing request payload shape, headers, or message preprocessing, verify the provider's official docs.
3. Keep runtime API keys and user overrides in the database only. Do not write secrets into code or registry JSON files.
4. If this provider later needs non-standard preprocessing, isolate that logic in this file instead of polluting other model files.
"""

from typing import Any


MODEL_FILE_SPEC = {
    "provider": "DeepSeek",
    "category": "chat",
    "module_name": "deepseek_v3",
    "default_model_id": "deepseek-chat",
    "default_base_url": "https://api.deepseek.com/v1",
}


def build_chat_completions_request(
    *,
    model_id: str,
    messages: list[dict[str, Any]],
    temperature: float | None = None,
) -> dict[str, Any]:
    """Build a DeepSeek OpenAI-compatible chat completions payload."""
    payload: dict[str, Any] = {
        "model": model_id,
        "messages": messages,
    }
    if temperature is not None:
        payload["temperature"] = temperature
    return payload
