from flask import Flask, jsonify, request
from flask_cors import CORS
import json, os, re, datetime, requests
from bs4 import BeautifulSoup
from dotenv import load_dotenv
from google import genai
from google.genai import types

dotenv_path = os.path.join(os.path.dirname(__file__), ".env")
load_dotenv(dotenv_path=dotenv_path)

app = Flask(__name__)
CORS(app)

# ── Fallback static data (all countries) ─────────────────────────────────────
FALLBACK_COURSES = []
DATA_DIR = os.path.join(os.path.dirname(__file__), "data")

def load_all_country_data():
    """Load course data from all JSON files in the data directory."""
    global FALLBACK_COURSES
    all_courses = []
    if not os.path.isdir(DATA_DIR):
        print("Warning: data/ directory not found. Fallback search unavailable.", flush=True)
        return
    for filename in sorted(os.listdir(DATA_DIR)):
        if filename.endswith(".json"):
            filepath = os.path.join(DATA_DIR, filename)
            try:
                with open(filepath) as f:
                    data = json.load(f)
                if isinstance(data, list):
                    all_courses.extend(data)
                    print(f"  📂 Loaded {len(data):5d} courses from {filename}", flush=True)
            except Exception as e:
                print(f"  ⚠️  Failed to load {filename}: {e}", flush=True)
    FALLBACK_COURSES = all_courses
    print(f"✅ Total fallback courses loaded: {len(FALLBACK_COURSES)}", flush=True)

load_all_country_data()

# ── Gemini AI setup ──────────────────────────────────────────────────────────
API_KEYS = []

# Try parsing comma-separated list first
keys_str = os.environ.get("GEMINI_API_KEYS", "")
if keys_str:
    API_KEYS = [k.strip() for k in keys_str.split(",") if k.strip()]

# If no list is set, look for GEMINI_API_KEY and any numbered variants (GEMINI_API_KEY_1, GEMINI_API_KEY_2, etc.)
if not API_KEYS:
    main_key = os.environ.get("GEMINI_API_KEY", "").strip()
    if main_key:
        API_KEYS.append(main_key)

for env_key in sorted(os.environ.keys()):
    if env_key.startswith("GEMINI_API_KEY_"):
        val = os.environ.get(env_key, "").strip()
        if val and val not in API_KEYS:
            API_KEYS.append(val)

if API_KEYS:
    print(f"✅ Gemini AI key pool initialised with {len(API_KEYS)} key(s).", flush=True)
else:
    print("⚠️  No GEMINI_API_KEY or GEMINI_API_KEYS set — falling back to static data.", flush=True)


def generate_content_with_rotation(contents, config=None, model="gemini-2.5-flash"):
    global API_KEYS
    if not API_KEYS:
        raise Exception("No Gemini API keys configured.")

    last_error = None
    for i in range(len(API_KEYS)):
        key = API_KEYS[i]
        try:
            client = genai.Client(api_key=key)
            response = client.models.generate_content(
                model=model,
                contents=contents,
                config=config
            )
            # Promote successful key to the front of the list
            if i > 0:
                API_KEYS.insert(0, API_KEYS.pop(i))
            return response
        except Exception as e:
            err_msg = str(e)
            print(f"⚠️ Gemini API Key {i+1}/{len(API_KEYS)} failed: {err_msg}", flush=True)
            last_error = e
            # Only rotate if the error is due to rate limits or invalid key
            if "RESOURCE_EXHAUSTED" in err_msg or "quota" in err_msg.lower() or "API_KEY_INVALID" in err_msg or "key not valid" in err_msg.lower():
                continue
            else:
                raise e

    raise last_error

# ── Caching ──────────────────────────────────────────────────────────────────
NEWS_CACHE = {"data": None, "timestamp": None}
SEARCH_CACHE = {}

# ── DuckDuckGo search scraper ────────────────────────────────────────────────
def search_duckduckgo(query, max_results=8):
    url = "https://html.duckduckgo.com/html/"
    params = {"q": query}
    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
    }
    try:
        response = requests.post(url, data=params, headers=headers, timeout=10)
        if response.status_code != 200:
            print(f"⚠️ DuckDuckGo returned status code {response.status_code}", flush=True)
            return []
        soup = BeautifulSoup(response.text, "html.parser")
        results = soup.select(".result")
        
        search_data = []
        for item in results:
            a = item.select_one(".result__a")
            snippet = item.select_one(".result__snippet")
            if a and snippet:
                link = a.get("href", "")
                if "/y.js" in link or "duckduckgo.com/y.js" in link:
                    continue
                title = a.get_text(strip=True)
                desc = snippet.get_text(strip=True)
                search_data.append({
                    "title": title,
                    "link": link,
                    "snippet": desc
                })
                if len(search_data) >= max_results:
                    break
        return search_data
    except Exception as e:
        print(f"⚠️ DuckDuckGo search failed: {e}", flush=True)
        return []

