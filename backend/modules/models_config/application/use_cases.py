"""Models config use cases."""

from collections import Counter

from modules.models_config.application.dto import (
    ConfiguredModelDTO,
    GenerateImageCommand,
    GenerateImageResultDTO,
    GeneratedImageAssetDTO,
    ModelCategoryDTO,
    ModelsConfigSnapshotDTO,
    SaveModelConfigCommand,
    TestModelConnectionCommand,
    TestModelConnectionResultDTO,
)
from modules.models_config.domain.entities import ConfiguredModel, ModelDefinition
from modules.models_config.infrastructure.connection_tester import OpenAICompatibleConnectionTester
from modules.models_config.infrastructure.image_generation_client import (
    ImageGenerationClient,
    ImageGenerationInputImage,
)
from modules.models_config.infrastructure.provider_registry import ProviderRegistryLoader
from modules.settings.domain.entities import SettingItem
from modules.settings.domain.repositories import SettingsRepository
from modules.settings.domain.value_objects import SettingScope


CATEGORY_ORDER = ("chat", "image", "video")
CATEGORY_LABELS = {
    "chat": "Chat",
    "image": "Image",
    "video": "Video",
}


def build_model_setting_key(model: ModelDefinition, field_name: str) -> str:
    """Create the persisted SQLite key for a model config field."""
    return f"models_config.{model.category}.{model.key}.{field_name}"


class ListModelsConfigUseCase:
    """Return the registry merged with persisted runtime values from SQLite."""

    def __init__(
        self,
        settings_repository: SettingsRepository,
        registry_loader: ProviderRegistryLoader,
    ) -> None:
        self._settings_repository = settings_repository
        self._registry_loader = registry_loader

    def execute(self) -> ModelsConfigSnapshotDTO:
        definitions = self._registry_loader.load_active_models()
        configured_models = [self._build_configured_model(item) for item in definitions]

        counter = Counter(model.category for model in configured_models)
        categories = [
            ModelCategoryDTO(
                key=category,
                label=CATEGORY_LABELS[category],
                count=counter[category],
            )
            for category in CATEGORY_ORDER
            if counter[category] > 0
        ]

        return ModelsConfigSnapshotDTO(
            categories=categories,
            models=[ConfiguredModelDTO.from_entity(item) for item in configured_models],
        )

    def _build_configured_model(self, definition: ModelDefinition) -> ConfiguredModel:
        model_id = self._read_setting_or_default(
            definition,
            "model_id",
            definition.default_model_id,
        )
        api_key = self._read_setting_or_default(definition, "api_key", "")
        base_url = self._read_setting_or_default(
            definition,
            "base_url",
            definition.default_base_url,
        )
        return ConfiguredModel(
            key=definition.key,
            display_name=definition.display_name,
            provider=definition.provider,
            category=definition.category,
            module_name=definition.module_name,
            model_id=model_id,
            api_key=api_key,
            base_url=base_url,
            parameter_spec=definition.parameter_spec,
        )

    def _read_setting_or_default(
        self,
        definition: ModelDefinition,
        field_name: str,
        default_value: str,
    ) -> str:
        setting = self._settings_repository.get(build_model_setting_key(definition, field_name))
        if setting is None:
            return default_value
        return str(setting.value)


class SaveModelsConfigUseCase:
    """Persist model configuration changes to SQLite without touching code files."""

    def __init__(
        self,
        settings_repository: SettingsRepository,
        registry_loader: ProviderRegistryLoader,
    ) -> None:
        self._settings_repository = settings_repository
        self._registry_loader = registry_loader

    def execute(self, commands: list[SaveModelConfigCommand]) -> ModelsConfigSnapshotDTO:
        definitions = {
            item.key: item
            for item in self._registry_loader.load_active_models()
        }

        for command in commands:
            definition = definitions.get(command.key)
            if definition is None:
                raise ValueError(f"未注册的模型 key: {command.key}")

            self._save_value(definition, "model_id", command.model_id.strip())
            self._save_value(definition, "api_key", command.api_key.strip())
            self._save_value(definition, "base_url", command.base_url.strip())

        return ListModelsConfigUseCase(
            self._settings_repository,
            self._registry_loader,
        ).execute()

    def _save_value(self, definition: ModelDefinition, field_name: str, value: str) -> None:
        self._settings_repository.save(
            SettingItem(
                key=build_model_setting_key(definition, field_name),
                value=value,
                scope=SettingScope.USER,
            )
        )


