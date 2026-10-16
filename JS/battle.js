// Library encounter: choose an action, read the warning, then move through a bullet pattern.
const battleScenes = (() => {
  const root = document.querySelector('#battle-screen'), canvas = document.querySelector('#battle-art'),
    c = canvas.getContext('2d'), message = document.querySelector('#battle-message'),
    commands = document.querySelector('#battle-commands'), buttons = [...root.querySelectorAll('[data-battle-command]')],
    items = document.querySelector('#battle-item-list'), back = document.querySelector('#battle-back'),
    next = document.querySelector('#battle-continue'), waveHud = document.querySelector('#battle-wave-hud'),
    touchPad = document.querySelector('#battle-touch-pad'), turnLabel = document.querySelector('#battle-turn');
  const held = new Set(), AW = 420, AH = 190;
  const patterns = [
    {name:'잿비 · 역류',seconds:10,hint:'아래에서 되솟는 탄환도 살펴보자. 움직이는 빈틈을 따라 피한다.'},
    {name:'사냥꾼의 발톱',seconds:11,hint:'노란 예고선은 곧 발톱이 된다. 교차점에서 멀어지자.'},
    {name:'균열의 나선',seconds:12,hint:'휘어지는 탄환과 옆에서 날아오는 침. 넓은 틈으로 빠져나가자.'},
    {name:'포식의 결계',seconds:6.8,hint:'결계의 마력이 몸을 짓누른다. 끝까지 버텨야 한다.'},
  ];
  let state = null, request = 0, previous = 0;
  const clamp = (n, lo = 0, hi = 1) => Math.max(lo, Math.min(hi, n));
  const ease = n => { n = clamp(n); return n * n * (3 - 2 * n); };
  const motion = () => state?.motion && !document.body.classList.contains('no-motion') && !matchMedia('(prefers-reduced-motion: reduce)').matches;
  const cinematic = () => ['lastStrike','arrow','impact','dissolve','won'].includes(state?.stage);
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
    const choosing = ['command','info','items'].includes(kind), dodging = ['dodge','desperation'].includes(kind);
    root.dataset.choosing = String(choosing); root.dataset.cinematic = String(cinematic());
    commands.hidden = kind !== 'command'; items.hidden = kind !== 'items'; back.hidden = !['info','items'].includes(kind);
    buttons.forEach(b => b.disabled = kind !== 'command');
    next.hidden = !['info','won'].includes(kind);
    next.textContent = kind === 'info' ? 'E · 돌아가기' : 'E · 카니아에게';
    waveHud.hidden = !['telegraph','dodge','waveEnd','overload','desperation'].includes(kind);
    touchPad.hidden = !dodging;
    touchPad.querySelectorAll('button').forEach(b => b.disabled = !dodging);
    turnLabel.textContent = ['overload','desperation'].includes(kind) ? '중급 마족 · 폭주' : choosing ? `내 차례 · ${state.turn + 1}` : ['telegraph','dodge','waveEnd','overload','desperation'].includes(kind) ? `적의 차례 · ${state.turn}` : '';
    document.querySelector('#battle-hint').textContent = dodging
      ? 'WASD / 방향키 이동 · Shift 천천히 · 터치: 회피 상자를 드래그'
      : choosing ? '↑ ↓ 선택 · E 결정 · 1 / 2 / 3 · Esc 돌아가기' : '성역 숲길 · 균열의 추적자';
    document.querySelector('#battle-cinematic-caption').hidden = kind !== 'intro';
    if (line) say(line);
    if (!dodging) clearInput();
    health();
    if (kind === 'won') next.focus({preventScroll:true});
    if (dodging) { canvas.tabIndex = -1; canvas.focus({preventScroll:true}); }
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
    stage('command', line || (state.turn ? '숨을 고른다. 마족의 다음 움직임을 살펴보자.' : '수풀에서 튀어나온 중급 마족이 숲길을 가로막았다.'));
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
  function bullet(x,y,vx,vy,r=4,kind='ember',curve=0){state.bullets.push({x,y,vx,vy,r,kind,curve,age:0,trail:[]});}
  function slash(ax,ay,bx,by,delay=.78,width=12){state.warnings.push({ax,ay,bx,by,delay,width,age:0,duration:.24});}
  function emit(index) {
    if(state.pattern===0){
      const gap=78+(Math.sin(index*.66)*.5+.5)*264;
      for(let x=9;x<AW;x+=19)if(Math.abs(x-gap)>34)bullet(x,-13,Math.sin(index*.6)*9,100+index%3*8,4.2);
      if(state.age>3.5&&index%2===0){const gap2=AW-gap;for(let x=18;x<AW;x+=34)if(Math.abs(x-gap2)>43)bullet(x,AH+13,0,-82,3.5,'needle');}
    }else if(state.pattern===1){
      const {x,y}=state.soul;
      if(index%3===2){slash(-20,y-110,AW+20,y+110,.82,11);slash(-20,y+110,AW+20,y-110,1.08,11);}
      else {slash(x,-20,x,AH+20,.74,13);slash(-20,y,AW+20,y,1.03,12);}
      if(index%2===0)for(let i=0;i<5;i++)bullet(index%4?AW+12:-12,24+i*34,index%4?-84:84,0,3.5,'shard');
    }else if(state.pattern===2){
      const x=80+(Math.sin(index*.9)*.5+.5)*260,gap=index%9;
      for(let i=0;i<13;i++)if(Math.abs(i-gap)>1){const a=.20+i*(Math.PI-.4)/12;bullet(x,-17,Math.cos(a)*108,Math.sin(a)*108,4,'shard',index%2?.16:-.16);}
      if(index%2===1){const from=index%4===1?-12:AW+12,yy=45+index*17%100,angle=Math.atan2(state.soul.y-yy,state.soul.x-from);
        for(let i=-2;i<=2;i++){const a=angle+i*.2;bullet(from,yy,Math.cos(a)*91,Math.sin(a)*91,3.8,'needle');}}
    }else{
      const gap=AW/2+Math.sin(index*.75)*80;
      for(let x=8;x<AW;x+=18)if(Math.abs(x-gap)>27)bullet(x,-10,Math.sin(index)*13,136,4,'ember');
      if(index%2===0){const a=Math.atan2(state.soul.y-AH/2,state.soul.x-AW/2);for(let i=-3;i<=3;i++){const angle=a+i*.3;bullet(AW/2,AH/2,Math.cos(angle)*67,Math.sin(angle)*67,3.3,'shard');}}
    }
  }
  function distanceToSlash(x,y,s){const dx=s.bx-s.ax,dy=s.by-s.ay,t=clamp(((x-s.ax)*dx+(y-s.ay)*dy)/(dx*dx+dy*dy));return Math.hypot(x-s.ax-dx*t,y-s.ay-dy*t);}
  function hurt(amount,pressure=false){
    if(!pressure&&state.invincible>0)return;
    const wouldFall=state.hp-amount<=1;
    state.hp=Math.max(1,state.hp-amount);state.hitsThisWave++;state.invincible=pressure?.48:.66;state.hurtAt=state.elapsed;
    gameAudio.sfx('hurt');health();
    if(wouldFall&&state.stage==='dodge')beginDesperation(true);
  }
  function beginDesperation(critical=false){
    state.critical=critical;state.pattern=3;state.bullets=[];state.warnings=[];state.pointer=null;state.spawn=0;state.pulses=0;state.pressureAt=-10;
    gameAudio.sfx('charge');
    document.querySelector('#battle-pattern-name').textContent=patterns[3].name;
    stage('overload','붉은 결계가 발목을 붙든다. 마력이 직접 몸을 짓누른다……!');
  }
  function dodge(dt) {
    const left=held.has('ArrowLeft')||held.has('KeyA'),right=held.has('ArrowRight')||held.has('KeyD'),
      up=held.has('ArrowUp')||held.has('KeyW'),down=held.has('ArrowDown')||held.has('KeyS'),
      dx=Number(right)-Number(left),dy=Number(down)-Number(up),speed=held.has('ShiftLeft')||held.has('ShiftRight')?77:150,length=Math.hypot(dx,dy)||1;
    if(state.pointer){const x=state.pointer.x-state.soul.x,y=state.pointer.y-state.soul.y,distance=Math.hypot(x,y);if(distance>1){const move=Math.min(distance,speed*dt);state.soul.x+=x/distance*move;state.soul.y+=y/distance*move;}}
    else{state.soul.x+=dx/length*speed*dt;state.soul.y+=dy/length*speed*dt;}
    state.soul.x=clamp(state.soul.x,8,AW-8);state.soul.y=clamp(state.soul.y,8,AH-8);state.invincible=Math.max(0,state.invincible-dt);
    const final=state.stage==='desperation',duration=final?(state.critical?2.3:6.8):patterns[state.pattern].seconds,
      cadence=[.68,.98,.80,.47][state.pattern];
    if(state.age<duration-1.0&&state.age>=state.spawn*cadence+.28)emit(state.spawn++);
    for(const warning of state.warnings){
      warning.age+=dt;
      if(warning.age>=warning.delay&&warning.age<warning.delay+warning.duration&&distanceToSlash(state.soul.x,state.soul.y,warning)<warning.width/2+4)hurt(4);
      if(state.stage!=='dodge'&&state.stage!=='desperation')return;
    }
    state.warnings=state.warnings.filter(s=>s.age<s.delay+s.duration+.3);
    for(const b of state.bullets){
      if(b.curve){const a=b.curve*dt,cs=Math.cos(a),sn=Math.sin(a),vx=b.vx;b.vx=vx*cs-b.vy*sn;b.vy=vx*sn+b.vy*cs;}
      b.trail.push({x:b.x,y:b.y});if(b.trail.length>5)b.trail.shift();b.x+=b.vx*dt;b.y+=b.vy*dt;b.age+=dt;
      if(Math.hypot(b.x-state.soul.x,b.y-state.soul.y)<b.r+4)hurt(3);
      if(state.stage!=='dodge'&&state.stage!=='desperation')return;
    }
    state.bullets=state.bullets.filter(b=>b.x>-40&&b.x<AW+40&&b.y>-40&&b.y<AH+40);
    if(final&&!state.critical&&state.pulses<5&&state.age>=1.2+state.pulses*1.0){
      // The boss's enclosing curse is a visible story attack, separate from dodgeable shots.
      const damage=Math.ceil((state.hp-1)/(5-state.pulses));state.pulses++;state.pressureAt=state.age;hurt(damage,true);
      say(state.pulses===5?'HP 1. 결계가 닫힌다. 마지막 발톱이 눈앞까지 다가온다――!':'결계의 압박이 거세진다. 탄환 사이에서 어떻게든 버틴다……!');
    }
    const remaining=Math.max(0,duration-state.age);
    document.querySelector('#battle-wave-time').textContent=final?'버텨라':`${remaining.toFixed(1)}초`;
    document.querySelector('#battle-wave-bar').style.width=remaining/duration*100+'%';
    if(state.age>=duration){
      state.bullets=[];state.warnings=[];
      if(final){state.hp=1;health();stage('lastStrike','마지막 일격이 내려온다――!');}
      else stage('waveEnd',state.hitsThisWave?'공격이 잦아들었다. 숨을 고르고 다시 검을 든다.':'탄막을 빠져나왔다! 마족이 더 거칠게 날개를 펼친다.');
    }
  }
  function update(dt){
    if(!state)return;state.age+=dt;state.elapsed+=dt;const age=state.age;
    if(state.stage==='intro'){
      const cut=motion()?age:age*1.8;
      const caption=cut<1.65?'숲의 소리가 갑자기 멎었다.':cut<2.6?'왼편 수풀에서, 무언가가 움직였다.':cut<4.1?'붉은 형체가 수풀을 찢고 덮쳐왔다!':'중급 마족 · 균열의 추적자';
      document.querySelector('#battle-cinematic-caption').textContent=caption;
      if(cut>=2.58&&!state.ambushSound){state.ambushSound=true;gameAudio.scene('battle');gameAudio.sfx('battleStart');gameAudio.sfx('demon');}
      if(cut>=5.6){root.dataset.ready='true';command();}
    }else if(state.stage==='attack'){
      if(age>=.4&&!state.struck){state.struck=true;state.enemyHp=Math.max(1,state.enemyHp-state.damage);health();gameAudio.sfx('sword');say(state.reaction==='guard'?`교차한 발톱이 검을 막았다. 갑각에 ${state.damage} 피해!`:state.reaction==='dodge'?`마족이 몸을 틀었다. 날개를 스쳐 ${state.damage} 피해!`:`갑각의 틈을 베었다! ${state.damage} 피해.`);}
      if(age>=1.35)enemyTurn();
    }else if(state.stage==='healing'&&age>=1.4)enemyTurn();
    else if(state.stage==='telegraph'&&age>=1.6)stage('dodge',patterns[state.pattern].hint);
    else if(['dodge','desperation'].includes(state.stage))dodge(dt);
    else if(state.stage==='waveEnd'&&age>=1.15){if(state.turn>=3)beginDesperation();else command();}
    else if(state.stage==='overload'&&age>=1.5){state.spawn=0;state.soul={x:AW/2,y:AH*.72};state.invincible=.5;stage('desperation','결계 안에 갇혔다. 공격을 피하며 버텨야 한다……!');}
    else if(state.stage==='lastStrike'&&age>=.48){gameAudio.sfx('arrow');stage('arrow','――탁!');}
    else if(state.stage==='arrow'&&age>=.18){state.rescued=true;state.enemyHp=0;health();gameAudio.sfx('arrowHit');stage('impact','어디선가 날아온 화살이 마족의 이마에 박혔다!');}
    else if(state.stage==='impact'&&age>=.7)stage('dissolve','마족의 마력이 흩어진다. 숲이 다시 조용해졌다.');
    else if(state.stage==='dissolve'&&age>=2.2){gameAudio.scene('grove');gameAudio.sfx('rescued');stage('won','가까스로 숨을 내쉰다.\n등 뒤에서 익숙한 목소리가 들려왔다. “괜찮아?”');}
  }
  function layout() {
    const w = canvas.width, h = canvas.height, portrait = h > w * 1.1, short = h < 430 && !portrait,
      bw = portrait ? w * .86 : Math.min(w * .61, h * 1.14), bh = bw * AH / AW;
    return { w,h,portrait,short,box:{x:(portrait ? w*.5 : w*.37)-bw/2,y:h*(short?.34:.43),w:bw,h:bh} };
  }
  function enemyPosition() {
    const {w,h,portrait,short} = layout(),
      wave = ['telegraph','dodge','waveEnd','overload','desperation'].includes(state.stage),
      blend = state.stage === 'telegraph' ? ease(state.age / 1.2) : wave ? 1 : 0;
    const target = { x:w*(portrait ? .3 + .2*blend : .36), ground:h*(portrait ? .53-.15*blend : short ? .66-.32*blend : .61-.21*blend),
      height:h*(portrait ? .32-.10*blend : short ? .53-.28*blend : .48-.18*blend) };
    if(['lastStrike','arrow','impact'].includes(state.stage))target.height*=1.12;
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
    // Tree silhouettes and a dim patch of the actual ambush forest persist in battle.
    c.save();c.globalAlpha=.08;const forest=state.pictures.forestAmbush;
    c.drawImage(forest,0,0,forest.naturalWidth,forest.naturalHeight,0,0,w,h*.65);c.restore();
    c.save();c.globalAlpha=.35;
    for(let side=-1;side<=1;side+=2)for(let i=0;i<5;i++){
      const x=side<0?i*w*.055:w*(.74+i*.065),lean=side*w*.025;
      polygon([[x,horizon],[x+lean,h*.14],[x-w*.016,0],[x+w*.02,0],[x+w*.04,horizon]],'#1c3835');
      c.strokeStyle='#45614b';c.lineWidth=1;c.beginPath();c.moveTo(x+lean,h*.2);c.lineTo(x+side*w*.08,h*.06);c.stroke();
    }c.restore();
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
    } else if(['telegraph','overload'].includes(kind)) frame=1;
    else if(['lastStrike','arrow'].includes(kind))frame=2;
    else if(['dodge','desperation'].includes(kind)) frame=Math.sin(age*3)>.3?2:1;
    else if(['impact','dissolve'].includes(kind)) {
      frame=kind==='impact'?(age<.10?2:6):7;
      if(kind==='dissolve') {alpha=1-ease((age-.35)/1.8);ground+=age*8;}
    } else if(['won'].includes(kind)) alpha=0;

    c.save();
    c.globalAlpha=alpha;c.fillStyle='#000a';c.beginPath();c.ellipse(x,ground+4,height*.43,height*.045,0,0,Math.PI*2);c.fill();c.globalAlpha=1;
    const bob=motion()&&!['impact','dissolve'].includes(kind)?Math.sin(state.elapsed*2)*height*.004:0;
    if (state.lastFrame !== frame) { state.previousFrame = state.lastFrame ?? frame; state.lastFrame = frame; state.poseAt = state.elapsed; }
    const poseBlend = kind==='impact' ? 1 : motion() ? ease((state.elapsed - state.poseAt) / .16) : 1;
    if (poseBlend < 1) pixelAtlases.draw(c,state.enemy,state.previousFrame,x,ground+bob,height,alpha*(1-poseBlend));
    pixelAtlases.draw(c,state.enemy,frame,x,ground+bob,height,alpha*poseBlend);
    if(kind==='attack'&&age>.4&&age<1.15) {
      const progress=clamp((age-.4)/.6);c.globalAlpha=1-ease((age-.8)/.35);c.strokeStyle='#fff5c9';c.lineWidth=4;
      c.beginPath();c.moveTo(x-height*.28,ground-height*.66);c.lineTo(x+height*.29*progress,ground-height*.26*progress-height*.4);c.stroke();
      c.fillStyle=state.reaction==='guard'?'#d5d8e2':'#ffe78f';c.font=`bold ${Math.max(24,height*.13)}px Galmuri,monospace`;c.textAlign='center';c.fillText(state.damage,x,ground-height*.73-progress*22);c.textAlign='left';
    }
    c.restore();
    if(['overload','lastStrike'].includes(kind)) {
      c.save();c.strokeStyle='#ff597c';c.globalAlpha=.45;c.lineWidth=2;
      const r=height*(.25+Math.sin(state.elapsed*2)*.015);
      c.beginPath();c.ellipse(x,ground-height*.48,r,r*.5,0,0,Math.PI*2);c.stroke();
      for(let i=0;i<8;i++){const a=i*Math.PI/4-state.elapsed*.4;c.fillStyle='#f06b8f';c.fillRect(x+Math.cos(a)*r,ground-height*.48+Math.sin(a)*r*.5,3,3);}
      c.restore();
    }
    if(['impact','dissolve'].includes(kind)) {
      const t=kind==='impact'?age*.2:.15+age;
      c.save();c.globalAlpha=1-ease(t/2.8);
      for(let i=0;i<42;i++){const a=i*2.399,dist=t*(22+i%6*8);c.fillStyle=i%3?'#eb3b6a':'#fff3ba';c.fillRect(x+Math.cos(a)*dist,ground-height*.60+Math.sin(a)*dist+t*t*17,2+i%3,2+i%3);}
      if(kind==='impact'){c.strokeStyle='#fff1b5';c.lineWidth=3;for(let i=0;i<8;i++){const a=i*Math.PI/4;c.beginPath();c.moveTo(x+Math.cos(a)*13,ground-height*.60+Math.sin(a)*13);c.lineTo(x+Math.cos(a)*(28+age*24),ground-height*.60+Math.sin(a)*(28+age*24));c.stroke();}}
      c.restore();
    }
  }
  function drawHands() {
    if(cinematic()||['dodge','telegraph','waveEnd','overload','desperation'].includes(state.stage))return;
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
    if(!['telegraph','dodge','waveEnd','overload','desperation'].includes(state.stage))return;
    const {box}=layout(), appearing=state.stage==='telegraph'?ease(state.age/.65):1;
    c.save();c.translate(box.x+box.w/2,box.y+box.h/2);c.scale(appearing,appearing);c.translate(-box.w/2,-box.h/2);
    polygon([[-5,3],[box.w*.22,-3],[box.w*.49,1],[box.w*.78,-2],[box.w+4,1],[box.w+2,box.h*.48],[box.w+5,box.h-1],[box.w*.67,box.h+4],[box.w*.32,box.h+1],[-3,box.h+3],[-1,box.h*.52]],'#020609','#f3e9dc',3);
    c.strokeStyle='#92394e';c.lineWidth=1;c.strokeRect(-9,-8,box.w+18,box.h+16);
    c.save();c.beginPath();c.rect(0,0,box.w,box.h);c.clip();c.scale(box.w/AW,box.h/AH);
    c.strokeStyle='#25303b';c.lineWidth=.7;
    for(let x=0;x<AW;x+=30){c.beginPath();c.moveTo(x,0);c.lineTo(x,AH);c.stroke();}
    for(let y=0;y<AH;y+=30){c.beginPath();c.moveTo(0,y);c.lineTo(AW,y);c.stroke();}
    for(const warning of state.warnings){
      const active=warning.age>=warning.delay&&warning.age<warning.delay+warning.duration,
        fade=warning.age>warning.delay+warning.duration?1-clamp((warning.age-warning.delay-warning.duration)/.3):1;
      c.save();c.globalAlpha=fade;c.strokeStyle=active?'#fff1d3':'#ddb979';c.lineWidth=active?warning.width:1.4;c.setLineDash(active?[]:[7,5]);
      c.beginPath();c.moveTo(warning.ax,warning.ay);c.lineTo(warning.bx,warning.by);c.stroke();
      if(active){c.strokeStyle='#ee426e';c.lineWidth=warning.width+7;c.globalAlpha=.3;c.stroke();}
      c.restore();
    }
    for(const b of state.bullets){
      if(b.trail?.length){c.save();c.globalAlpha=.17;c.strokeStyle=b.kind==='needle'?'#a5c2f6':'#ed5c85';c.lineWidth=3;c.beginPath();b.trail.forEach((p,i)=>i?c.lineTo(p.x,p.y):c.moveTo(p.x,p.y));c.stroke();c.restore();}
      c.save();c.translate(b.x,b.y);c.rotate(Math.atan2(b.vy,b.vx)-Math.PI/2);
      if(b.kind==='ember'){polygon([[0,-7],[5,0],[0,7],[-5,0]],'#e74e70');c.fillStyle='#ffd7bc';c.fillRect(-1,-2,2,4);}
      else if(b.kind==='needle'){polygon([[0,-9],[3,3],[0,7],[-3,3]],'#bdd5ff','#5b88d6',.7);}
      else polygon([[0,-8],[5,5],[0,3],[-5,5]],'#f5b9ce','#eb547a',1);
      c.restore();
    }
    if(state.stage==='desperation'){
      const period=state.critical?.65:1,next=(state.age-(state.critical?0:.2))%period,
        pulse=ease(clamp(next/period));
      c.save();c.strokeStyle='#f05d86';c.globalAlpha=.28+.3*pulse;c.lineWidth=2;
      c.strokeRect(4+pulse*22,4+pulse*10,AW-8-pulse*44,AH-8-pulse*20);
      const t=state.age-state.pressureAt;
      if(t>=0&&t<.45){c.globalAlpha=(1-t/.45)*.22;c.fillStyle='#e73466';c.fillRect(0,0,AW,AH);}
      for(let i=0;i<10;i++){const xx=i*AW/9,yy=i%2?AH-7:7;polygon([[xx-4,yy],[xx,yy-4],[xx+4,yy],[xx,yy+4]],'#cf5674');}
      c.restore();
    }
    if(state.stage!=='waveEnd'){
      const {x,y}=state.soul;
      c.save();c.globalAlpha=state.invincible>0?.45+.3*Math.sin(state.elapsed*30):1;
      polygon([[x,y-9],[x+7,y],[x,y+9],[x-7,y]],'#a8ffd2','#eafff1',1);
      c.fillStyle='#ffffff';c.fillRect(x-2,y-2,4,4);c.restore();
    }
    c.restore();c.restore();
  }
  function intro(){
    const {w,h}=layout(),age=motion()?state.age:state.age*1.8,
      bandH=Math.min(h*.76,w*.56),top=(h-bandH)/2-h*.03,
      blend=ease((age-3.9)/1.7),open=ease(age/.65),art=state.pictures.forestAmbush,
      cover=Math.max(w/art.naturalWidth,bandH/art.naturalHeight),aw=art.naturalWidth*cover,ah=art.naturalHeight*cover,
      left=(w-aw)/2,ay=top+(bandH-ah)/2;
    backdrop();
    c.save();c.globalAlpha=1-blend;c.beginPath();c.rect(0,top,w,bandH);c.clip();
    c.drawImage(art,left,ay,aw,ah);c.fillStyle='#06161835';c.fillRect(0,top,w,bandH);
    const rustle=clamp((age-1.65)/.9);
    if(age>1.65&&age<2.65){
      const eyesX=w*.23+Math.sin(age*14)*rustle*2,eyesY=top+bandH*.59;
      c.fillStyle='#f55d76';c.fillRect(eyesX-9,eyesY,5,2);c.fillRect(eyesX+6,eyesY-1,5,2);
      for(let i=0;i<10;i++){const xx=w*(.08+i*.023)+Math.sin(age*12+i)*rustle*8,yy=top+bandH*(.7+(i%3)*.04);polygon([[xx,yy],[xx+12,yy-8],[xx+21,yy],[xx+7,yy+3]],i%2?'#32613d':'#5b864d');}
    }
    c.restore();
    if(age<.7){
      c.save();c.globalAlpha=1-ease(age/.7);
      const initial=state.initialView,s=initial.scale*w;
      c.drawImage(state.snapshot,initial.x*w-360*s,initial.y*h-240*s,720*s,480*s);c.restore();
    }
    if(age>=2.6){
      const lunge=ease((age-2.6)/.48),land=ease((age-3.08)/.5),target=enemyPosition(),
        x=w*(.12+.42*lunge),ground=top+bandH*.94-Math.sin(lunge*Math.PI)*bandH*.25,
        height=bandH*(.56+.26*lunge),px=x+(target.x-x)*blend,py=ground+(target.ground-ground)*blend,
        ph=height+(target.height-height)*blend;
      c.save();
      if(blend<.01){c.beginPath();c.rect(0,top,w,bandH);c.clip();}
      if(motion()&&age>3.08&&age<3.35)c.translate(Math.sin(age*75)*3*(1-land),0);
      c.fillStyle='#02080ab0';c.beginPath();c.ellipse(px,py+2,ph*.37,ph*.04,0,0,Math.PI*2);c.fill();
      pixelAtlases.draw(c,state.enemy,age<3.12?2:0,px,py,ph);
      // The left trunk occludes the monster until it clears the bushes.
      if(age<2.94){c.save();c.beginPath();c.beginPath();[[0,top],[w*.19,top],[w*.22,top+bandH*.18],[w*.20,top+bandH*.35],[w*.235,top+bandH*.53],[w*.21,top+bandH*.65],[w*.30,top+bandH*.82],[w*.34,top+bandH],[0,top+bandH]].forEach(([xx,yy],i)=>i?c.lineTo(xx,yy):c.moveTo(xx,yy));c.closePath();c.clip();c.drawImage(art,left,ay,aw,ah);c.restore();}
      if(age<3.65){const t=clamp((age-2.6)/1.05);c.globalAlpha=1-t;
        for(let i=0;i<26;i++){const a=i*2.399,xx=w*.25+Math.cos(a)*t*w*.2,yy=top+bandH*.72+Math.sin(a)*t*bandH*.25+t*t*35;c.fillStyle=i%3?'#76984e':'#c4c880';c.fillRect(xx,yy,3+i%3,2);}}
      c.restore();
    }
    // Letterbox bars close first and open into the battle without a hard cut.
    c.fillStyle='#020306';const bar=top*open*(1-blend);c.fillRect(0,0,w,Math.max(0,bar));
    const bottom=top+bandH;c.fillRect(0,h-(h-bottom)*open*(1-blend),w,(h-bottom)*open*(1-blend)+1);
  }
  function rescueScene(){
    if(!['arrow','impact'].includes(state.stage))return;
    const age=state.age;if(state.stage==='impact'&&age>.14)return;
    const {w,h}=layout(),enemy=enemyPosition(),target={x:enemy.x,y:enemy.ground-enemy.height*.60},
      start={x:w+70,y:h*.15},t=state.stage==='impact'?1:clamp(age/.18),
      x=start.x+(target.x-start.x)*t,y=start.y+(target.y-start.y)*t;
    c.save();c.translate(x,y);c.rotate(Math.atan2(target.y-start.y,target.x-start.x));
    c.strokeStyle='#e4f1bd';c.lineWidth=2;c.beginPath();c.moveTo(-155,0);c.lineTo(-38,0);c.stroke();
    c.fillStyle='#c1b899';c.fillRect(-45,-1,42,2);polygon([[3,0],[-10,-4],[-8,4]],'#fff3d5');polygon([[-35,0],[-48,-6],[-44,0],[-49,6]],'#b5d597');c.restore();
  }
  function draw() {
    if(!state)return;
    c.imageSmoothingEnabled=false;
    if(state.stage==='intro'){intro();return;}
    backdrop();drawEnemy();drawHands();drawArena();rescueScene();
    if(['overload','lastStrike'].includes(state.stage)){
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
      enemy:pixelAtlases.make(options.pictures.demonActions,4,2)};
    root.hidden=false;delete root.dataset.ready;document.querySelector('#battle-player-name').textContent=options.name;
    items.replaceChildren();stage('intro','');fit();
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
    if(['dodge','desperation'].includes(state.stage)&&moving.includes(code)){held.add(code);state.pointer=null;return true;}
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
    if(!['dodge','desperation'].includes(state?.stage))return;const p=point(event);
    if(p.x<0||p.y<0||p.x>p.box.w||p.y>p.box.h)return;
    canvas.setPointerCapture(event.pointerId);held.clear();state.pointer={x:p.x/p.box.w*AW,y:p.y/p.box.h*AH};event.preventDefault();
  });
  canvas.addEventListener('pointermove',event=>{if(!['dodge','desperation'].includes(state?.stage)||!canvas.hasPointerCapture(event.pointerId))return;const p=point(event);state.pointer={x:clamp(p.x/p.box.w,0,1)*AW,y:clamp(p.y/p.box.h,0,1)*AH};});
  const pointerEnd=()=>{if(state)state.pointer=null;};canvas.addEventListener('pointerup',pointerEnd);canvas.addEventListener('pointercancel',pointerEnd);canvas.addEventListener('lostpointercapture',pointerEnd);
  touchPad.querySelectorAll('button').forEach(b=>{
    b.addEventListener('pointerdown',e=>{if(!['dodge','desperation'].includes(state?.stage))return;b.setPointerCapture(e.pointerId);held.add(b.dataset.dodge);state.pointer=null;b.classList.add('is-held');e.preventDefault();});
    for(const name of ['pointerup','pointercancel','lostpointercapture'])b.addEventListener(name,()=>{held.delete(b.dataset.dodge);b.classList.remove('is-held');});
  });
  new ResizeObserver(fit).observe(document.querySelector('#game-screen'));
  return {prepare,play,stop,handle,release,clearInput,get active(){return !!state;},getState(){return state?{stage:state.stage,hp:state.hp,enemyHp:state.enemyHp,turn:state.turn,rescued:state.rescued,pattern:patterns[state.pattern]?.name,projectiles:state.bullets.length,warnings:state.warnings.length,soul:{...state.soul},invincible:state.invincible,age:state.age}:null;}};
})();