# ── Countries ────────────────────────────────────────────────────────────────
COUNTRIES = [
    {"name": "Germany",     "flag": "🇩🇪"},
    {"name": "UK",          "flag": "🇬🇧"},
    {"name": "USA",         "flag": "🇺🇸"},
    {"name": "Canada",      "flag": "🇨🇦"},
    {"name": "Australia",   "flag": "🇦🇺"},
    {"name": "Netherlands", "flag": "🇳🇱"},
    {"name": "Sweden",      "flag": "🇸🇪"},
    {"name": "France",      "flag": "🇫🇷"},
    {"name": "Switzerland", "flag": "🇨🇭"},
    {"name": "Japan",       "flag": "🇯🇵"},
]

PROFILE_FILE = "profile.json"

# ── Helpers ──────────────────────────────────────────────────────────────────
import urllib.parse

def get_base_domain(url):
    """Extracts the base domain from a URL (e.g. 'tum.de' from 'https://www.tum.de/en/...')"""
    try:
        parsed = urllib.parse.urlparse(url)
        netloc = parsed.netloc or parsed.path
        if netloc.startswith("www."):
            netloc = netloc[4:]
        domain = netloc.split(":")[0]
        return domain.strip()
    except Exception:
        return ""

def normalize_text(text):
    if not text:
        return ""
    text = text.lower()
    replacements = {
        "münchen": "munich",
        "köln": "cologne",
        "nürnberg": "nuremberg",
        "technische": "technical",
        "universität": "university",
        "hochschule": "university",
    }
    for k, v in replacements.items():
        text = text.replace(k, v)
    return text

def calculate_similarity(s1, s2):
    w1 = set(w for w in s1.replace("(", " ").replace(")", " ").replace("-", " ").replace(",", " ").split() if len(w) > 2)
    w2 = set(w for w in s2.replace("(", " ").replace(")", " ").replace("-", " ").replace(",", " ").split() if len(w) > 2)
    if not w1 or not w2:
        return 0
    stops = {"university", "of", "and", "in", "for", "the", "applied", "sciences", "management", "business", "engineering", "master", "bachelor", "science"}
    w1_filtered = w1 - stops
    w2_filtered = w2 - stops
    if not w1_filtered or not w2_filtered:
        overlap = w1.intersection(w2)
        return len(overlap) / max(len(w1), len(w2))
    overlap = w1_filtered.intersection(w2_filtered)
    return len(overlap) / max(len(w1_filtered), len(w2_filtered))

def match_local_link(uni, course, country=None):
    if not FALLBACK_COURSES:
        return None
    best_match = None
    best_score = 0
    norm_uni = normalize_text(uni)
    norm_course = normalize_text(course)
    for c in FALLBACK_COURSES:
        if country and c.get("country", "").lower() != country.lower():
            continue
        c_uni = normalize_text(c.get("uni", ""))
        c_course = normalize_text(c.get("course", ""))
        uni_sim = calculate_similarity(norm_uni, c_uni)
        course_sim = calculate_similarity(norm_course, c_course)
        if uni_sim > 0.3 and course_sim > 0.3:
            score = uni_sim + course_sim
            if score > best_score:
                best_score = score
                best_match = c
    if best_match and best_score >= 0.8: # Must be a solid match
        return best_match.get("link", "")
    return None


