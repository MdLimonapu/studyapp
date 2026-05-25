"""
UK university course scraper.
Source: FindAMasters.com / FindAPhD.com (server-rendered HTML)
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


def scrape_uk():
    """Scrape UK Master's and Bachelor's courses from FindAMasters.com and FindAPhD.com."""
    courses = []

    # --- FindAMasters ---
    print("📚 Scraping FindAMasters.com for UK Master's programmes...")
    page = 1
    max_pages = 150
    consecutive_empty = 0

    while page <= max_pages:
        url = f"https://www.findamasters.com/masters-degrees/united-kingdom/?PG={page}"
        try:
            res = requests.get(url, headers=HEADERS, timeout=15)
            if res.status_code == 403:
                print(f"  ⚠️  403 Forbidden on page {page}, trying with different headers...")
                alt_headers = HEADERS.copy()
                alt_headers["Referer"] = "https://www.google.com"
                res = requests.get(url, headers=alt_headers, timeout=15)
            if res.status_code != 200:
                print(f"  ⚠️  HTTP {res.status_code} on page {page}, stopping.")
                break

            soup = BeautifulSoup(res.text, "html.parser")

            # Try multiple selector patterns
            items = soup.select("div.courseResult") or soup.select("div.result") or soup.select("article.result")
            if not items:
                consecutive_empty += 1
                if consecutive_empty >= 3:
                    print(f"  No results on page {page}, stopping after {consecutive_empty} empty pages.")
                    break
                page += 1
                time.sleep(2)
                continue

            consecutive_empty = 0
            for item in items:
                try:
                    # Course name
                    title_el = item.select_one("h4 a") or item.select_one("h3 a") or item.select_one("a.courseLink")
                    if not title_el:
                        continue
                    course_name = title_el.get_text(strip=True)
                    href = title_el.get("href", "")
                    link = href if href.startswith("http") else f"https://www.findamasters.com{href}"

                    # University
                    uni_el = item.select_one("span.instName") or item.select_one("a.instLink") or item.select_one("p.instName")
                    uni_name = uni_el.get_text(strip=True) if uni_el else ""

                    # Location
                    loc_el = item.select_one("span.locationName") or item.select_one("span.location")
                    city = loc_el.get_text(strip=True) if loc_el else ""

                    if uni_name and course_name:
                        courses.append({
                            "country": "UK",
                            "uni": uni_name,
                            "course": course_name,
                            "degree": "Master",
                            "city": city,
                            "link": link,
                        })
                except Exception as e:
                    continue

            print(f"  Page {page} — {len(courses)} courses so far...")
            page += 1
            time.sleep(1.5)

        except requests.exceptions.RequestException as e:
            print(f"  ⚠️  Request error on page {page}: {e}")
            consecutive_empty += 1
            if consecutive_empty >= 3:
                break
            time.sleep(3)
            page += 1

    # --- FindAPhD ---
    print(f"\n📚 Scraping FindAPhD.com for UK PhD programmes...")
    phd_page = 1
    phd_max = 50
    consecutive_empty = 0

    while phd_page <= phd_max:
        url = f"https://www.findaphd.com/phds/united-kingdom/?PG={phd_page}"
        try:
            res = requests.get(url, headers=HEADERS, timeout=15)
            if res.status_code != 200:
                print(f"  ⚠️  HTTP {res.status_code} on page {phd_page}, stopping.")
                break

            soup = BeautifulSoup(res.text, "html.parser")
            items = soup.select("div.phd-result") or soup.select("div.result") or soup.select("article.result")
            if not items:
                consecutive_empty += 1
                if consecutive_empty >= 3:
                    break
                phd_page += 1
                time.sleep(2)
                continue

            consecutive_empty = 0
            for item in items:
                try:
                    title_el = item.select_one("h4 a") or item.select_one("h3 a") or item.select_one("a.courseLink")
                    if not title_el:
                        continue
                    course_name = title_el.get_text(strip=True)
                    href = title_el.get("href", "")
                    link = href if href.startswith("http") else f"https://www.findaphd.com{href}"

                    uni_el = item.select_one("span.instName") or item.select_one("a.instLink")
                    uni_name = uni_el.get_text(strip=True) if uni_el else ""

                    loc_el = item.select_one("span.locationName") or item.select_one("span.location")
                    city = loc_el.get_text(strip=True) if loc_el else ""

                    if uni_name and course_name:
                        courses.append({
                            "country": "UK",
                            "uni": uni_name,
                            "course": course_name,
                            "degree": "PhD",
                            "city": city,
                            "link": link,
                        })
                except Exception:
                    continue

            print(f"  PhD Page {phd_page} — {len(courses)} total courses...")
            phd_page += 1
            time.sleep(1.5)

        except requests.exceptions.RequestException as e:
            print(f"  ⚠️  Request error: {e}")
            consecutive_empty += 1
            if consecutive_empty >= 3:
                break
            time.sleep(3)
            phd_page += 1

    # Save
    output_path = os.path.join(os.path.dirname(__file__), "..", "data", "uk.json")
    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    with open(output_path, "w") as f:
        json.dump(courses, f, indent=2)
    print(f"\n✅ UK Done! Total: {len(courses)} courses saved to data/uk.json")
    return courses


if __name__ == "__main__":
    scrape_uk()
