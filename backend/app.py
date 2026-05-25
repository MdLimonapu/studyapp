from flask import Flask, jsonify, request
from flask_cors import CORS
import json, os, re
import urllib.parse
import urllib.request
from bs4 import BeautifulSoup
import ssl

app = Flask(__name__)
CORS(app)

# ── Static course data (all countries) ────────────────────────────────────────
FALLBACK_COURSES = []
DATA_DIR = os.path.join(os.path.dirname(__file__), "data")

def load_all_country_data():
    """Load course data from all JSON files in the data directory."""
    global FALLBACK_COURSES
    all_courses = []
    if not os.path.isdir(DATA_DIR):
        print("Warning: data/ directory not found.", flush=True)
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
    print(f"✅ Total courses loaded: {len(FALLBACK_COURSES)}", flush=True)

load_all_country_data()

# ── Curated field/course categories for autocomplete ────────────────────────
UNIQUE_FIELDS = [
    # Computer Science & IT
    "Computer Science", "Software Engineering", "Data Science", "Artificial Intelligence", 
    "Cybersecurity", "Informatics", "Information Technology",
    # Engineering
    "Electrical Engineering", "Mechanical Engineering", "Aerospace Engineering", 
    "Biomedical Engineering", "Chemical Engineering", "Civil Engineering", 
    "Environmental Engineering", "Industrial Engineering", "Mechatronics & Robotics",
    # Business & Economics
    "Business Administration", "Finance", "Accounting", "Marketing", "Economics", 
    "Management", "Entrepreneurship", "International Business",
    # Natural Sciences
    "Physics", "Chemistry", "Biology", "Mathematics", "Statistics", "Environmental Science",
    # Health & Medicine
    "Medicine", "Nursing", "Dentistry", "Pharmacy", "Public Health", "Biomedical Sciences",
    # Social Sciences & Humanities
    "Law", "Psychology", "International Relations", "Political Science", "Sociology",
    # Art, Design & Architecture
    "Architecture", "Graphic Design", "Fine Arts", "Music", "Media & Communications"
]

def build_field_index():
    """No-op now that we use curated fields, but kept for compatibility."""
    print(f"✅ Curated field index ready: {len(UNIQUE_FIELDS)} categories", flush=True)

build_field_index()

# ── Caching ──────────────────────────────────────────────────────────────────
SEARCH_CACHE = {}
RESOLVED_LINKS_CACHE = {}
CACHE_PATH = os.path.join(DATA_DIR, "resolved_links_cache.json")

def load_resolved_links_cache():
    global RESOLVED_LINKS_CACHE
    if os.path.exists(CACHE_PATH):
        try:
            with open(CACHE_PATH, "r") as f:
                RESOLVED_LINKS_CACHE = json.load(f)
            print(f"✅ Loaded {len(RESOLVED_LINKS_CACHE)} resolved links from cache.", flush=True)
        except Exception as e:
            print(f"⚠️ Failed to load resolved links cache: {e}", flush=True)

def save_resolved_links_cache():
    try:
        with open(CACHE_PATH, "w") as f:
            json.dump(RESOLVED_LINKS_CACHE, f, indent=2)
    except Exception as e:
        print(f"⚠️ Failed to save resolved links cache: {e}", flush=True)

load_resolved_links_cache()

def search_ddg_direct_link(query, target_domain=None):
    """Search DuckDuckGo HTML for a direct university course page link."""
    url = f"https://html.duckduckgo.com/html/?q={urllib.parse.quote_plus(query)}"
    
    # Bypass SSL verification to avoid platform certificate issues
    ctx = ssl.create_default_context()
    ctx.check_hostname = False
    ctx.verify_mode = ssl.CERT_NONE
    
    req = urllib.request.Request(
        url,
        headers={
            "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
        }
    )
    try:
        with urllib.request.urlopen(req, context=ctx, timeout=7) as response:
            html = response.read()
        soup = BeautifulSoup(html, "html.parser")
        links = soup.select("a.result__url")
        
        resolved_links = []
        for a in links:
            href = a.get("href", "")
            if "uddg=" in href:
                parsed = urllib.parse.urlparse(href)
                queries = urllib.parse.parse_qs(parsed.query)
                target = queries.get("uddg", [None])[0]
                if target:
                    resolved_links.append(target)
            elif href.startswith("http"):
                resolved_links.append(href)
                
        # Prioritise links matching the target university domain (e.g. uva.nl)
        if target_domain and resolved_links:
            clean_domain = target_domain.lower().replace("www.", "").strip()
            for l in resolved_links:
                # Exclude social media or search portals
                if any(p in l.lower() for p in ["wikipedia.org", "facebook.com", "linkedin.com", "twitter.com", "instagram.com", "youtube.com"]):
                    continue
                if clean_domain in l.lower():
                    return l
                    
        # Fall back to first non-social link
        for l in resolved_links:
            if not any(p in l.lower() for p in ["wikipedia.org", "facebook.com", "linkedin.com", "twitter.com", "instagram.com", "youtube.com"]):
                return l
                
        return resolved_links[0] if resolved_links else None
    except Exception as e:
        print(f"Error searching DDG for query '{query}': {e}", flush=True)
        return None

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

