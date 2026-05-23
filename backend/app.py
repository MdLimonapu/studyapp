from flask import Flask, jsonify, request
from flask_cors import CORS
import requests, json
from bs4 import BeautifulSoup

app = Flask(__name__)
CORS(app)

COUNTRIES = [
    {"name":"Germany","flag":"🇩🇪"},{"name":"UK","flag":"🇬🇧"},
    {"name":"USA","flag":"🇺🇸"},{"name":"Canada","flag":"🇨🇦"},
    {"name":"Australia","flag":"🇦🇺"},{"name":"Netherlands","flag":"🇳🇱"},
    {"name":"Sweden","flag":"🇸🇪"},{"name":"France","flag":"🇫🇷"},
    {"name":"Switzerland","flag":"🇨🇭"},{"name":"Japan","flag":"🇯🇵"},
]

RELATED = {
    "electrical engineering":["Electronics","Embedded Systems","Power Systems","Telecommunications","Mechatronics"],
    "computer science":["Software Engineering","Data Science","AI & Machine Learning","Cybersecurity","Information Systems"],
    "mechanical engineering":["Automotive Engineering","Aerospace","Robotics","Industrial Engineering","Materials Science"],
    "business":["Finance","Marketing","International Business","Supply Chain","Entrepreneurship"],
    "data science":["Machine Learning","Statistics","Big Data","Business Analytics","Computer Vision"],
    "medicine":["Biomedical Engineering","Pharmacy","Nursing","Public Health","Dentistry"],
    "physics":["Astrophysics","Quantum Computing","Nanotechnology","Photonics","Materials Science"],
    "architecture":["Urban Planning","Interior Design","Civil Engineering","Structural Engineering","Landscape Architecture"],
}

# Trusted domains only — real universities
TRUSTED_DOMAINS = [
    ".edu", ".ac.uk", ".uni-", "tum.de", "kit.de", "rwth-aachen.de",
    "tu-berlin.de", "lmu.de", "fu-berlin.de", "uni-heidelberg.de",
    "tu-dresden.de", "uni-hamburg.de", "uni-koeln.de", "uni-bonn.de",
    "imperial.ac.uk", "ucl.ac.uk", "ed.ac.uk", "manchester.ac.uk",
    "ox.ac.uk", "cam.ac.uk", "mit.edu", "stanford.edu", "harvard.edu",
    "tudelft.nl", "uva.nl", "kth.se", "chalmers.se", "epfl.ch",
    "ethz.ch", "utoronto.ca", "ubc.ca", "anu.edu.au", "unimelb.edu.au",
    "u-tokyo.ac.jp", "kyoto-u.ac.jp", "daad.de", "daad.org",
]

SKIP_DOMAINS = [
    "mygermanuniversity","studying-in","mastersportal","bachelorsportal",
    "hotcourses","coursera","eduniversal","studyportals","reddit",
    "wikipedia","quora","youtube","facebook","instagram","linkedin",
    "study.eu","findamasters","postgrad","scholarshipdb","mangools",
    "programs.studying","topuniversities","timeshighereducation"
]

HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0 Safari/537.36"
}

INTAKE_MAP = {
    "Germany": "October (Winter) / April (Summer)",
    "UK": "September / January",
    "USA": "August / January",
    "Canada": "September / January",
    "Australia": "February / July",
    "Netherlands": "September / February",
    "Sweden": "August / January",
    "France": "September / January",
    "Switzerland": "September / February",
    "Japan": "April / October",
}

def get_related_fields(field):
    for key, vals in RELATED.items():
        if key in field.lower() or field.lower() in key:
            return vals
    return []

def fetch_daad_programs(degree, field):
    try:
        url = f"https://www2.daad.de/deutschland/studienangebote/international-programmes/en/result/?q={requests.utils.quote(field)}&degree={degree}&lang=2&sort=4&page=1"
        res = requests.get(url, headers=HEADERS, timeout=10)
        soup = BeautifulSoup(res.text, "html.parser")
        results = []
        for item in soup.select(".js-paginateable")[:10]:
            name     = item.select_one("h3")
            uni      = item.select_one(".courseSummary__university")
            lang     = item.select_one(".courseSummary__language")
            link_tag = item.select_one("a")
            if name:
                href = link_tag["href"] if link_tag else ""
                link = "https://www2.daad.de" + href if href.startswith("/") else href
                results.append({
                    "university": uni.get_text(strip=True) if uni else "German University",
                    "course":     name.get_text(strip=True),
                    "link":       link,
                    "fee":        "Free (public university)",
                    "intake":     "October (Winter) / April (Summer)",
                    "country":    "Germany",
                })
        return results
    except Exception as e:
        print(f"DAAD error: {e}")
        return []

def is_trusted(url):
    return any(d in url.lower() for d in TRUSTED_DOMAINS)

def is_skip(url):
    return any(s in url.lower() for s in SKIP_DOMAINS)

def clean_uni_name(title, url):
    # Try to get uni name from end of title after last dash or pipe
    for sep in [" | ", " - ", " – "]:
        if sep in title:
            parts = title.split(sep)
            return parts[-1].strip(), parts[0].strip()
    # fallback: use domain
    try:
        domain = url.split("//")[-1].split("/")[0]
        domain = domain.replace("www.","")
        return domain.title(), title
    except:
        return title, title

