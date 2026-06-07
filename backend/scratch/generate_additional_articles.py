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

# The 5 new highly searched student visa / study abroad topics for 2026
NEW_TOPICS = [
    {
        "id": "opportunity-card-germany-chancenkarte",
        "title": "Germany Opportunity Card (Chancenkarte) 2026: Points Calculator & Guide",
        "prompt": "Write a comprehensive guide on the Germany Opportunity Card (Chancenkarte) for 2026. Explain who is eligible, how the points calculator system works (language skills, professional experience, age, connection to Germany), the financial proof/blocked account required, and the step-by-step application process."
    },
    {
        "id": "canada-double-proof-of-funds",
        "title": "Canada Study Permit Financial Requirements 2026: Proving Proof of Funds",
        "prompt": "Write a highly detailed guide explaining Canada's updated cost-of-living and proof of funds requirements for a study permit. Explain the minimum required amount, how to prove it using GIC (Scotiabank, etc.), bank statements, sponsor letters, and how the visa officer assesses financial capacity."
    },
    {
        "id": "uk-dependent-visa-ban-updates",
        "title": "UK Student Visa Dependent Ban & Work Rules: What You Need to Know",
        "prompt": "Write a detailed explanation of the UK student visa updates, specifically focusing on the dependent visa ban (which courses are exempt), working hours restrictions during term time and holidays, and the Graduate Route post-study work rights transition."
    },
    {
        "id": "us-h1b-lottery-f1-cap-gap",
        "title": "F-1 to H-1B Visa Transition: SEVP Cap-Gap Extension & Lottery Guide",
        "prompt": "Write a masterclass guide for international students in the USA on F-1 OPT/STEM OPT transition to H-1B visa. Explain the H-1B registration process, the lottery system, the Cap-Gap extension rule allowing students to continue working, and alternative visa options like O-1 or Day 1 CPT."
    },
    {
        "id": "study-in-germany-without-ielts",
        "title": "How to Study in Germany Without IELTS: Alternative Language Proofs",
        "prompt": "Write a detailed guide on how international students can apply to and study at German public or private universities without an IELTS score. Explain alternatives like Medium of Instruction (MOI) certificates, university entrance tests, German language pathway courses, and how the visa office handles visa applications without IELTS."
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
3. Contains a detailed HTML or Markdown table summarizing key steps, costs, or requirements (e.g. document checklists or timelines).
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
[Enter main category name, e.g. Germany, Visa, SOP, Scholarships]

---TAGS---
[Comma-separated list of tags, e.g. blocked account, germany, visa]

---READ_TIME---
[Enter estimated reading time in minutes as a number, e.g. 6]

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
                
                # Fallback split
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
                read_time = 6
                
            # Generate organic views (e.g. 200 to 800 views)
            import random
            views = random.randint(150, 750)
                
            return {
                "slug": slug,
                "title": title,
                "meta_title": meta_title or title[:60],
                "meta_description": meta_description or "Learn more about studying abroad.",
                "category": category or "General",
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
    
    for topic in NEW_TOPICS:
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
        print("ℹ️ No new articles were generated.")
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
                
            print(f"✅ Successfully loaded {inserted_count} new articles to Cloud MongoDB Atlas.")
        except Exception as e:
            print(f"⚠️ Could not write to MongoDB Atlas: {e}")

if __name__ == "__main__":
    main()
