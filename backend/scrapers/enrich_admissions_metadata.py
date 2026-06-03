#!/usr/bin/env python3
"""
Normalize admissions metadata across course JSON files.

This script does not pretend to verify every course detail. It adds a consistent
metadata layer that separates source-backed facts from country-level estimates,
so the frontend can be transparent about confidence.
"""
from __future__ import annotations

import json
import os
import re
from datetime import date
from urllib.parse import urlparse


ROOT = os.path.dirname(os.path.dirname(__file__))
DATA_DIR = os.path.join(ROOT, "data")
SKIP_FILES = {"news_cache.json", "resolved_links_cache.json", "source_manifest.json", "canada_raw_list.json"}
TODAY = date.today().isoformat()

COUNTRY_DEFAULTS = {
    "Australia": {
        "language": "English",
        "intake": "February / July",
        "duration": {"Bachelor": "3-4 years", "Master": "1-2 years", "PhD": "3-4 years"},
        "deadline": "Varies by university; commonly October-December for February intake and April-May for July intake.",
    },
    "Canada": {
        "language": "English",
        "intake": "Fall / Winter",
        "duration": {"Bachelor": "4 years", "Master": "1-2 years", "PhD": "4-6 years"},
        "deadline": "Varies by university; commonly December-March for Fall intake.",
    },
    "France": {
        "language": "English / French",
        "intake": "September",
        "duration": {"Bachelor": "3 years", "Master": "2 years", "PhD": "3 years"},
        "deadline": "Varies by program; commonly January-May for September intake.",
    },
    "Germany": {
        "language": "English / German",
        "intake": "Winter / Summer",
        "duration": {"Bachelor": "3-3.5 years", "Master": "1.5-2 years", "PhD": "3-5 years"},
        "deadline": "Varies by university; often January-July for winter intake and July-January for summer intake.",
    },
    "Japan": {
        "language": "English / Japanese",
        "intake": "April / September",
        "duration": {"Bachelor": "4 years", "Master": "2 years", "PhD": "3 years"},
        "deadline": "Varies by university; commonly 6-10 months before intake.",
    },
    "Netherlands": {
        "language": "English / Dutch",
        "intake": "September / February",
        "duration": {"Bachelor": "3-4 years", "Master": "1-2 years", "PhD": "4 years"},
        "deadline": "Varies by program; commonly January-May for September intake.",
    },
    "Sweden": {
        "language": "English / Swedish",
        "intake": "Autumn / Spring",
        "duration": {"Bachelor": "3 years", "Master": "1-2 years", "PhD": "4 years"},
        "deadline": "National rounds usually close in January for autumn intake and August for spring intake.",
    },
    "Switzerland": {
        "language": "English / German / French / Italian",
        "intake": "Autumn / Spring",
        "duration": {"Bachelor": "3 years", "Master": "1.5-2 years", "PhD": "3-5 years"},
        "deadline": "Varies by university; commonly December-April for autumn intake.",
    },
    "UK": {
        "language": "English",
        "intake": "September / January",
        "duration": {"Bachelor": "3-4 years", "Master": "1 year", "PhD": "3-4 years"},
        "deadline": "UCAS and university deadlines vary; international applicants should verify the course page.",
    },
    "USA": {
        "language": "English",
        "intake": "Fall / Spring",
        "duration": {"Bachelor": "4 years", "Master": "1-2 years", "PhD": "4-6 years"},
        "deadline": "Varies by institution; commonly November-March for Fall intake.",
    },
}

OFFICIAL_SOURCE_PATTERNS = (
    "daad", "ucas", "campus france", "cricos", "college scorecard",
    "susa", "studyprogrammes", "official course", "university official",
    "studyportals", "universityadmissions",
)


def normalize_degree(value: str) -> str:
    text = (value or "").lower()
    if any(token in text for token in ("phd", "doctor")):
        return "PhD"
    if any(token in text for token in ("master", "msc", "meng", "mba", "ma ", "llm", "m.sc", "m.a")):
        return "Master"
    if any(token in text for token in ("bachelor", "bsc", "beng", "bba", "ba ", "llb", "b.sc", "b.a")):
        return "Bachelor"
    return value or ""


def estimate_fee(country: str, degree: str) -> str:
    level = normalize_degree(degree)
    table = {
        "Germany": "EUR 0-3,000/year at many public universities; higher at private universities",
        "France": "EUR 2,770-3,770/year at public universities for many non-EU students; higher at private schools",
        "Sweden": "SEK 80,000-295,000/year for many non-EU students",
        "Netherlands": "EUR 8,000-25,000/year for many non-EU students",
        "Switzerland": "CHF 1,000-8,000/year at many public universities; higher at some institutions",
        "Japan": "JPY 535,800/year at many national universities; private universities vary",
        "Canada": "CAD 20,000-45,000/year for many international students",
        "Australia": "AUD 25,000-50,000/year for many international students",
        "UK": "GBP 15,000-35,000/year for many international students",
        "USA": "USD 20,000-60,000/year depending on institution",
    }
    if level == "PhD" and country in {"Germany", "Switzerland", "Sweden", "Netherlands"}:
        return "Often funded/employed; verify funding and tuition status on the official program page"
    return table.get(country, "Varies by university; verify the official course page")