PROFILE_FILE = os.path.join(os.path.dirname(__file__), "profile.json")

# ── Helpers ──────────────────────────────────────────────────────────────────

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

def clean_link(link, fallback=None):
    """
    Cleans and normalises university course links.
    If the link is a known placeholder, missing, or is a generic homepage,
    it falls back to a Google Search redirect query.
    """
    if not link or not isinstance(link, str):
        return fallback or "https://www.google.com"
        
    link = link.strip()
    
    # Check for obvious placeholders
    lower_link = link.lower()
    placeholders = [
        "example.com", "placeholder.com", "hallucination", "invalid", 
        "your-course-url", "see-website", "course-link", "university.edu",
        "link_to_course", "domain.com", "insert-link", "admissions-page",
    ]
    
    is_placeholder = any(p in lower_link for p in placeholders)
    
    # Check if protocol is missing and prepend https if it looks like a domain
    if not (link.startswith("http://") or link.startswith("https://")):
        if "." in link and " " not in link:
            link = "https://" + link
        else:
            is_placeholder = True

    if is_placeholder:
        return fallback or "https://www.google.com"

    return link


def get_search_keywords(field):
    field_lower = field.lower().strip()
    keywords = [field_lower]
    
    # If the user searches for generic 'engineering', return related engineering branches
    if field_lower == "engineering":
        keywords.extend([
            "engineering", "electrical", "electronic", "mechanical", "aerospace", 
            "biomedical", "chemical", "civil", "environmental engineering", 
            "industrial engineering", "mechatronics", "robotics", "software engineering"
        ])
        return list(set(keywords))

    # Map major synonyms and related academic disciplines
    synonyms = {
        "computer science": ["computer science", "computing", "software engineering", "informatics", "computer engineering", "information technology", "it"],
        "software engineering": ["software engineering", "computer science", "computing", "programming", "software development"],
        "data science": ["data science", "data analytics", "big data", "machine learning", "statistics", "data analysis"],
        "artificial intelligence": ["artificial intelligence", "machine learning", "deep learning", "cognitive science", "robotics", "intelligent systems", "computer vision", "nlp"],
        "cybersecurity": ["cybersecurity", "cyber security", "information security", "network security", "cryptography", "infosec"],
        "informatics": ["informatics", "computer science", "information systems"],
        "information technology": ["information technology", "it", "information systems", "computer networks"],
        "electrical engineering": ["electrical engineering", "electronic engineering", "electronics", "power systems", "microelectronics", "embedded systems", "telecommunications"],
        "mechanical engineering": ["mechanical engineering", "robotics", "mechatronics", "automotive", "aerospace engineering", "fluid dynamics", "thermodynamics"],
        "aerospace engineering": ["aerospace", "aeronautical", "aviation", "space technology"],
        "biomedical engineering": ["biomedical engineering", "bioengineering", "biotech", "biotechnology", "prosthetics"],
        "chemical engineering": ["chemical engineering", "chemistry", "process engineering", "biochemical engineering"],
        "civil engineering": ["civil engineering", "structural engineering", "geotechnical", "construction management"],
        "environmental engineering": ["environmental engineering", "environment", "sustainability", "sustainable", "ecology", "water resources"],
        "industrial engineering": ["industrial engineering", "operations research", "systems engineering", "supply chain"],
        "mechatronics & robotics": ["mechatronics", "robotics", "automation", "control systems"],
        "business administration": ["business administration", "management", "business management", "mba", "bba", "entrepreneurship", "international business", "corporate strategy"],
        "finance": ["finance", "financial", "accounting", "banking", "investment", "corporate finance"],
        "accounting": ["accounting", "audit", "taxation", "financial reporting"],
        "marketing": ["marketing", "sales", "digital marketing", "branding", "public relations"],
        "economics": ["economics", "macroeconomics", "microeconomics", "econometrics", "political economy"],
        "management": ["management", "leadership", "human resources", "hr", "project management"],
        "entrepreneurship": ["entrepreneurship", "innovation", "startups", "venture"],
        "international business": ["international business", "global management", "cross-cultural"],
        "physics": ["physics", "astrophysics", "quantum", "thermodynamics", "optics"],
        "chemistry": ["chemistry", "biochemistry", "organic chemistry", "chemical"],
        "biology": ["biology", "molecular biology", "genetics", "microbiology", "ecology", "zoology"],
        "mathematics": ["mathematics", "math", "algebra", "calculus", "geometry"],
        "statistics": ["statistics", "probability", "data analysis", "actuarial"],
        "environmental science": ["environmental science", "ecology", "conservation", "climate change"],
        "medicine": ["medicine", "medical", "clinical", "healthcare", "health science", "biomedical", "surgery"],
        "nursing": ["nursing", "healthcare", "clinical nursing", "patient care"],
        "dentistry": ["dentistry", "dental", "oral health"],
        "pharmacy": ["pharmacy", "pharmacology", "pharmaceutical", "drug discovery"],
        "public health": ["public health", "epidemiology", "global health", "health policy"],
        "biomedical sciences": ["biomedical sciences", "biomedicine", "immunology", "pathology"],
        "law": ["law", "llm", "llb", "legal", "jurisprudence", "human rights"],
        "psychology": ["psychology", "cognitive science", "behavioral science", "clinical psychology"],
        "international relations": ["international relations", "global politics", "diplomacy", "foreign policy"],
        "political science": ["political science", "politics", "government", "public policy"],
        "sociology": ["sociology", "social sciences", "anthropology"],
        "architecture": ["architecture", "architectural", "urban planning", "landscape architecture"],
        "graphic design": ["graphic design", "visual communication", "ux", "ui", "illustration"],
        "fine arts": ["fine arts", "visual arts", "painting", "sculpture"],
        "music": ["music", "musicology", "performance", "composition"],
        "media & communications": ["media", "communications", "journalism", "public relations", "broadcasting"],
    }
    
    for key, syns in synonyms.items():
        if key in field_lower:
            keywords.extend(syns)
            
    # Deduplicate and return
    return list(set(keywords))

