"""Settings persistence adapters."""

from modules.settings.domain.entities import SettingItem
from modules.settings.domain.repositories import SettingsRepository
from modules.settings.domain.value_objects import SettingScope


class SettingsSqliteRepository(SettingsRepository):
    """Bootstrap settings store using in-memory persistence."""

    def __init__(self) -> None:
        self._items: dict[str, SettingItem] = {
            "theme": SettingItem(
                key="theme",
                value="system",
                scope=SettingScope.USER,
            ),
            "auto_save_interval": SettingItem(
                key="auto_save_interval",
                value=60,
                scope=SettingScope.SYSTEM,
            ),
        }

    def save(self, setting: SettingItem) -> None:
        self._items[setting.key] = setting

    def get(self, key: str) -> SettingItem | None:
        return self._items.get(key)

    def list_all(self) -> list[SettingItem]:
        return list(self._items.values())

