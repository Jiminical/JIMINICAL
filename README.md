# 그린스토아 인물 교체 인계 자료

2026-10-17. 실행 환경이 gateway_unavailable로 시작되지 않아, 확보할 수 있는 이미지·대사·설계 초안을 별도 GitHub 브랜치에 보존했습니다.

## 받는 방법과 이어서 작업하기

이 브랜치 화면의 Code → Download ZIP으로 전체 자료를 내려받으세요.
새 채팅에는 이 ZIP과, 이전 대화에서 별도로 저장한 루시 새 상반신 시트/필요한 원본 레퍼런스를 첨부하세요.
NEXT_CHAT_PROMPT.md의 내용을 요청으로 붙여 넣으면 됩니다.

실제 게임 저장소: https://github.com/Jiminical/JIMINICAL
게임 작업 브랜치: codex/greenstoa-interactions-20261016
전달 자료 전용 브랜치: codex/greenstoa-handoff-20261017
실제 게임 기준 커밋: a2086dc96b512f1a20433ae2b16022eddefddc88

이 브랜치의 루트는 전달 자료만 담고 있습니다. 게임 작업 브랜치를 먼저 체크아웃한 뒤 필요한 파일만 가져오세요. 이 전달용 루트 트리로 실제 게임을 덮어쓰지 마세요.

## 포함한 실제 파일

- assets/portraits/{iboria,hanari,aina,munia,girus,tobi}.png: 이 대화에서 만든 6명의 상반신 6표정 생성 시트 원본.
- data/characters.json: 7명 설정, 표정 맵, 잡담 3종씩, 무니아 안내, 기루스 탑승 대사, 통합 메모.
- data/speech-policy.json: 최종 정정된 말투 규칙. 루시·기루스 존댓말, 나머지 반말, 토비 ~하네/~하게.
- drafts/character-chats.js: 일반 잡담 자료. 미통합 소스이며 무니아의 동적 목표 설명은 별도 분기 처리가 필요.
- drafts/objective-guide.js, .css, .html 및 OBJECTIVE_INTEGRATION.md: 목표 HUD 초안과 통합 지침.
- data/objective-model-checks.json: 모델 수준 검사 기록(게임/브라우저 검증을 뜻하지 않음).
- LOCAL_WORK_RECOVERY.md: 접근할 수 없게 된 루시·게시판 수정본의 재구현 설명.
- NEXT_CHAT_PROMPT.md: 새 채팅에 보낼 프롬프트.
- ASSET_MANIFEST.json: 이미지 경로, 픽셀 크기, 원본 PNG byte 수와 Git blob SHA.

## 빠져 있는 것과 상태

루시 작업 로컬 커밋 729a324는 원격에 올라가지 않았고, 현재 작업 서버에서 읽을 수도 없습니다. 원래의 루시 코드·게시판 코드·새 루시 이미지·테스트 파일을 이 묶음에 담았다고 주장하지 않습니다.
루시의 3개 잡담은 기존 로컬 원본을 회수한 것이 아니라 같은 주제로 새로 정리한 인계용 대체 초안입니다. 원래 로컬 커밋이 복구되면 원본과 비교하세요.
나머지 6명은 준비한 대사와 생성 이미지를 보존했습니다. 실제 게임 반영·포즈 연결·SD 스프라이트 수정·브라우저 테스트·배포는 아직 하지 못했습니다.
생성 시트의 배경 투명도와 여백/잘림도 실제 파일 처리 전에 확인해야 합니다. 데이터 URL을 PNG 바이트로 보존할 뿐, 이미지 후처리를 했다고 주장하지 않습니다.