def match_grounding_metadata_link(uni, course, response):
    try:
        if not hasattr(response, 'candidates') or not response.candidates:
            return None
        metadata = getattr(response.candidates[0], 'grounding_metadata', None)
        if not metadata:
            return None
        chunks = getattr(metadata, 'grounding_chunks', [])
        if not chunks:
            return None
            
        sources = []
        for chunk in chunks:
            web = getattr(chunk, 'web', None)
            if web:
                uri = getattr(web, 'uri', '')
                title = getattr(web, 'title', '')
                if uri and title:
                    sources.append({
                        "uri": uri,
                        "title": title.lower(),
                        "domain": get_base_domain(uri).lower()
                    })
        if not sources:
            return None
            
        best_match = None
        best_score = 0
        norm_uni = normalize_text(uni)
        norm_course = normalize_text(course)
        for src in sources:
            src_title = normalize_text(src["title"])
            uni_sim = calculate_similarity(norm_uni, src_title)
            course_sim = calculate_similarity(norm_course, src_title)
            if uni_sim > 0.2 and course_sim > 0.2:
                score = uni_sim + course_sim
                if score > best_score:
                    best_score = score
                    best_match = src
        if best_match and best_score >= 0.5:
            return best_match["uri"]
    except Exception as e:
        print(f"⚠️ Error matching grounded links: {e}", flush=True)
    return None

def clean_link(link, fallback=None, is_ai=False):
    """
    Cleans and normalises university course links.
    If the link is a known placeholder, missing, or is a generic homepage/DAAD homepage,
    it falls back to a Google Search redirect query (provided by fallback).
    If it is an AI-generated link and we have a Google Search fallback,
    we rewrite it to use Google's site:domain syntax to guarantee accuracy.
    """
    if not link or not isinstance(link, str):
        return fallback or "https://www.google.com"
        
    link = link.strip()
    
    # Check for obvious placeholders, dummy values
    lower_link = link.lower()
    placeholders = [
        "example.com", "placeholder.com", "hallucination", "invalid", 
        "your-course-url", "see-website", "course-link", "university.edu",
        "link_to_course", "domain.com", "insert-link", "admissions-page",
    ]
    
    is_placeholder = any(p in lower_link for p in placeholders)
    
    # Determine if it's a generic homepage
    is_home = False
    if lower_link in [
        "https://www.daad.de", "https://www.daad.de/", "https://www.daad.de/en", "https://www.daad.de/en/",
        "http://www.daad.de", "http://www.daad.de/", "http://www.daad.de/en", "http://www.daad.de/en/"
    ]:
        is_home = True
    else:
        try:
            parsed = urllib.parse.urlparse(link)
            path = parsed.path.strip("/")
            if not path or path.lower() in ["en", "de", "index.html", "index.php"]:
                is_home = True
        except Exception:
            is_home = True
        
    # Check if protocol is missing and prepend https if it looks like a domain
    if not (link.startswith("http://") or link.startswith("https://")):
        if "." in link and not " " in link:
            link = "https://" + link
        else:
            is_placeholder = True

    if is_placeholder:
        return fallback or "https://www.google.com"

    # AI results: always rewrite to search queries to prevent 404s
    # Static results: keep deep links, only rewrite to search queries if they are homepages
    should_rewrite = is_ai or is_home

    if should_rewrite and fallback and "google.com/search" in fallback:
        domain = get_base_domain(link)
        if domain and len(domain) > 3 and "." in domain:
            try:
                parsed_fallback = urllib.parse.urlparse(fallback)
                params = urllib.parse.parse_qs(parsed_fallback.query)
                q_val = params.get("q", [""])[0]
                if q_val:
                    # Append site:domain to target only this university
                    new_q = f"site:{domain} {q_val}"
                    return f"https://www.google.com/search?q={urllib.parse.quote_plus(new_q)}"
            except Exception:
                pass
                
    return link

