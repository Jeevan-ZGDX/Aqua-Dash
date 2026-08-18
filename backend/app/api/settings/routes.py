"""Settings API routes: app settings + user management + config."""

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.constants import Permissions
from app.database.session import get_db_session
from app.dependencies.auth import CurrentUser, require_permissions
from app.dependencies.params import pagination_params
from app.schemas.auth import ChangePasswordRequest, UserCreateRequest, UserUpdateRequest
from app.schemas.common import StandardResponse
from app.schemas.settings import AppConfigOut, SettingOut, SettingUpdate
from app.services.settings_service import SettingsService
from app.services.user_service import UserService
from app.utils.pagination import PageParams
from app.utils.responses import build_pagination, success_response

router = APIRouter(prefix="/settings", tags=["Settings"])


@router.get(
    "/config",
    response_model=StandardResponse[AppConfigOut],
    summary="Application configuration",
    description="Public feature flags and app metadata for the frontend.",
)
async def app_config(session: AsyncSession = Depends(get_db_session)) -> dict:
    config = await SettingsService(session).app_config()
    return success_response(data=config, message="Configuration retrieved.")


@router.get(
    "",
    response_model=StandardResponse[list],
    summary="List application settings",
)
async def list_settings(
    session: AsyncSession = Depends(get_db_session),
    _: CurrentUser = Depends(require_permissions(Permissions.SETTINGS_READ)),
) -> dict:
    data = await SettingsService(session).get_all()
    return success_response(data=data, message="Settings retrieved.")


@router.put(
    "/{key}",
    response_model=StandardResponse[SettingOut],
    summary="Update a setting",
)
async def update_setting(
    key: str,
    payload: SettingUpdate,
    session: AsyncSession = Depends(get_db_session),
    _: CurrentUser = Depends(require_permissions(Permissions.SETTINGS_UPDATE)),
) -> dict:
    data = await SettingsService(session).update(key, payload)
    return success_response(data=data, message="Setting updated.")


# ----------------------------------------------------------------------
# User management (admin surface)
# ----------------------------------------------------------------------
@router.get(
    "/users",
    response_model=StandardResponse[list],
    summary="List users",
    description="Paginated list of platform users (AHOD/HOD/Administrator/Faculty/Read Only).",
)
async def list_users(
    params: PageParams = Depends(pagination_params),
    role: str | None = None,
    search: str | None = None,
    session: AsyncSession = Depends(get_db_session),
    _: CurrentUser = Depends(require_permissions(Permissions.USER_LIST)),
) -> dict:
    page = await UserService(session).list_users(params, role=role, search=search)
    data = [
        {
            "id": u.id, "username": u.username, "email": u.email, "name": u.name,
            "role": u.role, "department_id": u.department_id, "is_active": u.is_active,
            "last_login_at": u.last_login_at.isoformat() if u.last_login_at else None,
            "created_at": u.created_at.isoformat() if u.created_at else None,
        }
        for u in page.items
    ]
    pagination = build_pagination(page=page.page, page_size=page.page_size, total=page.total)
    return success_response(data=data, pagination=pagination, message="Users retrieved.")


@router.post(
    "/users",
    response_model=StandardResponse[dict],
    summary="Create user",
    status_code=201,
)
async def create_user(
    payload: UserCreateRequest,
    session: AsyncSession = Depends(get_db_session),
    actor: CurrentUser = Depends(require_permissions(Permissions.USER_CREATE)),
) -> dict:
    user = await UserService(session).create_user(payload, actor)
    return success_response(data=_user_dict(user), message="User created.")


@router.patch(
    "/users/{user_id}",
    response_model=StandardResponse[dict],
    summary="Update user",
)
async def update_user(
    user_id: int,
    payload: UserUpdateRequest,
    session: AsyncSession = Depends(get_db_session),
    actor: CurrentUser = Depends(require_permissions(Permissions.USER_UPDATE)),
) -> dict:
    user = await UserService(session).update_user(user_id, payload, actor)
    return success_response(data=_user_dict(user), message="User updated.")


@router.delete(
    "/users/{user_id}",
    response_model=StandardResponse[None],
    summary="Delete user",
)
async def delete_user(
    user_id: int,
    session: AsyncSession = Depends(get_db_session),
    actor: CurrentUser = Depends(require_permissions(Permissions.USER_DELETE)),
) -> dict:
    await UserService(session).delete_user(user_id, actor)
    return success_response(data=None, message="User deleted.")


@router.post(
    "/users/me/password",
    response_model=StandardResponse[None],
    summary="Change own password",
)
async def change_password(
    payload: ChangePasswordRequest,
    session: AsyncSession = Depends(get_db_session),
    actor: CurrentUser = Depends(require_permissions(Permissions.AUTH_LOGIN)),
) -> dict:
    await UserService(session).change_password(actor.id, payload.current_password, payload.new_password)
    return success_response(data=None, message="Password changed.")


@router.get(
    "/roles",
    response_model=StandardResponse[list],
    summary="Role summary",
    description="Roles present in the system with user counts.",
)
async def role_summary(
    session: AsyncSession = Depends(get_db_session),
    _: CurrentUser = Depends(require_permissions(Permissions.USER_LIST)),
) -> dict:
    data = await UserService(session).role_summary()
    return success_response(data=data, message="Roles retrieved.")


def _user_dict(u) -> dict:
    return {
        "id": u.id, "username": u.username, "email": u.email, "name": u.name,
        "role": u.role, "department_id": u.department_id, "is_active": u.is_active,
        "last_login_at": u.last_login_at.isoformat() if u.last_login_at else None,
        "created_at": u.created_at.isoformat() if u.created_at else None,
    }
