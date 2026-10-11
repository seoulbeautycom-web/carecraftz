import re
import urllib.request
from pathlib import Path

dirp = Path(r"c:\Users\Asad\CareCraftz\carecraftz\public\about")
dirp.mkdir(parents=True, exist_ok=True)

for p in dirp.glob("*.mp4"):
    p.unlink()
    print("removed", p.name)

ua = {"User-Agent": "Mozilla/5.0"}


def fetch(url: str) -> bytes:
    req = urllib.request.Request(url, headers=ua)
    with urllib.request.urlopen(req, timeout=45) as r:
        return r.read()


def title_ok(url: str) -> str | None:
    try:
        html = fetch(url).decode("utf-8", "ignore")
    except Exception:
        return None
    m = re.search(r"<title>([^<]+)", html)
    title = m.group(1) if m else ""
    bad = re.search(
        r"LGBT|gay men|kiss|pride|rainbow makeup|nude|naked|topless|intimate",
        title + html[:2000],
        re.I,
    )
    if bad:
        return None
    return title


# Prefer hands/products/spa-with-towel — avoid bare-shoulder beauty portraits
PICKS = [
    # hands applying moisturiser (no body)
    ("45118", "video-cream.mp4", "https://mixkit.co/free-stock-video/hands-applying-moisturiser-45118/"),
    # woman applies cream — verify title
    ("50426", "video-foam.mp4", "https://mixkit.co/free-stock-video/a-young-woman-applies-skincare-moisturizing-cream-on-her-face-50426/"),
    # spa facial treatment
    ("24701", "video-serum.mp4", "https://mixkit.co/free-stock-video/face-treatment-at-a-beauty-salon-24701/"),
    # oil face treatment salon
    ("24778", "video-mask.mp4", "https://mixkit.co/free-stock-video/oil-face-treatment-at-a-beauty-salon-24778/"),
]

# Fallbacks if any fail
FALLBACKS = [
    ("9229", "https://mixkit.co/free-stock-video/model-putting-on-pads-for-facial-skin-care-9229/"),
    ("52171", "https://mixkit.co/free-stock-video/a-skilled-masseuse-rubs-a-crystal-clear-tube-as-beauty-52171/"),
]

fb_i = 0
for vid, name, page in PICKS:
    title = title_ok(page)
    use_vid, use_title = vid, title
    while use_title is None and fb_i < len(FALLBACKS):
        use_vid, fb_page = FALLBACKS[fb_i]
        fb_i += 1
        use_title = title_ok(fb_page)
        print("fallback try", use_vid, use_title)
    if use_title is None:
        print("SKIP", name)
        continue
    url = f"https://assets.mixkit.co/videos/{use_vid}/{use_vid}-720.mp4"
    data = fetch(url)
    if len(data) < 150000:
        print("tiny", name)
        continue
    (dirp / name).write_bytes(data)
    print("DL", name, use_vid, use_title, len(data))

print("files", sorted(p.name for p in dirp.glob("*.mp4")))
