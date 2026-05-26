from flask import Flask, jsonify, request
from flask_cors import CORS
import json, os, re
import urllib.parse
import urllib.request
from bs4 import BeautifulSoup
import ssl

app = Flask(__name__)
CORS(app)

# Load environment variables from .env file manually if present
dotenv_path = os.path.join(os.path.dirname(__file__), ".env")
if os.path.exists(dotenv_path):
    with open(dotenv_path) as f:
        for line in f:
            if line.strip() and not line.startswith("#"):
                parts = line.strip().split("=", 1)
                if len(parts) == 2:
                    os.environ[parts[0].strip()] = parts[1].strip()

# Initialize MongoDB connection using remote cluster MONGO_URI
mongo_client = None
db = None
users_col = None

mongo_uri = os.environ.get("MONGO_URI")
if mongo_uri:
    try:
        from pymongo import MongoClient
        mongo_client = MongoClient(mongo_uri, serverSelectionTimeoutMS=5000)
        db_name = "studplex"
        parsed_uri = urllib.parse.urlparse(mongo_uri)
        if parsed_uri.path and parsed_uri.path != "/":
            db_name = parsed_uri.path.strip("/")
        
        db = mongo_client[db_name]
        users_col = db["users"]
        mongo_client.admin.command('ping')
        print(f"✅ Connected to Cloud MongoDB Atlas successfully (DB: {db_name}).", flush=True)
    except Exception as e:
        print(f"⚠️ Warning: Could not connect to MongoDB Atlas Cloud database: {e}", flush=True)
        mongo_client = None
        db = None
        users_col = None
else:
    print("⚠️ Warning: MONGO_URI not found in environment. Cloud database storage is disabled.", flush=True)


# ── Static course data (all countries) ────────────────────────────────────────
FALLBACK_COURSES = []
DATA_DIR = os.path.join(os.path.dirname(__file__), "data")
DATA_BACKUP_DIR = os.path.join(os.path.dirname(__file__), "data_backup")

def load_all_country_data():
    """Load course data from all JSON files in the data directory."""
    global FALLBACK_COURSES
    all_courses = []
    loaded_files = set()
    data_dirs = [DATA_DIR, DATA_BACKUP_DIR]

    if not any(os.path.isdir(data_dir) for data_dir in data_dirs):
        print("Warning: no course data directories found.", flush=True)
        return

    for data_dir in data_dirs:
        if not os.path.isdir(data_dir):
            continue
        for filename in sorted(os.listdir(data_dir)):
            if not filename.endswith(".json") or filename in loaded_files:
                continue
            try:
                filepath = os.path.join(data_dir, filename)
                with open(filepath) as f:
                    data = json.load(f)
                if isinstance(data, list):
                    all_courses.extend(data)
                    print(f"  📂 Loaded {len(data):5d} courses from {filename}", flush=True)
                    loaded_files.add(filename)
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
    "Engineering", "Electrical Engineering", "Mechanical Engineering", "Aerospace Engineering",
    "Biomedical Engineering", "Chemical Engineering", "Civil Engineering",
    "Environmental Engineering", "Industrial Engineering", "Mechatronics & Robotics",
    "Materials Science", "Energy Systems", "Transport & Logistics",
    # Business & Economics
    "Business Administration", "Finance", "Accounting", "Marketing", "Economics",
    "Management", "Entrepreneurship", "International Business",
    # Natural Sciences
    "Physics", "Chemistry", "Biology", "Mathematics", "Statistics", "Environmental Science",
    "Geography & Earth Sciences", "Agriculture & Food Science", "Veterinary Science",
    # Health & Medicine
    "Medicine", "Nursing", "Dentistry", "Pharmacy", "Public Health", "Biomedical Sciences",
    "Sports Science",
    # Social Sciences & Humanities
    "Law", "Psychology", "International Relations", "Political Science", "Sociology",
    "Education", "Social Work", "History & Cultural Studies", "Theology & Philosophy",
    "Languages & Linguistics",
    # Art, Design & Architecture
    "Architecture", "Urban Planning", "Graphic Design", "Fine Arts", "Music",
    "Performing Arts", "Fashion & Textile Design", "Media & Communications",
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


