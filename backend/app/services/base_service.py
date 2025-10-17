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
        # Add any additional filters from kwargs
        return await self.model.get(id, **kwargs)

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
        update_data = obj_in.dict(exclude_unset=True)
        if not update_data:
            return db_obj # No changes

        update_data["updated_at"] = datetime.utcnow()

        await db_obj.update({"$set": update_data})
        # Beanie's update doesn't refresh the object in place, so we need to reload it.
        # This is a bit inefficient, but ensures consistency.
        # A better approach might be to apply updates to the model in memory and then save.
        # Let's try that.

        updated_obj = db_obj.copy(update=update_data)
        await updated_obj.save()
        return updated_obj


    async def delete(self, id: str, **kwargs: Any) -> Optional[ModelType]:
        db_obj = await self.get(id, **kwargs)
        if not db_obj:
            return None
        await db_obj.delete()
        return db_obj