"""User repository with auth-oriented queries."""

from datetime import datetime, timedelta, timezone

from sqlalchemy import func, or_, select, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.constants import Limits
from app.core.exceptions import DuplicateRecordError
from app.core.security import hash_password
from app.models.user import User
from app.repositories.base import BaseRepository
from app.utils.pagination import Page, PageParams


class UserRepository(BaseRepository[User]):
    model = User

    async def find_by_username_or_email(self, username: str) -> User | None:
        stmt = select(User).where(or_(User.username == username, User.email == username))
        return await self.session.scalar(stmt)

    async def find_by_email(self, email: str) -> User | None:
        return await self.session.scalar(select(User).where(User.email == email))

    async def find_by_username(self, username: str) -> User | None:
        return await self.session.scalar(select(User).where(User.username == username))

    async def ensure_unique(self, *, username: str | None = None, email: str | None = None, exclude_id: int | None = None) -> None:
        conditions = []
        if username:
            conditions.append(User.username == username)
        if email:
            conditions.append(User.email == email)
        if not conditions:
            return
        stmt = select(User).where(or_(*conditions))
        if exclude_id:
            stmt = stmt.where(User.id != exclude_id)
        existing = await self.session.scalar(stmt)
        if existing:
            if username and existing.username == username:
                raise DuplicateRecordError(f"Username '{username}' is already taken.")
            raise DuplicateRecordError(f"Email '{email}' is already registered.")

    async def create_user(
        self,
        *,
        username: str,
        email: str,
        name: str,
        plain_password: str,
        role: str,
        department_id: int | None,
    ) -> User:
        await self.ensure_unique(username=username, email=email)
        user = User(
            username=username,
            email=email,
            name=name,
            hashed_password=hash_password(plain_password),
            role=role,
            department_id=department_id,
        )
        self.session.add(user)
        await self.session.flush()
        return user

    async def paginate_users(self, params: PageParams, *, role: str | None = None, search: str | None = None) -> Page[User]:
        stmt = select(User)
        if role:
            stmt = stmt.where(User.role == role)
        if search:
            like = f"%{search}%"
            stmt = stmt.where(
                or_(User.name.ilike(like), User.username.ilike(like), User.email.ilike(like))
            )
        count_stmt = select(func.count()).select_from(stmt.subquery())
        total = int((await self.session.scalar(count_stmt)) or 0)
        stmt = stmt.order_by(User.created_at.desc()).offset(params.offset).limit(params.limit)
        items = (await self.session.scalars(stmt)).all()
        return Page(items, total, params)

    async def record_login_success(self, user: User, ip: str | None = None) -> None:
        user.last_login_at = datetime.now(timezone.utc)
        user.failed_login_attempts = 0
        user.locked_until = None
        await self.session.flush()

    async def record_login_failure(self, user: User) -> bool:
        """Increment failure counter; return True if account became locked."""
        user.failed_login_attempts = (user.failed_login_attempts or 0) + 1
        if user.failed_login_attempts >= Limits.MAX_LOGIN_ATTEMPTS:
            user.locked_until = datetime.now(timezone.utc) + timedelta(minutes=15)
        await self.session.flush()
        return user.locked_until is not None

    async def count_users(self) -> int:
        return await self.count()

    async def update_password(self, user_id: int, new_password: str) -> None:
        await self.session.execute(
            update(User)
            .where(User.id == user_id)
            .values(hashed_password=hash_password(new_password), locked_until=None, failed_login_attempts=0)
        )
        await self.session.flush()

    async def list_roles(self) -> list[dict]:
        stmt = select(User.role, func.count(User.id)).group_by(User.role)
        rows = (await self.session.execute(stmt)).all()
        return [{"role": r, "count": c} for r, c in rows]
