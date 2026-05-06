"""
SpaceMind OS — Sensor Service
Anomaly detection and IoT data processing.
Anomaly: reading deviates > 2 standard deviations from the device's recent history.
"""
from __future__ import annotations

import hashlib
import statistics
from datetime import UTC, datetime
from typing import Optional

from sqlalchemy.orm import Session

from spacemind.ai.client import AIClient
from spacemind.core.config import settings
from spacemind.domain.schemas import SensorIngest, SensorSummary, LatestSensorReading
from spacemind.storage.repository import SensorRepository


class SensorService:
    def __init__(self, db: Session):
        self._repo = SensorRepository(db)
        self._ai = AIClient()

    @staticmethod
    def hash_api_key(raw_key: str) -> str:
        return hashlib.sha256(raw_key.encode()).hexdigest()

    def authenticate_device(self, raw_api_key: str):
        key_hash = self.hash_api_key(raw_api_key)
        return self._repo.get_device_by_api_key_hash(key_hash)

    def ingest(self, device_id: str, payload: SensorIngest) -> dict:
        from spacemind.storage.repository import SensorRepository
        device = self._repo.get_device_by_api_key_hash("")  # won't be called directly
        # Caller resolves device; we accept device object via ingest_with_device
        raise NotImplementedError("Use ingest_with_device instead")

    def ingest_with_device(self, device, payload: SensorIngest) -> dict:
        recorded_at = (
            datetime.fromisoformat(payload.recorded_at)
            if payload.recorded_at
            else datetime.now(UTC)
        )
        if recorded_at.tzinfo is None:
            recorded_at = recorded_at.replace(tzinfo=UTC)

        is_anomaly = self._detect_anomaly(device.id, payload.value)

        reading = self._repo.save_reading(
            device=device,
            value=payload.value,
            unit=payload.unit,
            recorded_at=recorded_at,
            is_anomaly=is_anomaly,
        )
        return {
            "reading_id": reading.id,
            "sensor_id": device.id,
            "sensor_type": reading.sensor_type,
            "value": reading.value,
            "unit": reading.unit,
            "recorded_at": reading.recorded_at.isoformat(),
            "is_anomaly": reading.is_anomaly,
        }

    def _detect_anomaly(self, sensor_id: str, new_value: float) -> bool:
        """Return True if new_value is > 2 std devs from recent history."""
        history = self._repo.get_recent_readings_for_sensor(sensor_id, limit=50)
        if len(history) < 5:
            return False
        values = [r.value for r in history]
        mean = statistics.mean(values)
        try:
            stdev = statistics.stdev(values)
        except statistics.StatisticsError:
            return False
        if stdev == 0:
            return False
        return abs(new_value - mean) > 2 * stdev

    def get_latest_summary(self) -> SensorSummary:
        rows = self._repo.get_latest_readings()
        readings = [
            LatestSensorReading(
                sensor_type=row["reading"].sensor_type,
                location_id=row["reading"].location_id,
                zone_name=row["reading"].zone_name,
                value=row["reading"].value,
                unit=row["reading"].unit,
                recorded_at=row["reading"].recorded_at,
                is_anomaly=row["reading"].is_anomaly,
                sensor_name=row["device"].name,
            )
            for row in rows
        ]
        anomaly_count = sum(1 for r in readings if r.is_anomaly)
        total_sensors = len(self._repo.list_devices())
        return SensorSummary(
            readings=readings,
            anomaly_count=anomaly_count,
            total_sensors=total_sensors,
        )

    def get_history(self, sensor_type: Optional[str] = None,
                    location_id: Optional[str] = None, limit: int = 200):
        return self._repo.get_history(sensor_type=sensor_type, location_id=location_id, limit=limit)

    def get_anomalies(self, limit: int = 100):
        return self._repo.get_anomalies(limit=limit)

    def analyse_sensors(self) -> str:
        """AI narrative on current sensor environment."""
        summary = self.get_latest_summary()
        if not summary.readings:
            return "No sensor data available for analysis."

        lines = "\n".join(
            f"- {r.sensor_name} ({r.sensor_type}) @ {r.location_id or 'unknown'}/{r.zone_name or ''}: "
            f"{r.value} {r.unit}{'  ⚠ ANOMALY' if r.is_anomaly else ''}"
            for r in summary.readings
        )
        anomalies = self._repo.get_anomalies(limit=10)
        anomaly_text = f"{len(anomalies)} anomalies detected in recent history." if anomalies else "No recent anomalies."

        prompt = f"""You are a Facilities Management IoT specialist. Analyse the following live sensor readings and provide a brief environmental status report.

Current Sensor Readings:
{lines}

Anomaly Summary: {anomaly_text}

Provide:
1. Overall environment status (1 sentence)
2. Any concerns requiring immediate attention
3. Recommended actions (bullet list, max 3)

Be concise and actionable."""

        system = "You are a Facilities Management IoT specialist providing concise environmental status reports."
        text, _ = self._ai._call(
            system=system,
            user_message=prompt,
            model=settings.primary_model,
            max_tokens=400,
        )
        return text
