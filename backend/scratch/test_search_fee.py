import sys
import os

# Set up paths
sys.path.append("/Users/mdlimonapu/studyapp/backend")

from app import fallback_search

print("Test 1: Search Sweden / Master / Computer Science with NO fee filter")
results_any, total_any = fallback_search("Sweden", "master", "Computer Science")
print(f"Total results with Any Fee: {total_any}")
if results_any:
    print(f"Sample fee: {results_any[0]['fee']}")

print("\nTest 2: Search Sweden / Master / Computer Science with max_fee = 15,000 USD")
results_15k, total_15k = fallback_search("Sweden", "master", "Computer Science", max_fee=15000)
print(f"Total results under $15k: {total_15k}")
if results_15k:
    print(f"Sample fee: {results_15k[0]['fee']}")

print("\nTest 3: Search Sweden / Master / Computer Science with max_fee = 5,000 USD")
results_5k, total_5k = fallback_search("Sweden", "master", "Computer Science", max_fee=5000)
print(f"Total results under $5k: {total_5k}")
if results_5k:
    print(f"Sample fee: {results_5k[0]['fee']}")
    
print("\nTest 4: Search Germany / Master / Computer Science with max_fee = 5,000 USD")
results_de, total_de = fallback_search("Germany", "master", "Computer Science", max_fee=5000)
print(f"Total results under $5k (Germany): {total_de}")
if results_de:
    print(f"Sample fee (Germany): {results_de[0]['fee']}")
