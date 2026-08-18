"""Pagination helpers shared across services and repositories."""

from typing import Generic, Sequence, TypeVar

from pydantic import BaseModel

from app.core.constants import Limits

T = TypeVar("T")


class PageParams(BaseModel):
    page: int = Limits.DEFAULT_PAGE
    page_size: int = Limits.DEFAULT_PAGE_SIZE

    def __init__(self, **data):  # noqa: D105
        super().__init__(**data)
        if self.page < 1:
            self.page = 1
        self.page_size = min(max(self.page_size, 1), Limits.MAX_PAGE_SIZE)

    @property
    def offset(self) -> int:
        return (self.page - 1) * self.page_size

    @property
    def limit(self) -> int:
        return self.page_size


class Page(Generic[T]):
    """Generic paginated result container."""

    def __init__(self, items: Sequence[T], total: int, params: PageParams) -> None:
        self.items = list(items)
        self.total = total
        self.page = params.page
        self.page_size = params.page_size
        self.total_pages = (total + params.page_size - 1) // params.page_size if params.page_size else 0

    def to_dict(self) -> dict:
        return {
            "items": self.items,
            "total": self.total,
            "page": self.page,
            "page_size": self.page_size,
            "total_pages": self.total_pages,
        }
