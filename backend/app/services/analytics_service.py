from fastapi_cache.decorator import cache
from datetime import datetime, timedelta
from app.schemas.user import User
from app.schemas.patient import Patient
from app.schemas.clinical_note import ClinicalNote
from app.schemas.sync_event import SyncEvent

class AnalyticsService:
    @cache(namespace="get_patient_growth_analytics", expire=60)
    async def get_patient_growth_analytics(self):
        """
        Retrieves patient growth analytics.
        """
        return {"status": "ok"}

    async def get_health_analytics(self):
        """
        Retrieves health analytics for the application.
        """
        active_users = await User.find(
            {"updated_at": {"$gte": datetime.now() - timedelta(days=1)}}
        ).count()
        total_patients = await Patient.find().count()
        total_notes = await ClinicalNote.find().count()

        total_sync_events = await SyncEvent.find().count()
        successful_sync_events = await SyncEvent.find(
            {"success": True}
        ).count()

        sync_success_rate = successful_sync_events / total_sync_events if total_sync_events > 0 else 1.0

        return {
            "active_users": active_users,
            "total_patients": total_patients,
            "total_notes": total_notes,
            "sync_success_rate": sync_success_rate,
        }

analytics_service = AnalyticsService()