"""HTML/text email bodies for marketing form submissions."""
from html import escape
from typing import Any, Dict, List, Tuple


def _esc(value: Any) -> str:
    if value is None:
        return "—"
    if isinstance(value, list):
        return escape(", ".join(str(v) for v in value)) if value else "—"
    return escape(str(value))


def _row(label: str, value: Any) -> str:
    return f"<tr><td style='padding:6px 12px 6px 0;font-weight:600;vertical-align:top;'>{escape(label)}</td><td style='padding:6px 0;'>{_esc(value)}</td></tr>"


def build_data_request_email(body: Any, payload: Dict[str, Any]) -> Tuple[str, str]:
    """Human-readable email for Typeform-parity data request submissions."""
    rows: List[str] = [
        _row("Business sectors", payload.get("business_sectors")),
        _row("Business sector (other)", payload.get("business_sector_other")),
        _row("Sales representatives", payload.get("sales_representatives")),
        _row("Leads per week (per rep)", payload.get("leads_per_week")),
        _row("Lead sourcing", payload.get("lead_sourcing")),
        _row("Lead sourcing (other)", payload.get("lead_sourcing_other")),
        _row("Countries / regions", payload.get("countries")),
        _row("Countries (other)", payload.get("countries_other")),
        _row("Ideal customer companies", payload.get("ideal_customer_companies")),
        _row("Countries out of bounds", payload.get("countries_out_of_bounds")),
        _row("Target industry", payload.get("target_industry")),
        _row("Job titles / roles", payload.get("job_titles")),
        _row("Company sizes", payload.get("company_sizes")),
        _row("LinkedIn prospect example", payload.get("linkedin_prospect_example")),
        _row("Ideal customer", payload.get("ideal_customer")),
        _row("Lead info required", payload.get("lead_info_required")),
        _row("Additional notes", payload.get("additional_notes")),
        _row("Weekly lead volume", payload.get("weekly_lead_volume")),
        _row("Terms accepted", payload.get("terms_accepted")),
    ]
    table = "<table style='border-collapse:collapse;font-family:sans-serif;font-size:14px;'>" + "".join(rows) + "</table>"

    html = f"""
    <h2 style="font-family:sans-serif;">New Data Request Form submission</h2>
    <p style="font-family:sans-serif;"><strong>Name:</strong> {_esc(body.full_name)}<br/>
    <strong>Email:</strong> {_esc(body.email)}<br/>
    <strong>Company:</strong> {_esc(body.company)}<br/>
    <strong>Phone:</strong> {_esc(body.phone)}</p>
    <h3 style="font-family:sans-serif;">Questionnaire answers</h3>
    {table}
    """
    text_lines = [
        "New Data Request Form submission",
        f"Name: {body.full_name}",
        f"Email: {body.email}",
        f"Company: {body.company or '-'}",
        f"Phone: {body.phone or '-'}",
        "",
        "Questionnaire answers:",
    ]
    for label, key in [
        ("Business sectors", "business_sectors"),
        ("Sales representatives", "sales_representatives"),
        ("Lead sourcing", "lead_sourcing"),
        ("Countries", "countries"),
        ("Industry", "target_industry"),
        ("Job titles", "job_titles"),
        ("Company sizes", "company_sizes"),
        ("Weekly lead volume", "weekly_lead_volume"),
        ("Additional notes", "additional_notes"),
    ]:
        val = payload.get(key)
        if val:
            text_lines.append(f"{label}: {val}")
    return html, "\n".join(text_lines)


def build_generic_email(body: Any, payload: Dict[str, Any]) -> Tuple[str, str]:
    import json

    payload_pretty = json.dumps(payload or {}, ensure_ascii=False, indent=2, default=str)
    html = f"""
    <h2>New marketing form submission</h2>
    <p><strong>Form type:</strong> {escape(body.form_type)}</p>
    <p><strong>Name:</strong> {escape(body.full_name)}</p>
    <p><strong>Email:</strong> {escape(body.email)}</p>
    <p><strong>Company:</strong> {escape(body.company or '-')}</p>
    <p><strong>Phone:</strong> {escape(body.phone or '-')}</p>
    <h3>Payload</h3>
    <pre>{escape(payload_pretty)}</pre>
    """
    text = (
        f"New marketing form submission\n"
        f"Form type: {body.form_type}\n"
        f"Name: {body.full_name}\n"
        f"Email: {body.email}\n\n"
        f"Payload:\n{payload_pretty}"
    )
    return html, text
