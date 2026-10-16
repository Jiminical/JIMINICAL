# 그린스토아 · Cloudflare Pages 배포용

이 폴더 전체를 Cloudflare Pages의 직접 업로드 화면에 올리세요.
`index.html`, `CSS`, `JS`, `assets`가 같은 위치에 있어야 합니다.

- index.html: 약 34KB
- 가장 큰 파일: 약 3.25MiB
- 모든 파일: 25MB 미만
- 서버나 데이터베이스 없이 동작하는 정적 사이트입니다.

Git 연동을 사용한다면 이 브랜치를 선택하고 프레임워크 None,
빌드 명령 비움, 출력 디렉터리 `/`를 지정합니다.

게임 수정과 새 빌드는 `codex/greenstoa-interactions-20261016` 브랜치에서
`python3 scripts/build-cloudflare.py`로 수행합니다. 이 브랜치는 배포 결과물입니다.
