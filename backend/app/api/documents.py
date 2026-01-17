from fastapi import APIRouter, Depends, status, Request, Query
from typing import List
from app.core.security import require_pro_user
from app.core.exceptions import BadRequestException, NotFoundException, InternalServerException
from app.core.logger import get_logger
from app.services import document_service
from app.schemas.document import DocumentCreate, Document
from app.schemas.user import User
from app.core.limiter import limiter

logger = get_logger(__name__)

router = APIRouter()

@router.post("/", response_model=Document, status_code=status.HTTP_201_CREATED)
@limiter.limit("10/minute")
async def upload_document(
    request: Request,
    doc_data: DocumentCreate,
    current_user: User = Depends(require_pro_user)
):
    """
    Create a new document record. This is a PRO feature.
    """
    try:
        document = await document_service.create_document(doc_data, current_user.id)
        return document
    except ValueError as e:
        raise BadRequestException(message=str(e))
    except Exception as e:
        logger.error("document_create_failed", user_id=str(current_user.id), error=str(e))
        raise InternalServerException("An unexpected error occurred while creating the document record.")

@router.get("/{patient_id}", response_model=List[Document])
@limiter.limit("30/minute")
async def get_patient_documents(
    request: Request,
    patient_id: str,
    skip: int = Query(0, ge=0, description="Number of documents to skip"),
    limit: int = Query(50, ge=1, le=100, description="Maximum documents to return"),
    current_user: User = Depends(require_pro_user)
):
    """
    Get all documents for a specific patient. This is a PRO feature.
    Supports pagination with skip and limit parameters.
    """
    try:
        documents = await document_service.get_documents_for_patient(
            patient_id, current_user.id, skip=skip, limit=limit
        )
        return documents
    except ValueError as e:
        raise NotFoundException(resource="Patient", identifier=patient_id)
    except Exception as e:
        logger.error("documents_fetch_failed", patient_id=patient_id, error=str(e))
        raise InternalServerException("An unexpected error occurred while fetching documents.")