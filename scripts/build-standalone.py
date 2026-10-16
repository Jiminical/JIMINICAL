"""Build the portable screen from templates/index.html, CSS and JavaScript.

Run: python3 scripts/build-standalone.py
The generated index.html contains its styles, script and background so it works
when opened directly or in a preview that does not serve adjacent files.
"""

from pathlib import Path
import base64
import io
import re
from PIL import Image, ImageChops

ROOT = Path(__file__).resolve().parent.parent
page = (ROOT / "templates/index.html").read_text()
styles = "\n".join((ROOT / "CSS" / name).read_text() for name in ("main.css", "game.css", "battle-polish.css", "scene-polish.css", "item-view.css"))
script = "\n".join((ROOT / "JS" / filename).read_text() for filename in ("audio.js", "events.js", "fields.js", "terrain.js", "lore.js", "archive.js", "staging.js", "letter.js", "shops.js", "sprites.js", "item-view.js", "weapon.js", "landscape.js", "journey.js", "walk.js", "menu-art.js", "battle-effects.js", "battle.js", "save.js", "game.js", "story.js", "main.js"))
# Re-encode PNGs losslessly inside the portable file to leave room for the
# additional scenery/audio under GitHub's 100 MiB per-file limit. Source assets
# stay unchanged. Visible RGB and every alpha value must remain identical; the
# encoder can optimise irrelevant RGB values hidden under fully transparent pixels.
asset_refs = sorted(set(re.findall(r"(?:\.\./)?assets/[a-zA-Z0-9_./-]+\.(?:png|webp|mp3)", page + "\n" + styles)))
for ref in asset_refs:
    asset_path = ROOT / ref.removeprefix("../")
    mime = {".webp": "image/webp", ".png": "image/png", ".mp3": "audio/mpeg"}[asset_path.suffix]
    data = asset_path.read_bytes()
    if asset_path.suffix == ".png":
        with Image.open(asset_path) as source:
            packed = io.BytesIO()
            source.save(packed, format="WEBP", lossless=True, method=6, exact=False)
            candidate = packed.getvalue()
            if len(candidate) < len(data):
                restored = Image.open(io.BytesIO(candidate)).convert("RGBA")
                expected = source.convert("RGBA")
                alpha = expected.getchannel("A")
                assert alpha.tobytes() == restored.getchannel("A").tobytes(), asset_path
                visible = alpha.point(lambda value: 255 if value else 0)
                for channel in "RGB":
                    difference = ImageChops.difference(expected.getchannel(channel), restored.getchannel(channel))
                    assert ImageChops.multiply(difference, visible).getbbox() is None, asset_path
                data, mime = candidate, "image/webp"
    encoded = base64.b64encode(data).decode("ascii")
    data_uri = "data:" + mime + ";base64," + encoded
    page = page.replace(ref, data_uri)
    styles = styles.replace(ref, data_uri)
for font_name in ("Galmuri11.woff2", "Galmuri11-Bold.woff2"):
    encoded = base64.b64encode((ROOT / "assets/fonts" / font_name).read_bytes()).decode("ascii")
    styles = styles.replace("../assets/fonts/" + font_name, "data:font/woff2;base64," + encoded)
for cursor_name in ("quill.svg", "quill-active.svg"):
    encoded = base64.b64encode((ROOT / "assets/cursors" / cursor_name).read_bytes()).decode("ascii")
    styles = styles.replace("../assets/cursors/" + cursor_name, "data:image/svg+xml;base64," + encoded)
# Preserve the font redistribution license inside the single-file build too.
license_text = (ROOT / "assets/fonts/LICENSE.txt").read_text()
styles = "/* Galmuri font license:\n" + license_text + "\n*/\n" + styles
style_tag = '<style id="greenstoa-styles">\n' + styles + "\n</style>"
script_tag = '<script id="greenstoa-script">\n' + script + "\n</script>"

page = re.sub(r'\s*<link rel="stylesheet" href="CSS/(?:game|battle-polish|scene-polish|item-view).css"\s*/?>', "", page)
if '<style id="greenstoa-styles">' in page:
    page = re.sub(
        r'<style id="greenstoa-styles">.*?</style>', lambda _: style_tag, page, flags=re.S
    )
else:
    page = re.sub(r'<link rel="stylesheet" href="CSS/main.css"\s*/?>', lambda _: style_tag, page)

if '<script id="greenstoa-script">' in page:
    page = re.sub(
        r'<script id="greenstoa-script">.*?</script>', lambda _: script_tag, page, flags=re.S
    )
else:
    page = re.sub(r'\s*<script src="JS/(?:audio|events|fields|terrain|lore|archive|staging|letter|shops|sprites|item-view|weapon|landscape|journey|walk|menu-art|battle-effects|battle|save|game|story|main).js" defer></script>', "", page)
    page = page.replace("</body>", script_tag + "\n</body>")

assert '<style id="greenstoa-styles">' in page
assert '<script id="greenstoa-script">' in page
assert 'data-sprite-src="data:image/webp;base64,' in page
assert 'data-art-src="data:image/webp;base64,' in page
assert 'data-late-src="data:image/webp;base64,' in page
for attribute in ('lucy', 'cast', 'kania', 'rogue', 'guild', 'carriage', 'checkpoint', 'gate', 'forest', 'sanctuary', 'events', 'event-props', 'sd-hero', 'sd-guild', 'sd-leads', 'city', 'grove', 'shop', 'field-cast', 'sd-field', 'sd-kania', 'library', 'guide-forest', 'guide-kania'):
    assert 'data-' + attribute + '-src="data:image/webp;base64,' in page
for attribute in ('demon-actions', 'item-specimens', 'first-person-arms', 'forest-ambush', 'journey-carriage'):
    assert 'data-' + attribute + '-src="data:image/webp;base64,' in page
assert "data:font/woff2;base64," in page
assert 'data-journey-src="data:image/webp;base64,' in page
for attribute in ('journey-gorge', 'journey-road'):
    assert 'data-' + attribute + '-src="data:image/webp;base64,' in page
assert 'src="data:audio/mpeg;base64,' in page
assert "../assets/" not in styles
assert len(page.encode("utf-8")) < 100 * 1024 * 1024, "Portable HTML exceeds GitHub's 100 MiB limit"
(ROOT / "index.html").write_text(page)
print("Updated standalone index.html with embedded styles, script and background.")
