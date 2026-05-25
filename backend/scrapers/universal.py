"""
Universal university course scraper using DuckDuckGo search.
Works for any country by searching for real university programs.
This is the fallback/universal method for countries without dedicated scrapers.
"""
import requests
from bs4 import BeautifulSoup
import json
import time
import re
import os
import urllib.parse

HEADERS = {
    "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
}

# Major fields to search for each country
FIELDS = [
    "Computer Science", "Electrical Engineering", "Mechanical Engineering",
    "Data Science", "Business Administration", "Civil Engineering",
    "Aerospace Engineering", "Biomedical Engineering", "Information Technology",
    "Artificial Intelligence", "Robotics", "Environmental Engineering",
    "Chemical Engineering", "Physics", "Mathematics", "Economics",
    "Psychology", "Architecture", "Medicine", "Law",
    "Software Engineering", "Cybersecurity", "Finance",
    "Embedded Systems", "Telecommunications", "Power Systems",
    "Nursing", "Marketing", "Biology", "Chemistry",
]

# Country-specific search configurations
COUNTRY_CONFIG = {
    "USA": {
        "search_terms": [
            "{field} master's program {uni} admissions",
            "{field} bachelor's degree {uni} apply",
            "PhD {field} {uni} graduate admissions",
        ],
        "top_universities": [
            "MIT", "Stanford University", "Harvard University",
            "UC Berkeley", "Carnegie Mellon", "Georgia Tech",
            "University of Michigan", "UCLA", "Caltech",
            "Columbia University", "University of Illinois",
            "UT Austin", "University of Washington",
            "Purdue University", "Penn State", "Ohio State University",
            "University of Wisconsin", "University of Minnesota",
            "Arizona State University", "University of Florida",
            "Virginia Tech", "Cornell University", "NYU",
            "University of Southern California", "Johns Hopkins University",
            "Northwestern University", "Duke University",
            "Rice University", "University of Colorado Boulder",
            "Boston University", "University of Maryland",
        ],
    },
    "Canada": {
        "search_terms": [
            "{field} master's program {uni} Canada",
            "{field} graduate studies {uni}",
        ],
        "top_universities": [
            "University of Toronto", "McGill University",
            "University of British Columbia", "University of Alberta",
            "University of Waterloo", "University of Ottawa",
            "McMaster University", "University of Calgary",
            "Queen's University", "Western University",
            "Simon Fraser University", "Dalhousie University",
            "University of Montreal", "Laval University",
            "University of Manitoba", "University of Saskatchewan",
            "York University", "Concordia University",
            "Carleton University", "University of Victoria",
        ],
    },
    "Australia": {
        "search_terms": [
            "{field} master degree {uni} Australia",
            "{field} coursework {uni} international students",
        ],
        "top_universities": [
            "University of Melbourne", "University of Sydney",
            "Australian National University", "University of Queensland",
            "University of New South Wales", "Monash University",
            "University of Western Australia", "University of Adelaide",
            "University of Technology Sydney", "RMIT University",
            "Macquarie University", "Griffith University",
            "Curtin University", "Deakin University",
            "Queensland University of Technology",
            "Swinburne University of Technology",
            "University of Wollongong", "La Trobe University",
        ],
    },
    "Netherlands": {
        "search_terms": [
            "{field} master {uni} Netherlands",
            "{field} MSc {uni} international",
        ],
        "top_universities": [
            "TU Delft", "University of Amsterdam",
            "Eindhoven University of Technology", "Leiden University",
            "Utrecht University", "Wageningen University",
            "University of Groningen", "Erasmus University Rotterdam",
            "Vrije Universiteit Amsterdam", "Maastricht University",
            "Radboud University", "University of Twente",
            "Tilburg University", "TU Eindhoven",
        ],
    },
    "Sweden": {
        "search_terms": [
            "{field} master programme {uni} Sweden",
            "{field} MSc {uni} international students",
        ],
        "top_universities": [
            "KTH Royal Institute of Technology",
            "Chalmers University of Technology",
            "Lund University", "Uppsala University",
            "Stockholm University", "Linköping University",
            "University of Gothenburg", "Umeå University",
            "Luleå University of Technology",
            "Malmö University", "Örebro University",
            "Mälardalen University",
        ],
    },
    "France": {
        "search_terms": [
            "{field} master {uni} France English",
            "{field} MSc {uni} international program",
        ],
        "top_universities": [
            "Sorbonne University", "École Polytechnique",
            "Université PSL", "University of Paris-Saclay",
            "Sciences Po", "INSA Lyon",
            "CentraleSupélec", "Grenoble INP",
            "Université de Strasbourg", "Université de Lyon",
            "ESSEC Business School", "HEC Paris",
            "École Normale Supérieure", "Toulouse INP",
            "Aix-Marseille University",
        ],
    },
    "Switzerland": {
        "search_terms": [
            "{field} master {uni} Switzerland",
            "{field} MSc {uni} program",
        ],
        "top_universities": [
            "ETH Zurich", "EPFL",
            "University of Zurich", "University of Basel",
            "University of Bern", "University of Geneva",
            "University of Lausanne", "University of St. Gallen",
            "University of Fribourg", "University of Neuchâtel",
        ],
    },
    "Japan": {
        "search_terms": [
            "{field} master program {uni} Japan English",
            "{field} graduate school {uni} international",
        ],
        "top_universities": [
            "University of Tokyo", "Kyoto University",
            "Osaka University", "Tokyo Institute of Technology",
            "Tohoku University", "Nagoya University",
            "Kyushu University", "Hokkaido University",
            "Keio University", "Waseda University",
            "Tsukuba University", "Tokyo Metropolitan University",
            "Hiroshima University", "Kobe University",
        ],
    },
    "UK": {
        "search_terms": [
            "{field} master's {uni} UK",
            "{field} MSc {uni} programme",
        ],
        "top_universities": [
            "University of Oxford", "University of Cambridge",
            "Imperial College London", "UCL",
            "University of Edinburgh", "King's College London",
            "University of Manchester", "University of Bristol",
            "University of Warwick", "University of Glasgow",
            "University of Birmingham", "University of Leeds",
            "University of Sheffield", "University of Southampton",
            "University of Nottingham", "University of Liverpool",
            "University of Exeter", "University of Bath",
            "Queen Mary University of London", "Lancaster University",
            "University of York", "Durham University",
            "University of St Andrews", "Loughborough University",
            "University of Surrey",
        ],
    },
}

