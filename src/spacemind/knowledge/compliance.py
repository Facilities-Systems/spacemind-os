"""
SpaceMind OS — Country Compliance Rules Engine
Structured, country-specific compliance rules applied as post-processing.

Each rule specifies:
  - regulation: name of the act/regulation
  - requirement: what must happen
  - applies_to: which request types trigger this rule (None = all types)
  - tenure_required: 'rented'|'owned'|None (None = all tenures)
  - mandatory: whether this is a legal requirement or advisory
  - note: brief guidance for the FM

Rules are keyed by country name matching KNOWN_LOCATIONS[...]["country"].
"""
from __future__ import annotations

from dataclasses import dataclass, field
from typing import Optional

from spacemind.core.constants import RequestType, TenureType


@dataclass
class ComplianceRule:
    regulation: str
    requirement: str
    mandatory: bool = True
    applies_to: list[str] = field(default_factory=list)   # empty = all request types
    tenure_required: Optional[str] = None                  # None = any tenure
    note: str = ""

    def matches(self, request_type: RequestType, tenure: TenureType) -> bool:
        type_match = (not self.applies_to) or (request_type.value in self.applies_to)
        tenure_match = (
            self.tenure_required is None or
            self.tenure_required == tenure.value
        )
        return type_match and tenure_match


# ─── Country Rule Databases ───────────────────────────────────────────────────

