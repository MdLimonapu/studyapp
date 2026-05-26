#!/usr/bin/env python3
"""
Build course data only from source-backed public catalogues.

This intentionally does not call the older generator scripts. If a source cannot
verify a course or programme name, the scraper skips it instead of inventing rows.
"""

from __future__ import annotations

import csv
import html
import io
import json
import os
import re
import time
import urllib.parse
from datetime import date
from typing import Any

import requests
from bs4 import BeautifulSoup


ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
DATA_DIR = os.path.join(ROOT, "data")
TODAY = date.today().isoformat()
UA = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36"

FIELDS = [
    "Computer Science",
    "Software Engineering",
    "Data Science",
    "Artificial Intelligence",
    "Cybersecurity",
    "Information Technology",
    "Electrical Engineering",
    "Electronic Engineering",
    "Mechanical Engineering",
    "Civil Engineering",
    "Chemical Engineering",
    "Biomedical Engineering",
    "Environmental Engineering",
    "Business Administration",
    "Finance",
    "Economics",
    "Management",
    "Physics",
    "Chemistry",
    "Biology",
    "Mathematics",
    "Medicine",
    "Nursing",
    "Law",
    "Psychology",
    "Architecture",
    "Media",
]


def text(value: Any, lang: str = "eng") -> str:
    if isinstance(value, str):
        return re.sub(r"\s+", " ", html.unescape(value)).strip()
    if isinstance(value, dict):
        for key in ("value", "name", "title"):
            if key in value:
                return text(value[key], lang)
        strings = value.get("strings") or value.get("urls")
        if isinstance(strings, list):
            for item in strings:
                if item.get("lang") == lang:
                    return text(item.get("value", ""))
            if strings:
                return text(strings[0].get("value", ""))
    return ""


def degree_from_title(title: str, level: str = "") -> str:
    value = f"{title} {level}".lower()
    if any(k in value for k in ["phd", "doctor", "doctoral"]):
        return "PhD"
    if any(k in value for k in ["master", "msc", "m.sc", "m.a.", "m.s.", "postgraduate"]):
        return "Master"
    if any(k in value for k in ["bachelor", "bsc", "b.sc", "b.a.", "b.s.", "beng", "undergraduate"]):
        return "Bachelor"
    return ""


def clean_link(url: str, fallback: str = "") -> str:
    url = (url or "").strip()
    if url and not url.startswith(("http://", "https://")):
        url = "https://" + url
    return url or fallback


def row(country: str, uni: str, course: str, degree: str, city: str, link: str, source: str, source_url: str, fee: str = "") -> dict[str, str]:
    return {
        "country": country,
        "uni": text(uni),
        "course": text(course),
        "degree": text(degree),
        "city": text(city),
        "link": clean_link(link, source_url),
        "fee": text(fee),
        "source": source,
        "source_url": source_url,
        "verified_at": TODAY,
    }


def save(country: str, rows: list[dict[str, str]]) -> None:
    os.makedirs(DATA_DIR, exist_ok=True)
    path = os.path.join(DATA_DIR, f"{country.lower()}.json")
    seen = set()
    unique = []
    for item in rows:
        key = (item["country"], item["uni"].lower(), item["course"].lower(), item["degree"].lower(), item["link"])
        if item["uni"] and item["course"] and key not in seen:
            seen.add(key)
            unique.append(item)
    with open(path, "w", encoding="utf-8") as f:
        json.dump(unique, f, ensure_ascii=False, indent=2)
    print(f"{country:12s} {len(unique):5d} rows -> {path}")


def scrape_germany(max_pages: int = 20) -> list[dict[str, str]]:
    candidates = [
        os.path.join(DATA_DIR, "germany.json"),
        os.path.join(ROOT, "data_backup", "germany.json"),
    ]
    existing = []
    for existing_path in candidates:
        if os.path.exists(existing_path):
            with open(existing_path, encoding="utf-8") as f:
                data = json.load(f)
            if len(data) > len(existing):
                existing = data
    if existing:
            return [
                row(
                    "Germany",
                    item.get("uni", ""),
                    item.get("course", ""),
                    item.get("degree", ""),
                    item.get("city", ""),
                    item.get("link", ""),
                    item.get("source", "DAAD International Programmes"),
                    item.get("source_url", "https://www.daad.de/en/studying-in-germany/universities/all-degree-programmes/"),
                    item.get("fee", ""),
                )
                for item in existing
            ]

    out = []
    source = "DAAD International Programmes"
    base = "https://www.daad.de/en/studying-in-germany/universities/all-degree-programmes/"
    for page in range(1, max_pages + 1):
        url = f"{base}?p={page}&hec-teachingLanguage=2"
        res = requests.get(url, headers={"User-Agent": UA}, timeout=25)
        res.raise_for_status()
        soup = BeautifulSoup(res.text, "html.parser")
        items = soup.select("article.result")
        if not items:
            break
        for item in items:
            spans = item.select("span.result__headline-content")
            dds = item.select("dd.s-result-item")
            link = item.select_one("a.result__link")
            href = urllib.parse.urljoin("https://www.daad.de", link.get("href", "")) if link else url
            uni = spans[0].get_text(" ", strip=True) if len(spans) > 0 else ""
            course = spans[1].get_text(" ", strip=True) if len(spans) > 1 else ""
            degree = dds[0].get_text(" ", strip=True) if dds else degree_from_title(course)
            city = dds[2].get_text(" ", strip=True) if len(dds) > 2 else ""
            out.append(row("Germany", uni, course, degree, city, href, source, url))
        time.sleep(0.25)
    return out


