# app/services/web_search.py
from serpapi import GoogleSearch
import os


def web_search(query: str, num_results: int = 5) -> str:
    """
    Perform a web search using SerpAPI and return formatted snippets.
    """
    api_key = os.getenv("SERPAPI_API_KEY")
    if not api_key:
        return ""

    params = {
        "engine": "google",
        "q": query,
        "api_key": api_key,
        "num": num_results,
    }

    search = GoogleSearch(params)
    results = search.get_dict()

    snippets = []

    for result in results.get("organic_results", []):
        title = result.get("title", "")
        snippet = result.get("snippet", "")
        link = result.get("link", "")
        snippets.append(f"{title}\n{snippet}\nSource: {link}")

    return "\n\n".join(snippets)
