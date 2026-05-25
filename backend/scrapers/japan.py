"""
Japan university course scraper.
Source: Study in Japan (JASSO) — studyinjapan.go.jp
PHP-based with server-side rendering and query parameters.
"""
import requests
from bs4 import BeautifulSoup
import json
import time
import re
import os

HEADERS = {
    "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    "Accept-Language": "en-US,en;q=0.9",
}

BASE_URL = "https://www.studyinjapan.go.jp/en/search-for-schools/school_search.php"


def scrape_japan(max_pages=100):
    """
    Scrape Japan university programs from studyinjapan.go.jp.
    Uses PHP query parameters for pagination.
    """
    courses = []
    offset = 0
    limit = 25
    consecutive_empty = 0

    print("🇯🇵 Scraping Japan universities from studyinjapan.go.jp...")

    while offset < max_pages * limit:
        params = {
            "lang": "en",
            "offset": offset,
            "limit": limit,
            "narabikae": "2",  # Sort order
            "course": "0",     # All courses
            "medium_inst-1": "1",  # English instruction
        }

        try:
            res = requests.get(BASE_URL, params=params, headers=HEADERS, timeout=15)
            if res.status_code != 200:
                print(f"  ⚠️  HTTP {res.status_code} at offset {offset}")
                consecutive_empty += 1
                if consecutive_empty >= 3:
                    break
                offset += limit
                time.sleep(2)
                continue

            soup = BeautifulSoup(res.text, "html.parser")

            # Try different selectors for the results
            items = (
                soup.select("div.school-item") or
                soup.select("div.search-result-item") or
                soup.select("article.result") or
                soup.select("div.result-item") or
                soup.select("li.school-list-item") or
                soup.select("table.school-list tr")
            )

            if not items:
                # Try to find any structured content
                # Sometimes the page uses a different structure
                all_links = soup.select("a[href*='school_detail']")
                if all_links:
                    for a_tag in all_links:
                        href = a_tag.get("href", "")
                        link = href if href.startswith("http") else f"https://www.studyinjapan.go.jp{href}"
                        text = a_tag.get_text(strip=True)
                        if text:
                            # Try to extract university name from surrounding context
                            parent = a_tag.parent
                            if parent:
                                full_text = parent.get_text(separator=" | ", strip=True)
                                parts = full_text.split("|")
                                uni_name = parts[0].strip() if parts else text

                                courses.append({
                                    "country": "Japan",
                                    "uni": uni_name,
                                    "course": text if text != uni_name else "Graduate Program",
                                    "degree": "Master",
                                    "city": "",
                                    "link": link,
                                })
                    print(f"  Offset {offset} (link-based) — {len(courses)} courses...")
                else:
                    consecutive_empty += 1
                    if consecutive_empty >= 3:
                        print(f"  No results after 3 attempts, stopping.")
                        break

                offset += limit
                time.sleep(1.5)
                continue

            consecutive_empty = 0
            for item in items:
                try:
                    # Try to extract school name
                    name_el = (
                        item.select_one("h3") or
                        item.select_one("h4") or
                        item.select_one(".school-name") or
                        item.select_one("a")
                    )
                    if not name_el:
                        continue

                    uni_name = name_el.get_text(strip=True)

                    # Link
                    link_el = item.select_one("a[href]")
                    href = link_el.get("href", "") if link_el else ""
                    link = href if href.startswith("http") else f"https://www.studyinjapan.go.jp{href}"

                    # Location
                    loc_el = item.select_one(".location") or item.select_one(".prefecture")
                    city = loc_el.get_text(strip=True) if loc_el else ""

                    # Program/field info
                    field_el = item.select_one(".field") or item.select_one(".course")
                    course_name = field_el.get_text(strip=True) if field_el else "Graduate Program"

                    if uni_name:
                        courses.append({
                            "country": "Japan",
                            "uni": uni_name,
                            "course": course_name,
                            "degree": "Master",
                            "city": city,
                            "link": link,
                        })
                except Exception:
                    continue

            print(f"  Offset {offset} — {len(courses)} courses...")
            offset += limit
            time.sleep(1.5)

        except requests.exceptions.RequestException as e:
            print(f"  ⚠️  Request error at offset {offset}: {e}")
            consecutive_empty += 1
            if consecutive_empty >= 3:
                break
            time.sleep(3)
            offset += limit

    # If scraping didn't yield enough results, fall back to universal scraper
    if len(courses) < 100:
        print(f"\n  ⚠️  Only {len(courses)} courses scraped. Supplementing with universal scraper...")
        from scrapers.universal import scrape_country, COUNTRY_CONFIG, COUNTRY_CITIES

        # Ensure Japan is in the config
        if "Japan" in COUNTRY_CONFIG:
            more = scrape_country("Japan", max_courses=850)
            if more:
                # Merge, avoiding duplicates by (uni, course) key
                existing = {(c["uni"], c["course"]) for c in courses}
                for c in more:
                    key = (c["uni"], c["course"])
                    if key not in existing:
                        courses.append(c)
                        existing.add(key)

    # Save
    output_path = os.path.join(os.path.dirname(__file__), "..", "data", "japan.json")
    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    with open(output_path, "w") as f:
        json.dump(courses, f, indent=2, ensure_ascii=False)

    print(f"\n✅ Japan Done! Total: {len(courses)} courses saved to data/japan.json")
    return courses


if __name__ == "__main__":
    scrape_japan()
