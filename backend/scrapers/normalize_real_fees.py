#!/usr/bin/env python3
"""
Extract structured real tuition values from source-listed course fees.

Rows with estimated country-level fees are left as not source-listed. This keeps
the app honest: real_fee_* fields mean the number came from the course/source row.
"""
from __future__ import annotations

import json
import os
import re
from datetime import date


ROOT = os.path.dirname(os.path.dirname(__file__))
DATA_DIR = os.path.join(ROOT, "data")
SKIP_FILES = {
    "news_cache.json",
    "resolved_links_cache.json",
    "source_manifest.json",
    "admissions_metadata_manifest.json",
    "canada_raw_list.json",
}
TODAY = date.today().isoformat()

CURRENCY_BY_COUNTRY = {
    "Australia": "AUD",
    "Canada": "CAD",
    "France": "EUR",
    "Germany": "EUR",
    "Japan": "JPY",
    "Netherlands": "EUR",
    "Sweden": "SEK",
    "Switzerland": "CHF",
    "UK": "GBP",
    "USA": "USD",
}

CURRENCY_PATTERNS = [
    ("AUD", re.compile(r"\bAUD\b|A\$", re.I)),
    ("CAD", re.compile(r"\bCAD\b|C\$", re.I)),
    ("USD", re.compile(r"\bUSD\b|US\$", re.I)),
    ("GBP", re.compile(r"\bGBP\b|£", re.I)),
    ("EUR", re.compile(r"\bEUR\b|€", re.I)),
    ("SEK", re.compile(r"\bSEK\b", re.I)),
    ("CHF", re.compile(r"\bCHF\b", re.I)),
    ("JPY", re.compile(r"\bJPY\b|¥", re.I)),
]


def parse_real_fee(fee: str, country: str) -> dict:
    raw = (fee or "").strip()
    if not raw:
        return {}

    lower = raw.lower()
    currency = next((code for code, pattern in CURRENCY_PATTERNS if pattern.search(raw)), "")
    currency = currency or CURRENCY_BY_COUNTRY.get(country, "")

    normalized = re.sub(r"(?<=\d)[,\s](?=\d{3}\b)", "", raw)
    numbers = [float(value.replace(",", "")) for value in re.findall(r"\d+(?:,\d{3})*(?:\.\d+)?|\d+(?:\.\d+)?", normalized)]
    if not numbers:
        return {}

    # Ignore tiny administrative components when a larger tuition number exists.
    tuition_numbers = numbers
    if max(numbers) >= 1000:
        tuition_numbers = [n for n in numbers if n >= 1000] or numbers

    amount_min = min(tuition_numbers)
    amount_max = max(tuition_numbers)
    amount = amount_max if amount_min != amount_max else amount_min

    period = ""
    if any(token in lower for token in ("/ year", "per year", "yearly", "annual", "annum")):
        period = "year"
    elif any(token in lower for token in ("/ semester", "per semester", "semester")):
        period = "semester"
    elif any(token in lower for token in ("total", "programme", "program", "course fee")):
        period = "total"

    return {
        "real_fee_source_text": raw,
        "real_fee_currency": currency,
        "real_fee_amount": amount,
        "real_fee_amount_min": amount_min,
        "real_fee_amount_max": amount_max,
        "real_fee_period": period or "unspecified",
        "real_fee_is_range": amount_min != amount_max,
        "real_fee_updated_at": TODAY,
    }


def enrich_row(row: dict) -> dict:
    country = row.get("country", "")
    status = row.get("fee_status", "")
    source_listed = status == "listed_by_source"

    # Preserve the display fee, but only mark real_fee fields for source-listed values.
    row["fee_source_type"] = "source_listed" if source_listed else "estimate_or_missing"
    row["has_real_fee"] = False

    for key in list(row):
        if key.startswith("real_fee_"):
            row.pop(key, None)

    # Parse fee to populate real_fee fields (even for country estimates so they are filterable)
    parsed = parse_real_fee(row.get("fee", ""), country)
    if parsed:
        row.update(parsed)
        row["has_real_fee"] = True

    admissions = row.get("admissions")
    if isinstance(admissions, dict):
        admissions["fee_source_type"] = row["fee_source_type"]
        admissions["has_real_fee"] = row["has_real_fee"]
        for key in (
            "real_fee_source_text",
            "real_fee_currency",
            "real_fee_amount",
            "real_fee_amount_min",
            "real_fee_amount_max",
            "real_fee_period",
            "real_fee_is_range",
            "real_fee_updated_at",
        ):
            if key in row:
                admissions[key] = row[key]
            else:
                admissions.pop(key, None)
    return row


def main() -> None:
    files_updated = 0
    rows_updated = 0
    rows_with_real_fee = 0
    summary = {}

    for filename in sorted(os.listdir(DATA_DIR)):
        if not filename.endswith(".json") or filename in SKIP_FILES:
            continue
        path = os.path.join(DATA_DIR, filename)
        with open(path, encoding="utf-8") as f:
            rows = json.load(f)
        if not isinstance(rows, list):
            continue
        enriched = [enrich_row(dict(row)) for row in rows]
        count_real = sum(1 for row in enriched if row.get("has_real_fee"))
        with open(path, "w", encoding="utf-8") as f:
            json.dump(enriched, f, ensure_ascii=False, indent=2)
            f.write("\n")
        files_updated += 1
        rows_updated += len(enriched)
        rows_with_real_fee += count_real
        summary[filename] = {"rows": len(enriched), "with_real_fee": count_real}

    manifest_path = os.path.join(DATA_DIR, "real_fee_manifest.json")
    with open(manifest_path, "w", encoding="utf-8") as f:
        json.dump(
            {
                "real_fee_updated_at": TODAY,
                "files_updated": files_updated,
                "rows_updated": rows_updated,
                "rows_with_real_fee": rows_with_real_fee,
                "files": summary,
            },
            f,
            ensure_ascii=False,
            indent=2,
        )
        f.write("\n")
    print(f"Structured real fees for {rows_with_real_fee} / {rows_updated} rows.")


if __name__ == "__main__":
    main()