def get_search_alternatives(field):
    field_lower = field.lower().strip()
    alternatives = [field_lower]
    
    # 1. Clean and normalize spacing/separators
    norm_space = re.sub(r'[/&,\-–]|\band\b|\bor\b', ' ', field_lower)
    norm_space = ' '.join(norm_space.split())
    if norm_space not in alternatives:
        alternatives.append(norm_space)
        
    norm_and = re.sub(r'[/&,\-–]|\bor\b', ' and ', field_lower)
    norm_and = ' '.join(norm_and.split())
    if norm_and not in alternatives:
        alternatives.append(norm_and)
        
    norm_amp = re.sub(r'[/,\-–]|\band\b|\bor\b', ' & ', field_lower)
    norm_amp = ' '.join(norm_amp.split())
    if norm_amp not in alternatives:
        alternatives.append(norm_amp)

    # 2. Handle specific combined slash/or disciplines
    if '/' in field_lower or ' or ' in field_lower or ' and ' in field_lower or ' & ' in field_lower:
        parts = re.split(r'[/]|\bor\b|\band\b|&', field_lower)
        words = field_lower.split()
        if len(words) > 1:
            noun = words[-1]
            for part in parts[:-1]:
                part_clean = part.strip()
                if part_clean:
                    alt_part = f"{part_clean} {noun}"
                    alt_part = ' '.join(alt_part.split())
                    if alt_part not in alternatives:
                        alternatives.append(alt_part)
            last_part_clean = parts[-1].strip()
            if last_part_clean and last_part_clean not in alternatives:
                alternatives.append(last_part_clean)
                
    return alternatives


