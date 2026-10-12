"""Import documented IFrame getPlaylist IDs and official YouTube oEmbed metadata.

No video files, watch-page scraping, private APIs, or API keys are used.
The input is the visible JSON output of public/catalog-import.html.
"""
import argparse
import concurrent.futures
import datetime
import json
import pathlib
import re
import urllib.error
import urllib.parse
import urllib.request

parser = argparse.ArgumentParser()
parser.add_argument("inventory")
parser.add_argument("--workers", type=int, default=12)
args = parser.parse_args()
root = pathlib.Path(__file__).resolve().parents[1]
source = json.loads(pathlib.Path(args.inventory).read_text())
playlist_source = (root / "src/data/playlists.ts").read_text()
subjects = {i: (o, c) for i, o, c in re.findall(
    r'id:\s*"([^"]+)"\s*,\s*original:\s*"([^"]+)"\s*,\s*current:\s*"([^"]+)"', playlist_source)}
assert len(subjects) == 45
memberships = {}
for unit in source["playlists"]:
    assert unit["id"] in subjects
    for video_id in unit["videoIds"]:
        assert re.fullmatch(r"[A-Za-z0-9_-]{11}", video_id)
        memberships.setdefault(video_id, []).append(unit["id"])
cache_path = root / "docs/oembed-metadata-20261012.json"
cache = json.loads(cache_path.read_text()) if cache_path.exists() else {}
failures = []
now = datetime.datetime.now(datetime.timezone.utc).isoformat()

def fetch_metadata(video_id):
    if video_id in cache:
        return video_id, cache[video_id], None
    query = urllib.parse.urlencode({"url": "https://www.youtube.com/watch?v=" + video_id, "format": "json"})
    request = urllib.request.Request("https://www.youtube.com/oembed?" + query, headers={"User-Agent": "Mathveo-metadata-import", "Accept": "application/json"})
    try:
        with urllib.request.urlopen(request, timeout=20) as response:
            data = json.load(response)
        if data.get("type") != "video" or not isinstance(data.get("title"), str) or not data["title"]:
            raise ValueError("oEmbed動画メタデータを確認できません")
        return video_id, {"title": data["title"], "author_name": data.get("author_name", ""), "author_url": data.get("author_url", ""), "thumbnail_url": data.get("thumbnail_url", ""), "fetchedAt": datetime.datetime.now(datetime.timezone.utc).isoformat()}, None
    except (urllib.error.URLError, ValueError, TimeoutError) as error:
        return video_id, None, {"id": video_id, "reason": str(error)}

print(f"Fetching metadata for {len(memberships)} unique video IDs", flush=True)
with concurrent.futures.ThreadPoolExecutor(max_workers=min(max(args.workers, 1), 20)) as pool:
    for count, (video_id, data, failure) in enumerate(pool.map(fetch_metadata, memberships), 1):
        if data:
            cache[video_id] = data
        if failure:
            failures.append(failure)
        if count % 100 == 0:
            cache_path.write_text(json.dumps(cache, ensure_ascii=False, indent=2) + "\n")
            print(f"Metadata: {count}/{len(memberships)}; failed: {len(failures)}", flush=True)
cache_path.write_text(json.dumps(cache, ensure_ascii=False, indent=2) + "\n")
records = []
for video_id, unit_ids in memberships.items():
    data = cache.get(video_id)
    channel = re.search(r"/channel/([^/?]+)", data["author_url"]) if data else None
    records.append({
        "id": video_id,
        "title": data["title"] if data else "タイトル未取得",
        "description": None,
        "channelId": channel.group(1) if channel else "",
        "channelTitle": data["author_name"] if data else "",
        "channelUrl": data["author_url"] if data else None,
        "publishedAt": None,
        "durationSeconds": None,
        "thumbnail": data["thumbnail_url"] if data else "",
        "playlistIds": list(dict.fromkeys(unit_ids)),
        "embeddable": None,
        "fetchedAt": data["fetchedAt"] if data else now,
        "updatedAt": data["fetchedAt"] if data else now,
        "source": "youtube-oembed" if data else "youtube-iframe-api",
        "originalSubject": subjects[unit_ids[0]][0],
        "currentSubjects": list(dict.fromkeys(subjects[u][1] for u in unit_ids)),
        "classification": "verified",
        "classificationEvidence": "公式サイト掲載の単元と公式IFrame Player APIのgetPlaylist()の動画IDを照合。動画内容の詳細は未確認。",
    })
output = {"fetchedAt": now, "videos": records, "units": [{"id": u["id"], "videoIds": u["videoIds"], "fetchedAt": u["fetchedAt"]} for u in source["playlists"]], "failures": source.get("failures", []) + failures}
(root / "src/data/registered-videos.json").write_text(json.dumps(output, ensure_ascii=False, indent=2) + "\n")
(root / "docs/video-inventory-20261012.json").write_text(json.dumps(source, ensure_ascii=False, indent=2) + "\n")
print(json.dumps({"units": len(output["units"]), "videos": len(records), "titlesVerified": sum(v["source"] == "youtube-oembed" for v in records), "failures": len(failures)}, ensure_ascii=False), flush=True)
