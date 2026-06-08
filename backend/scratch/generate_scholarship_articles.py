import os
import json
import time
import sys
import datetime
import re
from dotenv import load_dotenv

# Load env variables
dotenv_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), ".env")
load_dotenv(dotenv_path=dotenv_path)

API_KEY = os.environ.get("GEMINI_API_KEY")
MONGO_URI = os.environ.get("MONGO_URI")

SCHOLARSHIP_TOPICS = [
    {
        "id": "scholarships-germany-public-universities",
        "title": "Top Scholarships for International Students in Germany 2026",
        "prompt": "Write a complete, highly detailed guide about scholarships available to international students in Germany for 2026. Explain the DAAD EPOS and Helmut-Schmidt scholarships, Deutschlandstipendium, Heinrich Böll, Konrad-Adenauer-Stiftung, and Friedrich-Ebert-Stiftung. Include eligibility criteria, coverages (stipend, health insurance), application timelines, and step-by-step submission tips."
    },
    {
        "id": "fully-funded-scholarships-europe-2026",
        "title": "Top 7 Fully-Funded Government Scholarships to Study in Europe",
        "prompt": "Write a comprehensive guide outlining the top 7 fully-funded government scholarships for international students applying to Europe (covering countries like UK, France, Germany, Sweden, Netherlands, Switzerland). Highlight Chevening (UK), Eiffel (France), DAAD (Germany), Swedish Institute (Sweden), NL Scholarship (Netherlands), Swiss Government Excellence, and Erasmus Mundus. Provide comparison details, application deadlines, and tips to win them."
    },
    {
        "id": "scholarships-studying-in-australia-rtp",
        "title": "Guide to Australia's Research Training Program (RTP) & Destination Australia Scholarships",
        "prompt": "Write a highly detailed guide explaining the Research Training Program (RTP) and the Destination Australia scholarship schemes. Detail who qualifies, the application process through Australian universities, what is covered (tuition offset, living allowance, relocation costs), and tips for finding a supervisor and writing a successful research proposal."
    },
    {
        "id": "government-ireland-scholarships-guide",
        "title": "Study in Ireland: Fully-Funded Government of Ireland Scholarships Guide",
        "prompt": "Write a step-by-step guide on the Government of Ireland Postgraduate Scholarship Programme (GOIPG) and the Government of Ireland International Education Scholarships (GOI-IES). Explain eligibility, list of eligible higher education institutions, funding package details (stipend plus tuition offset), application timeline, and key components of a winning application."
    },
    {
        "id": "erasmus-mundus-scholarship-guide-2026",
        "title": "Complete Erasmus Mundus Joint Master Degrees (EMJMD) Scholarship Guide 2026",
        "prompt": "Write a masterclass guide on the prestigious Erasmus Mundus Joint Master Degrees (EMJMD) scholarship. Explain how the program works (studying in at least 2 different European countries), what the scholarship covers (tuition, monthly allowance, travel cost), how to find matching consortia on the Erasmus catalogue, application requirements (SOP, recommendation letters, CV), and timelines."
    }
]

MODELS = ["gemini-2.5-flash", "gemini-flash-latest", "gemini-2.0-flash"]