# Major cities per country (for matching)
COUNTRY_CITIES = {
    "USA": {"MIT": "Cambridge", "Stanford University": "Stanford", "Harvard University": "Cambridge",
            "UC Berkeley": "Berkeley", "Carnegie Mellon": "Pittsburgh", "Georgia Tech": "Atlanta",
            "University of Michigan": "Ann Arbor", "UCLA": "Los Angeles", "Caltech": "Pasadena",
            "Columbia University": "New York", "University of Illinois": "Urbana-Champaign",
            "UT Austin": "Austin", "University of Washington": "Seattle",
            "Purdue University": "West Lafayette", "Penn State": "State College",
            "Ohio State University": "Columbus", "University of Wisconsin": "Madison",
            "University of Minnesota": "Minneapolis", "Arizona State University": "Tempe",
            "University of Florida": "Gainesville", "Virginia Tech": "Blacksburg",
            "Cornell University": "Ithaca", "NYU": "New York",
            "University of Southern California": "Los Angeles",
            "Johns Hopkins University": "Baltimore", "Northwestern University": "Evanston",
            "Duke University": "Durham", "Rice University": "Houston",
            "University of Colorado Boulder": "Boulder", "Boston University": "Boston",
            "University of Maryland": "College Park"},
    "Canada": {"University of Toronto": "Toronto", "McGill University": "Montreal",
               "University of British Columbia": "Vancouver", "University of Alberta": "Edmonton",
               "University of Waterloo": "Waterloo", "University of Ottawa": "Ottawa",
               "McMaster University": "Hamilton", "University of Calgary": "Calgary",
               "Queen's University": "Kingston", "Western University": "London",
               "Simon Fraser University": "Burnaby", "Dalhousie University": "Halifax",
               "University of Montreal": "Montreal", "Laval University": "Quebec City",
               "University of Manitoba": "Winnipeg", "University of Saskatchewan": "Saskatoon",
               "York University": "Toronto", "Concordia University": "Montreal",
               "Carleton University": "Ottawa", "University of Victoria": "Victoria"},
    "Australia": {"University of Melbourne": "Melbourne", "University of Sydney": "Sydney",
                  "Australian National University": "Canberra", "University of Queensland": "Brisbane",
                  "University of New South Wales": "Sydney", "Monash University": "Melbourne",
                  "University of Western Australia": "Perth", "University of Adelaide": "Adelaide",
                  "University of Technology Sydney": "Sydney", "RMIT University": "Melbourne",
                  "Macquarie University": "Sydney", "Griffith University": "Brisbane",
                  "Curtin University": "Perth", "Deakin University": "Melbourne",
                  "Queensland University of Technology": "Brisbane",
                  "Swinburne University of Technology": "Melbourne",
                  "University of Wollongong": "Wollongong", "La Trobe University": "Melbourne"},
    "Netherlands": {"TU Delft": "Delft", "University of Amsterdam": "Amsterdam",
                    "Eindhoven University of Technology": "Eindhoven", "Leiden University": "Leiden",
                    "Utrecht University": "Utrecht", "Wageningen University": "Wageningen",
                    "University of Groningen": "Groningen", "Erasmus University Rotterdam": "Rotterdam",
                    "Vrije Universiteit Amsterdam": "Amsterdam", "Maastricht University": "Maastricht",
                    "Radboud University": "Nijmegen", "University of Twente": "Enschede",
                    "Tilburg University": "Tilburg", "TU Eindhoven": "Eindhoven"},
    "Sweden": {"KTH Royal Institute of Technology": "Stockholm", "Chalmers University of Technology": "Gothenburg",
               "Lund University": "Lund", "Uppsala University": "Uppsala",
               "Stockholm University": "Stockholm", "Linköping University": "Linköping",
               "University of Gothenburg": "Gothenburg", "Umeå University": "Umeå",
               "Luleå University of Technology": "Luleå", "Malmö University": "Malmö",
               "Örebro University": "Örebro", "Mälardalen University": "Västerås"},
    "France": {"Sorbonne University": "Paris", "École Polytechnique": "Palaiseau",
               "Université PSL": "Paris", "University of Paris-Saclay": "Saclay",
               "Sciences Po": "Paris", "INSA Lyon": "Lyon",
               "CentraleSupélec": "Gif-sur-Yvette", "Grenoble INP": "Grenoble",
               "Université de Strasbourg": "Strasbourg", "Université de Lyon": "Lyon",
               "ESSEC Business School": "Cergy", "HEC Paris": "Jouy-en-Josas",
               "École Normale Supérieure": "Paris", "Toulouse INP": "Toulouse",
               "Aix-Marseille University": "Marseille"},
    "Switzerland": {"ETH Zurich": "Zurich", "EPFL": "Lausanne",
                    "University of Zurich": "Zurich", "University of Basel": "Basel",
                    "University of Bern": "Bern", "University of Geneva": "Geneva",
                    "University of Lausanne": "Lausanne", "University of St. Gallen": "St. Gallen",
                    "University of Fribourg": "Fribourg", "University of Neuchâtel": "Neuchâtel"},
    "Japan": {"University of Tokyo": "Tokyo", "Kyoto University": "Kyoto",
              "Osaka University": "Osaka", "Tokyo Institute of Technology": "Tokyo",
              "Tohoku University": "Sendai", "Nagoya University": "Nagoya",
              "Kyushu University": "Fukuoka", "Hokkaido University": "Sapporo",
              "Keio University": "Tokyo", "Waseda University": "Tokyo",
              "Tsukuba University": "Tsukuba", "Tokyo Metropolitan University": "Tokyo",
              "Hiroshima University": "Hiroshima", "Kobe University": "Kobe"},
    "UK": {"University of Oxford": "Oxford", "University of Cambridge": "Cambridge",
           "Imperial College London": "London", "UCL": "London",
           "University of Edinburgh": "Edinburgh", "King's College London": "London",
           "University of Manchester": "Manchester", "University of Bristol": "Bristol",
           "University of Warwick": "Coventry", "University of Glasgow": "Glasgow",
           "University of Birmingham": "Birmingham", "University of Leeds": "Leeds",
           "University of Sheffield": "Sheffield", "University of Southampton": "Southampton",
           "University of Nottingham": "Nottingham", "University of Liverpool": "Liverpool",
           "University of Exeter": "Exeter", "University of Bath": "Bath",
           "Queen Mary University of London": "London", "Lancaster University": "Lancaster",
           "University of York": "York", "Durham University": "Durham",
           "University of St Andrews": "St Andrews", "Loughborough University": "Loughborough",
           "University of Surrey": "Guildford"},
}


