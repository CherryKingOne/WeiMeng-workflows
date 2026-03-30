"""Settings persistence adapters."""

import sqlite3
from pathlib import Path
from typing import Optional

from modules.settings.domain.entities import SettingItem
from modules.settings.domain.repositories import SettingsRepository
from modules.settings.domain.value_objects import SettingScope


class SettingsSqliteRepository(SettingsRepository):
    """Settings store using SQLite for persistence."""

    def __init__(self, db_path: Optional[Path] = None) -> None:
        if db_path is None:
            db_path = Path(__file__).resolve().parent.parent.parent.parent / "data" / "settings.db"
        
        self._db_path = db_path
        self._ensure_db_dir()
        self._init_db()
        self._init_default_settings()

    def _ensure_db_dir(self) -> None:
        """确保数据库目录存在"""
        self._db_path.parent.mkdir(parents=True, exist_ok=True)

    def _get_connection(self) -> sqlite3.Connection:
        """获取数据库连接"""
        conn = sqlite3.connect(str(self._db_path))
        conn.row_factory = sqlite3.Row
        return conn

    def _init_db(self) -> None:
        """初始化数据库表"""
        with self._get_connection() as conn:
            conn.execute("""
                CREATE TABLE IF NOT EXISTS settings (
                    key TEXT PRIMARY KEY,
                    value TEXT NOT NULL,
                    scope TEXT NOT NULL DEFAULT 'user'
                )
            """)
            conn.commit()

    def _init_default_settings(self) -> None:
        """初始化默认设置（如果不存在）"""
        defaults = {
            "download_dir": ("", "user"),
            "cache_dir": ("", "user"),
            "theme": ("system", "user"),
            "auto_save_interval": ("60", "system"),
        }
        
        with self._get_connection() as conn:
            for key, (value, scope) in defaults.items():
                existing = conn.execute(
                    "SELECT key FROM settings WHERE key = ?",
                    (key,)
                ).fetchone()
                
                if not existing:
                    conn.execute(
                        "INSERT INTO settings (key, value, scope) VALUES (?, ?, ?)",
                        (key, value, scope)
                    )
            conn.commit()

    def save(self, setting: SettingItem) -> None:
        with self._get_connection() as conn:
            conn.execute(
                """
                INSERT OR REPLACE INTO settings (key, value, scope) 
                VALUES (?, ?, ?)
                """,
                (setting.key, str(setting.value), setting.scope.value)
            )
            conn.commit()

    def get(self, key: str) -> SettingItem | None:
        with self._get_connection() as conn:
            row = conn.execute(
                "SELECT key, value, scope FROM settings WHERE key = ?",
                (key,)
            ).fetchone()
            
            if row is None:
                return None
            
            return SettingItem(
                key=row["key"],
                value=row["value"],
                scope=SettingScope(row["scope"])
            )

    def list_all(self) -> list[SettingItem]:
        with self._get_connection() as conn:
            rows = conn.execute(
                "SELECT key, value, scope FROM settings"
            ).fetchall()
            
            return [
                SettingItem(
                    key=row["key"],
                    value=row["value"],
                    scope=SettingScope(row["scope"])
                )
                for row in rows
            ]

    def get_download_dir(self) -> str:
        """获取下载目录"""
        setting = self.get("download_dir")
        return setting.value if setting else ""

    def set_download_dir(self, path: str) -> None:
        """设置下载目录"""
        self.save(SettingItem(
            key="download_dir",
            value=path,
            scope=SettingScope.USER
        ))

    def get_cache_dir(self) -> str:
        """获取缓存目录"""
        setting = self.get("cache_dir")
        return setting.value if setting else ""

    def set_cache_dir(self, path: str) -> None:
        """设置缓存目录"""
        self.save(SettingItem(
            key="cache_dir",
            value=path,
            scope=SettingScope.USER
        ))
