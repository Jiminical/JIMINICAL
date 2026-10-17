// Painted exits have a destination or an in-world reason to stop.
const fieldPaths = (() => {
  const paths = {
    city: [
      {id:'palace-door',name:'굳게 잠긴 왕궁 문',x:360,y:55,dir:-1,trigger:77,limit:63,range:[306,433],
        text:'왕궁의 커다란 문은 굳게 잠겨 있다.\n문을 밀어 보아도 꿈쩍하지 않는다. 지금은 안으로 들어갈 수 없다.'},
      {id:'city-south',name:'광장 남쪽 길',x:360,y:463,dir:1,trigger:460,range:[300,428],destination:'cliff'},
    ],
    cliff: [
      {id:'cliff-return',name:'광장으로 돌아가는 길',x:360,y:22,dir:-1,trigger:30,range:[306,413],destination:'city'},
      {id:'river-cliff',name:'절벽 아래의 큰 강',x:360,y:146,dir:1,trigger:125,limit:137,range:[155,562],
        text:'길은 가파른 절벽 끝에서 끊겨 있다.\n한참 아래로 큰 강이 거세게 흐른다. 건널 다리도, 내려갈 길도 없다. 더 이상 나아갈 수 없겠다.'},
    ],
    checkpoint: [
      {id:'checkpoint-north',name:'그린스토아로 가는 길',x:374,y:205,dir:-1,trigger:218,limit:207,range:[327,433],
        text:'검문을 마치기 전에는 이 길을 지나갈 수 없다.\n먼저 카니아에게 모험가증을 보여 주고, 안내를 받아 그린스토아로 나아가자.'},
    ],
    gate: [
      {id:'sealed-road',name:'마법으로 봉인된 남쪽 길',x:360,y:448,dir:1,trigger:426,limit:440,range:[220,490],
        text:'돌아가는 길의 입구가 마법 잠금으로 굳게 봉인되어 있다.\n희미한 문양 너머로는 발을 내디딜 수 없다. 그린스토아 정문으로 향하자.'},
    ],
    grove: [
      {id:'grove-north',name:'성역 깊은 곳으로 이어지는 길',x:391,y:190,dir:-1,trigger:211,limit:203,range:[348,438],
        text:'성역 안쪽으로 이어지는 길이다.\n아직 이곳에 대해 아는 것이 너무 적다. 먼저 도서관에서 대략적인 정보를 확인하자.'},
    ],
  };
  const list = location => paths[location] || [];
  function text(path, flags={}) {
    if(path.id==='grove-north' && flags.libraryLetterRead)
      return '성역 깊은 곳으로 이어지는 길이다.\n더 나아가기 전에 도서관에서 성역의 기록과 주변 정보를 충분히 확인하자. 지금은 이 부근부터 살펴보는 편이 좋겠다.';
    return path.text;
  }
  function contact(location, player, dy) {
    return list(location).find(path => Math.sign(dy)===path.dir &&
      player.x>=path.range[0] && player.x<=path.range[1] &&
      (path.dir<0 ? player.y<=path.trigger : player.y>=path.trigger));
  }
  function near(location, id, player) {
    const path=list(location).find(path=>path.id===id);
    return !!path && player.x>=path.range[0]-16 && player.x<=path.range[1]+16 &&
      (path.dir<0 ? player.y<=path.trigger+28 : player.y>=path.trigger-28);
  }
  function blocked(location,x,y) {
    return list(location).some(path => path.limit!==undefined && x>=path.range[0] && x<=path.range[1] &&
      (path.dir<0 ? y<path.limit : y>path.limit));
  }
  function settle(location, player) {
    // Old saves may be standing beyond a newly marked stop line.
    for(const path of list(location)) if(path.limit!==undefined &&
      player.x>=path.range[0] && player.x<=path.range[1] &&
      (path.dir<0 ? player.y<path.limit : player.y>path.limit))
      player.y=path.trigger-path.dir*10;
  }
  function draw(c,location,time,motion) {
    c.save();c.imageSmoothingEnabled=false;
    if(location==='city') {
      c.fillStyle='#f1d78e';c.fillRect(355,40,10,8);c.strokeStyle='#b49451';c.lineWidth=2;c.strokeRect(357,35,6,7);
    } else if(location==='checkpoint') {
      c.fillStyle='#625341';c.fillRect(338,203,5,17);c.fillRect(412,203,5,17);
      c.fillStyle='#d9c68c';c.fillRect(341,207,73,3);c.fillStyle='#435d48';c.fillRect(371,206,9,10);
    } else if(location==='gate') {
      c.globalAlpha=motion ? .6+Math.sin(time*2)*.12 : .7;
      c.fillStyle='#4cc7a14d';c.fillRect(246,429,228,18);
      c.strokeStyle='#9fffe0';c.lineWidth=2;c.strokeRect(246,429,228,18);
      for(let x=260;x<474;x+=22){c.beginPath();c.moveTo(x,433);c.lineTo(x+4,438);c.lineTo(x,443);c.lineTo(x-4,438);c.closePath();c.stroke();}
    } else if(location==='grove') {
      c.fillStyle='#66513c';c.fillRect(430,184,3,24);c.fillStyle='#354d3c';c.fillRect(410,178,47,16);
      c.strokeStyle='#c6d1a1';c.lineWidth=1;c.strokeRect(410.5,178.5,46,15);
      c.fillStyle='#e1dfbb';c.font='9px Galmuri11, monospace';c.fillText('도서관 →',413,189);
    }
    c.restore();
  }
  return {targets:location=>list(location).map(path=>({...path,kind:'path'})),contact,near,blocked,settle,text,draw};
})();