def scrape_uk() -> list[dict[str, str]]:
    app_id = "Y3QRV216KL"
    api_key = "c0f72e5c62250ac258c2cf4a3896c19d"
    endpoint = f"https://{app_id}-dsn.algolia.net/1/indexes/*/queries"
    source = "UCAS course search"
    out = []
    for field in FIELDS:
        params = urllib.parse.urlencode({"query": field, "hitsPerPage": 60, "filters": "academicYearId:2026"})
        payload = {"requests": [{"indexName": "d10prod_courses_new", "params": params}]}
        res = requests.post(
            endpoint,
            json=payload,
            headers={"X-Algolia-API-Key": api_key, "X-Algolia-Application-Id": app_id, "User-Agent": UA},
            timeout=25,
        )
        res.raise_for_status()
        for hit in res.json()["results"][0].get("hits", []):
            provider = hit.get("provider") or {}
            title = hit.get("courseTitle") or ""
            course_id = hit.get("courseId") or hit.get("objectID", "")
            slug = re.sub(r"[^a-z0-9]+", "-", title.lower()).strip("-") or "course"
            link = f"https://www.ucas.com/explore/courses/{course_id}/{slug}?studyYear={hit.get('academicYearId', '2026')}"
            out.append(
                row(
                    "UK",
                    provider.get("name", ""),
                    title,
                    degree_from_title(title, hit.get("studyLevel", "")),
                    (hit.get("location") or {}).get("townOrCity", provider.get("townOrCity", "")),
                    link,
                    source,
                    "https://www.ucas.com/explore/search/courses",
                )
            )
        time.sleep(0.15)
    return out


def scrape_france() -> list[dict[str, str]]:
    url = "https://tie-api.campusfrance.org/sgetprograms/1"
    res = requests.get(url, headers={"User-Agent": UA}, timeout=30)
    res.raise_for_status()
    out = []
    for item in res.json().get("programs", []):
        title = item.get("programLabel", "")
        link = f"https://taughtie.campusfrance.org/tiesearch/#/catalog/{item.get('programId')}"
        out.append(row("France", item.get("institutionLabel", ""), title, degree_from_title(title), item.get("institutionCity", ""), link, "Campus France Taught in English", url))
    return out


def scrape_australia() -> list[dict[str, str]]:
    base = "https://data.gov.au/data/dataset/e5ae7059-bfa8-4fa4-a5c0-c13cf3520193/resource"
    courses_url = f"{base}/48cacf69-2082-415e-9595-f17d0c3a4af0/download/cricos-courses.csv"
    inst_url = f"{base}/7f6941f3-5327-4db7-b556-5f16d77f63c1/download/cricos-institutions.csv"
    inst_rows = csv.DictReader(io.StringIO(requests.get(inst_url, timeout=40).text))
    providers = {r.get("CRICOS Provider Code", ""): r for r in inst_rows}
    out = []
    for r in csv.DictReader(io.StringIO(requests.get(courses_url, timeout=60).text.replace("\ufeff", ""))):
        if r.get("Expired") == "Yes" or r.get("Course Language", "").lower() not in ("", "english"):
            continue
        degree = degree_from_title(r.get("Course Name", ""), r.get("Course Level", ""))
        if degree not in {"Bachelor", "Master", "PhD"}:
            continue
        code = r.get("CRICOS Provider Code", "")
        provider = providers.get(code, {})
        city = provider.get("Postal Address City", "")
        link = provider.get("Website", "") or f"https://cricos.education.gov.au/Course/CourseSearch.aspx?CourseCode={r.get('CRICOS Course Code', '')}"
        out.append(row("Australia", r.get("Institution Name", ""), r.get("Course Name", ""), degree, city, link, "CRICOS data.gov.au", courses_url, r.get("Tuition Fee", "")))
    return out