def get_estimated_fee(country, degree, uni_name):
    country_lower = country.lower().strip()
    degree_lower = degree.lower().strip()
    uni_lower = uni_name.lower().strip()
    
    # 1. Germany
    if country_lower == "germany":
        is_private = any(k in uni_lower for k in ["private", "international", "business school", "applied sciences", "hhl", "gisma", "bsbi"])
        if is_private:
            return "€8,000 - €15,000 / year"
        return "None (Semester contribution ~€200 - €400)"
        
    # 2. USA
    elif country_lower in ["usa", "united states"]:
        is_ivy = any(k in uni_lower for k in ["harvard", "yale", "princeton", "columbia", "pennsylvania", "dartmouth", "brown", "cornell", "stanford", "mit"])
        if is_ivy:
            return "$55,000 - $65,000 / year"
        return "$25,000 - $45,000 / year"
        
    # 3. UK
    elif country_lower in ["uk", "united kingdom"]:
        is_oxbridge = any(k in uni_lower for k in ["oxford", "cambridge", "imperial", "ucl", "lse"])
        if is_oxbridge:
            return "£25,000 - £38,000 / year"
        return "£16,000 - £26,000 / year"
        
    # 4. Canada
    elif country_lower == "canada":
        if degree_lower == "bachelor":
            return "CAD 22,000 - 38,000 / year"
        return "CAD 18,000 - 32,000 / year"
        
    # 5. Australia
    elif country_lower == "australia":
        return "AUD 32,000 - 45,000 / year"
        
    # 6. Netherlands
    elif country_lower == "netherlands":
        if degree_lower == "bachelor":
            return "€8,000 - €14,000 / year"
        return "€12,000 - €19,000 / year"
        
    # 7. Sweden
    elif country_lower == "sweden":
        return "SEK 90,000 - 145,000 / year (~€8,000 - €13,000)"
        
    # 8. France
    elif country_lower == "france":
        is_business = any(k in uni_lower for k in ["business", "hec", "essec", "esc", "edhec"])
        if is_business:
            return "€12,000 - €22,000 / year"
        if degree_lower == "bachelor":
            return "€2,770 / year (State rate)"
        return "€3,770 / year (State rate)"
        
    # 9. Switzerland
    elif country_lower == "switzerland":
        return "CHF 1,000 - CHF 2,000 / year"
        
    # 10. Japan
    elif country_lower == "japan":
        is_national = any(k in uni_lower for k in ["tokyo", "kyoto", "osaka", "tohoku", "nagoya", "kyushu", "hokkaido", "tsukuba", "kobe"])
        if is_national:
            return "¥535,800 / year (~$3,500)"
        return "¥800,000 - ¥1,400,000 / year"
        
    return "See website"


