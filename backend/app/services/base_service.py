from typing import Type, TypeVar, Generic, Optional, List, Dict, Any
from beanie import Document
from pydantic import BaseModel
import uuid
from datetime import datetime, timezone
import time
from functools import wraps
from app.schemas.query_performance_event import QueryPerformanceEvent

ModelType = TypeVar("ModelType", bound=Document)
CreateSchemaType = TypeVar("CreateSchemaType", bound=BaseModel)
UpdateSchemaType = TypeVar("UpdateSchemaType", bound=BaseModel)

def log_query_performance(func):
    @wraps(func)
    async def wrapper(*args, **kwargs):
        start_time = time.time()
        result = await func(*args, **kwargs)
        end_time = time.time()
        execution_time = end_time - start_time
        query = f"{func.__name__} on {args[0].model.__name__}"
        await QueryPerformanceEvent(query=query, execution_time=execution_time).insert()
        return result
    return wrapper

class BaseService(Generic[ModelType, CreateSchemaType, UpdateSchemaType]):
    def __init__(self, model: Type[ModelType]):
        self.model = model

    async def _get_model(self) -> Type[ModelType]:
        if callable(self.model):
            return await self.model()
        return self.model

    @log_query_performance
    async def get(self, id: str, **kwargs: Any) -> Optional[ModelType]:
        """
        Get a single document by its ID and optional extra filters.
        This uses Beanie's query builder to handle field name mapping (e.g., id -> _id).
        """
        model = await self._get_model()
        expressions = [getattr(model, "id") == id]
        for key, value in kwargs.items():
            expressions.append(getattr(model, key) == value)
        return await model.find_one(*expressions)

    @log_query_performance
    async def get_multi(self, **kwargs: Any) -> List[ModelType]:
        model = await self._get_model()
        skip = kwargs.pop("skip", 0)
        limit = kwargs.pop("limit", 100)
        return await model.find(kwargs).skip(skip).limit(limit).to_list()

    @log_query_performance
    async def create(self, obj_in: CreateSchemaType, **kwargs: Any) -> ModelType:
        model = await self._get_model()
        obj_in_data = obj_in.model_dump()
        # Add id and any other kwargs
        db_obj = model(**obj_in_data, id=str(uuid.uuid4()), **kwargs)
        await db_obj.insert()
        return db_obj

    @log_query_performance
    async def update(
        self, db_obj: ModelType, obj_in: UpdateSchemaType
    ) -> ModelType:
        """
        Update a document in the database.
        Uses a direct $set operation for efficiency and atomicity.
        """
        model = await self._get_model()
        update_data = obj_in.model_dump(exclude_unset=True)
        if not update_data:
            return db_obj  # No changes to apply

        update_data["updated_at"] = datetime.now(timezone.utc)

        await db_obj.set(update_data)

        # The db_obj is not updated in-place, so we reload it from the DB
        # to ensure the returned object is in sync with the database.
        updated_db_obj = await model.get(db_obj.id)
        return updated_db_obj

    @log_query_performance
    async def delete(self, db_obj: ModelType) -> None:
        """
        Delete a document from the database.
        """
        await db_obj.delete()