def source_confidence(item: dict) -> tuple[str, int]:
    source = f"{item.get('source', '')} {item.get('source_url', '')} {item.get('link', '')}".lower()
    link = item.get("link", "")
    parsed = urlparse(link if link.startswith(("http://", "https://")) else "")
    has_course_like_link = bool(parsed.netloc and parsed.scheme and "google.com/search" not in link)

    if any(pattern in source for pattern in OFFICIAL_SOURCE_PATTERNS):
        return "verified_catalog", 90 if has_course_like_link else 80
    if has_course_like_link and re.search(r"\.(edu|ac|ca|de|fr|nl|se|ch|jp|uk|au)(/|$)", parsed.netloc):
        return "official_link_unverified_details", 70
    if has_course_like_link:
        return "external_link_unverified_details", 55
    return "estimated", 35


def requirements_for(item: dict) -> list[str]:
    degree = normalize_degree(item.get("degree", ""))
    reqs = []
    if degree == "Master":
        reqs.append("Relevant bachelor's degree or equivalent")
    elif degree == "Bachelor":
        reqs.append("Recognized secondary school qualification")
    elif degree == "PhD":
        reqs.append("Relevant master's degree or equivalent research preparation")
    else:
        reqs.append("Previous academic qualification appropriate to the program level")
    reqs.append("Official transcripts")
    reqs.append("Proof of language proficiency if required")
    return reqs


def enrich(item: dict) -> dict:
    country = item.get("country", "")
    degree = normalize_degree(item.get("degree", ""))
    defaults = COUNTRY_DEFAULTS.get(country, {})
    confidence_label, confidence_score = source_confidence(item)
    existing_fee = (item.get("fee") or "").strip()
    fee_status = "listed_by_source" if existing_fee else "country_estimate"
    fee = existing_fee or estimate_fee(country, degree)
    duration = item.get("duration") or defaults.get("duration", {}).get(degree, "")
    language = item.get("language") or defaults.get("language", "Verify on course page")
    intake = item.get("intake") or defaults.get("intake", "Verify on course page")
    deadline = item.get("deadline") or defaults.get("deadline", "Varies by university; verify on the official course page.")

    item["degree"] = degree or item.get("degree", "")
    item["fee"] = fee
    item["fee_status"] = item.get("fee_status") or fee_status
    item["language"] = language
    item["duration"] = duration
    item["intake"] = intake
    item["deadline"] = deadline
    item["requirements"] = item.get("requirements") or requirements_for(item)
    item["source_confidence"] = item.get("source_confidence") or confidence_label
    item["source_confidence_score"] = item.get("source_confidence_score") or confidence_score
    item["admissions"] = {
        "fee": fee,
        "fee_status": item["fee_status"],
        "deadline": deadline,
        "requirements": item["requirements"],
        "language": language,
        "duration": duration,
        "intake": intake,
        "source_confidence": item["source_confidence"],
        "source_confidence_score": item["source_confidence_score"],
        "verified_at": item.get("verified_at", ""),
        "metadata_updated_at": TODAY,
    }
    item["metadata_updated_at"] = TODAY
    return item


def main() -> None:
    changed_files = 0
    total_rows = 0
    summary = {}
    for filename in sorted(os.listdir(DATA_DIR)):
        if not filename.endswith(".json") or filename in SKIP_FILES:
            continue
        path = os.path.join(DATA_DIR, filename)
        with open(path, encoding="utf-8") as f:
            rows = json.load(f)
        if not isinstance(rows, list):
            continue
        enriched = [enrich(dict(row)) for row in rows]
        with open(path, "w", encoding="utf-8") as f:
            json.dump(enriched, f, ensure_ascii=False, indent=2)
            f.write("\n")
        changed_files += 1
        total_rows += len(enriched)
        summary[filename] = len(enriched)

    manifest_path = os.path.join(DATA_DIR, "admissions_metadata_manifest.json")
    with open(manifest_path, "w", encoding="utf-8") as f:
        json.dump(
            {
                "metadata_updated_at": TODAY,
                "files_updated": changed_files,
                "rows_updated": total_rows,
                "fields": [
                    "fee", "fee_status", "deadline", "requirements", "language",
                    "duration", "intake", "source_confidence", "source_confidence_score",
                    "admissions",
                ],
                "files": summary,
            },
            f,
            ensure_ascii=False,
            indent=2,
        )
        f.write("\n")
    print(f"Updated {total_rows} rows in {changed_files} files.")


if __name__ == "__main__":
    main()