# Generate using google-genai SDK
def generate_article_with_retry(client, topic, model_name):
    print(f"✍️ Generating article: '{topic['title']}' using model '{model_name}'...", flush=True)
    prompt = f"""You are an elite academic copywriter and SEO expert. Write a comprehensive, high-quality, and deeply informative guide/article on the following topic:
Title: {topic['title']}
Description: {topic['prompt']}

Make sure the article has these attributes:
1. Long-form and extremely thorough (at least 1000-1500 words).
2. Well-structured in Markdown using H2 (##) and H3 (###) headers, bullet points, numbered lists, and bold text.
3. Contains a detailed HTML or Markdown table summarizing key steps, costs, coverages, or requirements (e.g. document checklists or timelines).
4. Includes internal linking references back to the main website domain (e.g., 'Use the Studplex Matching Engine to find matching courses' or 'check your detailed eligibility on the Studplex Roadmap page').
5. SEO optimized.

You must format your response EXACTLY as text with the following delimiters:

---SLUG---
{topic['id']}

---TITLE---
[Enter the SEO Title here]

---META_TITLE---
[Enter the Meta Title here (maximum 60 characters)]

---META_DESCRIPTION---
[Enter the Meta Description here (maximum 160 characters)]

---CATEGORY---
[Enter main category name, e.g. Scholarships]

---TAGS---
[Comma-separated list of tags, e.g. scholarships, europe, funding]

---READ_TIME---
[Enter estimated reading time in minutes as a number, e.g. 7]

---CONTENT---
[Enter the complete, detailed article body in Markdown format here]
"""
    
    backoff = 5
    max_retries = 3
    for attempt in range(max_retries):
        try:
            response = client.models.generate_content(
                model=model_name,
                contents=prompt
            )
            text = response.text.strip()
            
            # Parse delimited text
            def extract_block(name, text_content):
                pattern = r'---' + name + r'---\s*\n(.*?)(?=\n---[A-Z_]+---| \Z)'
                match = re.search(pattern, text_content, re.DOTALL | re.IGNORECASE)
                if match:
                    return match.group(1).strip()
                
                parts = text_content.split(f"---{name}---")
                if len(parts) > 1:
                    subpart = parts[1].strip()
                    subparts = re.split(r'---[A-Z_]+---', subpart)
                    return subparts[0].strip()
                return ""

            slug = extract_block("SLUG", text)
            title = extract_block("TITLE", text)
            meta_title = extract_block("META_TITLE", text)
            meta_description = extract_block("META_DESCRIPTION", text)
            category = extract_block("CATEGORY", text)
            tags_str = extract_block("TAGS", text)
            read_time_str = extract_block("READ_TIME", text)
            content = extract_block("CONTENT", text)
            
            if not slug:
                slug = topic['id']
            if not title:
                title = topic['title']
            if not content:
                content = text
                
            tags = [t.strip() for t in tags_str.split(",") if t.strip()]
            if not tags:
                tags = [category.lower()] if category else []
                
            try:
                read_time = int(re.search(r'\d+', read_time_str).group())
            except Exception:
                read_time = 7
                
            # Generate organic views
            import random
            views = random.randint(180, 800)
                
            return {
                "slug": slug,
                "title": title,
                "meta_title": meta_title or title[:60],
                "meta_description": meta_description or "Learn more about studying abroad scholarships.",
                "category": category or "Scholarships",
                "tags": tags,
                "read_time": read_time,
                "content": content,
                "views": views,
                "date": datetime.datetime.now().strftime("%Y-%m-%d")
            }
        except Exception as e:
            err_str = str(e).lower()
            is_transient = "503" in err_str or "demand" in err_str or "429" in err_str or "quota" in err_str or "limit" in err_str or "exhausted" in err_str
            if is_transient and attempt < max_retries - 1:
                print(f"    ⚠️ Transient error calling Gemini ({e}). Sleeping for {backoff}s before retry...", flush=True)
                time.sleep(backoff)
                backoff *= 2
            else:
                raise e

def main():
    if not API_KEY:
        print("❌ GEMINI_API_KEY env variable not set.")
        sys.exit(1)
        
    api_keys = [k.strip() for k in API_KEY.split(",") if k.strip()]
    if not api_keys:
        print("❌ No valid GEMINI_API_KEY found.")
        sys.exit(1)
        
    from google import genai
    
    # Load existing backup
    local_path = os.path.join(
        os.path.dirname(os.path.dirname(__file__)), "data", "articles_backup.json"
    )
    if os.path.exists(local_path):
        with open(local_path, "r") as f:
            existing_articles = json.load(f)
    else:
        existing_articles = []
        
    existing_slugs = {a.get("slug") for a in existing_articles}
    
    new_generated_articles = []
    
    for topic in SCHOLARSHIP_TOPICS:
        if topic["id"] in existing_slugs:
            print(f"⏭️ Skipping {topic['title']} (already exists in backup)")
            continue
            
        art = None
        for key in api_keys:
            client = genai.Client(api_key=key)
            for model in MODELS:
                try:
                    art = generate_article_with_retry(client, topic, model)
                    if art and art.get("content") and len(art.get("content")) > 100:
                        break
                except Exception as e:
                    print(f"⚠️ Error using key {key[:10]}... with model {model}: {e}", flush=True)
            if art:
                break
                
        if art:
            new_generated_articles.append(art)
            existing_articles.append(art)
            print(f"    ✓ Successfully generated article: '{art['title']}' (Slug: {art['slug']})", flush=True)
        else:
            print(f"❌ Failed to generate article '{topic['title']}' after trying all keys/models.", flush=True)
            
        time.sleep(2) # Prevent rate limits
        
    if not new_generated_articles:
        print("ℹ️ No new scholarship articles were generated.")
        return
        
    # Save updated list locally
    with open(local_path, "w") as f:
        json.dump(existing_articles, f, indent=2, ensure_ascii=False)
    print(f"💾 Local cache updated with {len(new_generated_articles)} new articles (Total: {len(existing_articles)})")
    
    # Sync with MongoDB Atlas
    if MONGO_URI:
        try:
            from pymongo import MongoClient
            import urllib.parse
            
            mongo_client = MongoClient(MONGO_URI, serverSelectionTimeoutMS=5000, tlsAllowInvalidCertificates=True)
            db_name = "studyapp"
            parsed_uri = urllib.parse.urlparse(MONGO_URI)
            if parsed_uri.path and parsed_uri.path != "/":
                db_name = parsed_uri.path.strip("/")
                
            db = mongo_client[db_name]
            articles_col = db["articles"]
            
            inserted_count = 0
            for art in new_generated_articles:
                articles_col.replace_one({"slug": art["slug"]}, art, upsert=True)
                inserted_count += 1
                
            print(f"✅ Successfully loaded {inserted_count} new scholarship articles to Cloud MongoDB Atlas.")
        except Exception as e:
            print(f"⚠️ Could not write to MongoDB Atlas: {e}")

if __name__ == "__main__":
    main()
