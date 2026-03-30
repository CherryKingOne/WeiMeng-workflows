"""Settings use cases."""

from modules.settings.application.dto import SettingDTO, UpdateSettingCommand
from modules.settings.domain.entities import SettingItem
from modules.settings.domain.repositories import SettingsRepository


class ListSettingsUseCase:
    """Return the current settings snapshot."""

    def __init__(self, repository: SettingsRepository) -> None:
        self._repository = repository

    def execute(self) -> list[SettingDTO]:
        settings = self._repository.list_all()
        return [SettingDTO.from_entity(item) for item in settings]


class UpdateSettingUseCase:
    """Persist a single setting update."""

    def __init__(self, repository: SettingsRepository) -> None:
        self._repository = repository

    def execute(self, command: UpdateSettingCommand) -> SettingDTO:
        setting = SettingItem(
            key=command.key,
            value=command.value,
            scope=command.scope,
        )
        self._repository.save(setting)
        return SettingDTO.from_entity(setting)

