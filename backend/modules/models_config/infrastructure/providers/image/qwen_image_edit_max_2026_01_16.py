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

MODEL_PARAMETER_SPEC = {
    "input_image_mode": "base64_data_url",
    "supports_multiple_input_images": True,
    "supports_multiple_output_images": True,
    "defaults": {
        "aspect_ratio": "1:1",
        "resolution": "1K",
        "image_count": "1",
    },
    "aspect_ratio_options": [
        {"label": "1:1", "value": "1:1"},
        {"label": "2:3", "value": "2:3"},
        {"label": "3:2", "value": "3:2"},
        {"label": "3:4", "value": "3:4"},
        {"label": "4:3", "value": "4:3"},
        {"label": "9:16", "value": "9:16"},
        {"label": "16:9", "value": "16:9"},
        {"label": "21:9", "value": "21:9"},
    ],
    "resolution_options": [
        {
            "label": "1K",
            "value": "1K",
            "size_map": {
                "1:1": "1024*1024",
                "2:3": "1024*1536",
                "3:2": "1536*1024",
                "3:4": "1080*1440",
                "4:3": "1440*1080",
                "9:16": "1080*1920",
                "16:9": "1280*720",
                "21:9": "1344*576",
            },
        },
        {
            "label": "1.5K",
            "value": "1.5K",
            "size_map": {
                "1:1": "1536*1536",
                "2:3": "1024*1536",
                "3:2": "1536*1024",
                "3:4": "1080*1440",
                "4:3": "1440*1080",
                "9:16": "1080*1920",
                "16:9": "1920*1080",
                "21:9": "2048*872",
            },
        },
        {
            "label": "2K",
            "value": "2K",
            "size_map": {
                "1:1": "2048*2048",
                "2:3": "1024*1536",
                "3:2": "1536*1024",
                "3:4": "1080*1440",
                "4:3": "1440*1080",
                "9:16": "1080*1920",
                "16:9": "1920*1080",
                "21:9": "2048*872",
            },
        },
    ],
    "image_count_options": [
        {"label": "1张", "value": "1"},
        {"label": "2张", "value": "2"},
        {"label": "3张", "value": "3"},
        {"label": "4张", "value": "4"},
        {"label": "5张", "value": "5"},
        {"label": "6张", "value": "6"},
    ],
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
