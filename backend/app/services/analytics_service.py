from fastapi_cache.decorator import cache
from datetime import datetime, timedelta, timezone
from app.schemas.user import User
from app.schemas.patient import Patient
from app.schemas.clinical_note import ClinicalNote
from app.schemas.sync_event import SyncEvent

class AnalyticsService:
    @cache(namespace="get_patient_growth_analytics", expire=60)
    async def get_patient_growth_analytics(self, user_id: str):
        """
        Retrieves patient growth analytics (patients added per month).
        """
        pipeline = [
            {"$match": {"user_id": user_id}},
            {
                "$group": {
                    "_id": {
                        "year": {"$year": "$created_at"},
                        "month": {"$month": "$created_at"}
                    },
                    "count": {"$sum": 1}
                }
            },
            {"$sort": {"_id.year": 1, "_id.month": 1}}
        ]
        growth_data = await Patient.aggregate(pipeline).to_list()
        
        # Format for frontend: "YYYY-MM"
        formatted_data = []
        for item in growth_data:
            year = item["_id"]["year"]
            month = item["_id"]["month"]
            formatted_data.append({
                "period": f"{year}-{month:02d}",
                "count": item["count"]
            })
            
        return formatted_data

    @cache(namespace="get_notes_analytics", expire=60)
    async def get_notes_analytics(self, user_id: str):
        """
        Retrieves notes creation analytics (notes added per month).
        """
        pipeline = [
            {"$match": {"user_id": user_id}},
            {
                "$group": {
                    "_id": {
                        "year": {"$year": "$created_at"},
                        "month": {"$month": "$created_at"}
                    },
                    "count": {"$sum": 1}
                }
            },
            {"$sort": {"_id.year": 1, "_id.month": 1}}
        ]
        notes_data = await ClinicalNote.aggregate(pipeline).to_list()
        
        formatted_data = []
        for item in notes_data:
            year = item["_id"]["year"]
            month = item["_id"]["month"]
            formatted_data.append({
                "period": f"{year}-{month:02d}",
                "count": item["count"]
            })
            
        return formatted_data

    @cache(namespace="get_activity_analytics", expire=60)
    async def get_activity_analytics(self, user_id: str):
        """
        Retrieves activity analytics (most active days of week).
        """
        pipeline = [
            {"$match": {"user_id": user_id}},
            {
                "$group": {
                    "_id": {"$dayOfWeek": "$created_at"},
                    "count": {"$sum": 1}
                }
            },
            {"$sort": {"_id": 1}}
        ]
        # 1=Sunday, 2=Monday, ...
        activity_data = await ClinicalNote.aggregate(pipeline).to_list()
        
        days_map = {1: "Sun", 2: "Mon", 3: "Tue", 4: "Wed", 5: "Thu", 6: "Fri", 7: "Sat"}
        formatted_data = []
        for item in activity_data:
            formatted_data.append({
                "day": days_map.get(item["_id"], "Unknown"),
                "count": item["count"]
            })
            
        return formatted_data

    @cache(namespace="get_demographics_analytics", expire=60)
    async def get_demographics_analytics(self, user_id: str):
        """
        Retrieves patient demographics (by group).
        """
        pipeline = [
            {"$match": {"user_id": user_id, "group": {"$ne": None}}},
            {"$group": {"_id": "$group", "count": {"$sum": 1}}},
            {"$sort": {"count": -1}}
        ]
        group_stats = await Patient.aggregate(pipeline).to_list()
        
        formatted_data = []
        for item in group_stats:
            formatted_data.append({
                "group": item["_id"],
                "count": item["count"]
            })
            
        return formatted_data

    async def get_health_analytics(self):
        """
        Retrieves health analytics for the application.
        """
        active_users = await User.find(
            {"updated_at": {"$gte": datetime.now(timezone.utc) - timedelta(days=1)}}
        ).count()
        total_patients = await Patient.find().count()
        total_notes = await ClinicalNote.find().count()

        total_sync_events = await SyncEvent.find().count()
        successful_sync_events = await SyncEvent.find(
            {"success": True}
        ).count()

        sync_success_rate = successful_sync_events / total_sync_events if total_sync_events > 0 else 0.0

        return {
            "active_users": active_users,
            "total_patients": total_patients,
            "total_notes": total_notes,
            "sync_success_rate": sync_success_rate,
        }

analytics_service = AnalyticsService()