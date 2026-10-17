"""Bundle the embedded game and supplied webtoon for offline reading."""
from pathlib import Path
import argparse
import hashlib
import json
import shutil
import zipfile

root = Path(__file__).resolve().parent.parent
parser = argparse.ArgumentParser(description=__doc__)
parser.add_argument("--output-dir", type=Path, required=True)
args = parser.parse_args()
output = args.output_dir.resolve()
output.mkdir(parents=True, exist_ok=True)
shutil.copy2(root / "index.html", output / "greenstoa-portable.html")
shutil.copytree(root / "assets/webtoon", output / "assets/webtoon", dirs_exist_ok=True)
images = [root / "assets/webtoon" / (f"web{n}.png" if n == 10 else f"web{n}.webp")
          for n in (1, 2, 3, 4, 5, 6, 7, 8, 10)]
note = """그린스토아 오프라인 실행

압축을 모두 푼 뒤 index.html을 최신 Chrome 또는 Edge에서 여세요.
assets/webtoon 폴더를 함께 보관하면 도서관 프롤로그 웹툰도 인터넷 없이 읽을 수 있습니다.
웹툰 순서: 1 → 2 → 3 → 4 → 5 → 6 → 7 → 8 → 10
웹툰의 원본 화질과 WebP 애니메이션을 보존했습니다.
"""
target = output / "greenstoa-offline.zip"
manifest = []
with zipfile.ZipFile(target, "w", compression=zipfile.ZIP_DEFLATED, compresslevel=6) as bundle:
    for file, name in [(root / "index.html", "index.html"), *[(p, p.relative_to(root).as_posix()) for p in images]]:
        bundle.write(file, name)
        raw = file.read_bytes()
        manifest.append({"file": name, "bytes": len(raw), "sha256": hashlib.sha256(raw).hexdigest()})
    bundle.writestr("읽어주세요.txt", note)
with zipfile.ZipFile(target) as bundle:
    assert bundle.testzip() is None
    assert len(bundle.namelist()) == 11
(output / "greenstoa-offline-manifest.json").write_text(json.dumps(manifest, ensure_ascii=False, indent=2), encoding="utf-8")
print(f"Offline package: {target.name}, {target.stat().st_size:,} bytes, 11 files; CRC verified.")
