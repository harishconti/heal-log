import logging
from datetime import datetime, timedelta
from app.core.hashing import get_password_hash
from app.db.session import UserCollection, PatientCollection, CounterCollection
from app.schemas.user import UserPlan, SubscriptionStatus
import uuid

# Configure logger for this module
logger = logging.getLogger(__name__)

async def init_dummy_data():
    """
    Creates dummy users and patients for testing if they don't already exist.
    """
    logger.info("Starting dummy data initialization...")
    try:
        # --- Create Demo Users ---
        demo_users = [
            {
                "id": "demo_user_1", "email": "dr.sarah@clinic.com", "phone": "+1234567890",
                "full_name": "Dr. Sarah Johnson", "medical_specialty": "cardiology",
                "password_hash": get_password_hash("password123"), "plan": UserPlan.PRO,
                "role": "doctor",
                "subscription_status": SubscriptionStatus.ACTIVE, "subscription_end_date": datetime.utcnow() + timedelta(days=365),
                "created_at": datetime.utcnow(), "updated_at": datetime.utcnow()
            },
            {
                "id": "demo_user_2", "email": "dr.mike@physio.com", "phone": "+1987654321",
                "full_name": "Dr. Mike Chen", "medical_specialty": "physiotherapy",
                "password_hash": get_password_hash("password123"), "plan": UserPlan.BASIC,
                "role": "doctor",
                "subscription_status": SubscriptionStatus.ACTIVE, "subscription_end_date": datetime.utcnow() + timedelta(days=30),
                "created_at": datetime.utcnow(), "updated_at": datetime.utcnow()
            }
        ]

        logger.info("Checking and inserting demo users...")
        for user_data in demo_users:
            if not await UserCollection.find_one({"email": user_data["email"]}):
                try:
                    result = await UserCollection.insert_one(user_data)
                    logger.info(f"Inserted user: {user_data['email']} with result: {result.inserted_id}")
                except Exception as e:
                    logger.error(f"Error inserting user {user_data['email']}: {e}")

        # --- Create Dummy Patients for Dr. Sarah (demo_user_1) ---
        sarah_user = await UserCollection.find_one({"email": "dr.sarah@clinic.com"})
        if not sarah_user:
            logger.warning("Could not find dr.sarah@clinic.com to create patients for.")
            return

        user_id_sarah = sarah_user["id"]
        if await PatientCollection.count_documents({"user_id": user_id_sarah}) > 0:
            logger.info(f"Patients for {user_id_sarah} already exist. Skipping creation.")
            return

        logger.info("Creating dummy patients for Dr. Sarah...")
        dummy_patients = [
            {
                "id": str(uuid.uuid4()), "patient_id": "PAT001", "user_id": user_id_sarah, "name": "John Wilson",
                "phone": "+1555123456", "email": "john.wilson@email.com", "address": "123 Main St, Springfield",
                "location": "Clinic Room 1", "initial_complaint": "Chest pain", "initial_diagnosis": "Suspected angina", "photo": "",
                "group": "cardiology", "is_favorite": True,
                "notes": [{"id": str(uuid.uuid4()), "content": "Initial consultation.", "timestamp": datetime.utcnow(), "visit_type": "initial", "created_by": "Dr. Sarah Johnson"}],
                "created_at": datetime.utcnow(), "updated_at": datetime.utcnow()
            },
            {
                "id": str(uuid.uuid4()), "patient_id": "PAT002", "user_id": user_id_sarah, "name": "Emma Rodriguez",
                "phone": "+1555987654", "email": "emma.r@email.com", "address": "456 Oak Ave, Springfield",
                "location": "Clinic Room 2", "initial_complaint": "High blood pressure review", "initial_diagnosis": "Hypertension", "photo": "",
                "group": "cardiology", "is_favorite": False, "notes": [],
                "created_at": datetime.utcnow(), "updated_at": datetime.utcnow()
            },
            {
                "id": str(uuid.uuid4()), "patient_id": "PAT003", "user_id": user_id_sarah, "name": "Robert Chang",
                "phone": "+1555456789", "email": "robert.chang@email.com", "address": "789 Pine St, Springfield",
                "location": "Home Visit", "initial_complaint": "Diabetic foot care", "initial_diagnosis": "Diabetic neuropathy", "photo": "",
                "group": "endocrinology", "is_favorite": False, "notes": [],
                "created_at": datetime.utcnow(), "updated_at": datetime.utcnow()
            },
            {
                "id": str(uuid.uuid4()), "patient_id": "PAT004", "user_id": user_id_sarah, "name": "Lisa Thompson",
                "phone": "+1555654321", "email": "lisa.thompson@email.com", "address": "321 Elm Dr, Springfield",
                "location": "Clinic Room 1", "initial_complaint": "Pregnancy cardiac monitoring", "initial_diagnosis": "Benign heart murmur", "photo": "",
                "group": "obstetric_cardiology", "is_favorite": True, "notes": [],
                "created_at": datetime.utcnow(), "updated_at": datetime.utcnow()
            },
            {
                "id": str(uuid.uuid4()), "patient_id": "PAT005", "user_id": user_id_sarah, "name": "David Miller",
                "phone": "+1555789012", "email": "david.miller@email.com", "address": "654 Maple Ave, Springfield",
                "location": "Clinic Room 3", "initial_complaint": "Post-cardiac surgery follow-up", "initial_diagnosis": "Post-operative recovery", "photo": "",
                "group": "post_surgical", "is_favorite": False, "notes": [],
                "created_at": datetime.utcnow(), "updated_at": datetime.utcnow()
            }
        ]

        if dummy_patients:
            await PatientCollection.insert_many(dummy_patients)
            logger.info(f"Inserted {len(dummy_patients)} patients.")

        # --- Set up Counters ---
        await CounterCollection.update_one(
            {"_id": f"patient_id_{user_id_sarah}"},
            {"$set": {"sequence": len(dummy_patients)}},
            upsert=True
        )
        logger.info("Counter for Dr. Sarah updated.")

        logger.info("Dummy data initialization complete.")

    except Exception as e:
        logger.error(f"An unexpected error occurred during dummy data initialization: {e}", exc_info=True)
        raise e