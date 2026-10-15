# 이종족연합국 그린스토아

정적 HTML로 만든 도트풍 타이틀 화면입니다. `index.html`에 배경 이미지,
스타일, 동작 코드가 모두 포함되어 있어 별도 설치나 빌드 없이 열 수 있습니다.

로컬 서버로 확인하려면 저장소에서 `python3 -m http.server 8000`을 실행하세요.

`CSS/main.css`, `JS/main.js`, 배경 이미지를 수정한 뒤에는
`python3 scripts/build-standalone.py`를 실행해 `index.html`에 반영하세요.
문구와 화면 구조는 `index.html`에서 수정합니다.

캐릭터는 `assets/greenstoa-elf-atlas.png`의 4열 × 2행 스프라이트를
Canvas에 프레임별로 그립니다. 화면 요소의 위치를 움직이지 않고 눈과
머리카락·망토의 픽셀이 바뀌며, 옵션이나 시스템의 움직임 감소 설정으로
정지할 수 있습니다.
