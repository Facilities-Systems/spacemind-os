"""
SpaceMind OS — Report Service
Generates AI-powered executive briefs and KPI summaries using live FM data.
"""
from __future__ import annotations

from datetime import UTC, datetime
from typing import Optional

from sqlalchemy.orm import Session

from spacemind.ai.client import AIClient
from spacemind.core.config import settings
from spacemind.core.logging import log
from spacemind.services.asset_service import AssetService
from spacemind.services.medical_service import MedicalService
from spacemind.services.sensor_service import SensorService


class ReportService:
    def __init__(self, db: Session):
        self._db = db
        self._ai = AIClient()

    def _gather_fm_snapshot(self) -> dict:
        """Collect live metrics from all FM domains."""
        snapshot: dict = {"generated_at": datetime.now(UTC).isoformat()}

        # Assets
        try:
            svc = AssetService(self._db)
            analytics = svc.get_analytics()
            schedule = svc.get_maintenance_schedule()
            risk = svc.get_risk_report()
            snapshot["assets"] = {
                "total": analytics.get("total_assets", 0),
                "active": analytics.get("active_count", 0),
                "avg_condition": analytics.get("avg_condition_score", 0),
                "portfolio_value": analytics.get("total_portfolio_value", 0),
                "overdue_maintenance": analytics.get("overdue_maintenance_count", 0),
                "high_risk_count": sum(1 for r in risk if r.get("risk_level") == "high"),
                "due_soon_count": len(schedule),
            }
        except Exception as e:
            log.warning(f"ReportService: could not load asset data: {e}")
            snapshot["assets"] = {}

        # Medical
        try:
            med = MedicalService(self._db)
            alerts = med.get_alerts(days_ahead=30)
            analytics = med.get_analytics()
            snapshot["medical"] = {
                "expired_items": len(alerts.get("expired", [])),
                "expiring_soon": len(alerts.get("expiring_soon", [])),
                "low_stock": len(alerts.get("low_stock", [])),
                "open_incidents": analytics.get("open_incidents", 0) if hasattr(analytics, "get") else 0,
            }
        except Exception as e:
            log.warning(f"ReportService: could not load medical data: {e}")
            snapshot["medical"] = {}

        # Sensors
        try:
            sensor = SensorService(self._db)
            summary = sensor.get_latest_summary()
            snapshot["sensors"] = {
                "total_sensors": summary.total_sensors,
                "anomaly_count": summary.anomaly_count,
                "readings": [
                    {"type": r.sensor_type, "value": r.value, "unit": r.unit,
                     "zone": r.zone_name, "anomaly": r.is_anomaly}
                    for r in summary.readings
                ],
            }
        except Exception as e:
            log.warning(f"ReportService: could not load sensor data: {e}")
            snapshot["sensors"] = {}

        return snapshot

    def generate_executive_brief(self) -> str:
        """AI-generated executive summary of the facility's current status."""
        snap = self._gather_fm_snapshot()
        now = datetime.now(UTC).strftime("%d %B %Y, %H:%M UTC")

        assets = snap.get("assets", {})
        medical = snap.get("medical", {})
        sensors = snap.get("sensors", {})

        sensor_lines = "\n".join(
            f"  - {r['type'].replace('_', ' ').title()}: {r['value']} {r['unit']}"
            f" @ {r['zone'] or 'General'}"
            + (" ⚠ ANOMALY" if r['anomaly'] else "")
            for r in sensors.get("readings", [])
        ) or "  - No sensor data available"

        prompt = f"""You are a Senior Facilities Manager writing an executive brief for the Board of Directors.

Date: {now}

LIVE FACILITY DATA:

Asset Portfolio:
- Total assets: {assets.get("total", "N/A")}
- Active: {assets.get("active", "N/A")}
- Average condition score: {assets.get("avg_condition", "N/A")}/10
- Portfolio value: R{assets.get("portfolio_value", 0):,.0f}
- Assets overdue for maintenance: {assets.get("overdue_maintenance", "N/A")}
- High-risk assets: {assets.get("high_risk_count", "N/A")}
- Assets due for maintenance (next 60 days): {assets.get("due_soon_count", "N/A")}

Medical & Wellness:
- Expired medical items: {medical.get("expired_items", "N/A")}
- Items expiring within 30 days: {medical.get("expiring_soon", "N/A")}
- Low-stock medical items: {medical.get("low_stock", "N/A")}
- Open incidents: {medical.get("open_incidents", "N/A")}

Live Environmental Sensors ({sensors.get("total_sensors", 0)} active, {sensors.get("anomaly_count", 0)} anomalies):
{sensor_lines}

Write a professional executive brief with:
1. **OVERALL STATUS** — One-line facility health rating (RAG: Red/Amber/Green)
2. **KEY HIGHLIGHTS** — 3 bullet points of positive performance
3. **AREAS OF CONCERN** — 2-3 bullet points requiring attention
4. **RECOMMENDED ACTIONS** — 3 prioritised actions with owners (Facilities Manager, Medical Officer, etc.)
5. **OUTLOOK** — One paragraph on facility readiness for the next 30 days

Use South African FM terminology. Be specific and data-driven. Maintain executive tone."""

        system = "You are a Senior Facilities Manager writing concise, data-driven executive briefs for board-level audiences."
        text, usage = self._ai._call(
            system=system,
            user_message=prompt,
            model=settings.primary_model,
            max_tokens=800,
        )
        log.info(f"Executive brief generated: {usage.total_tokens} tokens")
        return text

    def get_kpi_summary(self) -> dict:
        """Structured KPI data for the reports dashboard."""
        snap = self._gather_fm_snapshot()
        assets = snap.get("assets", {})
        medical = snap.get("medical", {})
        sensors = snap.get("sensors", {})

        total_assets = assets.get("total", 1) or 1
        active_assets = assets.get("active", 0)
        avg_condition = assets.get("avg_condition", 0)
        high_risk = assets.get("high_risk_count", 0)
        overdue = assets.get("overdue_maintenance", 0)

        asset_health = round((active_assets / total_assets) * 100, 1) if total_assets else 0
        condition_pct = round(avg_condition * 10, 1) if avg_condition else 0
        medical_alerts = (medical.get("expired_items", 0) + medical.get("expiring_soon", 0) +
                          medical.get("low_stock", 0))
        sensor_anomalies = sensors.get("anomaly_count", 0)

        return {
            "generated_at": snap["generated_at"],
            "asset_health_pct": asset_health,
            "condition_score_pct": condition_pct,
            "high_risk_assets": high_risk,
            "overdue_maintenance": overdue,
            "medical_alerts": medical_alerts,
            "sensor_anomalies": sensor_anomalies,
            "total_assets": total_assets,
            "portfolio_value": assets.get("portfolio_value", 0),
        }
