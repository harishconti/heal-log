from app.db.session import get_document_collection
from app.models.document import Document
from app.schemas.document import DocumentCreate
from typing import List

async def create_document(doc_data: DocumentCreate, user_id: str) -> Document:
    """
    Creates a new document record in the database.
    """
    document_collection = await get_document_collection()
    document = Document(
        patient_id=doc_data.patient_id,
        user_id=user_id,
        file_name=doc_data.file_name,
        storage_url=doc_data.storage_url
    )
    await document_collection.insert_one(document.model_dump())
    return document

async def get_documents_for_patient(
    patient_id: str,
    user_id: str,
    skip: int = 0,
    limit: int = 50
) -> List[Document]:
    """
    Retrieves all documents for a specific patient that belong to the user.
    Supports pagination with skip and limit parameters.
    """
    document_collection = await get_document_collection()
    documents_cursor = document_collection.find({
        "patient_id": patient_id,
        "user_id": user_id
    }).skip(skip).limit(limit)
    documents = await documents_cursor.to_list(length=limit)
    return [Document(**doc) for doc in documents]