#!/usr/bin/env python3
"""Check every link and asset referenced by the built site.

  python3 scripts/check_links.py _site              # internal links only
  python3 scripts/check_links.py _site --external   # also request external URLs

Internal: every href/src that starts with "/" or is relative must exist in the build,
and every "#fragment" must match an id on the target page. Paths under the three
project sites (/morning-brief/, /earnings-desk/, /ai-adoption-tracker/) are served by
other repositories, so they are checked over the network as external links.

External: a 404 or 410 fails the build. Timeouts, 403/429 and LinkedIn's 999 are
reported as warnings, because those sites routinely block automated requests.
"""
import argparse
import os
import re
import sys
import urllib.error
import urllib.request
from html.parser import HTMLParser
from urllib.parse import urljoin, urlparse

SITE = "https://kechunwu.github.io"
OTHER_REPOS = ("/morning-brief", "/earnings-desk", "/ai-adoption-tracker")
UA = "Mozilla/5.0 (compatible; kechunwu.github.io link check)"


class Collect(HTMLParser):
    def __init__(self):
        super().__init__()
        self.links, self.ids = [], set()

    def handle_starttag(self, tag, attrs):
        a = dict(attrs)
        if "id" in a:
            self.ids.add(a["id"])
        for key in ("href", "src"):
            v = a.get(key)
            if v and not (tag == "link" and a.get("rel") in ("preconnect", "dns-prefetch")):
                self.links.append(v)
        if tag == "meta" and a.get("property", a.get("name", "")) in ("og:image", "twitter:image"):
            self.links.append(a.get("content", ""))


def parse(path):
    p = Collect()
    with open(path, encoding="utf-8") as f:
        p.feed(f.read())
    return p


def fetch(url):
    for method in ("HEAD", "GET"):
        req = urllib.request.Request(url, method=method, headers={"User-Agent": UA})
        try:
            with urllib.request.urlopen(req, timeout=20) as r:
                return r.status
        except urllib.error.HTTPError as e:
            if method == "HEAD" and e.code in (403, 405, 501):
                continue
            return e.code
        except Exception as e:  # timeouts, DNS, TLS
            return str(e)
    return "unknown"


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("root")
    ap.add_argument("--external", action="store_true")
    args = ap.parse_args()
    root = os.path.abspath(args.root)
    pages = [os.path.join(d, f) for d, _, fs in os.walk(root) for f in fs if f.endswith(".html")]
    errors, warnings, external = [], [], set()
    id_cache = {}

    for page in pages:
        rel_page = "/" + os.path.relpath(page, root).replace(os.sep, "/")
        parsed = parse(page)
        id_cache[rel_page] = parsed.ids
        for link in parsed.links:
            if link.startswith(("mailto:", "tel:", "data:", "javascript:")):
                continue
            if link.startswith(SITE):
                link = link[len(SITE):] or "/"
            u = urlparse(link)
            if u.scheme in ("http", "https"):
                external.add(link.split("#")[0])
                continue
            target = urljoin(rel_page, u.path) if u.path else rel_page
            if target.startswith(OTHER_REPOS):
                external.add(SITE + target)
                continue
            fs_path = os.path.join(root, target.lstrip("/"))
            if os.path.isdir(fs_path):
                fs_path = os.path.join(fs_path, "index.html")
            if not os.path.exists(fs_path):
                errors.append(f"{rel_page}: missing {link}")
                continue
            if u.fragment and fs_path.endswith(".html"):
                key = "/" + os.path.relpath(fs_path, root).replace(os.sep, "/")
                ids = id_cache.get(key) or parse(fs_path).ids
                if u.fragment not in ids:
                    errors.append(f"{rel_page}: no #{u.fragment} in {key}")

    print(f"checked {len(pages)} page(s) internally; {len(external)} external URL(s)")
    if args.external:
        for url in sorted(external):
            status = fetch(url)
            if status in (404, 410):
                errors.append(f"broken external link ({status}): {url}")
            elif not (isinstance(status, int) and status < 400):
                warnings.append(f"could not confirm ({status}): {url}")
            else:
                print(f"  ok {status} {url}")
    for w in warnings:
        print("warning:", w)
    for e in errors:
        print("ERROR:", e)
    return 1 if errors else 0


if __name__ == "__main__":
    sys.exit(main())
