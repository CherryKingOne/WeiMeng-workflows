"""GPT-5.4 chat provider request contract.

IMPORTANT FOR FUTURE AI CODING TOOLS AND HUMAN MAINTAINERS:
1. The OpenAI request payload format in this file is a contract, not a guess.
2. Do not rewrite field names, message roles, or payload nesting heuristically.
3. Any request-shape change must be validated against the official provider API docs first.
4. Never hardcode user API keys in code, JSON registries, or frontend defaults.
5. Runtime credentials must be loaded from persisted data storage at execution time.
"""

from typing import Any


MODEL_FILE_SPEC = {
    "provider": "OpenAI",
    "category": "chat",
    "module_name": "gpt_5_4",
    "default_model_id": "gpt-5.4",
    "default_base_url": "https://api.openai.com/v1",
}


def build_chat_completions_request(
    *,
    model_id: str,
    messages: list[dict[str, Any]],
    temperature: float | None = None,
) -> dict[str, Any]:
    """Build an OpenAI chat completions payload for GPT-5.4."""
    payload: dict[str, Any] = {
        "model": model_id,
        "messages": messages,
    }
    if temperature is not None:
        payload["temperature"] = temperature
    return payload