COMPLIANCE_RULES: dict[str, list[ComplianceRule]] = {

    "South Africa": [
        ComplianceRule(
            regulation="OHS Act No. 85 of 1993",
            requirement="All contractors must be registered and maintain valid OHS files on site. "
                        "A baseline risk assessment is required before any construction activity.",
            applies_to=["full_fitout", "floor_renovation", "space_change", "maintenance", "canteen_setup"],
            note="Employer (FM) remains liable under Section 37 if contractor OHS files are not vetted.",
        ),
        ComplianceRule(
            regulation="OHS Act — Construction Regulations 2014",
            requirement="Projects lasting longer than 30 days OR employing more than 10 workers simultaneously "
                        "require a Principal Contractor to be appointed and a Health & Safety Plan submitted.",
            applies_to=["full_fitout", "floor_renovation"],
            note="Appoint Principal Contractor on contract. Retain copy of H&S Plan in project file.",
        ),
        ComplianceRule(
            regulation="SANS 10142-1:2017 (Wiring of Premises)",
            requirement="A Certificate of Compliance (COC) is required from a registered electrician for "
                        "all new or modified electrical installations. No electrical work may be energised without COC.",
            applies_to=["full_fitout", "floor_renovation", "maintenance", "space_change", "canteen_setup"],
            note="COC must be lodged with local municipality. Retain original on premises.",
        ),
        ComplianceRule(
            regulation="National Building Regulations (NBR) Act 103 of 1977",
            requirement="Structural alterations, change of use, and significant fit-out works require "
                        "building plan approval from the local municipality before work commences.",
            applies_to=["full_fitout", "floor_renovation", "space_change"],
            note="Submit plans via architect/professional engineer. Allow 6–12 weeks for approval.",
        ),
        ComplianceRule(
            regulation="Compensation for Occupational Injuries and Diseases Act (COIDA)",
            requirement="All contractors must have valid COIDA/Workmen's Compensation registration. "
                        "Verify Letter of Good Standing before appointment.",
            applies_to=[],  # All types
            note="Check expiry date — Letters of Good Standing are issued annually.",
        ),
        ComplianceRule(
            regulation="B-BBEE (Broad-Based Black Economic Empowerment)",
            requirement="Procurement above R500,000 should target B-BBEE compliant suppliers. "
                        "Government-linked entities may have mandatory B-BBEE spend targets.",
            applies_to=["vendor_coordination", "full_fitout", "floor_renovation"],
            mandatory=False,
            note="Record B-BBEE scorecards for all major vendors. Required for sustainability reporting.",
        ),
        ComplianceRule(
            regulation="Lease / Dilapidations (Rented buildings)",
            requirement="Obtain written landlord consent before any structural, M&E, or external works. "
                        "Ensure make-good obligations are documented before works begin.",
            applies_to=["full_fitout", "floor_renovation", "space_change"],
            tenure_required="rented",
            note="Photograph existing condition (pre-work) and retain for lease exit claims.",
        ),
    ],

    "United Kingdom": [
        ComplianceRule(
            regulation="CDM Regulations 2015 (Construction Design & Management)",
            requirement="For projects involving more than one contractor, a Principal Designer (PD) and "
                        "Principal Contractor (PC) must be formally appointed in writing. "
                        "A pre-construction H&S file must be prepared.",
            applies_to=["full_fitout", "floor_renovation", "space_change", "canteen_setup"],
            note="CDM Coordinator notification to HSE required if project exceeds 30 working days "
                 "OR 500 person-days. F10 notification via HSE portal.",
        ),
        ComplianceRule(
            regulation="Building Regulations 2010 — Part B (Fire Safety)",
            requirement="Any works affecting fire escape routes, compartmentation, or fire suppression systems "
                        "require Building Control notification and sign-off.",
            applies_to=["full_fitout", "floor_renovation", "space_change"],
            note="Submit Building Notice or Full Plans Application to local Building Control Authority.",
        ),
        ComplianceRule(
            regulation="Building Regulations 2010 — Part L (Conservation of Fuel and Power)",
            requirement="Replacement of mechanical or electrical systems must meet current energy efficiency standards. "
                        "New HVAC installations require commissioning data demonstrating Part L compliance.",
            applies_to=["full_fitout", "floor_renovation", "maintenance"],
            note="Energy Performance Certificate (EPC) may need updating after significant M&E works.",
        ),
        ComplianceRule(
            regulation="BS 7671:2018 (IET Wiring Regulations — 18th Edition)",
            requirement="All electrical installation work must be designed, installed, and tested to BS 7671. "
                        "An Electrical Installation Condition Report (EICR) or Electrical Installation Certificate (EIC) "
                        "is required upon completion.",
            applies_to=["full_fitout", "floor_renovation", "maintenance", "canteen_setup"],
            note="Work must be completed by a registered electrician (NICEIC, NAPIT, or equivalent).",
        ),
        ComplianceRule(
            regulation="Regulatory Reform (Fire Safety) Order 2005",
            requirement="Responsible person must ensure a current Fire Risk Assessment is in place and "
                        "updated after any material change to the premises.",
            applies_to=[],  # All types
            note="Commission an updated FRA from a competent fire risk assessor post-works.",
        ),
        ComplianceRule(
            regulation="Landlord Consent & Lease Dilapidations",
            requirement="Obtain licence to alter from the landlord for any structural, M&E, or permanent works. "
                        "Review lease Schedule of Condition and reinstatement obligations.",
            applies_to=["full_fitout", "floor_renovation", "space_change"],
            tenure_required="rented",
            note="Engage a specialist dilapidations surveyor at project inception to quantify risk.",
        ),
        ComplianceRule(
            regulation="Asbestos Regulations 2012 (Control of Asbestos Regulations)",
            requirement="For buildings constructed before 2000, an Asbestos Survey must be conducted "
                        "before any intrusive works. If asbestos is found, a licensed contractor must remove it.",
            applies_to=["full_fitout", "floor_renovation", "space_change", "maintenance"],
            note="Management Survey required before work; Refurbishment/Demolition Survey before any intrusive works.",
        ),
    ],

    "Kenya": [
        ComplianceRule(
            regulation="Environmental Management and Co-ordination Act (EMCA) — NEMA",
            requirement="Any project likely to have a significant environmental impact requires an "
                        "Environmental Impact Assessment (EIA) from NEMA before commencement.",
            applies_to=["full_fitout", "floor_renovation", "canteen_setup"],
            note="NEMA approval can take 4–8 weeks. Construction waste disposal must comply with NEMA guidelines.",
        ),
        ComplianceRule(
            regulation="Physical Planning Act (Cap 286) — Change of Use",
            requirement="Change of use of premises (e.g., office to retail, storage to canteen) "
                        "requires approval from the County Physical Planning department.",
            applies_to=["canteen_setup", "full_fitout"],
            note="Submit development application to County government. Allow 60–90 days.",
        ),
        ComplianceRule(
            regulation="National Construction Authority (NCA) Act",
            requirement="All contractors must be registered with the National Construction Authority (NCA). "
                        "Verify NCA registration certificate before appointment.",
            applies_to=["full_fitout", "floor_renovation", "space_change", "canteen_setup"],
            note="NCA registration categories vary by project value. Ensure category matches scope.",
        ),
        ComplianceRule(
            regulation="Kenya Bureau of Standards (KEBS) — KS 04-210",
            requirement="Electrical installations must comply with KEBS standards. "
                        "Inspection certificate required from a licensed electrical contractor.",
            applies_to=["full_fitout", "floor_renovation", "maintenance", "canteen_setup"],
            note="Kenya Power & Lighting Company (KPLC) connection/upgrade requires KEBS compliance certificate.",
        ),
        ComplianceRule(
            regulation="Landlord Consent — Rented Premises",
            requirement="Written consent required from landlord for all structural and M&E modifications. "
                        "Make-good obligations must be confirmed before works begin.",
            applies_to=["full_fitout", "floor_renovation", "space_change"],
            tenure_required="rented",
            note="Many Nairobi landlords require a fit-out deposit (2–3 months rent) as security.",
        ),
    ],

    "Nigeria": [
        ComplianceRule(
            regulation="Lagos State Urban and Regional Planning and Development Law 2010",
            requirement="Building plan approval from Lagos State Physical Planning Permit Authority (LASPPPA) "
                        "required for any structural works, change of use, or significant fit-out.",
            applies_to=["full_fitout", "floor_renovation", "space_change"],
            note="Submit architectural drawings stamped by an NIA-registered architect. Allow 6–12 weeks.",
        ),
        ComplianceRule(
            regulation="Lagos Waste Management Authority (LAWMA)",
            requirement="Construction and demolition waste must be disposed of through LAWMA-approved channels. "
                        "Engage a LAWMA-licensed waste contractor. Illegal dumping carries significant fines.",
            applies_to=["full_fitout", "floor_renovation"],
            note="Retain LAWMA waste manifests as evidence of compliant disposal.",
        ),
        ComplianceRule(
            regulation="COREN (Council for the Regulation of Engineering in Nigeria)",
            requirement="M&E design must be prepared and certified by a COREN-registered engineer. "
                        "Electrical, mechanical, and structural drawings require engineer stamp.",
            applies_to=["full_fitout", "floor_renovation", "canteen_setup"],
            note="COREN verification can be done online. Retain certified drawings in project file.",
        ),
        ComplianceRule(
            regulation="Department of Petroleum Resources (DPR) — Gas Installations",
            requirement="Any natural gas or LPG installation (canteens, etc.) must be designed, "
                        "installed, and certified by DPR-licensed contractors.",
            applies_to=["canteen_setup"],
            note="Gas installation inspection and certificate required before commissioning.",
        ),
    ],

    "Unknown": [
        ComplianceRule(
            regulation="General Advisory — Unknown Jurisdiction",
            requirement="Location-specific regulatory requirements have not been verified. "
                        "Engage a local legal/compliance advisor before commencing any construction works. "
                        "Verify: building permits, environmental approvals, contractor registration, electrical certification.",
            applies_to=[],
            mandatory=False,
            note="Standard caution: assume rented/landlord approval required until tenure is confirmed.",
        ),
    ],
}


def get_compliance_notes(
    country: str,
    request_type: RequestType,
    tenure: TenureType,
) -> list[str]:
    """
    Return formatted compliance notes applicable to this country, request type, and tenure.
    """
    rules = COMPLIANCE_RULES.get(country, COMPLIANCE_RULES.get("Unknown", []))
    notes: list[str] = []

    for rule in rules:
        if rule.matches(request_type, tenure):
            prefix = "⚠ MANDATORY" if rule.mandatory else "ℹ ADVISORY"
            note = f"[{prefix}] {rule.regulation}: {rule.requirement}"
            if rule.note:
                note += f" | FM Note: {rule.note}"
            notes.append(note)

    return notes
