"""Settings IPC handlers."""

import shutil
from pathlib import Path

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

    def handle_get_download_dir(payload: dict[str, object]) -> dict[str, object]:
        _ = payload
        download_dir = container.settings_repository.get_download_dir()
        return {"status": "success", "data": {"download_dir": download_dir}}

    def handle_set_download_dir(payload: dict[str, object]) -> dict[str, object]:
        path = str(payload.get("path", "")).strip()
        if not path:
            return {"status": "error", "message": "路径不能为空"}
        container.settings_repository.set_download_dir(path)
        return {"status": "success", "data": {"download_dir": path}}

    def handle_get_cache_dir(payload: dict[str, object]) -> dict[str, object]:
        _ = payload
        cache_dir = container.settings_repository.get_cache_dir()
        return {"status": "success", "data": {"cache_dir": cache_dir}}

    def handle_set_cache_dir(payload: dict[str, object]) -> dict[str, object]:
        path = str(payload.get("path", "")).strip()
        if not path:
            return {"status": "error", "message": "路径不能为空"}
        container.settings_repository.set_cache_dir(path)
        return {"status": "success", "data": {"cache_dir": path}}

    def handle_clear_cache(payload: dict[str, object]) -> dict[str, object]:
        """清理缓存目录"""
        _ = payload
        cache_dir = container.settings_repository.get_cache_dir()
        
        if not cache_dir:
            return {"status": "success", "data": {"deleted_count": 0, "message": "未设置缓存目录"}}
        
        cache_path = Path(cache_dir)
        
        if not cache_path.exists():
            return {"status": "success", "data": {"deleted_count": 0, "message": "缓存目录不存在"}}
        
        try:
            deleted_count = 0
            # 遍历目录下的所有文件和文件夹（不删除目录本身）
            for item in cache_path.iterdir():
                if item.is_file():
                    item.unlink()
                    deleted_count += 1
                elif item.is_dir():
                    shutil.rmtree(item)
                    deleted_count += 1
            
            return {
                "status": "success",
                "data": {
                    "deleted_count": deleted_count,
                    "message": f"已清理 {deleted_count} 个文件/文件夹"
                }
            }
        except Exception as e:
            return {"status": "error", "message": f"清理失败: {str(e)}"}

    router.register("settings.list", handle_list_settings)
    router.register("settings.update", handle_update_setting)
    router.register("settings.getDownloadDir", handle_get_download_dir)
    router.register("settings.setDownloadDir", handle_set_download_dir)
    router.register("settings.getCacheDir", handle_get_cache_dir)
    router.register("settings.setCacheDir", handle_set_cache_dir)
    router.register("settings.clearCache", handle_clear_cache)
