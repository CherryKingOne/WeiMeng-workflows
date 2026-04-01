"""Models config data transfer objects."""

from dataclasses import asdict, dataclass, field

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
        )

    def to_dict(self) -> dict[str, str]:
        return asdict(self)


@dataclass(slots=True)
class ModelsConfigSnapshotDTO:
    """Full models config payload returned by list/save APIs."""

    categories: list[ModelCategoryDTO] = field(default_factory=list)
    models: list[ConfiguredModelDTO] = field(default_factory=list)

    def to_dict(self) -> dict[str, list[dict[str, str | int]]]:
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
