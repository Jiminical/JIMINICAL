const {test}=require('node:test');
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const lore=vm.runInNewContext(fs.readFileSync(path.join(__dirname,'../JS/lore.js'),'utf8')+';greenstoaLore',{
  document:{querySelector:()=>({dataset:Object.fromEntries(Array.from({length:9},(_,i)=>['chapter'+(i+1)+'Src','chapter-'+i]))})},
  Image:class{naturalWidth=1280;naturalHeight=720;decode(){return Promise.resolve()}},
});
const people=JSON.parse(JSON.stringify(lore.people));

test('all nine opening chapters draw their complete independent image within the canvas',()=>{
  assert.equal(lore.scenes.length,9);
  assert.equal(new Set(lore.scenes.map(scene=>scene.asset)).size,9);
  for(let index=0;index<9;index++)for(const [width,height]of [[800,400],[400,800]]){
    const calls=[],context={clearRect(){},drawImage(...args){calls.push(args)}},canvas={width,height,dataset:{},getContext:()=>context,setAttribute(){}};
    lore.paintChapter(canvas,index);
    assert.equal(calls.length,1);assert.equal(calls[0].length,5,'draw the entire source, without atlas cropping');
    const [image,x,y,w,h]=calls[0];
    assert.equal(image.src,'chapter-'+index);assert.ok(x>=0&&y>=0&&x+w<=width+.001&&y+h<=height+.001);
    assert.ok(Math.abs(w/h-16/9)<.0001);assert.equal(context.imageSmoothingQuality,'high');
    assert.ok(fs.existsSync(path.join(__dirname,'../assets/opening-'+String(index+1).padStart(2,'0')+'.webp')));
  }
});
test('archive lists the requested 16 leads and 8 supporting characters in order',()=>{
  assert.deepEqual(people.filter(p=>p.group==='lead').map(p=>p.name),['마르에리','카니아','헤니아','헬렌','아란','클로네','레무','루냐','슈냐','시프','뮈르슈','엘레나','캐롤라','세이아','장위','???']);
  assert.deepEqual(people.filter(p=>p.group==='supporting').map(p=>p.name),['루시','아르다','하나리','이보리아','아이헤르데','기루스','보르드','고드릭']);
  assert.equal(people.length,24);assert.equal(new Set(people.map(p=>p.id)).size,24);
  assert.deepEqual(JSON.parse(JSON.stringify(lore.peopleGroups)).map(g=>g.title),['주연','조연']);
});
test('existing portraits and biographies stay attached to their original actors',()=>{
  for(const [name,id]of Object.entries({'카니아':'scout','뮈르슈':'rael','장위':'sena','루시':'lucy','아르다':'rose','하나리':'mia','이보리아':'bran','기루스':'edan'})){
    const person=people.find(p=>p.name===name);assert.equal(person.id,id);assert.equal(person.portraitKind,'actor');assert.ok(person.tags.length>=3);assert.ok([person.body].flat().join('\n').length>50);
  }
  assert.equal(people[0].portraitKind,'title');assert.equal(people[0].name,'마르에리');
});
test('new supporting characters are separate people, without borrowed artwork or biographies',()=>{
  for(const name of ['고드릭']){
    const person=people.find(p=>p.name===name);assert.equal(person.portraitKind,'unrevealed');assert.equal(person.portraitSrc,'');assert.match(person.body,/공개되지/);
    assert.ok(!['nara','tobin','leon'].includes(person.id));
  }
  const aiherde=people.find(p=>p.id==='aiherde');
  assert.equal(aiherde.portraitKind,'unrevealed');assert.equal(aiherde.portraitSrc,'');
  assert.equal(aiherde.role,'전신갑주의 지식인');
  assert.deepEqual(aiherde.tags,['마법탐구자','과묵함','제르디아 왕국','피지컬','35세']);
  assert.equal(aiherde.quote,'강인한 육체 또한 학자의 소양이다.');
  assert.equal(aiherde.body.length,2);assert.match(aiherde.body[0],/^라는 말을.*191cm.*전신 금 갑주/);
  assert.equal(aiherde.body[1],'박식하지만 제르디아 외부에서 사용되는 마법에는 별로 흥미가 없습니다.');
  const bord=people.find(p=>p.id==='bord');
  assert.equal(bord.portraitKind,'unrevealed');assert.equal(bord.portraitSrc,'');
  assert.equal(bord.role,'곧은 동시에 삐뚤어진');
  assert.deepEqual(bord.tags,['정찰대원','소년미','희귀 남성','인간','20세']);
  assert.equal(bord.bodyBullets.length,3);assert.equal(bord.body.length,2);
  assert.deepEqual(bord.bodyEmphasis,['희귀함의 집합체']);
  assert.equal(people.filter(p=>p.portraitKind==='unrevealed').length,4);
  assert.ok(people.every(p=>typeof p.portraitSrc==='string'&&Array.isArray(p.tags)&&p.body&&(p.id==='unrevealed'||p.role&&p.summary)));
  const mystery=people.find(p=>p.id==='unrevealed');
  assert.deepEqual(mystery.tags,[]);assert.equal(mystery.role,'');assert.equal(mystery.summary,'');
  assert.equal(mystery.body,'(아무 것도 쓰이지 않았다. 혹은, 당신이 인식할 수 없는 무언가로 가득 찬 페이지이다.)');
  assert.equal(mystery.portraitAspect,1216/704);
  assert.equal(mystery.portraitEffect,'arcane');assert.deepEqual(people.filter(p=>p.portraitEffect).map(p=>p.id),['unrevealed']);
});
test('relationships exist only for the twenty-two requested sources and keep the requested target order',()=>{
  const expected={'마르에리':['헤니아','헬렌','아란'],'헤니아':['카니아','클로네','헬렌'],'카니아':['헤니아','클로네','레무','헬렌','아란'],'헬렌':['아란','카니아','헤니아','클로네','마르에리'],'아란':['헬렌','카니아','클로네','레무','헤니아'],'클로네':['헬렌','헤니아','뮈르슈'],'레무':['엘레나','카니아','장위'],'루냐':['슈냐','헬렌','엘레나'],'슈냐':['루냐'],'시프':['당신(플레이어)','아란','헬렌','캐롤라'],'엘레나':['레무']};
  expected['뮈르슈']=['클로네','장위'];
  expected['엘레나']=['레무','장위'];
  expected['슈냐']=['루냐','캐롤라'];
  expected['캐롤라']=['시프','헬렌','아란','카니아','보르드','마르에리','레무','슈냐','루냐','아르다','헤니아','클로네','엘레나'];
  expected['세이아']=['장위'];
  expected['장위']=['레무','세이아','엘레나'];
  expected['루시']=['이보리아','하나리','아르다','기루스'];
  expected['아르다']=['캐롤라','루시','이보리아'];
  expected['하나리']=['이보리아','루시'];
  expected['이보리아']=['하나리','루시'];
  expected['아이헤르데']=['고드릭','루시','기루스'];
  expected['기루스']=['루시','이보리아','하나리'];
  expected['보르드']=['카니아','헬렌','아란'];
  assert.equal(people.filter(p=>p.relationships.length).length,22);
  for(const person of people){
    const targets=person.relationships.flatMap(link=>{
      if(link.targetType==='player'){assert.equal(link.targetId,'hero');assert.equal(person.id,'sif');assert.ok(!people.some(p=>p.id==='hero'));return '당신(플레이어)';}
      if(link.targetIds){assert.ok(['sif','carola','bord'].includes(person.id));assert.deepEqual(link.targetIds,person.id==='sif'?['aran','helen']:person.id==='carola'?['henia','klone']:['helen','aran']);}
      return (link.targetIds||[link.targetId]).map(id=>{const target=people.find(p=>p.id===id);assert.ok(target);assert.ok(link.relation);return target.name;});
    });
    assert.deepEqual(targets,expected[person.name]||[],person.name);
  }
  assert.equal(people.find(p=>p.id==='ellen').name,'엘레나');
  assert.ok(!people.some(p=>p.name==='엘렌'));
});
test('relationship copy and reactions preserve the requested directional descriptions',()=>{
  const expected={
    bord:[['scout','가끔씩 순찰을 도는 동료. 이봐, 카니아. 왜 자꾸 그렇게 귀찮다는 듯한 눈빛으로 보는 건데?','neutral'],[['helen','aran'],'지도자들. ...대단한 분들이시지. 뭐? 맘에 안 드는 점이라도 말할까 봐? 있지도 않거든.','neutral']],
    edan:[['lucy','길드의 접수원입니다. 능률이 좋은 것 같습니다.','neutral'],['bran','...함구하겠습니다.','neutral'],['mia','월화국 출신의 모험가라는군요. 이질적인 기운이 느껴집니다.','neutral']],
    aiherde:[['godric','...간신배','neutral'],['lucy','접수원.','neutral'],['edan','충신이다.','neutral']],
    bran:[
      ['mia','술친구 겸 동료. 좀 깐깐해 보여도 은근 마음이 잘 맞아서 말이야!','neutral'],
      ['lucy','접수원. 피곤에 안 절어있으면 어떤 모습일까 싶은걸! 은퇴하지 않는 이상 불가능하겠지만.','neutral'],
    ],
    mia:[
      ['bran','얼마 전에 친해졌어. 뭐, 가끔은 너무 앞서갈 때도 있지만, 괜찮은 녀석이야.','neutral'],
      ['lucy','접수원. 인기가 많은가 봐. 맡은 일만 열심히 해주면 그만이지만.','neutral'],
    ],
    rose:[
      ['carola','우유나 치즈를 가끔 공수해와용. 그린스토아산은 역시 달라용.','neutral'],
      ['lucy','길드의 접수원님이세용. 자주 마주치진 않지만 착해보이세용.','neutral'],
      ['bran','가끔씩 잔뜩 취한 채로 잡화점에 올 때가 있는데... 곤란해용...','neutral'],
    ],
    lucy:[
      ['bran','길드에 상주하다시피 하는 모험가님이시죠. 몸에 붕대만 두르고 다니시는데, 안 춥나?','neutral'],
      ['mia','비교적 최근에 오신 분이세요. 월화국 출신이라던데,.. 말은 별로 안 나눠봤지만, 마력이랑 다른 기운이 나긴 하더라고요.','neutral'],
      ['rose','길드 근처 잡화점의 주인이에요. 자주 마주치진 않지만 말투가 특이해서 기억에 남네요. 그린스토아로 물건을 납품할 때도 있다고 해요.','neutral'],
      ['edan','기사단의 일원이세요. 성격은 조금 딱딱하시지만, 그럴 수 밖에 없는 자리니까요. 사석에서의 모습이 궁금하긴 해요.','neutral'],
    ],
    sena:[['remu','몇 번 본 적 있어요... 좋으신 분이에요.','neutral'],['seia','어...어딘가에서 자꾸 나타나고... 막... 놀래켜요...!!!','flustered'],['ellen','소문의 주인공이래요... 무서워요...','flustered']],
    seia:[['sena','겁 많은 녀석. 놀래키기 좋아!','neutral']],
    carola:[
      ['sif','귀여운 손님. 얌전한 부잣집 아가씨 같은데, 우유에 관심있는게 귀여워!','neutral'],
      ['helen','믿음직한 전 지도자님이시지! 헬렌 님과는 성격이 잘 맞아서 좋았어. 바쁘셔서 만나뵐 기회는 많이 없었지만.','neutral'],
      ['aran','지도자에겐 예를 차리지만, 솔직히 속으로는 귀엽고 기특한 아가씨라고 생각하고 있어. 전임의 품위를 지키기 위해 열심이니까!','neutral'],
      ['scout','서부까지 순찰을 돌 때 많이 만나. 툴툴대면서도 할 일은 꼼꼼히 하는 괜찮은 녀석이지. 언젠가 남자 하나 물어 은퇴하지 않으려나?','neutral'],
      ['bord','카니아와 가끔씩 같이 순찰을 돌더군. 성격은 좀 고약해도 본성은 착한 녀석이야. 우유 한 병 주면 좋아하더라고.','neutral'],
      ['mareri','목장 근처 그늘에서 잠을 자곤 해. 내쫓기 뭐하잖아? 낮잠 잘 곳을 주는 대신 정령들의 도움을 좀 받고 있지. 덕분에 일할 때도 덥지 않아.','neutral'],
      ['remu','목장 기구가 고장나도 걱정거리가 없는건 이 친구 덕분이지. 서로서로 잘 되고 있어서 좋아.','neutral'],
      ['shunya','사고뭉치. 옆에 있는 흰 녀석이 없었다면 아마 정말 큰 사고를 치겠지. 그럴 일은 없겠지만 말야.','neutral'],
      ['runya','소심해도 할 말은 다 하는게 귀여워. 검은 녀석한테 휘둘리긴 하지만, 서로 아끼는게 보인단 말이지.','neutral'],
      ['rose','그린스토아 말고도 제르디아에 납품할 기회가 있었는데, 제빵이 취미인 녀석이 있더라고. 밝고 선량한게 맘에 들어.','neutral'],
      [['henia','klone'],'안면 정도는 텄어. 둘 다 만날 일이 별로 없어서 말이야.','neutral'],
      ['ellen','낮에는 아주 가끔씩 보는데, 자세히는 모르고... 소문으로는 알고 있어.','neutral'],
    ],
    ellen:[['remu','반응 재밌는 슬라임. 이번엔 어떻게 놀려먹어야 할까나~?','neutral'],['sena','몸매 좋은 겁쟁이. 흉악한 걸 달고 다니면서, 겁은 엄청 많다니까~','neutral']],
    rael:[['klone','흥미로운 학자. 여러가지 지식과 마법식이 눈에 띄는군, 만나봐도 좋을 사람이지.','neutral'],['sena','정문 근처에서 떠도는 언데드 녀석. 쓸데없는 걱정을 하는 것 같더군.','neutral']],
    sif:[['hero','모험가 님. 혹시, 괜찮으시면 대화라도...!','flustered'],[['aran','helen'],'이 곳의 지도자. 명성은 알고 있어요...','neutral'],['carola','목장 주인. 목장의 우유에 관심이 있어요. 그리고 저한텐 없는 활력도 느껴져요.','neutral']],
    shunya:[['runya','친한 친구. 답답하다냐! 내 손에 들어오면 내 거다냐.','annoyed'],['carola','우유...! 가끔씩 우유를 준다냐. 여기 목장 우유는 맛있다냐.','neutral']],
    runya:[['shunya','친한 친구. 사람들 물건 좀 그만 훔치란 말이야...! 점찍는 것도 안 돼!','annoyed'],['helen','전임 지도자님. 만나볼 기회는 많이 없지만... 월광 마법을 정말 잘 다루세요.','neutral'],['ellen','소문의 주인공...? 저, 저는 직접 보기까지는 안 믿을래요.','puzzled']],
    remu:[['ellen','무서운 사람. 자꾸 대장간에 찾아와서 놀린다니까요!','flustered'],['scout','정찰병 님. 이따금씩 활을 손질해달라고 찾아오시는데, 저는 금속 외에는 잘...','puzzled'],['sena','정문의 강시. 상권까지 오지는 않지만... 분명 좋은 사람일 거에요!','neutral']],
    klone:[['helen','대화가 잘 통하는 전 지도자. 헬렌 님의 지원 덕에 많은 마법식을 만들고 개량했다.','neutral'],['henia','피곤하게 사는 영애. 다른 문화를 비난할 생각은 없다만, 귀찮은 껍데기 안에서 살아가는 건 분명하군.','neutral'],['rael','흥미로운 용족. 용족의 지능과 압도적인 마력에 관심이 가는군. 기회가 된다면 만남을 가지고 싶다.','neutral']],
    aran:[['helen','존경하는 어머니. 기대에 부응할 수 있었으면 좋겠다.','neutral'],['scout','신뢰하는 동료. 발빠르게 움직이며 소식을 빠르게 알려준다.','neutral'],['klone','뛰어난 마법탐구자. 정말 유능하지만 그... 그 옷차림 만큼은! 어떻게 안 되겠나앗...','flustered'],['remu','믿을 수 있는 대장장이. 직접적 만남은 뜸하지만 정찰대의 무기를 수리해주는 고마운 녀석이다.','neutral'],['henia','마법은 뛰어난 영애. 카니아와 티격대는 것을 많이 봤는데, 서로 친한가...?','puzzled']],
    helen:[['aran','딸. 기특하게 잘 해주고 있어~','neutral'],['scout','믿음직한 아이. 놀리는게 재밌고 귀여워~.','neutral'],['henia','고양이같은 아이. 틱틱대면서도 주눅드는게 귀여워~','neutral'],['klone','똑똑한 마법탐구자. 옷차림 덕분에 시민들을 놀래키곤 하지만... 말은 잘 통해~','neutral'],['mareri','술친구. 허울없는 모습이 맘에 들어~','neutral']],
    mareri:[['henia','고지식한 녀석','neutral'],['helen','술친구','neutral'],['aran','어리버리.','neutral']],
    scout:[['henia','악우. 온실 속 화초 주제에 정찰대를 흉본다!','annoyed'],['klone','신뢰하는 탐구자. 거적데기만 걸쳐 눈 둘 곳이 없다...','flustered'],['remu','신뢰하는 대장장이. 능률이 대단하군.','neutral'],['helen','존경하는 전임 지도자. 헬렌 님께는 예를 갖춰라!','neutral'],['aran','현임 지도자. 신뢰한다만... 아니, 아니!','flustered']],
    henia:[['scout','악우. 정말 안타깝구나, 카니아. 하이엘프라면 응당 품위를 차리는게 종족에 대한 예의 아니겠니? 정찰대같은 진흙탕이 아니라.','puzzled'],['klone','이해 불가. 왜 저런 천쪼가리만 걸치고 다니는 거니?','annoyed'],['helen','인정하는 전임 지도자. 헬렌 님의 체면을 생각해서 순순히 지내는 거란다. 절대 내가 무시당하는 게 아니고!','flustered']],
  };
  for(const [id,links]of Object.entries(expected))assert.deepEqual(people.find(p=>p.id===id).relationships.map(r=>[r.targetIds||r.targetId,r.relation,r.emotion]),links);
  for(const p of people.filter(p=>p.relationships.length)){
    if(['aiherde','bord'].includes(p.id)){assert.equal(p.portraitKind,'unrevealed');assert.equal(p.reactionAsset,'');}
    else{assert.ok(p.reactionAsset);assert.ok(fs.existsSync(path.join(__dirname,'../assets/reaction-'+p.reactionAsset+'.webp')));}
    for(const r of p.relationships)assert.ok(['neutral','annoyed','puzzled','flustered'].includes(r.emotion||'neutral'));
    if(!expected[p.id])assert.ok(p.relationships.every(r=>r.relation==='미공개'));
  }
  assert.equal(people.filter(p=>p.reactionAsset).length,21);
});