def get_search_keywords(field):
    field_lower = field.lower().strip()
    keywords = [field_lower]
    
    # Split by common separators: slashes, ampersands, commas, hyphens, and/or/with
    parts = re.split(r'[/&,\-–]|\band\b|\bor\b|\bwith\b', field_lower)
    cleaned_parts = []
    for p in parts:
        p_clean = p.strip()
        if p_clean and len(p_clean) > 2:
            cleaned_parts.append(p_clean)
            keywords.append(p_clean)
            
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
        # Computer Science & IT
        "computer science": ["computer science", "computing", "software engineering", "informatics", "computer engineering", "information technology", "it"],
        "software engineering": ["software engineering", "computer science", "computing", "programming", "software development"],
        "data science": ["data science", "data analytics", "big data", "machine learning", "statistics", "data analysis"],
        "artificial intelligence": ["artificial intelligence", "machine learning", "deep learning", "cognitive science", "intelligent systems", "computer vision", "nlp", "ai engineering", "ai in", "ai for"],
        "cybersecurity": ["cybersecurity", "cyber security", "information security", "network security", "cryptography", "infosec"],
        "informatics": ["informatics", "computer science", "information systems"],
        "information technology": ["information technology", "it", "information systems", "computer networks"],
        # Engineering
        "electrical engineering": ["electrical engineering", "electronic engineering", "electronics", "power systems", "microelectronics", "embedded systems", "telecommunications"],
        "mechanical engineering": ["mechanical engineering", "mechatronics", "automotive", "fluid dynamics", "thermodynamics"],
        "aerospace engineering": ["aerospace", "aeronautical", "aviation", "space technology", "space engineering", "space science"],
        "biomedical engineering": ["biomedical engineering", "bioengineering", "biotech", "biotechnology", "prosthetics"],
        "chemical engineering": ["chemical engineering", "process engineering", "biochemical engineering"],
        "civil engineering": ["civil engineering", "structural engineering", "geotechnical", "construction management", "construction engineering"],
        "environmental engineering": ["environmental engineering", "water resources", "water engineering", "environmental systems"],
        "industrial engineering": ["industrial engineering", "operations research", "systems engineering", "manufacturing engineering", "production engineering"],
        "mechatronics & robotics": ["mechatronics", "robotics", "automation", "control systems", "autonomous systems"],
        "materials science": ["materials science", "materials engineering", "advanced materials", "nanotechnology", "nanoscience", "polymer", "ceramic", "composite", "metallurgy", "semiconductor"],
        "energy systems": ["energy systems", "energy engineering", "renewable energy", "solar energy", "wind energy", "smart energy", "power engineering", "energy technology", "sustainable energy"],
        "transport & logistics": ["transport", "logistics", "supply chain", "aviation management", "air transport", "shipping", "maritime", "mobility"],
        # Business & Economics
        "business administration": ["business administration", "management", "business management", "mba", "bba", "entrepreneurship", "international business", "corporate strategy"],
        "finance": ["finance", "financial", "banking", "investment", "corporate finance"],
        "accounting": ["accounting", "accountancy", "accountan", "audit", "taxation", "controlling", "financial reporting"],
        "marketing": ["marketing", "sales", "digital marketing", "branding", "advertising", "brand design"],
        "economics": ["economics", "macroeconomics", "microeconomics", "econometrics", "political economy"],
        "management": ["management", "leadership", "human resources", "hr", "project management"],
        "entrepreneurship": ["entrepreneurship", "innovation", "startups", "venture"],
        "international business": ["international business", "global management", "cross-cultural"],
        # Natural Sciences
        "physics": ["physics", "astrophysics", "quantum", "thermodynamics", "optics"],
        "chemistry": ["chemistry", "biochemistry", "organic chemistry", "chemical", "synthesis", "catalysis"],
        "biology": ["biology", "molecular biology", "genetics", "microbiology", "ecology", "zoology", "botany", "marine biology", "evolutionary biology"],
        "mathematics": ["mathematics", "math", "algebra", "calculus", "geometry", "applied mathematics"],
        "statistics": ["statistics", "probability", "data analysis", "actuarial", "biostatistics"],
        "environmental science": ["environmental science", "ecology", "conservation", "climate change", "climate science", "atmospheric"],
        "geography & earth sciences": ["geography", "earth science", "geology", "geoscience", "geophysics", "meteorology", "oceanography", "hydrology", "cartography", "gis", "remote sensing"],
        "agriculture & food science": ["agriculture", "agri", "food science", "food technology", "animal science", "forestry", "horticulture", "viticulture", "agribusiness", "agricultural", "crop science", "aquaculture", "fishery", "food and nutrition"],
        "veterinary science": ["veterinary", "veterinarian", "animal health", "animal medicine", "zoo medicine"],
        # Health & Medicine
        "medicine": ["medicine", "medical", "clinical", "healthcare", "health science", "biomedical", "surgery"],
        "nursing": ["nursing", "clinical nursing", "patient care", "midwifery"],
        "dentistry": ["dentistry", "dental", "oral health"],
        "pharmacy": ["pharmacy", "pharmacology", "pharmaceutical", "drug discovery"],
        "public health": ["public health", "epidemiology", "global health", "health policy"],
        "biomedical sciences": ["biomedical sciences", "biomedicine", "immunology", "pathology"],
        "sports science": ["sports science", "sport science", "exercise science", "sport and exercise", "kinesiology", "physical education", "sports medicine", "sports management", "sport management", "coaching", "athletic"],
        # Social Sciences & Humanities
        "law": ["law", "llm", "llb", "legal", "jurisprudence", "human rights"],
        "psychology": ["psychology", "cognitive science", "behavioral science", "clinical psychology", "neuroscience"],
        "international relations": ["international relations", "global politics", "diplomacy", "foreign policy", "international studies"],
        "political science": ["political science", "politics", "government", "public policy", "political studies"],
        "sociology": ["sociology", "social sciences", "anthropology", "social research"],
        "education": ["education", "pedagogy", "teaching", "teacher", "learning science", "curriculum", "educational", "didactic"],
        "social work": ["social work", "social development", "community development", "welfare", "refugee", "migration", "human rights"],
        "history & cultural studies": ["history", "heritage", "cultural studies", "culture", "cultural science", "archaeology", "museum", "archival", "humanities", "civilisation", "classics"],
        "theology & philosophy": ["theology", "religion", "philosophy", "ethics", "moral", "divinity", "religious studies"],
        "languages & linguistics": ["linguistics", "language", "translation", "interpretation", "interpreting", "literary studies", "literature", "philology"],
        # Art, Design & Architecture
        "architecture": ["architecture", "architectural", "building design"],
        "urban planning": ["urban planning", "urban design", "urban development", "spatial planning", "spatial design", "landscape architecture", "landscape design", "regional planning", "city planning"],
        "graphic design": ["graphic design", "visual communication", "ux", "ui", "user experience", "illustration", "visual design"],
        "fine arts": ["fine arts", "visual arts", "painting", "sculpture", "drawing", "printmaking"],
        "music": ["music", "musicology", "composition", "conducting", "instrumental"],
        "performing arts": ["performing arts", "theatre", "theater", "drama", "dance", "acting", "performance", "choreography", "film", "cinema", "animation", "screen"],
        "fashion & textile design": ["fashion", "textile", "clothing", "costume", "interior design", "product design", "jewellery", "luxury", "accessories"],
        "media & communications": ["media", "communications", "journalism", "public relations", "broadcasting", "advertising", "digital media", "social media"],
    }
    
    for key, syns in synonyms.items():
        match = False
        if key in field_lower or field_lower in key:
            match = True
        else:
            for p in cleaned_parts:
                if len(p) >= 3 and (p in key or key in p):
                    match = True
                    break
        if match:
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


