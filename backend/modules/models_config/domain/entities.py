"""Models config entities."""

from dataclasses import dataclass


@dataclass(frozen=True, slots=True)
class ModelDefinition:
    """Static model metadata loaded from the registry JSON files."""

    key: str
    display_name: str
    provider: str
    category: str
    module_name: str
    default_model_id: str
    default_base_url: str
    is_active: bool


@dataclass(slots=True)
class ConfiguredModel:
    """Runtime model config merged with persisted user data."""

    key: str
    display_name: str
    provider: str
    category: str
    module_name: str
    model_id: str
    api_key: str
    base_url: str
