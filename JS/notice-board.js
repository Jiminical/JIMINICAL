// Read-only guild notices. Accepting the story quest remains Lucy's job.
const noticeBoard = (() => {
  const panel = document.querySelector('#notice-board');
  const list = document.querySelector('#notice-board-list');
  const paper = document.querySelector('#notice-board-paper');
  const close = document.querySelector('#notice-board-close');
  const notices = [
    {title:'성역의 이상 징후 사전 조사',tag:'제르디아 기사단 · 왕국 공문',body:'최근 성역 그린스토아에 불미스러운 기운이 감돈다는 보고가 접수되었다.\n\n현장의 이상 징후를 확인하고 사실을 구분해 보고할 모험가를 모집한다. 임무의 목적은 사전 조사이며, 무리한 단독 추적과 교전을 요구하지 않는다.\n\n접수처: 길드 접수원 루시\n이동: 기사단 파견 마차\n지참: 모험가증 및 인장이 찍힌 조사 의뢰서'},
    {title:'약초 채집 안내',tag:'일반 안내 · 열람 전용',body:'약초와 독초는 생김새가 비슷합니다. 채집 전 품종과 제출 상태를 반드시 확인해 주세요.\n\n현재 이 공문에서는 신규 의뢰를 접수하지 않습니다. 모집 기간과 자세한 조건은 접수대에 문의해 주세요.'},
    {title:'상단 호위 안내',tag:'일반 안내 · 열람 전용',body:'동쪽 숲길을 지나는 상단의 출발 일정과 호위 인원을 조정 중입니다.\n\n일정이 확정되기 전에는 임의로 상단에 합류하지 마세요. 현재 이 공문에서는 의뢰 접수나 보상 지급을 진행하지 않습니다.'},
    {title:'분실물 수색 안내',tag:'일반 안내 · 열람 전용',body:'길드와 광장에서 습득한 물건은 접수대로 가져다주세요. 봉인된 편지나 꾸러미는 개봉하지 마세요.\n\n소유자의 확인을 거쳐 돌려드립니다. 현재 이 공문은 안내용이며 별도 의뢰나 보상을 제공하지 않습니다.'},
  ];
  let selected = 0, accepted = false, finish = null, inertBefore = [];
  function select(index, focus = false) {
    selected = (index + notices.length) % notices.length;
    const notice = notices[selected];
    [...list.children].forEach((button, i) => {
      button.classList.toggle('is-current', selected === i);
      button.setAttribute('aria-pressed', String(selected === i));
    });
    paper.replaceChildren();
    const tag = document.createElement('small'), title = document.createElement('h3'), status = document.createElement('p'), body = document.createElement('p');
    tag.textContent = notice.tag; title.textContent = notice.title;
    status.className = 'notice-status';
    status.textContent = selected ? '열람 전용 · 수락되는 의뢰가 아닙니다' : accepted ? '수락 완료 · 조사 의뢰서 발급됨' : '미수락 · 루시에게 접수하세요';
    body.textContent = notice.body;
    paper.append(tag, title, status, body); paper.scrollTop = 0;
    if (focus) list.children[selected].focus({preventScroll:true});
  }
  function hide() {
    panel.hidden = true;
    for (const [node, value] of inertBefore) node.inert = value;
    inertBefore = []; finish = null;
  }
  function dismiss() { const callback = finish; hide(); callback?.(); }
  close.addEventListener('click', dismiss);
  function show({image, accepted: state, onClose}) {
    hide(); accepted = state; finish = onClose;
    list.replaceChildren();
    notices.forEach((notice, i) => {
      const button = document.createElement('button');
      button.type = 'button'; button.textContent = notice.title;
      button.addEventListener('click', () => select(i));
      list.append(button);
    });
    const art = document.querySelector('#notice-board-art'), ctx = art.getContext('2d');
    ctx.imageSmoothingEnabled = false;
    // The same wooden board that the player approaches in the guild painting.
    const sx = image.naturalWidth / 1536, sy = image.naturalHeight / 1024;
    ctx.drawImage(image, 220*sx, 184*sy, 225*sx, 185*sy, 0, 0, art.width, art.height);
    inertBefore = [...panel.parentElement.children].filter(node => node !== panel && !node.hidden).map(node => [node, node.inert]);
    for (const [node] of inertBefore) node.inert = true;
    panel.hidden = false; select(0, true);
  }
  function handle(event, repeat) {
    if (panel.hidden) return false;
    const {code} = event;
    if (['KeyC','Escape'].includes(code)) { if (!repeat) dismiss(); return true; }
    if (code === 'Tab') {
      const nodes = [...panel.querySelectorAll('button,[tabindex="0"]')];
      const index = nodes.indexOf(document.activeElement);
      nodes[(index + (event.shiftKey ? -1 : 1) + nodes.length) % nodes.length].focus();
      return true;
    }
    if (['ArrowLeft','KeyA','ArrowRight','KeyD','ArrowUp','KeyW','ArrowDown','KeyS'].includes(code)) {
      if (!repeat) select(selected + (['ArrowLeft','KeyA'].includes(code) ? -1 : ['ArrowRight','KeyD'].includes(code) ? 1 : ['ArrowUp','KeyW'].includes(code) ? -2 : 2), true);
      return true;
    }
    if (['KeyE','Enter','Space'].includes(code)) {
      if (!repeat) {
        if (document.activeElement === close) dismiss();
        else { select(selected); paper.focus({preventScroll:true}); }
      }
      return true;
    }
    if (['PageDown','PageUp','Home','End'].includes(code)) {
      paper.scrollTop = code === 'Home' ? 0 : code === 'End' ? paper.scrollHeight : paper.scrollTop + (code === 'PageUp' ? -1 : 1)*paper.clientHeight*.8;
      return true;
    }
    return false;
  }
  return {show,hide,handle};
})();