class TestModelConnectionUseCase:
    """Probe an OpenAI-compatible provider by requesting the /models endpoint."""

    def __init__(
        self,
        registry_loader: ProviderRegistryLoader,
        connection_tester: OpenAICompatibleConnectionTester,
    ) -> None:
        self._registry_loader = registry_loader
        self._connection_tester = connection_tester

    def execute(self, command: TestModelConnectionCommand) -> TestModelConnectionResultDTO:
        definitions = {
            item.key: item
            for item in self._registry_loader.load_active_models()
        }
        definition = definitions.get(command.key)
        if definition is None:
            raise ValueError(f"未注册的模型 key: {command.key}")

        result = self._connection_tester.test(
            base_url=command.base_url.strip(),
            api_key=command.api_key.strip(),
        )
        return TestModelConnectionResultDTO(
            key=command.key,
            ok=result.ok,
            status_code=result.status_code,
            tested_url=result.tested_url,
            message=result.message,
        )


class GenerateImageUseCase:
    """Call the configured image model and normalize the result."""

    def __init__(
        self,
        settings_repository: SettingsRepository,
        registry_loader: ProviderRegistryLoader,
        image_generation_client: ImageGenerationClient,
    ) -> None:
        self._settings_repository = settings_repository
        self._registry_loader = registry_loader
        self._image_generation_client = image_generation_client

    def execute(self, command: GenerateImageCommand) -> GenerateImageResultDTO:
        definitions = {
            item.key: item
            for item in self._registry_loader.load_active_models()
        }
        definition = definitions.get(command.key)
        if definition is None:
            raise ValueError(f"未注册的模型 key: {command.key}")
        if definition.category != "image":
            raise ValueError(f'模型 "{definition.display_name}" 不是图片模型。')

        model = self._build_configured_model(definition)
        if not model.api_key.strip():
            raise ValueError(f'模型 "{model.display_name}" 尚未配置 API Key。')
        if not model.base_url.strip():
            raise ValueError(f'模型 "{model.display_name}" 尚未配置 Base URL。')
        if not model.model_id.strip():
            raise ValueError(f'模型 "{model.display_name}" 尚未配置模型 ID。')

        input_images = [
            ImageGenerationInputImage(
                base64=str(item.get("base64", "")).strip() or None,
                url=str(item.get("url", "")).strip() or None,
                file_name=str(item.get("file_name", "")).strip() or None,
                mime_type=str(item.get("mime_type", "")).strip() or None,
                file_size=self._parse_optional_int(item.get("file_size")),
            )
            for item in command.input_images
            if isinstance(item, dict)
        ]

        result = self._image_generation_client.generate(
            model=model,
            prompt=command.prompt,
            input_images=input_images,
            size=command.size.strip() or "1024*1024",
            image_count=max(1, min(command.image_count, 6)),
        )
        return GenerateImageResultDTO(
            key=model.key,
            request_id=result.request_id,
            images=[
                GeneratedImageAssetDTO(
                    base64=item.base64,
                    url=item.url,
                    mime_type=item.mime_type,
                    file_name=item.file_name,
                    file_size=item.file_size,
                    source_url=item.source_url,
                )
                for item in result.images
            ],
        )

    def _build_configured_model(self, definition: ModelDefinition) -> ConfiguredModel:
        model_id = self._read_setting_or_default(
            definition,
            "model_id",
            definition.default_model_id,
        )
        api_key = self._read_setting_or_default(definition, "api_key", "")
        base_url = self._read_setting_or_default(
            definition,
            "base_url",
            definition.default_base_url,
        )
        return ConfiguredModel(
            key=definition.key,
            display_name=definition.display_name,
            provider=definition.provider,
            category=definition.category,
            module_name=definition.module_name,
            model_id=model_id,
            api_key=api_key,
            base_url=base_url,
            parameter_spec=definition.parameter_spec,
        )

    def _read_setting_or_default(
        self,
        definition: ModelDefinition,
        field_name: str,
        default_value: str,
    ) -> str:
        setting = self._settings_repository.get(build_model_setting_key(definition, field_name))
        if setting is None:
            return default_value
        return str(setting.value)

    def _parse_optional_int(self, value: object) -> int | None:
        if isinstance(value, int):
            return value

        if isinstance(value, str) and value.strip():
            try:
                return int(value.strip())
            except ValueError:
                return None

        return None
