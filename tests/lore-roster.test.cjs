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
    const person=people.find(p=>p.name===name);assert.equal(person.id,id);assert.equal(person.portraitKind,'actor');assert.ok(person.tags.length>=3);assert.ok(person.body.length>50);
  }
  assert.equal(people[0].portraitKind,'title');assert.equal(people[0].name,'마르에리');
});
test('new supporting characters are separate people, without borrowed artwork or biographies',()=>{
  for(const name of ['아이헤르데','보르드','고드릭']){
    const person=people.find(p=>p.name===name);assert.equal(person.portraitKind,'unrevealed');assert.equal(person.portraitSrc,'');assert.match(person.body,/공개되지/);
    assert.ok(!['nara','tobin','leon'].includes(person.id));
  }
  assert.equal(people.filter(p=>p.portraitKind==='unrevealed').length,4);
  assert.ok(people.every(p=>typeof p.portraitSrc==='string'&&Array.isArray(p.tags)&&p.role&&p.summary&&p.body));
});
test('relationships exist only for the eight requested sources and keep the requested target order',()=>{
  const expected={'마르에리':['헤니아','헬렌','아란'],'헤니아':['카니아','클로네','헬렌'],'카니아':['헤니아','클로네','레무','헬렌','아란'],'헬렌':['아란','카니아','헤니아','클로네','마르에리'],'아란':['헬렌','카니아','클로네','레무','헤니아'],'클로네':['헬렌','헤니아','뮈르슈'],'레무':['엘레나'],'엘레나':['레무']};
  assert.equal(people.filter(p=>p.relationships.length).length,8);
  for(const person of people){
    const targets=person.relationships.map(link=>{
      const target=people.find(p=>p.id===link.targetId);assert.ok(target);assert.ok(link.relation);return target.name;
    });
    assert.deepEqual(targets,expected[person.name]||[],person.name);
  }
  assert.equal(people.find(p=>p.id==='ellen').name,'엘레나');
  assert.ok(!people.some(p=>p.name==='엘렌'));
});
test('relationship copy and reactions preserve the requested directional descriptions',()=>{
  const expected={
    klone:[['helen','대화가 잘 통하는 전 지도자. 헬렌 님의 지원 덕에 많은 마법식을 만들고 개량했다.','neutral'],['henia','피곤하게 사는 영애. 다른 문화를 비난할 생각은 없다만, 귀찮은 껍데기 안에서 살아가는 건 분명하군.','neutral'],['rael','흥미로운 용족. 용족의 지능과 압도적인 마력에 관심이 가는군. 기회가 된다면 만남을 가지고 싶다.','neutral']],
    aran:[['helen','존경하는 어머니. 기대에 부응할 수 있었으면 좋겠다.','neutral'],['scout','신뢰하는 동료. 발빠르게 움직이며 소식을 빠르게 알려준다.','neutral'],['klone','뛰어난 마법탐구자. 정말 유능하지만 그... 그 옷차림 만큼은! 어떻게 안 되겠나앗...','flustered'],['remu','믿을 수 있는 대장장이. 직접적 만남은 뜸하지만 정찰대의 무기를 수리해주는 고마운 녀석이다.','neutral'],['henia','마법은 뛰어난 영애. 카니아와 티격대는 것을 많이 봤는데, 서로 친한가...?','puzzled']],
    helen:[['aran','딸. 기특하게 잘 해주고 있어~','neutral'],['scout','믿음직한 아이. 놀리는게 재밌고 귀여워~.','neutral'],['henia','고양이같은 아이. 틱틱대면서도 주눅드는게 귀여워~','neutral'],['klone','똑똑한 마법탐구자. 옷차림 덕분에 시민들을 놀래키곤 하지만... 말은 잘 통해~','neutral'],['mareri','술친구. 허울없는 모습이 맘에 들어~','neutral']],
    mareri:[['henia','고지식한 녀석','neutral'],['helen','술친구','neutral'],['aran','어리버리.','neutral']],
    scout:[['henia','악우. 온실 속 화초 주제에 정찰대를 흉본다!','annoyed'],['klone','신뢰하는 탐구자. 거적데기만 걸쳐 눈 둘 곳이 없다...','flustered'],['remu','신뢰하는 대장장이. 능률이 대단하군.','neutral'],['helen','존경하는 전임 지도자. 헬렌 님께는 예를 갖춰라!','neutral'],['aran','현임 지도자. 신뢰한다만... 아니, 아니!','flustered']],
    henia:[['scout','악우. 정말 안타깝구나, 카니아. 하이엘프라면 응당 품위를 차리는게 종족에 대한 예의 아니겠니? 정찰대같은 진흙탕이 아니라.','puzzled'],['klone','이해 불가. 왜 저런 천쪼가리만 걸치고 다니는 거니?','annoyed'],['helen','인정하는 전임 지도자. 헬렌 님의 체면을 생각해서 순순히 지내는 거란다. 절대 내가 무시당하는 게 아니고!','flustered']],
  };
  for(const [id,links]of Object.entries(expected))assert.deepEqual(people.find(p=>p.id===id).relationships.map(r=>[r.targetId,r.relation,r.emotion]),links);
  for(const p of people.filter(p=>p.relationships.length)){
    assert.ok(p.reactionAsset);assert.ok(fs.existsSync(path.join(__dirname,'../assets/reaction-'+p.reactionAsset+'.webp')));
    for(const r of p.relationships)assert.ok(['neutral','annoyed','puzzled','flustered'].includes(r.emotion||'neutral'));
    if(!expected[p.id])assert.ok(p.relationships.every(r=>r.relation==='미공개'));
  }
  assert.equal(people.filter(p=>p.reactionAsset).length,20);
});

test('eighteen supplied landscape cards map to their own people without duplicating Seia',()=>{
  const expected={runya:'runya',carola:'carola',seia:'seia',sif:'sif',sena:'jangwi',shunya:'shunya',aran:'aran',remu:'remu',mareri:'mareri',klone:'klone',helen:'helen',rael:'muirshu',ellen:'elena',scout:'kania',lucy:'lucy',bran:'ivoria',rose:'arda',henia:'henia'};
  assert.equal(people.filter(p=>p.portraitSrc).length,18);
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
    if(person.portraitKind==='unrevealed'){assert.equal(person.reactionAsset,'');continue;}
    assert.ok(person.reactionAsset,person.name);
    const grid=person.reactionGrid;assert.ok(grid&&grid.start>=0&&grid.start+3<grid.columns*grid.rows);
    const key=person.reactionAsset+':'+grid.start;assert.ok(!owners.has(key),person.name);owners.add(key);
  }
  assert.equal(owners.size,20);
});