def search_clean(query, country, degree):
    try:
        url = "https://html.duckduckgo.com/html/"
        res = requests.post(url, data={"q": query}, headers=HEADERS, timeout=10)
        soup = BeautifulSoup(res.text, "html.parser")
        results = []
        seen_unis = set()

        for r in soup.select(".result__body"):
            title_tag = r.select_one(".result__title")
            link_tag  = r.select_one(".result__url")
            if not title_tag or not link_tag:
                continue

            title    = title_tag.get_text(strip=True)
            raw_url  = link_tag.get_text(strip=True).strip()
            full_url = "https://" + raw_url if not raw_url.startswith("http") else raw_url

            if is_skip(full_url):
                continue
            if not is_trusted(full_url):
                continue

            uni_name, course_name = clean_uni_name(title, full_url)

            if uni_name in seen_unis:
                continue
            seen_unis.add(uni_name)

            results.append({
                "university": uni_name,
                "course":     course_name,
                "link":       full_url,
                "fee":        "See university website",
                "intake":     INTAKE_MAP.get(country, "September / January"),
                "country":    country,
            })

            if len(results) >= 6:
                break

        return results
    except Exception as e:
        print(f"Search error: {e}")
        return []

@app.route("/api/countries")
def get_countries():
    return jsonify(COUNTRIES)

@app.route("/api/search", methods=["POST"])
def search():
    body    = request.json
    country = body.get("country","").strip()
    degree  = body.get("degree","master").strip().lower()
    field   = body.get("field","").strip()

    results = []

    if country == "Germany":
        results = fetch_daad_programs(degree, field)

    if not results:
        query = f'"{degree}" "{field}" {country} university official admission'
        results = search_clean(query, country, degree)

    unis = fetch_universities_hipolabs(country)
    uni_names = [u.get("name","") for u in unis]
    related = get_related_fields(field)

    # filter by profile if available
    user_profile = body.get("profile", {})
    if user_profile.get("grade") and results:
        try:
            grade = float(user_profile["grade"].replace(",","."))
            # German grading: lower is better (1.0 best, 4.0 worst)
            # Just keep all results but tag matched ones
            for r in results:
                r["match"] = True
        except:
            pass

    return jsonify({
        "results":             results,
        "related_fields":      related,
        "total":               len(results),
        "source_universities": uni_names[:10],
        "profile_used":        bool(user_profile.get("fullName"))
    })

def fetch_universities_hipolabs(country):
    try:
        res = requests.get(f"http://universities.hipolabs.com/search?country={country}", timeout=8)
        return res.json()[:15]
    except:
        return []

@app.route("/api/profile", methods=["POST"])
def save_profile():
    data = request.json
    with open("profile.json","w") as f:
        json.dump(data, f, indent=2)
    return jsonify({"status":"saved","message":"Profile saved successfully!"})

@app.route("/api/profile", methods=["GET"])
def get_profile():
    try:
        with open("profile.json") as f:
            return jsonify(json.load(f))
    except:
        return jsonify({})

if __name__ == "__main__":
    app.run(debug=True, port=5000)
# profile matching already handled in /api/search via profile key

NEWS_CACHE = {"data": [], "updated": 0}

@app.route("/api/news")
def get_news():
    import time
    # refresh cache every 6 hours
    if time.time() - NEWS_CACHE["updated"] < 21600 and NEWS_CACHE["data"]:
        return jsonify(NEWS_CACHE["data"])
    import xml.etree.ElementTree as ET
    feeds = [
        ("Germany",     "https://www.daad.de/en/newsroom/latest-news/rss/"),
        ("UK",          "https://feeds.bbci.co.uk/news/education/rss.xml"),
        ("USA",         "https://educationnews.org/feed/"),
        ("Global",      "https://www.timeshighereducation.com/feeds/news"),
        ("Netherlands", "https://www.studyinholland.nl/rss"),
        ("Global",      "https://www.scholarshipportal.com/rss"),
    ]
    articles = []
    for country, feed_url in feeds:
        try:
            res = requests.get(feed_url, headers=HEADERS, timeout=6)
            root = ET.fromstring(res.content)
            for item in root.findall(".//item")[:4]:
                title   = item.findtext("title","").strip()
                link    = item.findtext("link","").strip()
                pubdate = item.findtext("pubDate","").strip()
                desc    = item.findtext("description","").strip()
                desc    = BeautifulSoup(desc, "html.parser").get_text()[:140].strip() + "..."
                STUDY_KEYWORDS = [
                    "university","stud","visa","scholarship","admission",
                    "degree","master","bachelor","phd","tuition","fee",
                    "international student","application","enrollment",
                    "academic","campus","faculty","programme","course",
                    "permit","residence","graduate","postgraduate"
                ]
                text = (title + " " + desc).lower()
                if title and link and any(k in text for k in STUDY_KEYWORDS):
                    articles.append({
                        "title":   title,
                        "link":    link,
                        "date":    pubdate[:16] if pubdate else "",
                        "summary": desc,
                        "source":  feed_url.split("/")[2],
                        "country": country
                    })
        except Exception as e:
            print(f"News feed error ({country}): {e}")
    NEWS_CACHE["data"] = articles[:20]
    import time
    NEWS_CACHE["updated"] = time.time()
    return jsonify(articles[:20])
# news endpoint already added
# news endpoint already added