def parse_user_gpa(grade_str):
    if not grade_str:
        return None
    grade_str = grade_str.lower().strip()
    try:
        # 1. Look for patterns like "3.8/4.0", "3.8 / 4.0", "3.8 out of 4"
        match = re.search(r'([0-9.]+)\s*(?:/|out of)\s*4', grade_str)
        if match:
            return float(match.group(1))
            
        # 2. Look for percentage like "85%", "85 percent"
        match = re.search(r'([0-9.]+)\s*%', grade_str)
        if match:
            pct = float(match.group(1))
            # Convert percentage to GPA scale
            if pct >= 90: return 4.0
            if pct >= 80: return 3.5
            if pct >= 70: return 3.0
            if pct >= 60: return 2.5
            return 2.0
            
        # 3. Look for standard GPA numbers e.g. "3.8", "gpa: 3.8", "3.5 gpa"
        match = re.search(r'(?:gpa\s*:?\s*)?([0-9.]+)\b', grade_str)
        if match:
            val = float(match.group(1))
            if val <= 4.0:
                return val
            elif val <= 5.0: # German or other 5.0 scale (1.0 is best, 5.0 is fail)
                return max(1.0, 4.0 - (val - 1.0))
            elif val <= 10.0: # 10.0 scale
                return (val / 10.0) * 4.0
            elif val <= 100.0: # Percentage
                return (val / 100.0) * 4.0
                
        # 4. Text classifications
        if "first class" in grade_str: return 3.7
        if "second class" in grade_str: return 3.0
        if "distinction" in grade_str: return 3.8
        if "excellent" in grade_str: return 3.9
        if "good" in grade_str: return 3.3
        if "pass" in grade_str: return 2.5
    except Exception:
        pass
    return None

def get_university_gpa_requirement(uni_name, country):
    uni_lower = uni_name.lower()
    # 1. Elite Universities (Top 20/Ivies/Oxbridge)
    elite_keywords = [
        "harvard", "yale", "princeton", "columbia", "pennsylvania", "dartmouth", "brown", "cornell",
        "stanford", "massachusetts institute of technology", "mit", "california institute of technology", "caltech",
        "oxford", "cambridge", "imperial college", "ucl", "eth zurich", "epfl", "toronto", "mcgill", "melbourne",
        "tokyo", "kyoto", "sorbonne", "sciences po", "psl university", "polytechnique"
    ]
    if any(k in uni_lower for k in elite_keywords):
        return 3.5
    
    # 2. Highly Reputable (Top 100)
    top_100_keywords = [
        "michigan", "berkeley", "ucla", "nyu", "chicago", "northwestern", "johns hopkins", "duke", "usc", "washington",
        "edinburgh", "manchester", "king's college", "bristol", "warwick", "glasgow", "amsterdam", "delft", "utrecht",
        "ubc", "british columbia", "alberta", "waterloo", "sydney", "unsw", "monash", "adelaide", "kth", "lund", "uppsala",
        "zurich", "geneva", "osaka", "waseda", "keio", "tsukuba", "hec paris", "polytechnique", "birmingham", "leeds", "sheffield",
        "southampton", "nottingham", "liverpool", "exeter", "bath"
    ]
    if any(k in uni_lower for k in top_100_keywords):
        return 3.0
        
    # 3. Standard
    return 2.5


