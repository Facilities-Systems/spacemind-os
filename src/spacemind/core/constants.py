"""
SpaceMind OS — Domain Constants
All business constants live here. No magic strings elsewhere.
"""
from enum import Enum


class RequestType(str, Enum):
    OFFICE_MOVE = "office_move"
    FULL_FITOUT = "full_fitout"
    FLOOR_RENOVATION = "floor_renovation"
    CANTEEN_SETUP = "canteen_setup"
    MAINTENANCE = "maintenance"
    SPACE_CHANGE = "space_change"
    VENDOR_COORDINATION = "vendor_coordination"
    UNKNOWN = "unknown"


class TenureType(str, Enum):
    OWNED = "owned"
    RENTED = "rented"
    MIXED = "mixed"


class ResponsiblePartyType(str, Enum):
    INTERNAL = "internal"
    LANDLORD = "landlord"
    VENDOR = "vendor"
    IT_TEAM = "it_team"
    ELECTRICIAN = "electrician"
    PLUMBER = "plumber"
    CONTRACTOR = "contractor"
    FACILITIES_MANAGER = "facilities_manager"
    HR = "hr"
    LEGAL = "legal"
    OTHER = "other"


class RiskLevel(str, Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"


class PhaseStatus(str, Enum):
    PENDING = "pending"
    IN_PROGRESS = "in_progress"
    BLOCKED = "blocked"
    COMPLETED = "completed"


# Countries with known office presence
KNOWN_LOCATIONS = {
    "FP1_HQ_SouthAfrica": {
        "tenure": TenureType.OWNED,
        "country": "South Africa",
        "timezone": "Africa/Johannesburg",
        "currency": "ZAR",
        "landlord_approval_required": False,
        "notes": "Flagship HQ — full internal authority over structural changes.",
    },
    "FP2_SouthAfrica": {
        "tenure": TenureType.RENTED,
        "country": "South Africa",
        "timezone": "Africa/Johannesburg",
        "currency": "ZAR",
        "landlord_approval_required": True,
        "notes": "Rented — any structural/ceiling/wall changes need landlord sign-off.",
    },
    "NAIROBI_Kenya": {
        "tenure": TenureType.RENTED,
        "country": "Kenya",
        "timezone": "Africa/Nairobi",
        "currency": "KES",
        "landlord_approval_required": True,
        "notes": "Rented office. Local contractors must be NEMA-compliant.",
    },
    "LAGOS_Nigeria": {
        "tenure": TenureType.RENTED,
        "country": "Nigeria",
        "timezone": "Africa/Lagos",
        "currency": "NGN",
        "landlord_approval_required": True,
        "notes": "Rented. LAWMA waste disposal regulations apply for fit-outs.",
    },
    "LONDON_UK": {
        "tenure": TenureType.RENTED,
        "country": "United Kingdom",
        "timezone": "Europe/London",
        "currency": "GBP",
        "landlord_approval_required": True,
        "notes": "UK Building Regulations + lease dilapidations clause — get legal review.",
    },
}

# Keyword → RequestType mapping for fast classification
REQUEST_KEYWORDS: dict[str, list[str]] = {
    RequestType.OFFICE_MOVE: [
        "move", "relocate", "migration", "shifting", "transfer staff",
        "move team", "office relocation", "desk move",
    ],
    RequestType.FULL_FITOUT: [
        "fit out", "fitout", "fit-out", "new office setup", "office build",
        "interior build", "strip and fit",
    ],
    RequestType.FLOOR_RENOVATION: [
        "renovation", "renovate", "refurbish", "refurbishment", "revamp",
        "upgrade floor", "floor redo",
    ],
    RequestType.CANTEEN_SETUP: [
        "canteen", "cafeteria", "kitchen", "break room", "staff kitchen",
        "food area", "eating area",
    ],
    RequestType.MAINTENANCE: [
        "repair", "fix", "broken", "not working", "maintenance", "hvac",
        "leak", "plumbing", "electrical fault", "aircon",
    ],
    RequestType.SPACE_CHANGE: [
        "partition", "wall", "open plan", "enclose", "layout change",
        "space reconfigure", "demountable",
    ],
    RequestType.VENDOR_COORDINATION: [
        "vendor", "contractor", "supplier", "quote", "procurement",
        "tender", "sla",
    ],
}
