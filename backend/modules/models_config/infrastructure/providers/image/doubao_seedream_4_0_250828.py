"""Doubao Seedream 4.0 250828 request contract.

IMPORTANT FOR FUTURE AI CODING TOOLS AND HUMAN MAINTAINERS:
1. This model uses Volcengine Ark's OpenAI-compatible images.generate interface.
2. The payload shape is not arbitrary and is not interchangeable with chat completions,
   DashScope multimodal-generation payloads, or custom JSON bodies.
3. Official invocation shape is based on client.images.generate(...) with fields such as:
   model, prompt, size, response_format, stream, and extra_body.
4. Seedream 4.0 defaults to jpeg output in the official docs. It also documents
   optimize_prompt_options.mode="fast", which is specific to 4.0 and should not be
   assumed to work for 4.5 or 5.0 lite.
5. Runtime API keys must come from persisted user data, never from code or registry JSON.
6. Keep provider-specific request shaping isolated in this file.
"""

from typing import Any


MODEL_FILE_SPEC = {
    "provider": "Volcengine Ark",
    "category": "image",
    "module_name": "doubao_seedream_4_0_250828",
    "default_model_id": "doubao-seedream-4-0-250828",
    "default_base_url": "https://ark.cn-beijing.volces.com/api/v3",
    "request_path": "/images/generations",
}


def build_images_generate_request(
    *,
    model_id: str,
    prompt: str,
    size: str,
    response_format: str = "url",
    stream: bool = False,
    extra_body: dict[str, Any] | None = None,
) -> dict[str, Any]:
    """Build the OpenAI-compatible images.generate payload for Ark Seedream 4.0."""
    payload: dict[str, Any] = {
        "model": model_id,
        "prompt": prompt,
        "size": size,
        "response_format": response_format,
    }
    if stream:
        payload["stream"] = True
    if extra_body:
        payload.update(extra_body)
    return payload