test('twenty supplied landscape images map to their own people without duplicating Seia',()=>{
  const expected={runya:'runya',carola:'carola',seia:'seia',sif:'sif',sena:'jangwi',shunya:'shunya',aran:'aran',remu:'remu',mareri:'mareri',klone:'klone',helen:'helen',rael:'muirshu',ellen:'elena',scout:'kania',lucy:'lucy',bran:'ivoria',rose:'arda',henia:'henia'};
  expected.mia='hanari';
  expected.unrevealed='unknown';
  assert.equal(people.filter(p=>p.portraitSrc).length,20);
  assert.equal(people.filter(p=>p.name==='세이아').length,1);
  for(const [id,file]of Object.entries(expected)){
    const person=people.find(p=>p.id===id);
    assert.equal(person.portraitSrc,'assets/person-'+file+'.webp');
    assert.ok(fs.existsSync(path.join(__dirname,'..',person.portraitSrc)));
    assert.ok(!person.tags.includes('미공개'));assert.ok(!person.body.includes('아직 공개되지'));
  }
  assert.equal(people.find(p=>p.id==='sena').portraitKind,'actor');
});

test('every revealed person owns four dot-face frames and hidden cast stays unknown',()=>{
  const owners=new Set();
  for(const person of people){
    if(person.portraitKind==='unrevealed'&&person.id!=='unrevealed'){assert.equal(person.reactionAsset,'');continue;}
    assert.ok(person.reactionAsset,person.name);
    const grid=person.reactionGrid;assert.ok(grid&&grid.start>=0&&grid.start+3<grid.columns*grid.rows);
    const key=person.reactionAsset+':'+grid.start;assert.ok(!owners.has(key),person.name);owners.add(key);
  }
  assert.equal(owners.size,21);
  assert.equal(people.find(p=>p.id==='unrevealed').reactionAsset,'unknown');
});
