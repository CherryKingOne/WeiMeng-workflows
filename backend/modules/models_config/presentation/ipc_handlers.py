"""Models config IPC handlers."""

from core.container import ApplicationContainer
from core.ipc_router import IPCRouter
from modules.models_config.application.dto import (
    GenerateImageCommand,
    SaveModelConfigCommand,
    TestModelConnectionCommand,
)
from modules.models_config.application.use_cases import (
    GenerateImageUseCase,
    ListModelsConfigUseCase,
    SaveModelsConfigUseCase,
    TestModelConnectionUseCase,
)
from modules.models_config.infrastructure.connection_tester import OpenAICompatibleConnectionTester
from modules.models_config.infrastructure.image_generation_client import ImageGenerationClient
from modules.models_config.infrastructure.provider_registry import ProviderRegistryLoader


def register_handlers(router: IPCRouter, container: ApplicationContainer) -> None:
    """Register models config IPC handlers."""

    registry_loader = ProviderRegistryLoader()
    connection_tester = OpenAICompatibleConnectionTester()
    image_generation_client = ImageGenerationClient()

    def handle_list_models_config(payload: dict[str, object]) -> dict[str, object]:
        _ = payload
        use_case = ListModelsConfigUseCase(
            container.settings_repository,
            registry_loader,
        )
        result = use_case.execute()
        return {"status": "success", "data": result.to_dict()}

    def handle_save_models_config(payload: dict[str, object]) -> dict[str, object]:
        raw_models = payload.get("models", [])
        if not isinstance(raw_models, list):
            return {"status": "error", "message": "models 必须是数组"}

        commands = [
            SaveModelConfigCommand(
                key=str(item.get("key", "")).strip(),
                model_id=str(item.get("model_id", "")).strip(),
                api_key=str(item.get("api_key", "")).strip(),
                base_url=str(item.get("base_url", "")).strip(),
            )
            for item in raw_models
            if isinstance(item, dict)
        ]

        use_case = SaveModelsConfigUseCase(
            container.settings_repository,
            registry_loader,
        )
        try:
            result = use_case.execute(commands)
        except ValueError as exc:
            return {"status": "error", "message": str(exc)}
        return {"status": "success", "data": result.to_dict()}

    def handle_test_model_connection(payload: dict[str, object]) -> dict[str, object]:
        command = TestModelConnectionCommand(
            key=str(payload.get("key", "")).strip(),
            api_key=str(payload.get("api_key", "")).strip(),
            base_url=str(payload.get("base_url", "")).strip(),
        )
        use_case = TestModelConnectionUseCase(
            registry_loader,
            connection_tester,
        )
        try:
            result = use_case.execute(command)
        except ValueError as exc:
            return {"status": "error", "message": str(exc)}
        return {"status": "success", "data": result.to_dict()}

    def handle_generate_image(payload: dict[str, object]) -> dict[str, object]:
        raw_input_images = payload.get("input_images", [])
        use_case = GenerateImageUseCase(
            container.settings_repository,
            registry_loader,
            image_generation_client,
        )
        try:
            image_count = int(payload.get("image_count", 1) or 1)
            command = GenerateImageCommand(
                key=str(payload.get("key", "")).strip(),
                prompt=str(payload.get("prompt", "")),
                input_images=raw_input_images if isinstance(raw_input_images, list) else [],
                size=str(payload.get("size", "1024*1024")).strip() or "1024*1024",
                image_count=image_count,
            )
            result = use_case.execute(command)
        except (ValueError, RuntimeError) as exc:
            return {"status": "error", "message": str(exc)}
        return {"status": "success", "data": result.to_dict()}

    router.register("models_config.list", handle_list_models_config)
    router.register("models_config.save", handle_save_models_config)
    router.register("models_config.test_connection", handle_test_model_connection)
    router.register("models_config.generate_image", handle_generate_image)
