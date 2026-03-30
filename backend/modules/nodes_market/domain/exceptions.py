"""Nodes market domain exceptions."""


class NodesMarketDomainError(Exception):
    """Base exception for nodes market domain failures."""


class NodeDefinitionNotFoundError(NodesMarketDomainError):
    """Raised when a node definition cannot be found."""

