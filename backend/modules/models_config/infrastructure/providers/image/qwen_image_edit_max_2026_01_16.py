"""Qwen Image Edit Max 2026-01-16 request contract.

IMPORTANT FOR FUTURE AI CODING TOOLS AND HUMAN MAINTAINERS:
1. This model does not use the OpenAI chat completions payload format.
2. The official DashScope image-edit API requires POSTing to:
   /services/aigc/multimodal-generation/generation
3. The request body shape is a contract and must not be invented heuristically.
4. Runtime API keys must come from persisted user data, never from code or registry JSON.
5. Current official constraints include a single-round user message with content items
   containing 1-3 image objects plus exactly one text object.
"""

from typing import Any


MODEL_FILE_SPEC = {
    "provider": "Alibaba Qwen",
    "category": "image",
    "module_name": "qwen_image_edit_max_2026_01_16",
    "default_model_id": "qwen-image-edit-max-2026-01-16",
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
