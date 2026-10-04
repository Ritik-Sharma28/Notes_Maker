"""Permission system for role-based access control."""
from enum import Enum


class Permission(str, Enum):
    """Available permissions in the system."""
    CREATE_SOURCE = "create_source"
    VIEW_SOURCE = "view_source"
    DELETE_SOURCE = "delete_source"
    VIEW_PROGRESS = "view_progress"
    ADMIN_VIEW_ALL = "admin_view_all"
    ADMIN_DELETE_ANY = "admin_delete_any"


def has_permission(user_role: str, permission: Permission) -> bool:
    """Check if user role has permission."""
    if user_role == "admin":
        return True

    # Regular user permissions
    regular_permissions = [
        Permission.CREATE_SOURCE,
        Permission.VIEW_SOURCE,
        Permission.VIEW_PROGRESS,
    ]

    return permission in regular_permissions
