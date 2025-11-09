from app.schemas.telemetry import Telemetry, TelemetryEvent

class TelemetryService:
    async def create_event(self, user_id: str, event: TelemetryEvent) -> Telemetry:
        """
        Creates a new telemetry event.
        """
        telemetry_event = Telemetry(
            user_id=user_id,
            event_type=event.event_type,
            payload=event.payload
        )
        await telemetry_event.insert()
        return telemetry_event

telemetry_service = TelemetryService()
