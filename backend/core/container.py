"""Application container used to assemble module dependencies."""

from dataclasses import dataclass, field

from core.config import Settings, load_settings
from core.event_bus import EventBus
from modules.nodes_market.infrastructure.file_storage import NodeAssetStorage
from modules.nodes_market.infrastructure.sqlite_repo import NodeMarketSqliteRepository
from modules.settings.infrastructure.file_storage import SettingsFileStorage
from modules.settings.infrastructure.sqlite_repo import SettingsSqliteRepository
from modules.workflow_engine.infrastructure.file_storage import WorkflowFileStorage
from modules.workflow_engine.infrastructure.sqlite_repo import WorkflowSqliteRepository


@dataclass(slots=True)
class ApplicationContainer:
    """Holds infrastructure services shared by the presentation layer."""

    settings: Settings
    event_bus: EventBus = field(default_factory=EventBus)
    workflow_repository: WorkflowSqliteRepository = field(init=False)
    workflow_storage: WorkflowFileStorage = field(init=False)
    node_market_repository: NodeMarketSqliteRepository = field(init=False)
    node_asset_storage: NodeAssetStorage = field(init=False)
    settings_repository: SettingsSqliteRepository = field(init=False)
    settings_storage: SettingsFileStorage = field(init=False)

    def __post_init__(self) -> None:
        data_dir = self.settings.data_dir

        self.workflow_storage = WorkflowFileStorage(data_dir / "workflows")
        self.workflow_repository = WorkflowSqliteRepository()

        self.node_asset_storage = NodeAssetStorage(data_dir / "node_assets")
        self.node_market_repository = NodeMarketSqliteRepository()

        self.settings_storage = SettingsFileStorage(data_dir / "settings")
        self.settings_repository = SettingsSqliteRepository()


def build_container() -> ApplicationContainer:
    """Create the application container using environment-backed settings."""
    return ApplicationContainer(settings=load_settings())