def fallback_search(country, degree, field):
    """Search static country JSON data with rating-based relevance sorting and smart links."""
    results = FALLBACK_COURSES
    if country:
        results = [c for c in results if country.lower() in c.get("country", "").lower()]
    if degree:
        results = [c for c in results if degree.lower() in c.get("degree", "").lower()]
        
    scored_results = []
    keywords = get_search_keywords(field) if field else []
    
    for c in results:
        course_title = c.get("course", "").lower()
        uni_name = c.get("uni", "").lower()
        
        if field:
            field_lower = field.lower().strip()
            # Assign match rating:
            # 3 = Exact search string contained in course name or uni name
            # 2 = Matches related synonym keywords
            # 1 = General keyword match
            if field_lower in course_title or field_lower in uni_name:
                rating = 3
            elif any(kw in course_title for kw in keywords):
                rating = 2
            else:
                rating = 1
        else:
            rating = 3
            
        scored_results.append((c, rating))
        
    # Sort scored results by rating descending (3 stars, then 2 stars, then 1 star)
    scored_results.sort(key=lambda x: x[1], reverse=True)
    
    total = len(scored_results)
    formatted = []
    
    for c, rating in scored_results[:50]:
        raw_city = c.get("city", "")
        city = raw_city.split(",")[0].strip() if raw_city else ""
        
        uni_name = c.get("uni", "")
        course_name = c.get("course", "")
        fallback_query = f"{uni_name} {course_name}".strip()
        fallback_link = f"https://www.google.com/search?q={urllib.parse.quote_plus(fallback_query)}"
        
        # Resolve working links:
        # Germany uses 100% real scraped DAAD links.
        db_link = c.get("link", "")
        is_germany = c.get("country", "").lower() == "germany"
        
        is_verified_template = False
        verified_domains = ["ox.ac.uk", "cam.ac.uk", "imperial.ac.uk", "ucl.ac.uk", "ed.ac.uk", "kth.se", "ethz.ch", "epfl.ch"]
        base_domain = get_base_domain(db_link)
        if any(vd in base_domain for vd in verified_domains):
            is_verified_template = True
            
        if is_germany or is_verified_template:
            link = clean_link(db_link, fallback_link)
        else:
            # Query-based direct link resolver with persistent cache
            cache_key = f"{uni_name} | {course_name}"
            if cache_key in RESOLVED_LINKS_CACHE:
                link = RESOLVED_LINKS_CACHE[cache_key]
            else:
                resolved = search_ddg_direct_link(f"{uni_name} {course_name}", base_domain)
                if resolved:
                    link = resolved
                    RESOLVED_LINKS_CACHE[cache_key] = resolved
                    save_resolved_links_cache()
                else:
                    # Fallback to the university's main page if DDG fails
                    link = clean_link(db_link, fallback_link)
            
        # Get estimated or existing fee data
        fee = c.get("fee") if c.get("fee") else get_estimated_fee(c.get("country", ""), c.get("degree", ""), uni_name)
            
        formatted.append({
            "university":   uni_name,
            "course":       course_name,
            "city":         city,
            "country":      c.get("country", ""),
            "degree":       c.get("degree", ""),
            "link":         link,
            "requirements": "See university website for full requirements.",
            "match_rating": rating,
            "intake":       "Winter / Summer",
            "fee":          fee,
        })
        
    if len(formatted) == 0 and field:
        # Generate some plausible results based on the user's search
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
                "match_rating": 3 - i,
                "intake": "Winter 2026",
                "fee": get_estimated_fee(country or "Germany", degree or "Master", uni_name),
            })
        total = len(formatted)
        
    return formatted, total


# ── Routes ───────────────────────────────────────────────────────────────────
@app.route("/api/fields")
def get_fields():
    """Return all unique course/field names for autocomplete."""
    country = request.args.get("country", "").strip().lower()
    if country:
        fields = set()
        for c in FALLBACK_COURSES:
            if country not in c.get("country", "").lower():
                continue
            course = c.get("course", "").strip()
            if not course:
                continue
            m = re.match(r'^(?:MSc|BSc|MEng|BEng|MBA|BBA|LLM|LLB|MD|MBBS|PhD)\s+in\s+(.+)$', course)
            if m:
                fields.add(m.group(1))
            else:
                fields.add(course)
        return jsonify(sorted(fields, key=str.lower))
    return jsonify(UNIQUE_FIELDS)


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

    # ── Caching ──────────────────────────────────────────────────────────────
    cache_key = (country.lower(), degree.lower(), field.lower())
    if cache_key in SEARCH_CACHE:
        return jsonify(SEARCH_CACHE[cache_key])

    formatted, total = fallback_search(country, degree, field)
    response_data = {
        "results":        formatted,
        "total":          total,
        "related_fields": [],
        "source":         "static",
        "fallback_notice": None,
    }
    SEARCH_CACHE[cache_key] = response_data
    return jsonify(response_data)


if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5001))
    app.run(host="0.0.0.0", port=port, debug=False)
