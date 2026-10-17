"""Build the portable screen from templates/index.html, CSS and JavaScript.

Run: python3 scripts/build-standalone.py
The generated index.html contains its styles, script and background so it works
when opened directly or in a preview that does not serve adjacent files.
"""

from pathlib import Path
import base64
import io
import re
import subprocess
import gzip
from PIL import Image, ImageChops

ROOT = Path(__file__).resolve().parent.parent
page = (ROOT / "templates/index.html").read_text(encoding="utf-8")
css = re.findall(r'<link rel="stylesheet" href="(CSS/[^\"]+)"', page)
programs = re.findall(r'<script src="(JS/[^\"]+)" defer></script>', page)
styles = "\n".join((ROOT / name).read_text(encoding="utf-8") for name in css)
script = "\n".join((ROOT / name).read_text(encoding="utf-8") for name in programs)
def minify(source, loader):
    # Use the pinned package, preserving template order and all artwork/audio.
    # The JS API works on Windows too; bin/esbuild itself is a native executable.
    command = ["node", "-e", "const e=require('esbuild'),fs=require('fs');process.stdout.write(e.transformSync(fs.readFileSync(0,'utf8'),{minify:true,target:'es2020',charset:'utf8',loader:process.argv[1]}).code)", loader]
    return subprocess.run(command,input=source,capture_output=True,text=True,encoding="utf-8",check=True,cwd=ROOT).stdout
styles = minify(styles, "css")
script = minify(script, "js")
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
license_text = (ROOT / "assets/fonts/LICENSE.txt").read_text(encoding="utf-8")
styles = "/* Galmuri font license:\n" + license_text + "\n*/\n" + styles
style_tag = '<style id="greenstoa-styles">\n' + styles + "\n</style>"
script_tag = '<script id="greenstoa-script">\n' + script + "\n</script>"

page = re.sub(r'\s*<link rel="stylesheet" href="CSS/[^\"]+"\s*/?>', "", page)
page = page.replace("</head>", style_tag + "\n</head>")
page = re.sub(r'\s*<script src="JS/[^\"]+" defer></script>', "", page)
page = page.replace("</body>", script_tag + "\n</body>")

assert '<style id="greenstoa-styles">' in page
assert '<script id="greenstoa-script">' in page
assert 'data-sprite-src="data:image/webp;base64,' in page
assert 'data-art-src="data:image/webp;base64,' in page
assert 'data-late-src="data:image/webp;base64,' in page
for attribute in ('lucy', 'cast', 'kania', 'rogue', 'guild', 'carriage', 'checkpoint', 'gate', 'sanctuary', 'events', 'event-props', 'sd-hero', 'sd-leads', 'city', 'grove', 'shop', 'field-cast', 'sd-field', 'sd-kania', 'library', 'guide-forest', 'guide-kania'):
    assert 'data-' + attribute + '-src="data:image/webp;base64,' in page
for attribute in ('demon-actions', 'item-specimens', 'first-person-arms', 'forest-ambush', 'journey-carriage'):
    assert 'data-' + attribute + '-src="data:image/webp;base64,' in page
assert "data:font/woff2;base64," in page
assert 'data-journey-src="data:image/webp;base64,' in page
for attribute in ('journey-gorge', 'journey-road'):
    assert 'data-' + attribute + '-src="data:image/webp;base64,' in page
assert 'src="data:audio/mpeg;base64,' in page
assert "../assets/" not in styles
# Lossless transport encoding keeps all decoded artwork and original audio.
# Native gzip decompression works offline; no remote libraries or media needed.
payload = gzip.compress(page.encode('utf-8'), compresslevel=9, mtime=0)
alphabet = ''.join(chr(i) for i in range(128) if i not in (0,10,13,34,39,60,92))
blocks = []
for offset in range(0,len(payload),6):
    value = int.from_bytes(payload[offset:offset+6].ljust(6,b'\0'),'big')
    digits = [''] * 7
    for index in range(6,-1,-1):
        value, digit = divmod(value,121)
        digits[index] = alphabet[digit]
    blocks.append(''.join(digits))
packed = ''.join(blocks)
decoder = (ROOT/'scripts/portable-codec.cjs').read_text(encoding='utf-8')
page = '''<!doctype html><html lang="ko"><meta charset="utf-8"><title>그린스토아</title>
<body style="background:#10191e;color:#e8e4cc;font-family:monospace"><p id="boot">그린스토아 자료를 여는 중…</p>
<script id="portable-payload" type="application/octet-stream">''' + packed + '''</script>
<script>''' + decoder + '''
(async()=>{try {
 const bytes=decodePortable(document.getElementById('portable-payload').textContent,''' + str(len(payload)) + ''');
 const stream=new Blob([bytes]).stream().pipeThrough(new DecompressionStream('gzip'));
 const html=await new Response(stream).text();
 document.open();document.write(html);document.close();
} catch(error) {document.getElementById('boot').textContent='게임을 열지 못했습니다. 최신 브라우저에서 다시 열어 주세요.';console.error(error);}})();
</script></body></html>'''
print(f"Portable HTML (lossless gzip + compact ASCII): {len(page.encode('utf-8')) / 1024 / 1024:.2f} MiB")
assert len(page.encode("utf-8")) < 100 * 1024 * 1024, "Portable HTML exceeds GitHub's 100 MiB limit"
(ROOT / "index.html").write_bytes(page.encode("utf-8"))
print("Updated standalone index.html with embedded styles, script and background.")
