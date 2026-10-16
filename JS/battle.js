// Library encounter: choose an action, read the warning, then move through a bullet pattern.
const battleScenes = (() => {
  const root = document.querySelector('#battle-screen'), canvas = document.querySelector('#battle-art'),
    c = canvas.getContext('2d'), message = document.querySelector('#battle-message'),
    commands = document.querySelector('#battle-commands'), buttons = [...root.querySelectorAll('[data-battle-command]')],
    items = document.querySelector('#battle-item-list'), back = document.querySelector('#battle-back'),
    next = document.querySelector('#battle-continue'), waveHud = document.querySelector('#battle-wave-hud'),
    touchPad = document.querySelector('#battle-touch-pad'), turnLabel = document.querySelector('#battle-turn');
  const held = new Set(), AW = 420, AH = 190, WAVE_SECONDS = 8;
  const patterns = [
    { name: '붉은 잿비', hint: '붉은 잿비가 내린다. 빗줄기 사이의 빈틈으로 이동하자.' },
    { name: '갈라지는 발톱', hint: '가느다란 예고선을 확인하고, 발톱이 지나갈 자리를 벗어나자.' },
    { name: '균열의 맥동', hint: '탄환이 부채처럼 퍼진다. 작은 틈을 찾아 천천히 움직이자.' },
  ];
  let state = null, request = 0, previous = 0;
  const clamp = (n, lo = 0, hi = 1) => Math.max(lo, Math.min(hi, n));
  const ease = n => { n = clamp(n); return n * n * (3 - 2 * n); };
  const motion = () => state?.motion && !document.body.classList.contains('no-motion') && !matchMedia('(prefers-reduced-motion: reduce)').matches;
  const cinematic = () => ['threat','entrance','aim','arrow','impact','dissolve','approach','won'].includes(state?.stage);
  function say(line) { if (message.textContent !== line) message.textContent = line; }
  function polygon(points, fill, stroke, width = 2) {
    c.beginPath(); points.forEach(([x,y],i) => i ? c.lineTo(x,y) : c.moveTo(x,y)); c.closePath();
    if (fill) { c.fillStyle = fill; c.fill(); }
    if (stroke) { c.strokeStyle = stroke; c.lineWidth = width; c.stroke(); }
  }
  function health() {
    document.querySelector('#battle-hp-text').textContent = `HP ${state.hp} / 24`;
    document.querySelector('#battle-hp-bar').style.width = state.hp / 24 * 100 + '%';
    document.querySelector('#battle-hp-bar').style.background = state.hp <= 6 ? '#fc716f' : '#f6d978';
    document.querySelector('#battle-enemy-bar').style.width = state.enemyHp / 96 * 100 + '%';
  }
  function stage(kind, line) {
    if (!state) return;
    const previousView = enemyPosition();
    state.viewFrom = { x: previousView.x / canvas.width, ground: previousView.ground / canvas.height, height: previousView.height / canvas.height };
    state.stage = kind; state.age = 0; state.inputAfter = performance.now() + 160;
    root.dataset.state = kind;
    const choosing = ['command','info','items'].includes(kind), dodging = kind === 'dodge';
    root.dataset.choosing = String(choosing); root.dataset.cinematic = String(cinematic());
    commands.hidden = kind !== 'command'; items.hidden = kind !== 'items'; back.hidden = !['info','items'].includes(kind);
    buttons.forEach(b => b.disabled = kind !== 'command');
    next.hidden = !['info','won'].includes(kind);
    next.textContent = kind === 'info' ? 'E · 돌아가기' : 'E · 카니아에게';
    waveHud.hidden = !['telegraph','dodge','waveEnd'].includes(kind);
    touchPad.hidden = !dodging;
    touchPad.querySelectorAll('button').forEach(b => b.disabled = !dodging);
    turnLabel.textContent = choosing ? `내 차례 · ${state.turn + 1}` : ['telegraph','dodge','waveEnd'].includes(kind) ? `적의 차례 · ${state.turn}` : '';
    document.querySelector('#battle-hint').textContent = dodging
      ? 'WASD / 방향키 이동 · Shift 천천히 · 터치: 회피 상자를 드래그'
      : choosing ? '↑ ↓ 선택 · E 결정 · 1 / 2 / 3 · Esc 돌아가기' : '이슬잎 도서관 · 균열의 추적자';
    if (line) say(line);
    if (!dodging) clearInput();
    health();
    if (kind === 'won') next.focus({preventScroll:true});
    if (kind === 'dodge') { canvas.tabIndex = -1; canvas.focus({preventScroll:true}); }
  }
  function select(index, focus = false) {
    if (!state) return;
    const list = state.stage === 'items' ? [...items.querySelectorAll('button'), back] : buttons;
    state.selection = (index + list.length) % list.length;
    list.forEach((b,i) => b.classList.toggle('is-selected', i === state.selection));
    if (focus) list[state.selection]?.focus({preventScroll:true});
  }
  function command(line) {
    state.bullets = []; state.warnings = []; state.pointer = null;
    stage('command', line || (state.turn ? '숨을 고른다. 마족의 다음 움직임을 살펴보자.' : '붉은 날개가 도서관의 문을 가렸다.'));
    select(0, true);
  }
  function choose(action) {
    if (state?.stage !== 'command') return;
    gameAudio.sfx('confirm');
    if (action === 'attack') {
      // The command resolves directly. Enemy poses communicate the outcome; no timing bar.
      state.reaction = state.turn % 3 === 0 ? 'guard' : state.turn % 3 === 2 ? 'dodge' : 'hit';
      state.damage = state.reaction === 'guard' ? 10 : state.reaction === 'dodge' ? 5 : 19;
      state.struck = false;
      stage('attack', '검을 쥐고, 마족의 갑각 틈으로 파고든다!');
    } else if (action === 'info') {
      stage('info', `균열의 추적자 · 중급 마족\nHP ${state.enemyHp} / 96 · 단단한 갑각과 붉은 날개.\n공격 뒤에는 반드시 반격한다. 예고선을 읽고 빈틈으로 피하자.\n정보 확인은 턴을 소모하지 않는다.`);
      next.focus({preventScroll:true});
    } else {
      stage('items', '회복 아이템을 사용하면 적의 차례로 넘어간다.'); items.replaceChildren();
      const stock = state.items();
      if (!stock.length) { const p = document.createElement('p'); p.textContent = '사용할 수 있는 회복 아이템이 없다.'; items.append(p); }
      stock.forEach((item,index) => {
        const b = document.createElement('button'); b.type = 'button'; b.textContent = `${item.name} ×${item.count} · HP +${item.heal}`;
        b.addEventListener('click', () => use(item.id)); b.addEventListener('focus', () => { if (state?.stage === 'items') select(index); }); items.append(b);
      }); select(0,true);
    }
  }
  function use(id) {
    if (state?.stage !== 'items') return;
    const result = state.useItem(id, state.hp);
    if (!result.ok) { say(result.message); return; }
    state.hp = result.hp; gameAudio.sfx(id === 'bread' ? 'eat' : 'drink'); stage('healing', result.message);
  }
  function enemyTurn() {
    state.turn++; state.pattern = (state.turn - 1) % patterns.length;
    state.soul = { x: AW / 2, y: AH * .68 }; state.invincible = 0;
    state.bullets = []; state.warnings = []; state.spawn = 0; state.hitsThisWave = 0;
    gameAudio.sfx('demon');
    document.querySelector('#battle-pattern-name').textContent = patterns[state.pattern].name;
    document.querySelector('#battle-wave-time').textContent = '공격 예고';
    document.querySelector('#battle-wave-bar').style.width = '100%';
    stage('telegraph', patterns[state.pattern].hint);
  }
  function bullet(x,y,vx,vy,r = 5, kind = 'ember') { state.bullets.push({x,y,vx,vy,r,kind,age:0}); }
  function emit(index) {
    if (state.pattern === 0) {
      // Rows have a broad moving gap. A row is visible well before reaching the soul.
      const gap = 75 + (index * 73 % 270);
      for (let x = 14; x < AW; x += 25) if (Math.abs(x - gap) > 48) bullet(x, -12, Math.sin(index) * 5, 70 + index % 3 * 6, 5);
    } else if (state.pattern === 1) {
      // Alternating vertical and horizontal claw lanes, each warned for 0.85 seconds.
      const vertical = index % 2 === 0, pos = vertical ? 35 + (index * 71 % 345) : 30 + (index * 31 % 125);
      state.warnings.push({vertical,pos,age:0,fired:false});
    } else {
      const source = { x: 45 + (index * 91 % 330), y: -13 },
        angle = Math.atan2(state.soul.y - source.y, state.soul.x - source.x);
      for (let i = -2; i <= 2; i++) {
        const a = angle + i * .25; bullet(source.x, source.y, Math.cos(a) * 77, Math.sin(a) * 77, 5, 'shard');
      }
    }
  }
  function dodge(dt) {
    const left = held.has('ArrowLeft') || held.has('KeyA'), right = held.has('ArrowRight') || held.has('KeyD'),
      up = held.has('ArrowUp') || held.has('KeyW'), down = held.has('ArrowDown') || held.has('KeyS'),
      dx = Number(right) - Number(left), dy = Number(down) - Number(up),
      speed = held.has('ShiftLeft') || held.has('ShiftRight') ? 77 : 150,
      length = Math.hypot(dx,dy) || 1;
    if (state.pointer) {
      const x = state.pointer.x - state.soul.x, y = state.pointer.y - state.soul.y, distance = Math.hypot(x,y);
      if (distance > 1) { const move = Math.min(distance, speed * dt); state.soul.x += x / distance * move; state.soul.y += y / distance * move; }
    } else { state.soul.x += dx / length * speed * dt; state.soul.y += dy / length * speed * dt; }
    state.soul.x = clamp(state.soul.x, 8, AW - 8); state.soul.y = clamp(state.soul.y, 8, AH - 8);
    state.invincible = Math.max(0, state.invincible - dt);
    const cadence = state.pattern === 0 ? .92 : state.pattern === 1 ? 1.05 : .95;
    if (state.age < WAVE_SECONDS - 1.8 && state.age >= state.spawn * cadence + .35) emit(state.spawn++);
    for (const warning of state.warnings) {
      warning.age += dt;
      if (warning.age >= .85 && !warning.fired) {
        warning.fired = true;
        if (warning.vertical) for (let i = -1; i <= 1; i++) bullet(warning.pos + i * 13, -18, 0, 195, 6, 'claw');
        else for (let i = -1; i <= 1; i++) bullet(-18, warning.pos + i * 13, 235, 0, 6, 'claw');
      }
    }
    state.warnings = state.warnings.filter(w => w.age < 1.25);
    for (const b of state.bullets) {
      b.x += b.vx * dt; b.y += b.vy * dt; b.age += dt;
      // Four logical pixels of player hit radius, smaller than the visible sigil.
      if (state.invincible <= 0 && Math.hypot(b.x - state.soul.x, b.y - state.soul.y) < b.r + 4) {
        state.hp = Math.max(0, state.hp - 3); state.hitsThisWave++; state.invincible = .85;
        state.hurtAt = state.elapsed; gameAudio.sfx('hurt'); health();
        if (!state.hp) { startRescue(true); return; }
      }
    }
    state.bullets = state.bullets.filter(b => b.x > -40 && b.x < AW + 40 && b.y > -40 && b.y < AH + 40);
    const remaining = Math.max(0, WAVE_SECONDS - state.age);
    document.querySelector('#battle-wave-time').textContent = `${remaining.toFixed(1)}초`;
    document.querySelector('#battle-wave-bar').style.width = remaining / WAVE_SECONDS * 100 + '%';
    if (state.age >= WAVE_SECONDS) {
      state.bullets = []; state.warnings = [];
      stage('waveEnd', state.hitsThisWave ? '공격이 잦아들었다. 다시 검을 들 틈이다.' : '모든 공격을 피했다! 마족이 불쾌한 듯 날개를 펼친다.');
    }
  }
  function startRescue(critical = false) {
    state.critical = critical; state.bullets = []; state.warnings = [];
    gameAudio.sfx('charge');
    stage('threat', critical ? '몸이 휘청인다. 마족이 마지막 일격을 준비한다……!' : '마족이 모든 마력을 끌어모은다. 숲 너머에서, 활시위가 당겨지는 소리가 들렸다.');
  }
  function update(dt) {
    if (!state) return;
    state.age += dt; state.elapsed += dt;
    const age = state.age;
    if (state.stage === 'intro' && age >= (motion() ? 3.4 : 1.3)) { root.dataset.ready = 'true'; command(); }
    else if (state.stage === 'attack') {
      if (age >= .4 && !state.struck) {
        state.struck = true; state.enemyHp = Math.max(1, state.enemyHp - state.damage); health(); gameAudio.sfx('sword');
        say(state.reaction === 'guard' ? `교차한 발톱이 검을 막았다. 갑각에 ${state.damage} 피해!` : state.reaction === 'dodge' ? `마족이 몸을 틀었다. 날개를 스쳐 ${state.damage} 피해!` : `갑각의 틈을 베었다! ${state.damage} 피해.`);
      }
      if (age >= 1.35) enemyTurn();
    } else if (state.stage === 'healing' && age >= 1.4) enemyTurn();
    else if (state.stage === 'telegraph' && age >= 1.6) stage('dodge', '표식을 움직여 공격을 피하자. 작은 중심점이 피격 범위다.');
    else if (state.stage === 'dodge') dodge(dt);
    else if (state.stage === 'waveEnd' && age >= 1.25) { if (state.turn >= 3) startRescue(); else command(); }
    else if (state.stage === 'threat' && age >= 2.2) stage('entrance', '나뭇잎 사이로 녹색 망토가 모습을 드러냈다.');
    else if (state.stage === 'entrance' && age >= 2) stage('aim', '카니아가 숨을 멈추고, 마족의 이마를 겨눈다.');
    else if (state.stage === 'aim' && age >= 2.4) { gameAudio.sfx('arrow'); stage('arrow', '당겨진 활시위에서, 한 줄기 빛이 쏘아졌다.'); }
    else if (state.stage === 'arrow' && age >= 1.15) {
      state.rescued = true; state.enemyHp = 0;
      if (!state.hp) state.hp = 1;
      gameAudio.sfx('arrowHit'); health(); stage('impact', '화살이 마족의 이마를 정확히 꿰뚫었다!');
    } else if (state.stage === 'impact' && age >= .75) stage('dissolve', '붉은 균열이 무너지고, 응축된 마력이 흩어진다.');
    else if (state.stage === 'dissolve' && age >= 2.3) { gameAudio.scene('grove'); gameAudio.sfx('rescued'); stage('approach', '카니아가 활을 내리고, 서둘러 다가왔다.'); }
    else if (state.stage === 'approach' && age >= 2.1) stage('won', '“이게 바로 네가 조사하러 온, 그 불미스러운 일이야.”\n카니아의 시선이 도서관의 문으로 향했다.');
  }
  function layout() {
    const w = canvas.width, h = canvas.height, portrait = h > w * 1.1, short = h < 430 && !portrait,
      bw = portrait ? w * .86 : Math.min(w * .61, h * 1.14), bh = bw * AH / AW;
    return { w,h,portrait,short,box:{x:(portrait ? w*.5 : w*.37)-bw/2,y:h*(short?.34:.43),w:bw,h:bh} };
  }
  function enemyPosition() {
    const {w,h,portrait,short} = layout(),
      wave = ['telegraph','dodge','waveEnd'].includes(state.stage),
      blend = state.stage === 'telegraph' ? ease(state.age / 1.2) : wave ? 1 : 0;
    const target = { x:w*(portrait ? .3 + .2*blend : .36), ground:h*(portrait ? .53-.15*blend : short ? .66-.32*blend : .61-.21*blend),
      height:h*(portrait ? .32-.10*blend : short ? .53-.28*blend : .48-.18*blend) };
    if (['entrance','aim','arrow','impact','dissolve'].includes(state.stage)) {
      target.x = w*.69; target.ground = h*.51; target.height *= .83;
    }
    const from = state.viewFrom, progress = ease(state.age / .85);
    if (from && progress < 1 && motion()) return {
      x: from.x*w + (target.x-from.x*w)*progress,
      ground: from.ground*h + (target.ground-from.ground*h)*progress,
      height: from.height*h + (target.height-from.height*h)*progress,
    };
    return target;
  }

  function backdrop() {
    const {w,h} = layout(), t = motion() ? state.elapsed : 0, horizon = h*.47;
    c.fillStyle = '#030508'; c.fillRect(0,0,w,h);
    const glow = c.createRadialGradient(w*.36,h*.34,10,w*.36,h*.4,w*.7);
    glow.addColorStop(0,'#351021'); glow.addColorStop(.38,'#11151f'); glow.addColorStop(1,'#020508'); c.fillStyle=glow;c.fillRect(0,0,w,h);
    // Broken library doorway, layered trees and drifting dust tie the arena to the field.
    c.save(); c.globalAlpha=.32;
    const cx=w*.36, arch=h*.12, half=w*.22;
    for(let side=-1;side<=1;side+=2) {
      for(let i=0;i<5;i++) {
        const x=cx+side*(half+i*22), bottom=horizon+i*9;
        polygon([[x,arch+60+i*8],[x+side*12,arch+53+i*8],[x+side*14,bottom],[x-5,bottom]],'#263c42','#50615a',1);
        for(let y=arch+87;y<bottom;y+=27){c.strokeStyle='#65705a';c.beginPath();c.moveTo(x,y);c.lineTo(x+side*12,y-4);c.stroke();}
      }
      for(let i=0;i<4;i++) {
        const x=side===-1?i*w*.075:w*(.73+i*.08);
        polygon([[x,horizon],[x+w*.02,h*.16],[x-w*.015,0],[x+w*.03,0],[x+w*.04,horizon]],'#17282a');
        c.strokeStyle='#273d37';c.beginPath();c.moveTo(x+w*.025,h*.2);c.lineTo(x+side*w*.09,h*.07);c.stroke();
      }
    }
    c.strokeStyle='#a08279';c.lineWidth=2;c.beginPath();c.moveTo(cx-half,arch+65);c.lineTo(cx-half*.64,arch+15);c.lineTo(cx,arch-12);c.lineTo(cx+half*.64,arch+15);c.lineTo(cx+half,arch+65);c.stroke();
    c.restore();
    c.save(); c.strokeStyle='#5e364c'; c.lineWidth=1;
    for(let i=-7;i<=10;i++){c.globalAlpha=.24;c.beginPath();c.moveTo(w*.36+i*w*.023,horizon);c.lineTo(w*.36+i*w*.22,h*.9);c.stroke();}
    for(let i=0;i<11;i++){const p=(i+(t*.26)%1)/11,y=horizon+p*p*h*.43;c.globalAlpha=.15+p*.22;c.beginPath();c.moveTo(0,y);c.lineTo(w,y);c.stroke();}
    c.restore();
    for(let i=0;i<42;i++){const x=(i*113+31)%w,y=((i*73-t*(3+i%4))%(h*.76)+h*.76)%(h*.76);c.fillStyle=i%4?'#637e653d':'#ec9a705d';c.fillRect(x,y,i%3?2:3,2);}
    const shade=c.createLinearGradient(0,h*.6,0,h);shade.addColorStop(0,'#02040800');shade.addColorStop(1,'#020408');c.fillStyle=shade;c.fillRect(0,h*.6,w,h*.4);
  }
  function drawEnemy() {
    const p=enemyPosition(), age=state.age, kind=state.stage;
    let frame=0, x=p.x, ground=p.ground, height=p.height, alpha=1;
    if(kind==='attack') {
      frame=age<.36?0:state.reaction==='guard'?3:state.reaction==='dodge'?(age<.8?4:5):6;
      if(motion()) x+=(state.reaction==='dodge'?Math.sin(clamp((age-.35)/.9)*Math.PI)*height*.12:Math.sin(age*29)*4*(1-ease(age/1.3)));
    } else if(['telegraph','threat'].includes(kind)) frame=1;
    else if(kind==='dodge') frame=Math.sin(age*3)>.3?2:1;
    else if(['impact','dissolve'].includes(kind)) {
      frame=kind==='impact'?6:7;
      if(kind==='dissolve') {alpha=1-ease((age-.35)/1.8);ground+=age*8;}
    } else if(['approach','won'].includes(kind)) alpha=0;

    c.save();
    c.globalAlpha=alpha;c.fillStyle='#000a';c.beginPath();c.ellipse(x,ground+4,height*.43,height*.045,0,0,Math.PI*2);c.fill();c.globalAlpha=1;
    const bob=motion()&&!['impact','dissolve'].includes(kind)?Math.sin(state.elapsed*2)*height*.004:0;
    if (state.lastFrame !== frame) { state.previousFrame = state.lastFrame ?? frame; state.lastFrame = frame; state.poseAt = state.elapsed; }
    const poseBlend = motion() ? ease((state.elapsed - state.poseAt) / .16) : 1;
    if (poseBlend < 1) pixelAtlases.draw(c,state.enemy,state.previousFrame,x,ground+bob,height,alpha*(1-poseBlend));
    pixelAtlases.draw(c,state.enemy,frame,x,ground+bob,height,alpha*poseBlend);
    if(kind==='attack'&&age>.4&&age<1.15) {
      const progress=clamp((age-.4)/.6);c.globalAlpha=1-ease((age-.8)/.35);c.strokeStyle='#fff5c9';c.lineWidth=4;
      c.beginPath();c.moveTo(x-height*.28,ground-height*.66);c.lineTo(x+height*.29*progress,ground-height*.26*progress-height*.4);c.stroke();
      c.fillStyle=state.reaction==='guard'?'#d5d8e2':'#ffe78f';c.font=`bold ${Math.max(24,height*.13)}px Galmuri,monospace`;c.textAlign='center';c.fillText(state.damage,x,ground-height*.73-progress*22);c.textAlign='left';
    }
    c.restore();
    if(['threat','aim'].includes(kind)) {
      c.save();c.strokeStyle='#ff597c';c.globalAlpha=.45;c.lineWidth=2;
      const r=height*(.25+Math.sin(state.elapsed*2)*.015);
      c.beginPath();c.ellipse(x,ground-height*.48,r,r*.5,0,0,Math.PI*2);c.stroke();
      for(let i=0;i<8;i++){const a=i*Math.PI/4-state.elapsed*.4;c.fillStyle='#f06b8f';c.fillRect(x+Math.cos(a)*r,ground-height*.48+Math.sin(a)*r*.5,3,3);}
      c.restore();
    }
    if(['impact','dissolve'].includes(kind)) {
      const t=kind==='impact'?age*.2:.15+age;
      c.save();c.globalAlpha=1-ease(t/2.8);
      for(let i=0;i<42;i++){const a=i*2.399,dist=t*(22+i%6*8);c.fillStyle=i%3?'#eb3b6a':'#fff3ba';c.fillRect(x+Math.cos(a)*dist,ground-height*.72+Math.sin(a)*dist+t*t*17,2+i%3,2+i%3);}
      if(kind==='impact'){c.strokeStyle='#fff1b5';c.lineWidth=3;for(let i=0;i<8;i++){const a=i*Math.PI/4;c.beginPath();c.moveTo(x+Math.cos(a)*13,ground-height*.72+Math.sin(a)*13);c.lineTo(x+Math.cos(a)*(28+age*24),ground-height*.72+Math.sin(a)*(28+age*24));c.stroke();}}
      c.restore();
    }
  }
  function drawHands() {
    if(cinematic()||['dodge','telegraph','waveEnd'].includes(state.stage))return;
    const {w,h,portrait}=layout(), s=Math.min(w/780,h/560),swing=state.stage==='attack'&&motion()?Math.sin(clamp(state.age/1.1)*Math.PI):0;
    c.save();c.globalAlpha=state.turn===0&&state.stage==='command'?ease(state.age/.6):1;c.translate(w*(portrait?.47:.57)-swing*w*.17,h*.76);c.rotate(-.16-swing*.85);c.scale(s,s);
    polygon([[-31,92],[-24,0],[-10,-15],[12,-12],[30,9],[27,46],[55,95]],'#263341','#5c696d',2);
    polygon([[-24,2],[-12,-16],[8,-16],[24,2],[19,29],[-8,35],[-29,19]],'#bc946f');
    c.fillStyle='#816d51';c.fillRect(-8,-64,13,55);c.fillStyle='#30303a';for(let i=0;i<5;i++)c.fillRect(-8,-58+i*9,13,3);
    polygon([[-44,-77],[36,-77],[43,-65],[11,-60],[-16,-61],[-49,-67]],'#b7c6b5');
    polygon([[-10,-79],[-8,-220],[0,-244],[10,-219],[7,-79]],'#d9e5dc','#809c9d',1);
    polygon([[0,-233],[8,-218],[6,-82],[0,-82]],'#7f9fa6');c.restore();
  }
  function drawArena() {
    if(!['telegraph','dodge','waveEnd'].includes(state.stage))return;
    const {box}=layout(), appearing=state.stage==='telegraph'?ease(state.age/.65):1;
    c.save();c.translate(box.x+box.w/2,box.y+box.h/2);c.scale(appearing,appearing);c.translate(-box.w/2,-box.h/2);
    polygon([[-5,3],[box.w*.22,-3],[box.w*.49,1],[box.w*.78,-2],[box.w+4,1],[box.w+2,box.h*.48],[box.w+5,box.h-1],[box.w*.67,box.h+4],[box.w*.32,box.h+1],[-3,box.h+3],[-1,box.h*.52]],'#020609','#f3e9dc',3);
    c.strokeStyle='#92394e';c.lineWidth=1;c.strokeRect(-9,-8,box.w+18,box.h+16);
    c.save();c.beginPath();c.rect(0,0,box.w,box.h);c.clip();c.scale(box.w/AW,box.h/AH);
    c.strokeStyle='#25303b';c.lineWidth=.7;
    for(let x=0;x<AW;x+=30){c.beginPath();c.moveTo(x,0);c.lineTo(x,AH);c.stroke();}
    for(let y=0;y<AH;y+=30){c.beginPath();c.moveTo(0,y);c.lineTo(AW,y);c.stroke();}
    for(const warning of state.warnings) {
      c.save();c.strokeStyle=warning.fired?'#ff9aa3':'#d8b568';c.globalAlpha=warning.fired?.3:.45+warning.age*.45;c.lineWidth=warning.fired?34:2;
      c.setLineDash(warning.fired?[]:[6,5]);c.beginPath();
      if(warning.vertical){c.moveTo(warning.pos,0);c.lineTo(warning.pos,AH);}else{c.moveTo(0,warning.pos);c.lineTo(AW,warning.pos);}c.stroke();c.restore();
    }
    for(const b of state.bullets){
      c.fillStyle=b.kind==='claw'?'#fff0d0':'#f05c83';
      if(b.kind==='ember'){polygon([[b.x,b.y-7],[b.x+5,b.y],[b.x,b.y+7],[b.x-5,b.y]],'#e74e70');c.fillStyle='#ffd7bc';c.fillRect(b.x-2,b.y-2,3,4);}
      else if(b.kind==='shard')polygon([[b.x,b.y-8],[b.x+5,b.y+5],[b.x,b.y+3],[b.x-5,b.y+5]],'#f5b9ce','#eb547a',1);
      else{c.fillRect(b.x-3,b.y-9,6,18);c.fillStyle='#d84968';c.fillRect(b.x-2,b.y-5,4,9);}
    }
    if(state.stage!=='waveEnd'){
      const {x,y}=state.soul;
      c.save();c.globalAlpha=state.invincible>0?.45+.3*Math.sin(state.elapsed*30):1;
      polygon([[x,y-9],[x+7,y],[x,y+9],[x-7,y]],'#a8ffd2','#eafff1',1);
      c.fillStyle='#ffffff';c.fillRect(x-2,y-2,4,4);c.restore();
    }
    c.restore();c.restore();
  }
  function intro() {
    const {w,h}=layout(), age=state.age, duration=motion()?3.4:1.3,
      p=clamp(age/duration), blend=ease((p-.56)/.44), focus=state.origin,
      target=enemyPosition(), initial=state.initialView,
      initialScale=initial.scale*w,
      zoom=motion()?initialScale+(target.height/74-initialScale)*ease(p/.78):initialScale,
      pan=motion()?ease((p-.4)/.55):blend,
      centre={x:initial.x*w+(target.x-initial.x*w)*pan,y:initial.y*h+(target.ground-initial.y*h)*pan},
      camera={x:360+(focus.x-360)*ease(p/.75),y:240+(focus.y-240)*ease(p/.75)},
      emergence=ease(age/(duration*.4));
    backdrop();
    c.save();c.globalAlpha=1-blend;c.translate(centre.x,centre.y);c.scale(zoom,zoom);
    c.translate(-camera.x,-camera.y);c.drawImage(state.snapshot,0,0,720,480);
    c.fillStyle='#4c153577';c.beginPath();c.ellipse(focus.x,focus.y-15,36*emergence,15*emergence,0,0,Math.PI*2);c.fill();c.restore();
    // One continuous enemy projection bridges the field camera and the arena.
    // Only the scenery crossfades, so two silhouettes never overlap during entry.
    const projected={x:centre.x+(focus.x-camera.x)*zoom,y:centre.y+(focus.y-camera.y)*zoom,height:74*emergence*zoom};
    pixelAtlases.draw(c,state.enemy,0,projected.x+(target.x-projected.x)*blend,projected.y+(target.ground-projected.y)*blend,projected.height+(target.height-projected.height)*blend,emergence);
    if(p>.2&&p<.85){
      c.save();c.globalAlpha=Math.sin(clamp((p-.2)/.65)*Math.PI)*.85;
      c.fillStyle='#09070cd9';c.fillRect(0,h*.63,w,h*.14);
      c.font=`bold ${Math.max(28,Math.min(w*.06,56))}px Galmuri,monospace`;c.textAlign='center';c.fillStyle='#fff2d6';c.fillText('균 열 의 추 적 자',w*.5,h*.72);c.restore();
    }
  }
  function rescueScene() {
    if(!cinematic()||state.stage==='threat')return;
    const {w,h,portrait}=layout(),age=state.age,kind=state.stage,
      focus=['entrance','aim','arrow','impact','dissolve'].includes(kind),
      x=focus?w*.23:w*(kind==='approach'?.23+ease(age/2.1)*.13:.36),
      ground=h*(portrait?.54:.6),height=h*(portrait?.32:.45);
    if(focus){
      c.save();c.globalAlpha=kind==='entrance'?ease(age/1.6):1;
      const glow=c.createRadialGradient(x,ground-height*.5,10,x,ground-height*.5,height*.7);glow.addColorStop(0,'#65815c30');glow.addColorStop(1,'#182c2300');c.fillStyle=glow;c.fillRect(0,h*.1,w*.5,h*.6);c.restore();
    }
    if(kind==='entrance'){
      const enter=ease(age/1.7);pixelAtlases.draw(c,state.walk,Math.floor(age*9.6)%8,x-(1-enter)*w*.33,ground,height,enter);
    } else if(['aim','arrow','impact','dissolve'].includes(kind)) {
      const frame=kind==='aim'?Math.min(2,Math.floor(age/.64)):3;
      pixelAtlases.draw(c,state.bow,frame,x,ground,height*1.16);
      if(kind==='aim'){
        const enemy=enemyPosition(),target={x:enemy.x,y:enemy.ground-enemy.height*.60};
        c.save();c.globalAlpha=ease((age-.8)/.8)*.6;c.setLineDash([4,9]);c.strokeStyle='#bce5b5';c.lineWidth=1;c.beginPath();c.moveTo(x+height*.3,ground-height*.57);c.lineTo(target.x,target.y);c.stroke();c.setLineDash([]);
        c.strokeStyle='#f3dd9d';c.strokeRect(target.x-11,target.y-11,22,22);c.restore();
      }
    } else if(['approach','won'].includes(kind)) {
      pixelAtlases.draw(c,state.walk,kind==='won'?0:Math.floor(age*9.6)%8,x,ground,height);
    }
    if(kind==='arrow'||(kind==='impact'&&age<.2)){
      const enemy=enemyPosition(),target={x:enemy.x,y:enemy.ground-enemy.height*.60},start={x:w*.23+height*.5,y:ground-height*.67},
        t=kind==='impact'?1:ease(age/1.15),ax=start.x+(target.x-start.x)*t,ay=start.y+(target.y-start.y)*t;
      c.save();c.translate(ax,ay);c.rotate(Math.atan2(target.y-start.y,target.x-start.x));
      if(kind==='arrow'){const trail=c.createLinearGradient(-80,0,0,0);trail.addColorStop(0,'#c8efb000');trail.addColorStop(1,'#d6f5b5aa');c.fillStyle=trail;c.fillRect(-80,-2,76,4);}
      c.fillStyle='#ded5b1';c.fillRect(-42,-1,39,2);polygon([[2,0],[-8,-4],[-7,4]],'#ffefc0');polygon([[-34,0],[-46,-6],[-42,0],[-47,5]],'#b4d599');c.restore();
    }
    if(['entrance','aim'].includes(kind)){
      c.fillStyle='#c9e8b5';c.font=`${Math.max(16,Math.min(w*.027,25))}px Galmuri,monospace`;c.textAlign='center';c.fillText('카니아',x,ground+25);c.textAlign='left';
    }
  }
  function draw() {
    if(!state)return;
    c.imageSmoothingEnabled=false;
    if(state.stage==='intro'){intro();return;}
    backdrop();drawEnemy();drawHands();drawArena();rescueScene();
    if(state.stage==='threat'){
      const {w,h}=layout();c.save();c.globalAlpha=.16*ease(state.age/2);c.fillStyle='#ef2d60';c.fillRect(0,0,w,h);c.restore();
    }
    if(motion()&&state.elapsed-state.hurtAt<.2){c.strokeStyle='#ff677b';c.lineWidth=5;c.strokeRect(3,3,canvas.width-6,canvas.height-6);}
  }
  function fit() {
    if(!state||root.hidden)return;
    canvas.width=Math.max(1,Math.min(1120,Math.round(root.clientWidth)));
    canvas.height=Math.max(1,Math.round(canvas.width*root.clientHeight/Math.max(1,root.clientWidth)));draw();
  }
  function loop(now) {
    if(!state)return;
    const dt=Math.min(.05,Math.max(0,(now-previous)/1000));previous=now;
    if(!document.hidden)update(dt);draw();request=requestAnimationFrame(loop);
  }
  function prepare(options) {
    stop();const snapshot=document.createElement('canvas');snapshot.width=720;snapshot.height=480;snapshot.getContext('2d').drawImage(options.world,0,0,720,480);
    const worldRect=options.world.getBoundingClientRect(), viewport=root.parentElement.getBoundingClientRect(),
      initialView={x:(worldRect.x+worldRect.width/2-viewport.x)/viewport.width,y:(worldRect.y+worldRect.height/2-viewport.y)/viewport.height,scale:worldRect.width/viewport.width/720};
    state={...options,snapshot,initialView,stage:'intro',age:0,elapsed:0,enemyHp:96,hp:clamp(options.hp,1,24),turn:0,selection:0,rescued:false,
      bullets:[],warnings:[],soul:{x:AW/2,y:AH*.68},invincible:0,hurtAt:-10,
      enemy:pixelAtlases.make(options.pictures.demonActions,4,2),walk:pixelAtlases.make(options.pictures.kaniaWalk,4,2),bow:pixelAtlases.make(options.pictures.kaniaArchery,4,1)};
    root.hidden=false;delete root.dataset.ready;document.querySelector('#battle-player-name').textContent=options.name;
    items.replaceChildren();stage('intro','');fit();gameAudio.sfx('battleStart');
  }
  function play(){if(!state)return;cancelAnimationFrame(request);previous=performance.now();request=requestAnimationFrame(loop);}
  function finish(){if(state?.stage!=='won'||performance.now()<state.inputAfter)return;const {after,hp}=state;stop();after({hp});}
  function clearInput(){held.clear();if(state)state.pointer=null;touchPad.querySelectorAll('button').forEach(b=>b.classList.remove('is-held'));}
  function release(code){held.delete(code);}
  function stop(){cancelAnimationFrame(request);clearInput();state=null;root.hidden=true;delete root.dataset.ready;delete root.dataset.state;}
  function confirm(){
    if(!state||performance.now()<state.inputAfter)return;
    if(state.stage==='command')choose(buttons[state.selection].dataset.battleCommand);
    else if(state.stage==='items'){const list=[...items.querySelectorAll('button'),back];list[state.selection]?.click();}
    else if(state.stage==='info')command();else if(state.stage==='won')finish();
  }
  function handle(code,repeat,shift){
    if(!state)return false;
    const moving=['KeyW','KeyA','KeyS','KeyD','ArrowUp','ArrowDown','ArrowLeft','ArrowRight','ShiftLeft','ShiftRight'];
    if(state.stage==='dodge'&&moving.includes(code)){held.add(code);state.pointer=null;return true;}
    if(![...moving,'KeyE','Enter','Space','Escape','KeyC','Tab','Digit1','Digit2','Digit3'].includes(code))return false;
    if(code==='Tab'){
      const list=[...root.querySelectorAll('button:not([disabled])'),document.querySelector('#game-sound-toggle')].filter(b=>!b.hidden&&b.getClientRects().length&&!b.closest('[hidden]')),
        i=list.indexOf(document.activeElement);list[(i+(shift?-1:1)+list.length)%list.length]?.focus({preventScroll:true});
    }else if(!repeat){
      if(['KeyE','Enter','Space'].includes(code))confirm();
      else if(['Escape','KeyC'].includes(code)&&['info','items'].includes(state.stage))command();
      else if(['command','items'].includes(state.stage)&&['ArrowUp','ArrowDown','KeyW','KeyS'].includes(code))select(state.selection+(['ArrowUp','KeyW'].includes(code)?-1:1),true);
      else if(state.stage==='command'&&code.startsWith('Digit'))choose(['attack','info','items'][Number(code.at(-1))-1]);
    }return true;
  }
  buttons.forEach((b,i)=>{b.addEventListener('click',()=>choose(b.dataset.battleCommand));b.addEventListener('focus',()=>{if(state?.stage==='command')select(i);});});
  back.addEventListener('click',()=>command());back.addEventListener('focus',()=>{if(state?.stage==='items')select(items.querySelectorAll('button').length);});
  next.addEventListener('click',()=>state?.stage==='info'?command():finish());
  function point(event){const r=canvas.getBoundingClientRect(),{box}=layout();return{x:(event.clientX-r.left)/r.width*canvas.width-box.x,y:(event.clientY-r.top)/r.height*canvas.height-box.y,box};}
  canvas.addEventListener('pointerdown',event=>{
    if(state?.stage!=='dodge')return;const p=point(event);
    if(p.x<0||p.y<0||p.x>p.box.w||p.y>p.box.h)return;
    canvas.setPointerCapture(event.pointerId);held.clear();state.pointer={x:p.x/p.box.w*AW,y:p.y/p.box.h*AH};event.preventDefault();
  });
  canvas.addEventListener('pointermove',event=>{if(state?.stage!=='dodge'||!canvas.hasPointerCapture(event.pointerId))return;const p=point(event);state.pointer={x:clamp(p.x/p.box.w,0,1)*AW,y:clamp(p.y/p.box.h,0,1)*AH};});
  const pointerEnd=()=>{if(state)state.pointer=null;};canvas.addEventListener('pointerup',pointerEnd);canvas.addEventListener('pointercancel',pointerEnd);canvas.addEventListener('lostpointercapture',pointerEnd);
  touchPad.querySelectorAll('button').forEach(b=>{
    b.addEventListener('pointerdown',e=>{if(state?.stage!=='dodge')return;b.setPointerCapture(e.pointerId);held.add(b.dataset.dodge);state.pointer=null;b.classList.add('is-held');e.preventDefault();});
    for(const name of ['pointerup','pointercancel','lostpointercapture'])b.addEventListener(name,()=>{held.delete(b.dataset.dodge);b.classList.remove('is-held');});
  });
  new ResizeObserver(fit).observe(document.querySelector('#game-screen'));
  return {prepare,play,stop,handle,release,clearInput,get active(){return !!state;},getState(){return state?{stage:state.stage,hp:state.hp,enemyHp:state.enemyHp,turn:state.turn,rescued:state.rescued,pattern:patterns[state.pattern]?.name,projectiles:state.bullets.length,warnings:state.warnings.length,soul:{...state.soul},invincible:state.invincible,age:state.age}:null;}};
})();
