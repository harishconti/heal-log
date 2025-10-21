from typing import Type, TypeVar, Generic, Optional, List, Dict, Any
from beanie import Document
from pydantic import BaseModel
import uuid
from datetime import datetime

ModelType = TypeVar("ModelType", bound=Document)
CreateSchemaType = TypeVar("CreateSchemaType", bound=BaseModel)
UpdateSchemaType = TypeVar("UpdateSchemaType", bound=BaseModel)

class BaseService(Generic[ModelType, CreateSchemaType, UpdateSchemaType]):
    def __init__(self, model: Type[ModelType]):
        self.model = model

    async def get(self, id: str, **kwargs: Any) -> Optional[ModelType]:
        """
        Get a single document by its ID and optional extra filters.
        This uses Beanie's query builder to handle field name mapping (e.g., id -> _id).
        """
        expressions = [getattr(self.model, "id") == id]
        for key, value in kwargs.items():
            expressions.append(getattr(self.model, key) == value)
        return await self.model.find_one(*expressions)

    async def get_multi(self, **kwargs: Any) -> List[ModelType]:
        return await self.model.find(kwargs).to_list()

    async def create(self, obj_in: CreateSchemaType, **kwargs: Any) -> ModelType:
        obj_in_data = obj_in.dict()
        # Add id and any other kwargs
        db_obj = self.model(**obj_in_data, id=str(uuid.uuid4()), **kwargs)
        await db_obj.insert()
        return db_obj

    async def update(
        self, db_obj: ModelType, obj_in: UpdateSchemaType
    ) -> ModelType:
        """
        Update a document in the database.
        This method is more efficient and uses modern Pydantic V2 methods.
        """
        update_data = obj_in.model_dump(exclude_unset=True)
        if not update_data:
            return db_obj  # No changes

        update_data["updated_at"] = datetime.utcnow()

        # Update the model in-memory
        updated_obj = db_obj.model_copy(update=update_data)

        # Save the changes to the database
        await updated_obj.save()
        return updated_obj


    async def delete(self, db_obj: ModelType) -> None:
        """
        Delete a document from the database.
        """
        await db_obj.delete()