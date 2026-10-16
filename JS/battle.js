// One story encounter: first-person commands, timing checks and Kania's rescue.
const battleScenes = (() => {
  const root = document.querySelector("#battle-screen"),
    canvas = document.querySelector("#battle-art"), c = canvas.getContext("2d"),
    text = document.querySelector("#battle-message"),
    commands = document.querySelector("#battle-commands"),
    buttons = [...root.querySelectorAll("[data-battle-command]")],
    items = document.querySelector("#battle-item-list"),
    back = document.querySelector("#battle-back"),
    next = document.querySelector("#battle-continue"),
    timing = document.querySelector("#battle-timing"),
    timingButton = document.querySelector("#battle-timing-button");
  let state = null, request = 0, previous = 0;
  const clamp = (n) => Math.max(0, Math.min(1, n));
  const animated = () => state?.motion && !document.body.classList.contains("no-motion") &&
    !matchMedia("(prefers-reduced-motion: reduce)").matches;
  function polygon(ctx, points, color) {
    ctx.fillStyle = color;
    ctx.beginPath();
    points.forEach(([x, y], i) => i ? ctx.lineTo(Math.round(x), Math.round(y)) : ctx.moveTo(Math.round(x), Math.round(y)));
    ctx.closePath(); ctx.fill();
  }
  function makeEnemy() {
    const art = document.createElement("canvas"); art.width = 128; art.height = 180;
    const p = art.getContext("2d", { willReadFrequently: true });
    const poly = (points, color) => polygon(p, points, color);
    // Original pixel silhouette: split horns, stone skull, broken violet armour.
    poly([[31,44],[14,54],[7,93],[0,133],[20,122],[13,159],[37,143],[46,173],[56,151],[78,177],[88,148],[114,159],[107,123],[127,137],[117,82],[112,52],[94,42]], "#11151f");
    poly([[39,68],[27,95],[22,137],[34,131],[31,149],[48,132],[57,156],[65,133],[80,161],[85,133],[104,148],[97,122],[109,130],[101,76]], "#342d49");
    poly([[37,111],[53,116],[53,157],[44,173],[25,173],[31,161]], "#a8a7a3");
    poly([[74,115],[91,109],[95,159],[106,174],[84,174],[77,157]], "#9396a0");
    poly([[39,125],[46,126],[43,155],[37,162],[32,162]], "#535461");
    poly([[82,124],[89,119],[91,155],[98,165],[88,165]], "#454553");
    poly([[26,165],[45,163],[44,175],[20,176],[20,171]], "#c4c6bc");
    poly([[84,166],[100,165],[109,174],[109,178],[84,177]], "#b6bbae");
    poly([[34,55],[52,43],[80,43],[98,56],[88,100],[77,123],[50,122],[39,99]], "#aaa4ad");
    poly([[42,61],[54,51],[63,69],[71,51],[89,61],[83,89],[70,104],[53,96]], "#585268");
    poly([[42,65],[61,76],[51,79],[42,74]], "#d8d6c8");
    poly([[87,65],[69,76],[78,80],[88,73]], "#c6c8bf");
    poly([[60,81],[67,75],[74,84],[69,111],[60,111]], "#bb79b4");
    poly([[61,84],[66,81],[69,88],[66,101],[63,99]], "#e5b2cc");
    poly([[46,102],[61,111],[79,104],[83,118],[70,125],[51,120]], "#443b56");
    poly([[44,48],[28,44],[14,49],[20,37],[7,33],[11,53],[5,65],[15,82],[34,77],[43,63]], "#cccdc2");
    poly([[83,48],[102,43],[113,48],[110,35],[122,30],[120,53],[126,65],[112,81],[94,76],[85,62]], "#bfc4bb");
    poly([[17,56],[29,51],[37,58],[32,68],[17,73],[12,65]], "#6a6a77");
    poly([[94,56],[105,51],[117,58],[118,68],[106,73],[96,66]], "#626775");
    poly([[15,77],[28,78],[26,105],[18,126],[7,122],[9,102]], "#9295a0");
    poly([[102,78],[115,77],[119,103],[122,122],[111,127],[103,105]], "#9398a4");
    poly([[8,117],[18,119],[22,134],[15,143],[16,131],[12,129],[8,142],[4,136],[5,124]], "#d0d3c4");
    poly([[111,119],[121,117],[125,125],[126,138],[121,142],[119,129],[115,132],[116,143],[109,135]], "#c9cfc0");
    poly([[43,18],[33,14],[24,0],[27,24],[43,33]], "#d4d2ba");
    poly([[82,18],[96,12],[105,0],[101,25],[85,33]], "#e0dac0");
    poly([[49,13],[75,13],[89,27],[85,47],[74,57],[53,57],[39,42],[40,25]], "#d9d8c5");
    poly([[46,22],[54,17],[60,28],[56,36],[42,33]], "#a1a4a0");
    poly([[76,18],[84,27],[85,34],[71,37],[65,29]], "#a4aaa3");
    poly([[43,32],[58,35],[57,41],[45,39]], "#202333");
    poly([[69,35],[85,31],[81,39],[70,42]], "#202333");
    p.fillStyle = "#f496c2"; p.fillRect(47,35,8,2); p.fillRect(73,35,7,2);
    poly([[62,31],[66,35],[68,45],[63,48],[58,44]], "#777e81");
    poly([[49,45],[58,48],[68,49],[80,43],[76,53],[68,58],[55,54]], "#30313e");
    p.fillStyle = "#f0ebcf"; [54,60,66,72].forEach(x => p.fillRect(x,49,2,5));
    poly([[59,14],[64,19],[61,25],[65,30],[62,34]], "#59596b");
    const data = p.getImageData(0,0,128,180);
    for (let i=3;i<data.data.length;i+=4) data.data[i] = data.data[i] > 128 ? 255 : 0;
    p.putImageData(data,0,0); return art;
  }
  const enemy = makeEnemy();
  function say(message) { if (text.textContent !== message) text.textContent = message; }
  function health() {
    document.querySelector("#battle-hp-text").textContent = `HP ${state.hp} / 24`;
    const bar = document.querySelector("#battle-hp-bar");
    bar.style.width = state.hp / 24 * 100 + "%";
    bar.style.background = state.hp <= 6 ? "#df806b" : "#e6da7b";
    document.querySelector("#battle-enemy-bar").style.width = state.enemyHp / 96 * 100 + "%";
  }
  function stage(kind, message) {
    if (!state) return;
    state.stage = kind; state.age = 0; state.inputAfter = performance.now() + 130;
    root.dataset.state = kind;
    commands.hidden = ["items", "info"].includes(kind);
    items.hidden = kind !== "items";
    back.hidden = !["items", "info"].includes(kind);
    buttons.forEach(b => b.disabled = kind !== "command");
    timing.hidden = !["aim", "guard"].includes(kind);
    next.hidden = !["won", "info"].includes(kind);
    next.textContent = kind === "info" ? "E · 돌아가기" : "E · 카니아에게";
    timingButton.textContent = kind === "guard" ? "E · 방어" : "E · 검격 맞추기";
    document.querySelector("#battle-timing-zone").style.left = kind === "guard" ? "61%" : "43%";
    if (message) say(message);
    health();
    if (kind === "aim" || kind === "guard") timingButton.focus({preventScroll:true});
    if (kind === "won") next.focus({preventScroll:true});
  }
  function select(index, focus = false) {
    if (!state) return;
    const list = state.stage === "items" ? [...items.querySelectorAll("button"), back] : buttons;
    state.selection = (index + list.length) % list.length;
    list.forEach((b,i) => b.classList.toggle("is-selected", i === state.selection));
    if (focus) list[state.selection]?.focus({preventScroll:true});
  }
  function command(message) {
    if (!state) return;
    stage("command", message || (state.turn ? "단단한 갑각이 검날을 막는다. ……아직 물러설 기색이 없다." : "중급 마족이 길을 가로막았다."));
    state.selection = 0; select(0, true);
  }
  function choose(action) {
    if (!state || state.stage !== "command") return;
    gameAudio.sfx("confirm");
    if (action === "attack") {
      state.cursor = 0;
      stage("aim", "갑각의 틈을 겨눈다. 밝은 구간에서 검을 휘두르자.");
    } else if (action === "info") {
      stage("info", `균열의 추적자 · 중급 마족\n체력 ${state.enemyHp} / 96 · 높은 방어력\n단단한 갑각, 비정상적으로 응축된 마력.\n혼자 상대하기에는 위험하다. 뿔 아래의 균열이 눈에 띈다.`);
      next.focus({preventScroll:true});
    } else {
      stage("items", "전투에 사용할 소지품을 고르자.");
      items.replaceChildren();
      const stock = state.items();
      if (!stock.length) {
        const p = document.createElement("p"); p.textContent = "사용할 수 있는 회복 아이템이 없다."; items.append(p);
      }
      stock.forEach((item, index) => {
        const b = document.createElement("button"); b.type = "button";
        b.textContent = `${item.name} ×${item.count} · +${item.heal}`;
        b.addEventListener("click", () => use(item.id)); items.append(b);
        b.addEventListener("focus", () => { if (state?.stage === "items") select(index); });
      });
      select(0,true);
    }
  }
  function use(id) {
    if (state?.stage !== "items") return;
    const result = state.useItem(id, state.hp);
    if (!result.ok) { say(result.message); return; }
    state.hp = result.hp;
    gameAudio.sfx(id === "bread" ? "eat" : "drink");
    stage("healing", result.message);
  }
  function enemyTurn() {
    state.turn++;
    gameAudio.sfx("demon");
    stage("windup", state.turn >= 3 ? "마족이 검은 기운을 끌어모은다. 공기가 무겁게 가라앉는다." : "마족의 발톱이 다가온다. 방어할 틈을 노리자.");
  }
  function confirmTiming() {
    if (!state || !["aim","guard"].includes(state.stage) || performance.now() < state.inputAfter) return;
    const attacking = state.stage === "aim",
      quality = clamp(1 - Math.abs(state.cursor - (attacking ? .5 : .68)) * 3.4);
    if (attacking) {
      state.damage = 7 + Math.round(quality * 9);
      state.enemyHp = Math.max(1, state.enemyHp - state.damage);
      gameAudio.sfx("sword");
      stage("strike", `${quality > .8 ? "정확한 일격! " : "검날이 갑각을 스쳤다. "}피해 ${state.damage}.\n마족은 잠깐 비틀거릴 뿐이다.`);
    } else {
      const guarded = quality > .66,
        damage = guarded ? 2 : 7 + state.turn * 2;
      state.hp = Math.max(1, state.hp - damage);
      gameAudio.sfx(guarded ? "parry" : "hurt");
      stage("hurt", guarded ? `검을 세워 공격을 흘렸다. 피해 ${damage}.` : `발톱이 방어를 뚫었다! 피해 ${damage}.\n${state.hp <= 6 ? "이대로는 오래 버틸 수 없다……." : "충격이 팔 전체를 타고 올라온다."}`);
    }
  }
  function update(dt) {
    if (!state) return;
    state.age += dt; state.elapsed += dt;
    if (state.stage === "intro" && state.age >= (animated() ? 1.65 : .45)) {
      root.dataset.ready = "true"; command();
    } else if (["aim","guard"].includes(state.stage)) {
      state.cursor = animated() ? clamp(state.age / 1.65) : state.stage === "guard" ? .68 : .5;
      document.querySelector("#battle-timing-cursor").style.left = state.cursor * 99 + "%";
      if (state.age >= 1.7) confirmTiming();
    } else if (state.stage === "strike" && state.age >= .7) enemyTurn();
    else if (state.stage === "healing" && state.age >= 1.0) enemyTurn();
    else if (state.stage === "windup" && state.age >= .8) {
      if (state.turn >= 3) {
        gameAudio.sfx("charge");
        stage("finisher", "검은 마력이 한곳으로 모인다. 피할 수 없다――!");
      } else { state.cursor = 0; stage("guard", "발톱이 시야를 가른다. 밝은 구간에서 E로 막아내자!"); }
    } else if (state.stage === "hurt" && state.age >= .95) command();
    else if (state.stage === "finisher" && state.age >= 1.35) {
      gameAudio.sfx("arrow"); stage("rescue", "어디선가 날카로운 파공음이 들려왔다.");
    } else if (state.stage === "rescue") {
      if (state.age >= .34 && !state.rescued) {
        state.rescued = true; state.enemyHp = 0; health();
        gameAudio.scene("grove");
        gameAudio.sfx("arrowHit");
        say("한 발의 화살이 마족의 이마를 꿰뚫었다!");
      }
      if (state.age >= 2.6) {
        gameAudio.sfx("rescued");
        stage("won", "마족의 기운이 흩어졌다.\n숲 저편에서, 익숙한 녹색 망토가 다가온다.");
      }
    }
  }
  function enemyPosition() {
    const w = canvas.width, h = canvas.height,
      scale = Math.min(w * .36 / 128, h * .45 / 180);
    return {x:w * .355, y:h * .615, scale};
  }
  function backdrop() {
    const w = canvas.width, h = canvas.height, horizon = h * .46;
    c.fillStyle = "#04080c"; c.fillRect(0,0,w,h);
    const glow = c.createRadialGradient(w*.36,h*.36,5,w*.36,h*.4,w*.55);
    glow.addColorStop(0,"#16352a"); glow.addColorStop(.6,"#08191a"); glow.addColorStop(1,"#030609");
    c.fillStyle = glow; c.fillRect(0,0,w,h);
    c.strokeStyle = "#375a47"; c.lineWidth = 1;
    const cx=w*.355, arch=h*.14, half=w*.19;
    c.beginPath(); c.moveTo(cx-half,horizon+20); c.lineTo(cx-half,arch+65);
    c.lineTo(cx-half*.65,arch+23); c.lineTo(cx,arch); c.lineTo(cx+half*.65,arch+23);
    c.lineTo(cx+half,arch+65); c.lineTo(cx+half,horizon+20); c.stroke();
    c.strokeStyle="#1f4134";
    for(let i=0;i<8;i++) {
      const x=cx-half-28-i*24;
      c.strokeRect(Math.round(x),Math.round(arch+70+i*9),12,Math.round(horizon-arch-30));
    }
    c.strokeStyle="#41674b";
    for(let i=-6;i<11;i++) { c.beginPath();c.moveTo(cx+i*w*.025,horizon);c.lineTo(cx+i*w*.22,h);c.stroke(); }
    const travel = animated() ? (state.elapsed * .15) % 1 : 0;
    for(let i=0;i<9;i++) {
      const p=(i+travel)/9, y=horizon+Math.pow(p,2.3)*(h-horizon);
      c.globalAlpha=.2+p*.35;c.beginPath();c.moveTo(0,Math.round(y));c.lineTo(w,Math.round(y));c.stroke();
    }
    c.globalAlpha=1;
    for(let i=0;i<20;i++) {
      const x=(i*97+41)%Math.max(1,w), y=(i*67+(animated()?state.elapsed*(i%3+1)*5:0))%(h*.65);
      c.fillStyle=i%4 ? "#54725c" : "#c6cd8d";c.fillRect(Math.round(x),Math.round(y),1+(i%2),1);
    }
    const shade=c.createLinearGradient(0,h*.62,0,h);shade.addColorStop(0,"#02070b00");shade.addColorStop(1,"#020408");c.fillStyle=shade;c.fillRect(0,h*.62,w,h*.38);
  }
  function drawEnemy() {
    const {x,y,scale}=enemyPosition(), age=state.age,
      bob=animated()?Math.round(Math.sin(state.elapsed*2.7)):0;
    c.save();c.translate(Math.round(x),Math.round(y));
    c.globalAlpha = state.stage === "won" ? 0 : state.stage === "rescue" ? 1-clamp((age-.7)/1.1) : 1;
    c.fillStyle="#020307aa";c.beginPath();c.ellipse(0,4,scale*63,scale*9,0,0,Math.PI*2);c.fill();
    if(state.stage==="rescue") {
      if(animated()) { c.translate(0,clamp((age-.5)/1.4)*27);c.rotate(-clamp((age-.35)/1.4)*.16); }
    }
    if(state.stage==="strike"&&animated())c.translate(Math.sin(age*35)*6*(1-clamp(age/.6)),0);
    c.drawImage(enemy,Math.round(-64*scale),Math.round(-180*scale+bob),Math.round(128*scale),Math.round(180*scale));
    if(state.stage==="strike"&&age<.35) {
      c.strokeStyle="#f6edb9";c.lineWidth=3;c.beginPath();c.moveTo(-30*scale,-128*scale);c.lineTo(32*scale,-75*scale);c.stroke();
      c.fillStyle="#f8edc9";c.font=`${Math.round(16*scale)}px monospace`;c.fillText(state.damage,-7*scale,-145*scale-age*20);
    }
    if(["windup","finisher"].includes(state.stage)) {
      c.strokeStyle=state.stage==="finisher"?"#c88ec9":"#825c8e";c.lineWidth=2;
      const r=(state.stage==="finisher"?28+(animated()?age:0)*23:20)*scale;
      for(let i=0;i<8;i++){const a=i*Math.PI/4+(animated()?state.elapsed:0);c.beginPath();c.moveTo(Math.cos(a)*r,-92*scale+Math.sin(a)*r);c.lineTo(Math.cos(a+.13)*(r+8*scale),-92*scale+Math.sin(a+.13)*(r+8*scale));c.stroke();}
    }
    c.restore();
    if(state.stage==="rescue"&&age>.34) {
      c.fillStyle="#dbe0a9";
      for(let i=0;i<20;i++){const t=age-.34,a=i*2.399;c.globalAlpha=1-clamp(t/1.5);c.fillRect(Math.round(x+Math.cos(a)*t*45),Math.round(y-145*scale+Math.sin(a)*t*40+t*t*22),2,2);}c.globalAlpha=1;
    }
  }
  function hands() {
    const w=canvas.width,h=canvas.height,s=Math.min(w/720,h/480),
      swing=state.stage==="strike"&&animated()?Math.sin(clamp(state.age/.65)*Math.PI):0;
    c.save();c.translate(w*.14,h*.69);c.scale(s*1.12,s*1.12);
    polygon(c,[[-64,95],[-60,22],[-43,-4],[-12,-9],[10,6],[12,32],[-3,57],[-8,105]],"#202e39");
    polygon(c,[[-58,21],[-43,3],[-13,-2],[3,11],[1,31],[-18,48],[-46,47]],"#9b7c63");
    polygon(c,[[-49,18],[-35,6],[-14,5],[-5,13],[-8,22],[-33,22]],"#d5b58a");
    c.fillStyle="#405561";c.fillRect(-57,43,39,12);c.fillStyle="#80958e";c.fillRect(-53,45,32,3);
    c.restore();
    c.save();c.translate(w*.59-swing*w*.18,h*.88-swing*h*.12);c.rotate(-.13-swing*1.25);c.scale(s,s);
    polygon(c,[[-35,75],[-26,6],[-13,-13],[10,-12],[27,4],[29,40],[53,87]],"#243541");
    polygon(c,[[-26,4],[-15,-14],[9,-14],[23,0],[18,25],[-10,35],[-29,20]],"#bc946f");
    polygon(c,[[-17,-12],[-9,-18],[7,-16],[14,-3],[-2,6],[-18,0]],"#e4bf8d");
    c.fillStyle="#8c7458";c.fillRect(-9,-71,14,58);c.fillStyle="#322b31";for(let i=0;i<5;i++)c.fillRect(-9,-64+i*10,14,3);
    polygon(c,[[-48,-79],[39,-79],[44,-68],[12,-62],[-15,-63],[-51,-70]],"#bdc4ac");
    polygon(c,[[-10,-81],[-8,-229],[0,-252],[10,-228],[8,-81]],"#d4dfcf");
    polygon(c,[[0,-240],[8,-227],[6,-84],[0,-84]],"#718e94");
    polygon(c,[[-7,-227],[-3,-231],[-3,-87],[-7,-87]],"#f0efce");
    c.restore();
  }
  function arrowAndKania() {
    const w=canvas.width,h=canvas.height,{x,y,scale}=enemyPosition(),age=state.age;
    if(state.stage==="rescue"&&age<1.15) {
      const t=animated()?clamp(age/.34):1,target={x,y:y-146*scale},start={x:w+80,y:h*.16};
      c.save();c.translate(start.x+(target.x-start.x)*t,start.y+(target.y-start.y)*t);c.rotate(Math.atan2(target.y-start.y,target.x-start.x));
      c.fillStyle="#b7c592";c.fillRect(-75,-1,68,2);polygon(c,[[0,0],[-12,-5],[-10,4]],"#f6eac1");
      polygon(c,[[-66,0],[-81,-8],[-77,0],[-82,7]],"#b9d99d");c.restore();
    }
    if(state.stage==="won"||(state.stage==="rescue"&&age>1.1)) {
      const k=Math.min(w/620,h/370)*1.2,kx=w*.7,ky=h*.60;
      c.drawImage(fieldSprites.make("scout","left",0),Math.round(kx-28*k),Math.round(ky-76*k),56*k,80*k);
      c.strokeStyle="#c0bc8c";c.lineWidth=2;c.beginPath();c.moveTo(kx-24*k,ky-62*k);c.quadraticCurveTo(kx-44*k,ky-36*k,kx-24*k,ky-9*k);c.stroke();
      c.strokeStyle="#6e9674";c.lineWidth=1;c.beginPath();c.moveTo(kx-24*k,ky-62*k);c.lineTo(kx-24*k,ky-9*k);c.stroke();
      c.font="12px Galmuri, monospace";c.fillStyle="#c4dfa3";c.fillText("카니아",kx-22,ky-84*k);
    }
  }
  function intro() {
    const w=canvas.width,h=canvas.height,t=clamp(state.age/1.65),
      zoom=animated()?1+Math.min(2.5,t*3.6):1,
      focus=state.origin, cover=Math.max(w/720,h/480);
    c.save();c.translate(w*.5,h*.43);c.scale(cover*zoom,cover*zoom);
    c.translate(-360-(focus.x-360)*clamp(t*2),-240-(focus.y-240)*clamp(t*2));
    c.drawImage(state.snapshot,0,0,720,480);
    const emergence=clamp(state.age/.45),es=.55*emergence;
    c.fillStyle="#101320dd";c.fillRect(focus.x-30,focus.y-45,60,52);
    c.drawImage(enemy,focus.x-64*es,focus.y-180*es,128*es,180*es);
    c.restore();
    c.fillStyle="#03060a";
    const shutter=animated()?clamp((t-.5)/.4):0;
    c.fillRect(0,0,w,h*.5*shutter);c.fillRect(0,h-h*.5*shutter,w,h*.5*shutter);
    if(animated()&&t>.22&&t<.8){c.strokeStyle="#e6e6b4";c.lineWidth=2;for(let i=0;i<16;i++){const a=i*Math.PI/8;c.beginPath();c.moveTo(w*.5+Math.cos(a)*w*.4,h*.43+Math.sin(a)*h*.4);c.lineTo(w*.5+Math.cos(a)*w,h*.43+Math.sin(a)*h);c.stroke();}}
    if(t>.52){c.font=`bold ${Math.max(24,Math.round(w*.038))}px Galmuri, monospace`;c.textAlign="center";c.fillStyle="#e7ebc9";c.fillText("기 습",w*.5,h*.51);c.textAlign="left";}
  }
  function draw() {
    if(!state)return;
    c.imageSmoothingEnabled=false;
    if(state.stage==="intro"){intro();return;}
    c.save();
    if(state.stage==="hurt"&&animated()&&state.age<.3)c.translate(Math.round(Math.sin(state.age*70)*5),0);
    backdrop();drawEnemy();hands();arrowAndKania();
    if(state.stage==="finisher") {
      const v=animated()?clamp(state.age/1.35):.35;c.fillStyle=`rgba(61,16,58,${v*.33})`;c.fillRect(0,0,canvas.width,canvas.height);
      c.strokeStyle="#c784ae";c.lineWidth=2;c.strokeRect(9+v*8,9+v*8,canvas.width-18-v*16,canvas.height-18-v*16);
    }
    if(state.stage==="guard"&&animated()) {
      c.strokeStyle="#b58db3";c.lineWidth=4;
      for(let i=0;i<3;i++){c.beginPath();c.moveTo(canvas.width*(.13+state.cursor*.5)+i*16,canvas.height*.2);c.lineTo(canvas.width*(.02+state.cursor*.5)+i*16,canvas.height*.55);c.stroke();}
    }
    c.restore();
  }
  function fit() {
    if(!state||root.hidden)return;
    canvas.width=Math.max(1,Math.min(960,Math.round(root.clientWidth)));
    canvas.height=Math.max(1,Math.round(canvas.width*root.clientHeight/Math.max(1,root.clientWidth)));
    draw();
  }
  function loop(now) {
    if(!state)return;
    const dt=Math.min(.05,Math.max(0,(now-previous)/1000));previous=now;
    if(!document.hidden)update(dt);
    draw();request=requestAnimationFrame(loop);
  }
  function prepare(options) {
    stop();
    const snapshot=document.createElement("canvas");snapshot.width=720;snapshot.height=480;
    snapshot.getContext("2d").drawImage(options.world,0,0,720,480);
    state={...options,snapshot,stage:"intro",age:0,elapsed:0,enemyHp:96,hp:Math.max(1,options.hp),turn:0,selection:0,rescued:false,cursor:0};
    root.hidden=false;delete root.dataset.ready;root.dataset.state="intro";
    document.querySelector("#battle-player-name").textContent=options.name;
    items.replaceChildren();stage("intro","");fit();gameAudio.sfx("battleStart");
  }
  function play() { if(!state)return;previous=performance.now();request=requestAnimationFrame(loop); }
  function finish() {
    if(state?.stage!=="won"||performance.now()<state.inputAfter)return;
    const {after,hp}=state;stop();after({hp});
  }
  function stop() {cancelAnimationFrame(request);state=null;root.hidden=true;delete root.dataset.ready;delete root.dataset.state;}
  function confirm() {
    if(!state)return;
    if(state.stage==="command")choose(buttons[state.selection].dataset.battleCommand);
    else if(["aim","guard"].includes(state.stage))confirmTiming();
    else if(state.stage==="items"){const list=[...items.querySelectorAll("button"),back];list[state.selection]?.click();}
    else if(state.stage==="info")command();
    else if(state.stage==="won")finish();
  }
  function handle(code,repeat,shift) {
    if(!state)return false;
    const allowed=["KeyE","Enter","Space","Escape","KeyC","KeyW","KeyS","KeyA","KeyD","ArrowUp","ArrowDown","ArrowLeft","ArrowRight","Tab","Digit1","Digit2","Digit3"];
    if(!allowed.includes(code))return false;
    if(code==="Tab") {
      const focusable=[...root.querySelectorAll("button:not([disabled])"),document.querySelector("#game-sound-toggle")].filter(b=>!b.hidden&&b.getClientRects().length&&!b.closest("[hidden]"));
      const i=focusable.indexOf(document.activeElement);focusable[(i+(shift?-1:1)+focusable.length)%focusable.length]?.focus({preventScroll:true});
    } else if(!repeat) {
      if(["KeyE","Enter","Space"].includes(code))confirm();
      else if(["Escape","KeyC"].includes(code)&&["info","items"].includes(state.stage))command();
      else if(["command","items"].includes(state.stage)&&["ArrowUp","ArrowDown","KeyW","KeyS"].includes(code))select(state.selection+(["ArrowUp","KeyW"].includes(code)?-1:1),true);
      else if(state.stage==="command"&&code.startsWith("Digit"))choose(["attack","info","items"][Number(code.at(-1))-1]);
    }
    return true;
  }
  buttons.forEach((b,i)=>{b.addEventListener("click",()=>choose(b.dataset.battleCommand));b.addEventListener("focus",()=>{if(state?.stage==="command")select(i);});});
  back.addEventListener("click",()=>command());
  back.addEventListener("focus",()=>{if(state?.stage==="items")select(items.querySelectorAll("button").length);});
  next.addEventListener("click",()=>state?.stage==="info"?command():finish());
  timingButton.addEventListener("click",confirmTiming);
  new ResizeObserver(fit).observe(document.querySelector("#game-screen"));
  return {prepare,play,stop,handle,get active(){return !!state;},getState(){return state?{stage:state.stage,hp:state.hp,enemyHp:state.enemyHp,turn:state.turn,cursor:state.cursor,rescued:state.rescued}:null;}};
})();
