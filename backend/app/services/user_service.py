"""User management service (admin CRUD + password change)."""

from typing import Optional

from app.core.exceptions import ForbiddenError, InvalidCredentialsError, NotFoundError
from app.core.security import verify_password
from app.dependencies.auth import CurrentUser
from app.repositories.activity_repository import ActivityRepository
from app.repositories.user_repository import UserRepository
from app.schemas.auth import UserCreateRequest, UserUpdateRequest
from app.schemas.common import ORMModel
from app.utils.pagination import Page, PageParams


class UserService:
    def __init__(self, session) -> None:  # noqa: ANN001
        self.session = session
        self.users = UserRepository(session)
        self.activities = ActivityRepository(session)

    async def list_users(self, params: PageParams, *, role: Optional[str] = None, search: Optional[str] = None) -> Page:
        return await self.users.paginate_users(params, role=role, search=search)

    async def get_user(self, user_id: int) -> ORMModel:
        return await self.users.get(user_id)

    async def create_user(self, payload: UserCreateRequest, actor: CurrentUser) -> ORMModel:
        user = await self.users.create_user(
            username=payload.username.strip(),
            email=payload.email.strip(),
            name=payload.name.strip(),
            plain_password=payload.password,
            role=payload.role.value,
            department_id=payload.department_id,
        )
        await self.activities.log(
            user_id=actor.id,
            action="user.create",
            description=f"Created user {user.username}",
            entity_type="user",
            entity_id=user.id,
        )
        return user

    async def update_user(self, user_id: int, payload: UserUpdateRequest, actor: CurrentUser) -> ORMModel:
        user = await self.users.get(user_id)
        data = payload.model_dump(exclude_unset=True)
        if "role" in data and data["role"] is not None:
            data["role"] = data["role"].value
        updated = await self.users.update(user, data)
        await self.activities.log(
            user_id=actor.id,
            action="user.update",
            description=f"Updated user {updated.username}",
            entity_type="user",
            entity_id=updated.id,
        )
        return updated

    async def delete_user(self, user_id: int, actor: CurrentUser) -> None:
        user = await self.users.get(user_id)
        if user.id == actor.id:
            raise ForbiddenError("You cannot delete your own account.")
        await self.users.delete(user)
        await self.activities.log(
            user_id=actor.id,
            action="user.delete",
            description=f"Deleted user {user.username}",
            entity_type="user",
            entity_id=user_id,
        )

    async def change_password(self, user_id: int, current_password: str, new_password: str) -> None:
        user = await self.users.get(user_id)
        if not verify_password(current_password, user.hashed_password):
            raise InvalidCredentialsError("Current password is incorrect.")
        await self.users.update_password(user_id, new_password)

    async def role_summary(self) -> list[dict]:
        return await self.users.list_roles()