def normalize_country(c_name):
    if not c_name:
        return ""
    c_lower = c_name.lower().strip()
    if c_lower in ["usa", "united states", "us", "u.s.a.", "u.s.", "united states of america"]:
        return "usa"
    if c_lower in ["uk", "united kingdom", "great britain", "u.k.", "gb", "england", "scotland", "wales", "northern ireland"]:
        return "uk"
    return c_lower


GENERIC_BRANCHES = {
    "engineering": {
        "core": ["general engineering", "engineering science", "engineering management", "engineering technology", "systems engineering", "engineering and management", "advanced engineering", "business and engineering", "business administration and engineering"],
        "sub": ["software", "electrical", "electronic", "mechanical", "aerospace", "civil", "chemical", "biomedical", "environmental", "industrial", "mechatronics", "robotics", "robotic", "computer engineering", "marine", "materials", "embedded", "autonomous", "automotive", "power", "energy", "renewable", "green", "sustainable", "process", "telecommunications", "telecommunication", "construction", "structural", "nanotechnology", "nano", "optical", "optics", "medical", "micro", "water", "fluid", "mobility", "transport", "logistics", "production", "manufacturing", "metallurg", "mining", "petroleum", "nuclear"]
    },
    "computer science": {
        "core": ["computer science", "computing", "computer engineering", "informatics"],
        "sub": ["software", "artificial", "intelligence", "data", "cyber", "security", "information technology", "it", "machine learning", "robotics", "robotic", "embedded", "information systems", "network", "web", "cloud", "game", "media", "graphics", "vision"]
    },
    "business": {
        "core": ["business administration", "business management", "business", "mba", "bba", "international business"],
        "sub": ["finance", "financial", "accounting", "account", "marketing", "market", "entrepreneur", "management", "economics", "econom", "hr", "human resources", "logistics", "logist", "supply", "commerce", "tourism", "hospitality", "healthcare management", "public relations"]
    }
}


def fallback_search(country, degree, field, user_grade=None):
    """Search static country JSON data with rating-based relevance sorting and smart links."""
    results = FALLBACK_COURSES
    if country:
        norm_country = normalize_country(country)
        results = [c for c in results if normalize_country(c.get("country", "")) == norm_country]
    if degree:
        results = [c_match for c_match in results if degree.lower() in c_match.get("degree", "").lower()]
        
    user_gpa = parse_user_gpa(user_grade) if user_grade else None
    scored_results = []
    keywords = get_search_keywords(field) if field else []
    
    for c in results:
        course_title = c.get("course", "").lower()
        uni_name = c.get("uni", "").lower()
        
        if field:
            field_lower = field.lower().strip()
            rating = 0
            
            # Check for generic parent categorization (e.g. engineering, computer science, business)
            is_generic = False
            for gen_key, gen_cfg in GENERIC_BRANCHES.items():
                if field_lower == gen_key:
                    is_generic = True
                    
                    # Determine if it is a core/general program or a specific sector
                    is_core = any(core_kw in course_title for core_kw in gen_cfg["core"])
                    
                    # Strip common academic degree labels to see if only the main keyword is left
                    clean_title = re.sub(
                        r'\b(msc|bsc|meng|beng|mba|bba|llm|llb|phd|master|bachelor|degree|of|in|science|arts|technology|engineering)\b',
                        '',
                        course_title
                    ).strip()
                    
                    if not clean_title or clean_title == gen_key:
                        is_core = True
                        
                    has_sub_term = any(sub_term in course_title for sub_term in gen_cfg["sub"])
                        
                    if gen_key in course_title or has_sub_term:
                        if is_core and not has_sub_term:
                            rating = 3  # Core general matches -> 3 stars
                        else:
                            rating = 2  # Specific branch matches -> 2 stars
                    break
                    
            if not is_generic:
                # Specific query matching:
                alternatives = get_search_alternatives(field_lower)
                if any(alt in course_title for alt in alternatives):
                    rating = 3
                elif any(len(kw) >= 3 and kw in course_title for kw in keywords):
                    rating = 2
                elif any(alt in uni_name for alt in alternatives):
                    rating = 1
                    
            # Skip if there's no match
            if rating == 0:
                continue
        else:
            rating = 3
            
        # Apply profile-based GPA matching to personalize the rating
        if user_gpa is not None:
            req_gpa = get_university_gpa_requirement(c.get("uni", ""), c.get("country", ""))
            # If the user's GPA is way below the requirement (more than 0.6 below), downgrade rating to 1 star (Plausible)
            if user_gpa < req_gpa - 0.6:
                rating = 1
            # If the user's GPA is slightly below the requirement, downgrade by 1 star
            elif user_gpa < req_gpa:
                rating = max(1, rating - 1)
                
        scored_results.append((c, rating))
        
    # Sort scored results by rating descending (3 stars, then 2 stars, then 1 star)
    scored_results.sort(key=lambda x: x[1], reverse=True)
    
    total = len(scored_results)
    formatted = []
    
    for c, rating in scored_results[:500]:
        raw_city = c.get("city", "")
        city = raw_city.split(",")[0].strip() if raw_city else ""
        
        uni_name = c.get("uni", "")
        course_name = c.get("course", "")
        fallback_query = f"{uni_name} {course_name}".strip()
        fallback_link = f"https://www.google.com/search?q={urllib.parse.quote_plus(fallback_query)}"
        
        # Resolve working links:
        # All country databases are now populated with real, direct course page URLs.
        db_link = c.get("link", "")
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
            "requirements": f"Minimum GPA: {get_university_gpa_requirement(uni_name, c.get('country', '')):.1f}",
            "match_rating": rating,
            "intake":       "Winter / Summer",
            "fee":          fee,
            "source":       c.get("source", ""),
            "source_url":   c.get("source_url", ""),
            "verified_at":  c.get("verified_at", ""),
        })
        
    return formatted, total


