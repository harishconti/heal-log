from datetime import datetime
from typing import Dict, Any, List
from app.db.session import PatientCollection, ClinicalNoteCollection
from app.models.user import User

async def pull_changes(last_pulled_at: int, user_id: str) -> Dict[str, Any]:
    """
    Pull changes from the database since the last pulled timestamp.
    """
    last_pulled_at_dt = datetime.fromtimestamp(last_pulled_at / 1000)

    # Fetch changes from all relevant collections
    patient_changes = await get_collection_changes(PatientCollection, last_pulled_at_dt, user_id)
    note_changes = await get_collection_changes(ClinicalNoteCollection, last_pulled_at_dt, user_id)

    changes = {
        "patients": patient_changes,
        "clinical_notes": note_changes,
    }

    return {
        "changes": changes,
        "timestamp": int(datetime.now().timestamp() * 1000)
    }

async def get_collection_changes(collection, last_pulled_at_dt: datetime, user_id: str) -> Dict[str, List[Dict]]:
    """
    Generic function to get changes from a collection.
    """
    created_cursor = collection.find({
        "user_id": user_id,
        "created_at": {"$gt": last_pulled_at_dt}
    })
    updated_cursor = collection.find({
        "user_id": user_id,
        "updated_at": {"$gt": last_pulled_at_dt},
        "created_at": {"$lte": last_pulled_at_dt}
    })

    created = await created_cursor.to_list(length=None)
    updated = await updated_cursor.to_list(length=None)

    # We don't have a way to track deletions yet.
    # This will be handled in a future iteration.

    return {
        "created": [doc for doc in created],
        "updated": [doc for doc in updated],
        "deleted": []
    }

async def push_changes(changes: Dict[str, Any], user_id: str):
    """
    Push changes from the client to the database.
    """
    # Process changes for each table
    if "patients" in changes:
        await process_collection_changes(PatientCollection, changes["patients"], user_id)

    if "clinical_notes" in changes:
        await process_collection_changes(ClinicalNoteCollection, changes["clinical_notes"], user_id)

async def process_collection_changes(collection, collection_changes: Dict[str, List[Dict]], user_id: str):
    """
    Generic function to process creates, updates, and deletes for a collection.
    """
    if "created" in collection_changes:
        for doc in collection_changes["created"]:
            doc["user_id"] = user_id
            await collection.insert_one(doc)

    if "updated" in collection_changes:
        for doc in collection_changes["updated"]:
            doc["updated_at"] = datetime.utcnow()
            await collection.update_one(
                {"id": doc["id"], "user_id": user_id},
                {"$set": doc}
            )

    if "deleted" in collection_changes:
        for doc_id in collection_changes["deleted"]:
            await collection.delete_one({"id": doc_id, "user_id": user_id})