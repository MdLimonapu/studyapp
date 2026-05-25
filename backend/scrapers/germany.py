import requests
from bs4 import BeautifulSoup
import json
import time

def scrape_germany():
    courses = []
    page = 1
    consecutive_empty = 0

    print("🇩🇪 Scraping Germany English-taught programs from DAAD...")

    while True:
        url = f"https://www.daad.de/en/studying-in-germany/universities/all-degree-programmes/?p={page}&hec-teachingLanguage=2"
        try:
            res = requests.get(url, headers={"User-Agent": "Mozilla/5.0"}, timeout=15)
            if res.status_code != 200:
                print(f"  ⚠️  HTTP {res.status_code} on page {page}, stopping.")
                break

            soup = BeautifulSoup(res.text, "html.parser")
            items = soup.select("article.result")
            
            if not items:
                consecutive_empty += 1
                if consecutive_empty >= 3:
                    print(f"  No more results. Stopped at page {page}.")
                    break
                page += 1
                time.sleep(2)
                continue

            consecutive_empty = 0
            for item in items:
                try:
                    spans = item.select("span.result__headline-content")
                    uni = spans[0].text.strip() if len(spans) > 0 else ""
                    course = spans[1].text.strip() if len(spans) > 1 else ""
                    
                    dds = item.select("dd.s-result-item")
                    degree = dds[0].text.strip() if dds else ""
                    city = dds[2].text.strip() if len(dds) > 2 else ""
                    
                    link = item.select_one("a.result__link")
                    href = "https://www.daad.de" + link["href"] if link else ""

                    if uni and course:
                        courses.append({
                            "country": "Germany",
                            "uni": uni,
                            "course": course,
                            "degree": degree,
                            "city": city,
                            "link": href
                        })
                except Exception:
                    continue

            print(f"  Page {page} — {len(courses)} courses...")
            page += 1
            time.sleep(1)  # Respectful delay
            
        except Exception as e:
            print(f"  ⚠️ Error on page {page}: {e}")
            time.sleep(3)
            page += 1

    # Save to JSON database
    with open("data/germany.json", "w") as f:
        json.dump(courses, f, indent=2, ensure_ascii=False)
    print(f"Done! Total: {len(courses)} German English-taught courses saved.")
    return courses

if __name__ == "__main__":
    scrape_germany()