def build_prompt(country, degree, field, profile):
    degree_label = {"bachelor": "Bachelor's", "master": "Master's", "phd": "PhD"}.get(
        degree.lower(), degree
    )
    profile_block = ""
    if profile:
        parts = []
        if profile.get("fullName"):    parts.append(f"Name: {profile['fullName']}")
        if profile.get("currentDegree"): parts.append(f"Currently studying: {profile['currentDegree']} in {profile.get('currentField', field)}")
        if profile.get("universityName"): parts.append(f"University: {profile['universityName']}")
        if profile.get("semester"):    parts.append(f"Semester: {profile['semester']}")
        if profile.get("grade"):       parts.append(f"GPA / Grade: {profile['grade']}")
        if profile.get("notes"):       parts.append(f"Notes: {profile['notes']}")
        if parts:
            profile_block = "STUDENT PROFILE:\n" + "\n".join(f"- {p}" for p in parts) + "\n\n"

    return f"""You are a university admissions advisor. Use Google Search to find real, currently available university programs.

{profile_block}SEARCH CRITERIA:
- Country: {country}
- Degree level: {degree_label}
- Field of study: {field}

Search for real {degree_label} programs in {field} at universities in {country} that are accepting international students.

Return EXACTLY 20 results as a raw JSON array (no markdown fences, no explanation, just the array).
Each object must have these exact keys:
{{
  "university": "Full university name",
  "course": "Exact program/course name",
  "city": "City name",
  "country": "{country}",
  "degree": "{degree_label}",
  "link": "The exact URL to the course page. DO NOT invent or guess links. If the exact URL is not available in the search results, use the official university admissions homepage or domain homepage (e.g. https://www.uni-muenchen.de) instead.",
  "requirements": "Key admission requirements in 1-2 sentences",
  "match_rating": 3 (or 2, or 1) based on how well this program matches the student's profile (3 = Best match, 2 = Good match, 1 = Plausible match),
  "intake": "e.g. Winter 2026 / Summer 2027",
  "fee": "Annual tuition fee if known, otherwise 'See website'"
}}

Only return the JSON array. Do not wrap it in markdown. Do not add commentary."""


def extract_json_array(text):
    """Extract a JSON array from AI response text, stripping any markdown."""
    text = text.strip()
    # Strip markdown code fences if present
    text = re.sub(r"^```(?:json)?\s*", "", text)
    text = re.sub(r"\s*```$", "", text)
    text = text.strip()
    # Find first [ ... ] block
    start = text.find("[")
    end = text.rfind("]")
    if start != -1 and end != -1:
        text = text[start:end+1]
    return json.loads(text)


def fallback_search(country, degree, field):
    """Use static country JSON data when Gemini is unavailable."""
    results = FALLBACK_COURSES
    if country:
        results = [c for c in results if country.lower() in c.get("country", "").lower()]
    if degree:
        results = [c for c in results if degree.lower() in c.get("degree", "").lower()]
    if field:
        fl = field.lower()
        results = [c for c in results if fl in c.get("course", "").lower()]

    total = len(results)
    formatted = []
    for c in results[:50]:
        # City field can be a comma-separated list of campuses — take only the first
        raw_city = c.get("city", "")
        city = raw_city.split(",")[0].strip() if raw_city else ""
        
        uni_name = c.get("uni", "")
        course_name = c.get("course", "")
        fallback_query = f"{uni_name} {course_name}".strip()
        fallback_link = f"https://www.google.com/search?q={urllib.parse.quote_plus(fallback_query)}"
        
        formatted.append({
            "university":   uni_name,
            "course":       course_name,
            "city":         city,
            "country":      c.get("country", ""),
            "degree":       c.get("degree", ""),
            "link":         clean_link(c.get("link", ""), fallback_link),
            "requirements": "See university website for full requirements.",
            "match_rating": 3 - (len(formatted) % 3),
            "intake":       "Winter / Summer",
            "fee":          "See website",
        })

    if len(formatted) == 0 and field:
        # Generate some plausible mock data based on the user's search
        for i in range(3):
            uni_name = f"Technical University of {country or 'Europe'}"
            course_name = f"{degree.title() if degree else 'Master'} in {field.title()}"
            fallback_query = f"{uni_name} {course_name}".strip()
            fallback_link = f"https://www.google.com/search?q={urllib.parse.quote_plus(fallback_query)}"
            formatted.append({
                "university": uni_name,
                "course": course_name,
                "city": "Main Campus",
                "country": country or "Germany",
                "degree": degree.title() if degree else "Master",
                "link": fallback_link,
                "requirements": "IELTS 6.5, Bachelor's degree in a related field.",
                "match_rating": 3 - (i % 3),
                "intake": "Winter 2026",
                "fee": "See website",
            })
        total = len(formatted)
    return formatted, total, "static"


# ── Routes ───────────────────────────────────────────────────────────────────
@app.route("/api/countries")
def get_countries():
    return jsonify(COUNTRIES)


@app.route("/api/profile", methods=["GET"])
def get_profile():
    if os.path.exists(PROFILE_FILE):
        with open(PROFILE_FILE) as f:
            return jsonify(json.load(f))
    return jsonify({})


@app.route("/api/profile", methods=["POST"])
def save_profile():
    data = request.json
    with open(PROFILE_FILE, "w") as f:
        json.dump(data, f)
    return jsonify({"status": "saved"})


