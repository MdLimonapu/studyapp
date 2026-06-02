import sys
import os

# Set up paths
sys.path.append("/Users/mdlimonapu/studyapp/backend")

from app import fallback_search, load_all_country_data

# Run search for engineering
print("Running search for field 'Engineering' in USA...")
results, total = fallback_search("USA", "master", "Engineering")

print(f"Total results found: {total}")
print("\n--- Top 10 Search Results: ---")
for r in results[:10]:
    print(f"University: {r['university']}")
    print(f"Course:     {r['course']}")
    print(f"Rating:     {r['match_rating']} stars")
    print(f"Country:    {r['country']}")
    print("-" * 30)

# Check specifically if general engineering is 3 stars and specific engineering is 2 stars
three_stars = [r['course'] for r in results if r['match_rating'] == 3]
two_stars = [r['course'] for r in results if r['match_rating'] == 2]

print(f"\nSample of 3-star matches: {three_stars[:5]}")
print(f"Sample of 2-star matches: {two_stars[:5]}")