def search_duckduckgo(query, max_results=5):
    """Search DuckDuckGo HTML version and return results."""
    url = "https://html.duckduckgo.com/html/"
    try:
        res = requests.post(url, data={"q": query}, headers=HEADERS, timeout=15)
        if res.status_code != 200:
            return []
        soup = BeautifulSoup(res.text, "html.parser")
        results = []
        for item in soup.select(".result"):
            a = item.select_one(".result__a")
            snippet = item.select_one(".result__snippet")
            if a and snippet:
                link = a.get("href", "")
                if "/y.js" in link or "duckduckgo.com" in link:
                    continue
                title = a.get_text(strip=True)
                desc = snippet.get_text(strip=True)
                results.append({"title": title, "link": link, "snippet": desc})
                if len(results) >= max_results:
                    break
        return results
    except Exception as e:
        print(f"    ⚠️  DuckDuckGo search error: {e}")
        return []


def find_course_link(uni, field, degree, country):
    """Search for the actual course page link for a specific program."""
    query = f"{uni} {degree} {field} program admissions"
    results = search_duckduckgo(query, max_results=5)

    # Domains to exclude (third-party aggregators)
    excluded_domains = [
        "yocket.com", "shiksha.com", "collegedunia.com", "leverageedu",
        "studyportals.com", "mastersportal.com", "findamasters.com",
        "libertify.com", "niche.com", "usnews.com", "timeshighereducation",
        "topuniversities.com", "educations.com", "hotcoursesabroad.com",
        "keystone.com", "masterstudies.com", "phdstudies.com",
        "whatuni.com", "theuniguide.co.uk", "bachelorsportal.com",
    ]

    # Preferred domain patterns (official university sites)
    preferred_patterns = [".edu", ".ac.uk", ".ac.jp", ".uni-", ".tu-", ".eth", ".epfl"]

    # Try to find a link from the university domain
    uni_words = [
        w.lower() for w in
        uni.replace("University of", "").replace("University", "")
           .replace("Institute of", "").replace("Institute", "")
           .replace("College", "").strip().split()
        if len(w) > 2
    ]

    best_link = None
    for r in results:
        link_lower = r["link"].lower()

        # Skip excluded domains
        if any(d in link_lower for d in excluded_domains):
            continue

        # Prefer links with official university domain patterns
        is_official = any(p in link_lower for p in preferred_patterns)
        has_uni_word = any(w in link_lower for w in uni_words if len(w) > 3)

        if is_official and has_uni_word:
            return r["link"]  # Best possible match

        if has_uni_word and best_link is None:
            best_link = r["link"]

    if best_link:
        return best_link

    # If no uni-specific link found, return a Google search link as fallback
    fallback_query = f"{uni} {degree} {field}"
    return f"https://www.google.com/search?q={urllib.parse.quote_plus(fallback_query)}"


