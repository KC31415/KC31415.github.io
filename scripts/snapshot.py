#!/usr/bin/env python3
"""Build data/sdk-share.json from the AI Adoption Tracker's published data.

Source: https://kechunwu.github.io/ai-adoption-tracker/data/entity_weekly.csv
(npm downloads per package, with a 4-week moving average in column `ma4`).

Output: weekly share of combined npm downloads (4-week average) for the official
OpenAI, Anthropic, Google Gen AI and Mistral SDKs, from 2024 onward.

Standard library only. If the download fails, the existing snapshot is kept and the
script exits 0, so a network hiccup never breaks the site build.

Usage:
  python3 scripts/snapshot.py                 # fetch from the live site
  python3 scripts/snapshot.py --csv FILE      # use a local copy of entity_weekly.csv
"""
import argparse
import csv
import io
import json
import os
import sys
import urllib.request
from datetime import datetime, timezone

URL = "https://kechunwu.github.io/ai-adoption-tracker/data/entity_weekly.csv"
OUT = os.path.join(os.path.dirname(__file__), "..", "data", "sdk-share.json")
ENTITIES = {"openai": "OpenAI", "anthropic": "Anthropic", "google-genai": "Google Gen AI", "mistralai": "Mistral"}
START = "2024-01-01"


def load(csv_path):
    if csv_path:
        with open(csv_path, newline="") as f:
            return f.read()
    req = urllib.request.Request(URL, headers={"User-Agent": "kechunwu.github.io snapshot"})
    with urllib.request.urlopen(req, timeout=30) as r:
        return r.read().decode("utf-8")


def build(text):
    weeks = {}
    for row in csv.DictReader(io.StringIO(text)):
        if row["registry"] != "npm" or row["entity"] not in ENTITIES or row["week"] < START:
            continue
        if not row["ma4"]:
            continue
        weeks.setdefault(row["week"], {})[row["entity"]] = float(row["ma4"])
    rows = [(w, v) for w, v in sorted(weeks.items()) if len(v) == len(ENTITIES)]
    if len(rows) < 20:
        raise ValueError(f"only {len(rows)} complete weeks; refusing to overwrite snapshot")
    series = {k: [] for k in ENTITIES}
    for _, v in rows:
        total = sum(v.values())
        for k in ENTITIES:
            series[k].append(round(v[k] / total, 4))
    return {
        "title": "Share of npm downloads among official AI SDKs (4-week average)",
        "source": "AI Adoption Tracker, npm downloads API",
        "source_url": "https://kechunwu.github.io/ai-adoption-tracker/ai-sdk.html",
        "data_as_of": rows[-1][0],
        "snapshot_at": datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%MZ"),
        "labels": ENTITIES,
        "weeks": [w for w, _ in rows],
        "share": series,
    }


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--csv")
    args = ap.parse_args()
    try:
        data = build(load(args.csv))
    except Exception as e:  # keep the committed snapshot
        print(f"snapshot: kept existing data/sdk-share.json ({e})", file=sys.stderr)
        return 0
    with open(OUT, "w") as f:
        json.dump(data, f, separators=(",", ":"))
    last = {k: v[-1] for k, v in data["share"].items()}
    print(f"snapshot: {len(data['weeks'])} weeks, as of {data['data_as_of']}: {last}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
