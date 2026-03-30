"""Workflow engine domain exceptions."""


class WorkflowDomainError(Exception):
    """Base exception for workflow engine domain failures."""


class WorkflowNotFoundError(WorkflowDomainError):
    """Raised when the requested workflow does not exist."""


class NodeConnectionError(WorkflowDomainError):
    """Raised when a workflow edge is not valid."""

