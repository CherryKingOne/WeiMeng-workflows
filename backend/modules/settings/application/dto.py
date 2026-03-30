"""Settings data transfer objects."""

from dataclasses import asdict, dataclass

from modules.settings.domain.entities import SettingItem
from modules.settings.domain.value_objects import SettingScope


@dataclass(slots=True)
class UpdateSettingCommand:
    """Input payload for writing a setting value."""

    key: str
    value: str | bool | int
    scope: SettingScope


@dataclass(slots=True)
class SettingDTO:
    """Serializable setting item returned to the frontend."""

    key: str
    value: str | bool | int
    scope: str

    @classmethod
    def from_entity(cls, setting: SettingItem) -> "SettingDTO":
        return cls(
            key=setting.key,
            value=setting.value,
            scope=setting.scope.value,
        )

    def to_dict(self) -> dict[str, str | bool | int]:
        return asdict(self)

