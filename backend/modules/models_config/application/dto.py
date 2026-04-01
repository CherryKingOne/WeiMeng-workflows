"""Models config data transfer objects."""

from dataclasses import asdict, dataclass, field
from typing import Any

from modules.models_config.domain.entities import ConfiguredModel


@dataclass(slots=True)
class SaveModelConfigCommand:
    """Write model configuration payload received from the frontend."""

    key: str
    model_id: str
    api_key: str
    base_url: str


@dataclass(slots=True)
class TestModelConnectionCommand:
    """Test a model connection using the runtime form values."""

    key: str
    api_key: str
    base_url: str


@dataclass(slots=True)
class GenerateImageCommand:
    """Generate an image with the configured runtime model."""

    key: str
    prompt: str
    input_images: list[dict[str, Any]] = field(default_factory=list)
    size: str = "1024*1024"
    image_count: int = 1


@dataclass(slots=True)
class ModelCategoryDTO:
    """Serializable tab metadata returned to the frontend."""

    key: str
    label: str
    count: int

    def to_dict(self) -> dict[str, str | int]:
        return asdict(self)


@dataclass(slots=True)
class ConfiguredModelDTO:
    """Serializable model config returned to the frontend."""

    key: str
    display_name: str
    provider: str
    category: str
    module_name: str
    model_id: str
    api_key: str
    base_url: str
    parameter_spec: dict[str, Any] = field(default_factory=dict)

    @classmethod
    def from_entity(cls, model: ConfiguredModel) -> "ConfiguredModelDTO":
        return cls(
            key=model.key,
            display_name=model.display_name,
            provider=model.provider,
            category=model.category,
            module_name=model.module_name,
            model_id=model.model_id,
            api_key=model.api_key,
            base_url=model.base_url,
            parameter_spec=model.parameter_spec,
        )

    def to_dict(self) -> dict[str, Any]:
        return asdict(self)


@dataclass(slots=True)
class ModelsConfigSnapshotDTO:
    """Full models config payload returned by list/save APIs."""

    categories: list[ModelCategoryDTO] = field(default_factory=list)
    models: list[ConfiguredModelDTO] = field(default_factory=list)

    def to_dict(self) -> dict[str, list[dict[str, Any]]]:
        return {
            "categories": [item.to_dict() for item in self.categories],
            "models": [item.to_dict() for item in self.models],
        }


@dataclass(slots=True)
class TestModelConnectionResultDTO:
    """Serializable response for the connection test action."""

    key: str
    ok: bool
    status_code: int | None
    tested_url: str
    message: str

    def to_dict(self) -> dict[str, str | bool | int | None]:
        return asdict(self)


@dataclass(slots=True)
class GeneratedImageAssetDTO:
    """Serializable generated image payload."""

    base64: str | None = None
    url: str | None = None
    mime_type: str = "image/png"
    file_name: str = "generated-image.png"
    file_size: int = 0
    source_url: str | None = None

    def to_dict(self) -> dict[str, Any]:
        return asdict(self)


@dataclass(slots=True)
class GenerateImageResultDTO:
    """Serializable response for runtime image generation."""

    key: str
    request_id: str | None = None
    images: list[GeneratedImageAssetDTO] = field(default_factory=list)

    def to_dict(self) -> dict[str, Any]:
        return {
            "key": self.key,
            "request_id": self.request_id,
            "images": [item.to_dict() for item in self.images],
            "image": self.images[0].to_dict() if self.images else None,
        }