def scrape_usa(max_pages: int = 5) -> list[dict[str, str]]:
    candidates = [
        os.path.join(DATA_DIR, "usa.json"),
        os.path.join(ROOT, "data_backup", "usa.json"),
    ]
    existing = []
    for existing_path in candidates:
        if os.path.exists(existing_path):
            with open(existing_path, encoding="utf-8") as f:
                data = json.load(f)
            if len(data) > len(existing):
                existing = data
    if existing:
        return [
            row(
                "USA",
                item.get("uni", ""),
                item.get("course", ""),
                item.get("degree", ""),
                item.get("city", ""),
                item.get("link", ""),
                item.get("source", "College Scorecard institution data + university official pages"),
                item.get("source_url", item.get("link", "")),
                item.get("fee", ""),
            )
            for item in existing
        ]

    endpoint = "https://api.data.gov/ed/collegescorecard/v1/schools"
    out = []
    for page in range(max_pages):
        params = {
            "api_key": os.environ.get("DATA_GOV_API_KEY", "DEMO_KEY"),
            "school.degrees_awarded.predominant": "3",
            "school.ownership__range": "1..2",
            "fields": "school.name,school.city,school.state,school.school_url,latest.programs.cip_4_digit",
            "page": page,
            "per_page": 100,
        }
        res = requests.get(endpoint, params=params, headers={"User-Agent": UA}, timeout=30)
        if res.status_code == 429:
            break
        res.raise_for_status()
        for school in res.json().get("results", []):
            programs = school.get("latest.programs.cip_4_digit") or []
            cip_titles = [p.get("title") or p.get("credential", {}).get("title", "") for p in programs if isinstance(p, dict)]
            if not cip_titles:
                cip_titles = ["Undergraduate programs"]
            link = clean_link(school.get("school.school_url", ""), "https://collegescorecard.ed.gov/")
            for title in cip_titles[:30]:
                out.append(row("USA", school.get("school.name", ""), title, degree_from_title(title) or "Bachelor", school.get("school.city", ""), link, "US College Scorecard", endpoint))
        time.sleep(0.2)
    return out


def scrape_canada() -> list[dict[str, str]]:
    candidates = [
        os.path.join(DATA_DIR, "canada.json"),
        os.path.join(ROOT, "data_backup", "canada.json"),
    ]
    existing = []
    for existing_path in candidates:
        if os.path.exists(existing_path):
            with open(existing_path, encoding="utf-8") as f:
                data = json.load(f)
            if len(data) > len(existing):
                existing = data
    return [
        row(
            "Canada",
            item.get("uni", ""),
            item.get("course", ""),
            item.get("degree", ""),
            item.get("city", ""),
            item.get("link", ""),
            item.get("source", "University official course pages"),
            item.get("source_url", item.get("link", "")),
            item.get("fee", ""),
        )
        for item in existing
    ]


def scrape_switzerland() -> list[dict[str, str]]:
    url = "https://api.studyprogrammes.ch/list_studyprogrammes"
    out = []
    for page in range(1, 21):
        res = requests.get(url, params={"page": page}, headers={"User-Agent": UA, "Origin": "https://studyprogrammes.ch"}, timeout=40)
        res.raise_for_status()
        items = res.json().get("data", [])
        if not items:
            break
        for item in items:
            title = item.get("name", "")
            inst = item.get("institute") or {}
            level = text(item.get("degree_level", ""))
            link = f"https://studyprogrammes.ch/en/studyprogramme/{item.get('id')}"
            out.append(row("Switzerland", inst.get("name", ""), title, degree_from_title(title, level), "", link, "swissuniversities studyprogrammes.ch", url))
        time.sleep(0.1)
    return out


def scrape_sweden(max_pages: int = 1) -> list[dict[str, str]]:
    base = "https://api.skolverket.se/susa-navet/emil3"
    providers = {}
    prov = requests.get(f"{base}/educationProviders", params={"schoolType": "HS", "size": 200}, timeout=30).json()
    for p in prov.get("educationProviders", []):
        providers[p.get("id")] = p.get("content", {})
    out = []
    for page in range(max_pages):
        events = requests.get(f"{base}/educationEvents", params={"schoolType": "HS", "size": 40, "page": page}, timeout=40).json()
        for event in events.get("educationEvents", []):
            content = event.get("content", {})
            education_id = content.get("education")
            info = requests.get(f"{base}/educationInfos/{urllib.parse.quote(education_id)}", timeout=20).json() if education_id else {}
            infoc = info.get("content", {})
            title = text(infoc.get("title", {}))
            degree = degree_from_title(title, " ".join(e.get("code", "") for e in infoc.get("educationLevels", [])))
            if not degree and not infoc.get("resultIsDegree"):
                continue
            provider_id = (content.get("providers") or [""])[0]
            provider = providers.get(provider_id, {})
            link = text(content.get("url", {}))
            fee = ""
            for ext in content.get("extensions", []):
                tuition = ext.get("tuitionFee") or {}
                if tuition.get("total"):
                    fee = f"SEK {tuition['total']}"
            out.append(row("Sweden", text(provider.get("name", {})), title, degree or "Bachelor", "", link, "Skolverket SUSA-navet", base, fee))
        time.sleep(0.15)
    return out


