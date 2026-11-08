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
  assert.equal(people.filter(p=>p.portraitKind==='unrevealed').length,15);
  assert.ok(people.every(p=>typeof p.portraitSrc==='string'&&Array.isArray(p.tags)&&p.role&&p.summary&&p.body));
});
test('relationships exist only for the six requested sources and keep the requested target order',()=>{
  const expected={'헤니아':['카니아','클로네'],'카니아':['헤니아','클로네'],'헬렌':['아란'],'아란':['헬렌'],'레무':['엘레나'],'엘레나':['레무']};
  assert.equal(people.filter(p=>p.relationships.length).length,6);
  for(const person of people){
    const targets=person.relationships.map(link=>{
      const target=people.find(p=>p.id===link.targetId);assert.ok(target);assert.ok(link.relation);return target.name;
    });
    assert.deepEqual(targets,expected[person.name]||[],person.name);
  }
  assert.equal(people.find(p=>p.id==='ellen').name,'엘레나');
  assert.ok(!people.some(p=>p.name==='엘렌'));
});
test('relationship copy and reactions match the four supplied descriptions',()=>{
  const expected={
    scout:[['henia','악우. 온실 속 화초 주제에 정찰대를 흉본다!','annoyed'],['klone','신뢰하는 탐구자. 거적데기만 걸쳐 눈 둘 곳이 없다...','flustered']],
    henia:[['scout','악우. 하이엘프인데도 정찰대를 자원하다니?','puzzled'],['klone','이해 불가. 왜 저런 천쪼가리만 걸치고 다니는 거니?','annoyed']],
  };
  for(const [id,links]of Object.entries(expected))assert.deepEqual(people.find(p=>p.id===id).relationships.map(r=>[r.targetId,r.relation,r.emotion]),links);
  for(const p of people.filter(p=>p.relationships.length)){
    assert.ok(p.reactionAsset);assert.ok(fs.existsSync(path.join(__dirname,'../assets/reaction-'+p.reactionAsset+'.webp')));
    for(const r of p.relationships)assert.ok(['neutral','annoyed','puzzled','flustered'].includes(r.emotion||'neutral'));
    if(!expected[p.id])assert.ok(p.relationships.every(r=>r.relation==='미공개'));
  }
  assert.equal(people.filter(p=>p.reactionAsset).length,6);
});
