"""
SpaceMind OS — AI Concierge Chat Service
Assembles live FM context (inventory alerts, medical alerts, open incidents,
maintenance schedule) and passes it to Claude Haiku for conversational answers.
"""
from __future__ import annotations

from datetime import UTC, datetime
from typing import List

from sqlalchemy.orm import Session

from spacemind.ai.client import AIClient
from spacemind.core.config import settings
from spacemind.core.exceptions import ValidationError
from spacemind.core.guardrails import scan_for_injection
from spacemind.core.logging import log
from spacemind.services.medical_service import MedicalService
from spacemind.services.sensor_service import SensorService
from spacemind.storage.repository import AssetRepository


_SYSTEM_PROMPT = """You are SpaceMind Concierge — the AI assistant for SpaceMind OS, an enterprise Facilities Management platform.

You have access to live data from the facility: inventory levels, medical alerts, sensor readings, asset maintenance schedules, and more.

Rules:
- Be friendly, professional, and concise (2-5 sentences unless detail is needed)
- Reference the live FM context provided to ground your answers in real data
- For questions outside FM scope, politely redirect to your FM expertise
- Use South African FM terminology (e.g. "Work Order", "REQ number", "BEE compliance")
- If you can't answer precisely from the context, say so and suggest who to contact
"""


class ChatService:
    def __init__(self, db: Session):
        self._db = db
        self._ai = AIClient()

    def _build_context(self) -> str:
        """Collect a concise snapshot of live FM data to inject into the prompt."""
        lines: List[str] = []
        now = datetime.now(UTC).strftime("%Y-%m-%d %H:%M UTC")
        lines.append(f"=== Live FM Context (as of {now}) ===\n")

        # Medical alerts
        try:
            med_svc = MedicalService(self._db)
            alerts = med_svc.get_alerts(days_ahead=30)
            expired = alerts.get("expired", [])
            expiring = alerts.get("expiring_soon", [])
            low_stock = alerts.get("low_stock", [])
            if expired:
                names = ", ".join(i.name for i in expired[:5])
                lines.append(f"MEDICAL — {len(expired)} expired items: {names}")
            if expiring:
                names = ", ".join(i.name for i in expiring[:5])
                lines.append(f"MEDICAL — {len(expiring)} items expiring within 30 days: {names}")
            if low_stock:
                names = ", ".join(i.name for i in low_stock[:5])
                lines.append(f"MEDICAL — {len(low_stock)} low-stock items: {names}")
            if not (expired or expiring or low_stock):
                lines.append("MEDICAL — No active alerts.")
        except Exception as e:
            log.warning(f"ChatService: could not load medical alerts: {e}")

        # Asset maintenance schedule
        try:
            asset_repo = AssetRepository(self._db)
            from spacemind.services.asset_service import AssetService
            asset_svc = AssetService(self._db)
            schedule = asset_svc.get_maintenance_schedule()
            overdue = [s for s in schedule if s.get("overdue")]
            due_soon = [s for s in schedule if not s.get("overdue")]
            if overdue:
                names = ", ".join(f'{s["asset_name"]} ({s["days_until_due"]}d overdue)' for s in overdue[:3])
                lines.append(f"ASSETS — {len(overdue)} assets overdue for maintenance: {names}")
            if due_soon:
                names = ", ".join(f'{s["asset_name"]} (due in {s["days_until_due"]}d)' for s in due_soon[:3])
                lines.append(f"ASSETS — {len(due_soon)} assets due for maintenance: {names}")
            if not (overdue or due_soon):
                lines.append("ASSETS — No assets due for maintenance in next 60 days.")
        except Exception as e:
            log.warning(f"ChatService: could not load asset schedule: {e}")

        # Sensor summary
        try:
            sensor_svc = SensorService(self._db)
            summary = sensor_svc.get_latest_summary()
            if summary.readings:
                sensor_lines = [
                    f"{r.sensor_type}: {r.value} {r.unit} @ {r.zone_name or r.location_id or 'N/A'}"
                    + (" ⚠ ANOMALY" if r.is_anomaly else "")
                    for r in summary.readings
                ]
                lines.append("SENSORS — " + " | ".join(sensor_lines))
                if summary.anomaly_count:
                    lines.append(f"SENSORS — {summary.anomaly_count} anomaly/anomalies detected!")
            else:
                lines.append("SENSORS — No live sensor data.")
        except Exception as e:
            log.warning(f"ChatService: could not load sensor summary: {e}")

        return "\n".join(lines)

    def chat(self, messages: List[dict]) -> str:
        """
        messages: list of {role: 'user'|'assistant', content: str}
        Returns the assistant's reply as a string.
        """
        # Guard: scan last user message for prompt injection before touching the AI
        user_messages = [m for m in messages if m.get("role") == "user"]
        if user_messages:
            try:
                scan_for_injection(user_messages[-1].get("content", ""), context="chat message")
            except ValidationError:
                log.info("[Guardrails] Chat message blocked — returning safe response")
                return "I'm not able to process that request. Please describe your facilities question in plain language."

        context = self._build_context()
        system = f"{_SYSTEM_PROMPT}\n\n{context}"

        anthropic_messages = [
            {"role": m["role"], "content": m["content"]}
            for m in messages
            if m["role"] in ("user", "assistant")
        ]

        reply, usage = self._ai._call(
            system=system,
            user_message=anthropic_messages[-1]["content"] if anthropic_messages else "",
            model=settings.fast_model,
            max_tokens=600,
        )
        log.info(f"ChatService: tokens used input={usage.input_tokens} output={usage.output_tokens}")
        return reply