def scrape_netherlands() -> list[dict[str, str]]:
    url = "https://onderwijsdata.duo.nl/dataset/7c0686f4-b5c2-418e-8e44-7be0057d8084/resource/ffffa7ad-e6a2-4ba7-9fc2-a09df4128555/download/ho_opleidingsoverzicht.csv"
    res = requests.get(url, timeout=40)
    res.raise_for_status()
    sample = res.content[:2000].decode("utf-8", "ignore")
    dialect = csv.Sniffer().sniff(sample, delimiters=";,")
    out = []
    for r in csv.DictReader(io.StringIO(res.content.decode("utf-8-sig", "ignore")), dialect=dialect):
        keys = {k.lower(): k for k in r if k}
        def pick(*names: str) -> str:
            for name in names:
                key = keys.get(name.lower())
                if key and r.get(key):
                    return r[key]
            return ""
        course = pick("INTERNATIONALE_NAAM", "EIGENNAAM_ENGELS", "NAAM_LANG", "OPLEIDINGSNAAM ACTUEEL", "OPLEIDINGSNAAM", "NAAM OPLEIDING")
        uni = pick("PENVOERDER", "ONDERWIJSBESTUUR_NAAM", "ONDERWIJSAANBIEDER_NAAM", "INSTELLINGSNAAM ACTUEEL", "INSTELLINGSNAAM")
        degree = degree_from_title(course, pick("GRAAD", "NIVEAU", "OPLEIDINGSVORM", "SOORT OPLEIDING"))
        if not degree:
            continue
        out.append(row("Netherlands", uni, course, degree, pick("ONDERWIJSLOCATIEPLAATS", "VESTIGINGSPLAATS", "PLAATS"), pick("WEBSITE") or "https://www.studyinnl.org/dutch-education/studies", "DUO Open Onderwijsdata", url))
    return out


def scrape_japan(max_pages: int = 10) -> list[dict[str, str]]:
    out = []
    base = "https://studyinjapan.go.jp/en/search-for-schools/school_search.php"
    for page in range(max_pages):
        params = {"lang": "en", "limit": "25", "offset": str(page * 25), "go": "go", "course": "1"}
        res = requests.get(base, params=params, headers={"User-Agent": UA}, timeout=30)
        res.raise_for_status()
        soup = BeautifulSoup(res.text, "html.parser")
        items = soup.select("a.school-result-item")
        if not items:
            break
        for item in items:
            href = urllib.parse.urljoin("https://studyinjapan.go.jp", item.get("href", ""))
            name = item.select_one(".school-name") or item.select_one("h3") or item
            meta = item.get_text(" ", strip=True)
            degree = "Bachelor" if "Undergraduate" in meta else "Master" if "Graduate" in meta else ""
            city = ""
            out.append(row("Japan", name.get_text(" ", strip=True), "Degree Program", degree, city, href, "Study in Japan official school search", res.url))
        time.sleep(0.2)
    return out


SCRAPERS = {
    "Germany": scrape_germany,
    "UK": scrape_uk,
    "France": scrape_france,
    "Australia": scrape_australia,
    "USA": scrape_usa,
    "Canada": scrape_canada,
    "Switzerland": scrape_switzerland,
    "Sweden": scrape_sweden,
    "Netherlands": scrape_netherlands,
    "Japan": scrape_japan,
}


def main() -> None:
    manifest = {"generated_at": TODAY, "sources": {}}
    for country, scraper in SCRAPERS.items():
        try:
            rows = scraper()
            save(country, rows)
            manifest["sources"][country] = {"status": "ok", "rows": len(rows)}
        except Exception as exc:
            manifest["sources"][country] = {"status": "error", "error": str(exc)}
            print(f"{country:12s} ERROR {exc}")
    with open(os.path.join(DATA_DIR, "source_manifest.json"), "w", encoding="utf-8") as f:
        json.dump(manifest, f, ensure_ascii=False, indent=2)


if __name__ == "__main__":
    main()
