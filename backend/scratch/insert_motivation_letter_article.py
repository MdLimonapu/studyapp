import os
import json
import urllib.parse
from pymongo import MongoClient
from dotenv import load_dotenv

# Load environment variables
load_dotenv(dotenv_path=os.path.join(os.path.dirname(os.path.dirname(__file__)), ".env"))

def main():
    article = {
        "slug": "write-best-motivation-letter-guide",
        "title": "Master Guide: Writing a Winning Motivation Letter for Global Universities",
        "meta_title": "Write the Best Motivation Letter | Global Admissions Guide",
        "meta_description": "Learn how to write a perfect motivation letter/SOP for universities in Germany, UK, USA, Canada, Australia, Netherlands, Sweden, France, Switzerland, and Japan.",
        "category": "SOP",
        "country": "Global",
        "tags": ["sop", "motivation letter", "admissions", "global", "guide"],
        "read_time": 7,
        "views": 250,
        "date": "2026-06-10",
        "content": """# Master Guide: Writing a Winning Motivation Letter for Global Universities

When applying for higher education abroad, your **Motivation Letter** (or Statement of Purpose) is your primary opportunity to speak directly to the admissions committee. While your GPA and test scores prove your academic abilities, your motivation letter explains your passion, plans, and potential.

However, different study destinations have drastically different expectations. What gets you into a US university might get you rejected in Germany or Japan. In this guide, we break down how to tailor your motivation letter for the top 10 global destinations.

---

## Country-Specific Requirements Summary

| Destination | Tone Focus | Length Limit | Core Expectation |
| :--- | :--- | :--- | :--- |
| **Germany** | Factual & Academic | 1 - 2 Pages | Course syllabus compatibility & credit match |
| **United Kingdom** | Academic Interests | Max 4,000 chars | 80% academic depth, 20% extracurricular achievements |
| **United States** | Narrative & Personal | 800 - 1000 words | Personal hook, community contribution & future goals |
| **Canada** | Career Logic & Visa | 2 Pages | Practical utility, clear career path, intent to return home |
| **Australia** | Genuine Student | 1 - 2 Pages | Specific reasons for choosing Australia over home country |
| **Netherlands** | Academic Readiness | 1 Page | Independent study skills & critical thinking capacity |
| **Sweden** | Sustainable Goals | 1 Page | Alignment with global sustainability & leadership skills |
| **France** | Academic Synergy | 1 - 2 Pages | Research plans, language capability & institutional fit |
| **Switzerland** | Research Depth | 2 Pages | High academic rigor, thesis proposal & lab alignment |
| **Japan** | Detail & Structure | 1 - 2 Pages | Study plan details, respect for culture & future plans |

---

## 1. Germany & Switzerland: The Factual Approach
Consular officers and university professors in Germany and Switzerland focus strictly on **academic compatibility**. Avoid generic phrases like *"I fell in love with this country as a child."*
* **The Strategy:** Map your undergraduate coursework directly to their Master's modules. State explicitly how many credits you achieved in core fields (e.g., Mathematics, Thermodynamics) and why you want to continue that research path.

---

## 2. USA & Canada: The Narrative Approach
North American universities look for well-rounded individuals who will contribute to their campus community.
* **The Strategy:** Start with a strong personal hook—a project, internship, or book that triggered your ambition. For Canadian universities (and visa officers), place a strong emphasis on your **intent to return home** and how the degree will help your home country's local market.

---

## 3. United Kingdom: The UCAS Rule (80/20)
For the UK, keep your statement tightly focused on the subject.
* **The Strategy:** Allocate **80%** of your content to explaining your academic interest, additional readings, and projects. Reserve only **20%** for hobbies and extracurricular activities, making sure to link them back to student skills like time management or team leadership.

---

## 4. Sweden & Netherlands: Sustainability and Independence
Dutch and Swedish admissions committees value critical thinking and societal contribution.
* **The Strategy:** For Sweden, highlight how your research coordinates with the **UN Sustainable Development Goals (SDGs)** and show your leadership potential. For the Netherlands, emphasize your capability to conduct independent, self-motivated research.

---

## 5. Japan: Structure & Respect
Japanese universities require highly structured and formal study plans.
* **The Strategy:** Divide your statement clearly into your educational background, detailed research proposal (what you will study, which methodology you will use), and your plans after graduation. Express a genuine interest in the Japanese culture or language.

---

## General Structure Checklist for All Letters

Regardless of the country, every winning letter should follow this general flow:

- [ ] **Introduction:** Clear declaration of the target course and a compelling personal/academic trigger hook.
- [ ] **Academic Foundation:** Proof of your technical readiness, referencing specific Bachelor's courses or papers.
- [ ] **Professional/Project Experience:** Highlighting real-world application of your skills.
- [ ] **Why This Program & University:** Naming specific professors, elective modules, or university research labs.
- [ ] **Future Goals:** Defining clear, logical short-term and long-term career aspirations.

> [!IMPORTANT]
> Never copy a template or use generic AI-generated files. Consular officers and admissions teams read thousands of applications and instantly reject plagiarized or standard-sounding statements. Always customize at least 30% of your letter to the specific university and program you are applying to.

*Evaluate your eligibility and find matching academic guidelines on the [Studplex Portal](https://www.studplex.com).*"""
    }

    # Files to update
    targets = [
        "/Users/mdlimonapu/studyapp/news-frontend/backend/data/articles_backup.json"
    ]

    for filepath in targets:
        if os.path.exists(filepath):
            try:
                with open(filepath, "r") as f:
                    articles = json.load(f)
                
                # Check for duplicate slug and update or append
                exists = False
                for i, art in enumerate(articles):
                    if art["slug"] == article["slug"]:
                        articles[i] = article
                        exists = True
                        break
                
                if not exists:
                    articles.append(article)
                
                with open(filepath, "w") as f:
                    json.dump(articles, f, indent=2, ensure_ascii=False)
                print(f"✅ Successfully updated local JSON file at: {filepath}")
            except Exception as e:
                print(f"❌ Failed to update {filepath}: {e}")
        else:
            print(f"⚠️ Path not found: {filepath}")

    # Synchronize to MongoDB Atlas
    mongo_uri = os.environ.get("MONGO_URI")
    if not mongo_uri:
        print("⚠️ MONGO_URI environment variable is not set. Database synchronization skipped.")
        return

    try:
        client = MongoClient(
            mongo_uri, 
            serverSelectionTimeoutMS=5000,
            tlsAllowInvalidCertificates=True
        )
        db_name = "studyapp"
        parsed_uri = urllib.parse.urlparse(mongo_uri)
        if parsed_uri.path and parsed_uri.path != "/":
            db_name = parsed_uri.path.strip("/")
            
        db = client[db_name]
        articles_col = db["articles"]
        
        articles_col.replace_one({"slug": article["slug"]}, article, upsert=True)
        print(f"✅ Successfully upserted motivation letter guide article to Cloud MongoDB Atlas database: {db_name}")
    except Exception as e:
        print(f"❌ Failed to write to MongoDB Atlas: {e}")

if __name__ == "__main__":
    main()
