"""Settings IPC handlers."""

from core.container import ApplicationContainer
from core.ipc_router import IPCRouter
from modules.settings.application.dto import UpdateSettingCommand
from modules.settings.application.use_cases import (
    ListSettingsUseCase,
    UpdateSettingUseCase,
)
from modules.settings.domain.value_objects import SettingScope


def register_handlers(router: IPCRouter, container: ApplicationContainer) -> None:
    """Register settings IPC handlers."""

    def handle_list_settings(payload: dict[str, object]) -> dict[str, object]:
        _ = payload
        use_case = ListSettingsUseCase(container.settings_repository)
        result = [setting.to_dict() for setting in use_case.execute()]
        return {"status": "success", "data": result}

    def handle_update_setting(payload: dict[str, object]) -> dict[str, object]:
        scope_raw = str(payload.get("scope", SettingScope.USER.value))
        command = UpdateSettingCommand(
            key=str(payload.get("key", "")).strip(),
            value=payload.get("value", ""),
            scope=SettingScope(scope_raw),
        )
        use_case = UpdateSettingUseCase(container.settings_repository)
        result = use_case.execute(command)
        return {"status": "success", "data": result.to_dict()}

    router.register("settings.list", handle_list_settings)
    router.register("settings.update", handle_update_setting)
