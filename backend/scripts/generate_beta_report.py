import asyncio
from datetime import datetime, timedelta
import os
import sys

# Add the project root to the Python path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..')))

from backend.app.services.analytics_service import AnalyticsService
from backend.app.db.session import connect_to_mongo, close_mongo_connection, get_database
from beanie import init_beanie
from backend.app.schemas.user import User
from backend.app.schemas.patient import Patient
from backend.app.schemas.clinical_note import ClinicalNote
from backend.app.schemas.document import Document
from backend.app.schemas.feedback import Feedback
from backend.app.schemas.telemetry import Telemetry
from backend.app.schemas.error_event import ErrorEvent
from backend.app.schemas.query_performance_event import QueryPerformanceEvent
from backend.app.schemas.sync_event import SyncEvent


async def generate_report():
    """
    Generates a weekly beta report.
    """
    await connect_to_mongo()
    db = await get_database()
    await init_beanie(
        database=db,
        document_models=[User, Patient, ClinicalNote, Document, Feedback, Telemetry, ErrorEvent, QueryPerformanceEvent, SyncEvent],
    )
    analytics_service = AnalyticsService()
    health_data = await analytics_service.get_health_analytics()

    # User Engagement
    screen_views = await Telemetry.find(
        {"event_type": "screen_view"}
    ).count()

    # Feature Usage
    feature_adoption = await Telemetry.find(
        {"event_type": "feature_adoption"}
    ).aggregate(
        [{"$group": {"_id": "$payload.featureName", "count": {"$sum": 1}}}]
    ).to_list(length=None)

    feature_usage = "\n".join(
        [f"- **{f['_id']}**: {f['count']} times" for f in feature_adoption]
    )

    # Common Errors
    common_errors_pipeline = [
        {"$group": {"_id": {"path": "$path", "error": "$error"}, "count": {"$sum": 1}}},
        {"$sort": {"count": -1}},
        {"$limit": 5}
    ]
    common_errors_cursor = ErrorEvent.aggregate(common_errors_pipeline)
    common_errors_list = await common_errors_cursor.to_list(length=None)
    common_errors = "\n".join(
        [f"- **{e['_id']['path']}**: {e['_id']['error']} ({e['count']} times)" for e in common_errors_list]
    ) if common_errors_list else "No errors recorded."

    # Database Query Performance
    query_performance_pipeline = [
        {"$group": {"_id": "$query", "avg_time": {"$avg": "$execution_time"}}},
        {"$sort": {"avg_time": -1}}
    ]
    query_performance_cursor = QueryPerformanceEvent.aggregate(query_performance_pipeline)
    query_performance_list = await query_performance_cursor.to_list(length=None)
    query_performance = "\n".join(
        [f"- **{q['_id']}**: {q['avg_time']:.4f}s avg" for q in query_performance_list]
    ) if query_performance_list else "No query performance data available."


    await close_mongo_connection()

    report = f"""
    # Weekly Beta Report - {datetime.now().strftime("%Y-%m-%d")}

    ## Key Metrics
    - **Active Users (24h):** {health_data['active_users']}
    - **Total Patients:** {health_data['total_patients']}
    - **Total Notes:** {health_data['total_notes']}
    - **Sync Success Rate:** {health_data['sync_success_rate'] * 100:.2f}%

    ## User Engagement
    - **Total Screen Views:** {screen_views}

    ## Feature Usage
    {feature_usage}

    ## Common Errors
    {common_errors}

    ## Database Query Performance
    {query_performance}

    ## Notes
    - This report is automatically generated.
    - All analytics are anonymous and GDPR compliant.
    """

    print(report)

if __name__ == "__main__":
    asyncio.run(generate_report())
