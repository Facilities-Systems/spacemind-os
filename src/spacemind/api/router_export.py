"""
SpaceMind OS — Export Routes
GET /api/v1/history/{id}/export?format={pdf|json|markdown|excel}
"""
from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session

from spacemind.api.auth import get_current_user
from spacemind.core.validators import validate_export_format
from spacemind.domain.models import User
from spacemind.services.decomposition_service import DecompositionService
from spacemind.services.export_service import ExportService
from spacemind.storage.database import get_db

router = APIRouter(prefix="/api/v1", tags=["Export"])


def get_service(db: Session = Depends(get_db)) -> DecompositionService:
    return DecompositionService(db)


@router.get(
    "/history/{decomposition_id}/export",
    summary="Export a decomposition plan as PDF, JSON, Markdown, or Excel",
)
def export_decomposition(
    decomposition_id: str,
    format: str = Query(default="pdf", pattern="^(pdf|json|markdown|excel)$"),
    service: DecompositionService = Depends(get_service),
    _current_user: User = Depends(get_current_user),
):
    from spacemind.core.exceptions import ValidationError as SMValidationError
    try:
        fmt = validate_export_format(format)
    except SMValidationError as e:
        raise HTTPException(status_code=422, detail=e.message)

    result = service.get_by_id(decomposition_id)
    if not result:
        raise HTTPException(status_code=404, detail="Decomposition not found.")

    exporter = ExportService()
    short_id = decomposition_id[:8]

    if fmt == "pdf":
        pdf_bytes = exporter.to_pdf(result)
        return StreamingResponse(
            iter([pdf_bytes]),
            media_type="application/pdf",
            headers={"Content-Disposition": f'attachment; filename="spacemind-plan-{short_id}.pdf"'},
        )

    if fmt == "excel":
        xlsx_bytes = exporter.to_excel(result)
        return StreamingResponse(
            iter([xlsx_bytes]),
            media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            headers={"Content-Disposition": f'attachment; filename="spacemind-plan-{short_id}.xlsx"'},
        )

    if fmt == "json":
        import json
        json_str = result.model_dump_json(indent=2)
        return StreamingResponse(
            iter([json_str.encode()]),
            media_type="application/json",
            headers={"Content-Disposition": f'attachment; filename="spacemind-plan-{short_id}.json"'},
        )

    # markdown
    md = exporter.to_markdown(result)
    return StreamingResponse(
        iter([md.encode()]),
        media_type="text/markdown",
        headers={"Content-Disposition": f'attachment; filename="spacemind-plan-{short_id}.md"'},
    )
