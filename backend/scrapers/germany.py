import requests
from bs4 import BeautifulSoup
import json
import time

def scrape_germany():
    courses = []
    page = 1

    while True:
        url = f"https://www.daad.de/en/studying-in-germany/universities/all-degree-programmes/?p={page}"
        res = requests.get(url, headers={"User-Agent": "Mozilla/5.0"})
        soup = BeautifulSoup(res.text, "html.parser")

        items = soup.select("article.result")
        if not items:
            break

        for item in items:
            spans = item.select("span.result__headline-content")
            uni = spans[0].text.strip() if len(spans) > 0 else ""
            course = spans[1].text.strip() if len(spans) > 1 else ""
            dds = item.select("dd.s-result-item")
            degree = dds[0].text.strip() if dds else ""
            city = dds[2].text.strip() if len(dds) > 2 else ""
            link = item.select_one("a.result__link")
            href = "https://www.daad.de" + link["href"] if link else ""

            courses.append({
                "country": "Germany",
                "uni": uni,
                "course": course,
                "degree": degree,
                "city": city,
                "link": href
            })

        print(f"Page {page} — {len(courses)} courses...")
        page += 1
        time.sleep(1)
        if page > 300:
            break

    with open("data/germany.json", "w") as f:
        json.dump(courses, f, indent=2)
    print(f"Done! Total: {len(courses)} courses saved.")

if __name__ == "__main__":
    scrape_germany()
