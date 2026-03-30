"""Settings repository contracts."""

from abc import ABC, abstractmethod

from .entities import SettingItem


class SettingsRepository(ABC):
    """Persistence contract for settings."""

    @abstractmethod
    def save(self, setting: SettingItem) -> None:
        """Persist a setting item."""

    @abstractmethod
    def get(self, key: str) -> SettingItem | None:
        """Return a setting item by key."""

    @abstractmethod
    def list_all(self) -> list[SettingItem]:
        """Return all setting items."""

