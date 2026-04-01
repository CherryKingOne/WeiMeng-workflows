"""Kling V3 Video Generation request contract.

IMPORTANT FOR FUTURE AI CODING TOOLS AND HUMAN MAINTAINERS:
1. This model uses DashScope's asynchronous video-generation HTTP interface.
2. The request body shape is not arbitrary and is not interchangeable with OpenAI chat,
   OpenAI images.generate, or DashScope multimodal image generation payloads.
3. Official task creation endpoint is:
   /services/aigc/video-generation/video-synthesis
4. Official invocation requires the HTTP header X-DashScope-Async: enable.
   Do not assume synchronous calls are supported.
5. Official flow is two-step: create task first, then poll GET /tasks/{task_id}.
   Do not repeatedly create tasks while waiting for results.
6. The model, endpoint region, and API key region must match. This contract is for the
   China mainland Beijing endpoint only.
7. Runtime API keys must come from persisted user data, never from code or registry JSON.
8. Keep provider-specific request shaping isolated in this file.
"""

from typing import Any


MODEL_FILE_SPEC = {
    "provider": "Alibaba DashScope",
    "category": "video",
    "module_name": "kling_kling_v3_video_generation",
    "default_model_id": "kling/kling-v3-video-generation",
    "default_base_url": "https://dashscope.aliyuncs.com/api/v1",
    "request_path": "/services/aigc/video-generation/video-synthesis",
}

TASK_STATUS_PATH_TEMPLATE = "/tasks/{task_id}"
ASYNC_HEADER_NAME = "X-DashScope-Async"
ASYNC_HEADER_VALUE = "enable"


def build_video_synthesis_request(
    *,
    model_id: str,
    input_payload: dict[str, Any],
    parameters: dict[str, Any] | None = None,
) -> dict[str, Any]:
    """Build the official DashScope async video synthesis payload."""
    payload: dict[str, Any] = {
        "model": model_id,
        "input": input_payload,
    }
    if parameters:
        payload["parameters"] = parameters
    return payload
