"""Search service delegating to the dynamic search repository."""

from sqlalchemy.ext.asyncio import AsyncSession

from app.repositories.student_repository import StudentRepository
from app.schemas.search import StudentSearchRequest
from app.utils.pagination import Page


class SearchService:
    def __init__(self, session: AsyncSession) -> None:
        self.session = session
        self.students = StudentRepository(session)

    async def search_students(self, req: StudentSearchRequest) -> Page:
        return await self.students.search(req)

    async def export_records(self, req: StudentSearchRequest, max_rows: int = 10_000) -> list:
        return await self.students.list_for_export(req, max_rows=max_rows)
