#!/usr/bin/env python3
import json
from urllib import request
from urllib.error import HTTPError

from dev.ck_migration.config import categories, cookie, user_id, limit


# configure this script by creating the file config.py

def call(url: str, headers: dict[str, str]) -> str:
    opener = request.build_opener()
    for name in headers:
        opener.addheaders.append((name, headers[name]))
    try:
        f = opener.open(url)
        return json.loads(f.read().decode("utf-8"))
    except HTTPError as e:
        raise Exception(e.read())


api_token = call("https://www.chefkoch.de/benutzer/me", {"Cookie": cookie})["api_token"]

urls: list[str] = []
sql_queries: list[str] = []

for category in categories:
    api_url = f"https://www.chefkoch.de/api/v2/cookbooks/{user_id}/recipes?categoryId={category['id']}&offset=0&limit={limit}&order=1&orderBy=1"
    response = call(api_url, {"Cookie": cookie, "X-Chefkoch-Api-Token": api_token})
    category_urls: list[str] = []
    for result in response["results"]:
        created_at = result["createdAt"]
        recipe_url = result["recipe"]["siteUrl"]
        sql_queries.append(f"UPDATE recipe SET created_at = '{created_at}' WHERE source = '{recipe_url}';")
        urls.append(recipe_url)
        category_urls.append(recipe_url)
    recipe_urls = ", ".join(map(lambda u: f"'{u}'", category_urls))
    if category["tag"] is not None:
        sql_queries.append(f"INSERT INTO tag (title) VALUES ('{category['tag']}') ON CONFLICT (title) DO NOTHING;")
        sql_queries.append(f"INSERT INTO recipe_tag SELECT id AS recipe_id, (SELECT id FROM tag WHERE tag.title = '{category['tag']}') AS tag_id"
                           f" FROM recipe WHERE source IN ({recipe_urls}) ON CONFLICT DO NOTHING;")
    if category["use_created_at_history"]:
        sql_queries.append(f"INSERT INTO recipe_history SELECT id AS recipe_id, created_at AS timestamp FROM recipe WHERE source IN ({recipe_urls});")
    if category["rating"] is not None:
        sql_queries.append(f"UPDATE recipe SET rating = {category['rating']} WHERE source IN ({recipe_urls});")

sql_queries.append("UPDATE recipe SET description = substr(description, 0, instr(description, '.') + 1)")

print("Please import the following URLs:")
print("\n".join(urls))
print("")
print("Afterwards, please make sure to execute the following SQL queries:")
print("\n".join(sql_queries))
