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


def _normalize_output_image_count(value: Any) -> int:
    try:
        image_count = int(value)
    except (TypeError, ValueError):
        image_count = 1

    return max(1, min(image_count, 6))


def build_multimodal_generation_request(
    *,
    model_id: str,
    messages: list[dict[str, Any]],
    parameters: dict[str, Any] | None = None,
) -> dict[str, Any]:
    """Build the official DashScope multimodal generation payload."""
    raw_parameters = parameters if isinstance(parameters, dict) else {}
    normalized_parameters: dict[str, Any] = {
        "n": _normalize_output_image_count(raw_parameters.get("n")),
        "negative_prompt": " ",
        "prompt_extend": True,
        "watermark": False,
    }
    size = raw_parameters.get("size")
    if isinstance(size, str) and size.strip():
        normalized_parameters["size"] = size.strip()

    payload: dict[str, Any] = {
        "model": model_id,
        "input": {
            "messages": messages,
        },
        "parameters": normalized_parameters,
    }
    return payload