# ── Routes ───────────────────────────────────────────────────────────────────
@app.route("/api/fields")
def get_fields():
    """Return curated field categories for autocomplete — always the same standardized list."""
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
    profile = body.get("profile", {})
    user_grade = profile.get("grade", "").strip() if profile else ""

    # ── Caching ──────────────────────────────────────────────────────────────
    cache_key = (country.lower(), degree.lower(), field.lower(), user_grade.lower())
    if cache_key in SEARCH_CACHE:
        return jsonify(SEARCH_CACHE[cache_key])

    formatted, total = fallback_search(country, degree, field, user_grade)
    response_data = {
        "results":        formatted,
        "total":          total,
        "related_fields": [],
        "source":         "static",
        "fallback_notice": None,
    }
    SEARCH_CACHE[cache_key] = response_data
    return jsonify(response_data)


@app.route("/api/register", methods=["POST"])
def register_user():
    data = request.json or {}
    email = data.get("email", "").strip()
    full_name = data.get("fullName", "").strip()
    method = data.get("method", "email").strip()
    avatar_url = data.get("avatarUrl", "")

    if not email:
        return jsonify({"error": "Email is required"}), 400

    # If MongoDB is connected, save the user
    if users_col is not None:
        try:
            import datetime
            user_doc = {
                "email": email.lower(),
                "fullName": full_name,
                "method": method,
                "avatarUrl": avatar_url,
                "lastActive": datetime.datetime.now(datetime.timezone.utc)
            }
            users_col.update_one(
                {"email": email.lower()},
                {"$set": user_doc, "$setOnInsert": {"signUpDate": datetime.datetime.now(datetime.timezone.utc)}},
                upsert=True
            )
            print(f"💾 User saved to Cloud MongoDB: {email}", flush=True)
            return jsonify({"status": "saved", "database": "mongodb"})
        except Exception as e:
            print(f"⚠️ Failed to save user to MongoDB: {e}", flush=True)
            return jsonify({"status": "saved_fallback_error", "error": str(e)})
    else:
        print(f"⚠️ User sign-up bypass (MongoDB disconnected): {email}", flush=True)
        return jsonify({"status": "saved_offline"})


if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5001))
    app.run(host="0.0.0.0", port=port, debug=False)
