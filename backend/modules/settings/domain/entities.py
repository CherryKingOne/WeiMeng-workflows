"""Settings entities."""

from dataclasses import dataclass

from .value_objects import SettingScope


@dataclass(slots=True)
class SettingItem:
    """Represents a single persisted setting value."""

    key: str
    value: str | bool | int
    scope: SettingScope

