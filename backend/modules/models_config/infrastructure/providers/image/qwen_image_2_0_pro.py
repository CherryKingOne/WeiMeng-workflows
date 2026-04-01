"""Qwen Image 2.0 Pro request contract.

IMPORTANT FOR FUTURE AI CODING TOOLS AND HUMAN MAINTAINERS:
1. This model uses DashScope's multimodal-generation HTTP interface, not OpenAI chat completions.
2. The official HTTP endpoint is:
   /services/aigc/multimodal-generation/generation
3. Request payload structure must follow the official docs exactly.
4. Do not write user API keys into code, comments, or registry JSON.
5. Keep provider-specific request shaping isolated in this file.
"""

from typing import Any


MODEL_FILE_SPEC = {
    "provider": "Alibaba Qwen",
    "category": "image",
    "module_name": "qwen_image_2_0_pro",
    "default_model_id": "qwen-image-2.0-pro",
    "default_base_url": "https://dashscope.aliyuncs.com/api/v1",
    "request_path": "/services/aigc/multimodal-generation/generation",
}


def build_multimodal_generation_request(
    *,
    model_id: str,
    messages: list[dict[str, Any]],
    parameters: dict[str, Any] | None = None,
) -> dict[str, Any]:
    """Build the official DashScope multimodal generation payload."""
    payload: dict[str, Any] = {
        "model": model_id,
        "input": {
            "messages": messages,
        },
    }
    if parameters:
        payload["parameters"] = parameters
    return payload
