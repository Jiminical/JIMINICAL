"""Build the portable screen from templates/index.html, CSS and JavaScript.

Run: python3 scripts/build-standalone.py
The generated index.html contains its styles, script and background so it works
when opened directly or in a preview that does not serve adjacent files.
"""

from pathlib import Path
import base64
import re

ROOT = Path(__file__).resolve().parent.parent
page = (ROOT / "templates/index.html").read_text()
styles = (ROOT / "CSS/main.css").read_text()
script = (ROOT / "JS/main.js").read_text()
for asset_name in ("greenstoa-title.png", "greenstoa-elf-idle.png"):
    background = base64.b64encode(
        (ROOT / "assets" / asset_name).read_bytes()
    ).decode("ascii")
    styles = styles.replace("../assets/" + asset_name, "data:image/png;base64," + background)
    if asset_name == "greenstoa-elf-idle.png":
        page = re.sub(
            r'data-sprite-src="[^"]*"',
            lambda _: 'data-sprite-src="data:image/png;base64,' + background + '"',
            page,
        )
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
    page = re.sub(r'\s*<script src="JS/main.js" defer></script>', "", page)
    page = page.replace("</body>", script_tag + "\n</body>")

assert '<style id="greenstoa-styles">' in page
assert '<script id="greenstoa-script">' in page
assert "data:image/png;base64," in page
assert 'data-sprite-src="data:image/png;base64,' in page
assert "data:font/woff2;base64," in page
assert "../assets/" not in styles
(ROOT / "index.html").write_text(page)
print("Updated standalone index.html with embedded styles, script and background.")