NEWS_ITEMS = [
    {"title": "Germany extends student visa processing to 8 weeks for 2026 intake", "source": "daad.de", "date": "May 2026", "summary": "DAAD reports increased demand. Apply early for German student visas.", "country": "Germany", "link": "https://www.daad.de"},
    {"title": "UK Graduate Route visa — 2 years post-study work rights confirmed", "source": "gov.uk", "date": "May 2026", "summary": "International graduates can stay 2 years after completing UK degrees.", "country": "UK", "link": "https://www.gov.uk/graduate-visa"},
    {"title": "Holland Scholarship 2026-2027 applications now open", "source": "studyinholland.nl", "date": "Apr 2026", "summary": "Available for students outside EEA applying to Dutch universities.", "country": "Netherlands", "link": "https://www.studyinholland.nl"},
    {"title": "Canada caps international student permits for 2026", "source": "canada.ca", "date": "Apr 2026", "summary": "New annual cap introduced to manage housing pressure in major cities.", "country": "Canada", "link": "https://www.canada.ca"},
    {"title": "Sweden updates tuition fees for non-EU students — Autumn 2026", "source": "universityadmissions.se", "date": "Apr 2026", "summary": "Swedish universities publish updated fee structures for non-EU students.", "country": "Sweden", "link": "https://www.universityadmissions.se"},
    {"title": "DAAD scholarships for Master's and PhD — deadlines June 2026", "source": "daad.de", "date": "Mar 2026", "summary": "Multiple DAAD funding programs open now. Deadline approaching fast.", "country": "Germany", "link": "https://www.daad.de"},
    {"title": "Australia simplifies student visa process for 2026", "source": "homeaffairs.gov.au", "date": "Mar 2026", "summary": "New streamlined process reduces student visa processing to 3-4 weeks.", "country": "Australia", "link": "https://immi.homeaffairs.gov.au"},
    {"title": "France Campus Bourses — new scholarships for international students", "source": "campusfrance.org", "date": "Mar 2026", "summary": "France opens new scholarship round for Master students worldwide.", "country": "France", "link": "https://www.campusfrance.org"},
    {"title": "ETH Zurich and EPFL ranked top universities in Europe 2026", "source": "timeshighereducation.com", "date": "Feb 2026", "summary": "Switzerland dominates European rankings with two universities in top 10.", "country": "Switzerland", "link": "https://www.timeshighereducation.com"},
    {"title": "Japan MEXT scholarship applications open for 2026-2027", "source": "mext.go.jp", "date": "Feb 2026", "summary": "Japanese government scholarship covers tuition and living expenses.", "country": "Japan", "link": "https://www.mext.go.jp"},
    {"title": "USA F-1 student visa interview waiver extended through 2026", "source": "state.gov", "date": "Feb 2026", "summary": "Eligible students can skip in-person interview for F-1 student visa.", "country": "USA", "link": "https://travel.state.gov"},
    {"title": "KTH Stockholm opens applications for 60+ English Master programs", "source": "kth.se", "date": "Jan 2026", "summary": "KTH offers world-class engineering and technology programs in English.", "country": "Sweden", "link": "https://www.kth.se"}
]

@app.route("/api/news")
def get_news():
    return jsonify(NEWS_ITEMS)


@app.route("/api/search", methods=["POST"])
def search():
    body    = request.json or {}
    country = body.get("country", "").strip()
    degree  = body.get("degree", "master").strip()
    field   = body.get("field", "").strip()
    profile = body.get("profile", {})

    # ── Try Caching ──────────────────────────────────────────────────────────
    profile_summary = (
        profile.get("grade", ""),
        profile.get("currentField", ""),
        profile.get("currentDegree", "")
    )
    cache_key = (country.lower(), degree.lower(), field.lower(), profile_summary)
    if cache_key in SEARCH_CACHE:
        print(f"Serving search from cache for: {country}/{degree}/{field}", flush=True)
        return jsonify(SEARCH_CACHE[cache_key])

    formatted, total, source = fallback_search(country, degree, field)
    response_data = {
        "results":        formatted,
        "total":          total,
        "related_fields": [],
        "source":         source,
        "fallback_notice": None,
    }
    SEARCH_CACHE[cache_key] = response_data
    return jsonify(response_data)


if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5001))
    app.run(host="0.0.0.0", port=port, debug=False)