def scrape_country(country_name, fields=None, degrees=None, max_courses=2000):
    """
    Scrape university courses for a given country using DuckDuckGo search.
    Builds a database by searching for specific field + university combinations.
    """
    if country_name not in COUNTRY_CONFIG:
        print(f"❌ No configuration for {country_name}. Available: {list(COUNTRY_CONFIG.keys())}")
        return []

    config = COUNTRY_CONFIG[country_name]
    universities = config["top_universities"]
    cities = COUNTRY_CITIES.get(country_name, {})
    if fields is None:
        fields = FIELDS
    if degrees is None:
        degrees = ["Master", "Bachelor"]

    courses = []
    seen = set()  # Deduplicate

    print(f"\n🌍 Scraping courses for {country_name}...")
    print(f"   Universities: {len(universities)}")
    print(f"   Fields: {len(fields)}")
    print(f"   Degrees: {degrees}")
    print()

    for uni in universities:
        city = cities.get(uni, "")
        for field in fields:
            for degree in degrees:
                if len(courses) >= max_courses:
                    break

                key = (uni, field, degree)
                if key in seen:
                    continue
                seen.add(key)

                # Build course name
                degree_label = {
                    "Master": "MSc",
                    "Bachelor": "BSc",
                    "PhD": "PhD",
                }.get(degree, degree)

                course_name = f"{degree_label} in {field}"

                # Find the course link
                link = find_course_link(uni, field, degree, country_name)

                courses.append({
                    "country": country_name,
                    "uni": uni,
                    "course": course_name,
                    "degree": degree,
                    "city": city,
                    "link": link,
                })

                # Rate limit
                time.sleep(0.8)

            if len(courses) >= max_courses:
                break

            # Progress
            print(f"  {uni} — {len(courses)} courses so far...")

        if len(courses) >= max_courses:
            print(f"  Reached max {max_courses} courses limit.")
            break

    # Save
    output_path = os.path.join(
        os.path.dirname(__file__), "..", "data", f"{country_name.lower()}.json"
    )
    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    with open(output_path, "w") as f:
        json.dump(courses, f, indent=2, ensure_ascii=False)

    print(f"\n✅ {country_name} Done! Total: {len(courses)} courses saved to data/{country_name.lower()}.json")
    return courses


if __name__ == "__main__":
    import sys
    country = sys.argv[1] if len(sys.argv) > 1 else "USA"
    scrape_country(country)
