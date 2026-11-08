const {test}=require('node:test');
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const lore=vm.runInNewContext(fs.readFileSync(path.join(__dirname,'../JS/lore.js'),'utf8')+';greenstoaLore',{
  document:{querySelector:()=>({dataset:{artSrc:'early',lateSrc:'late'}})},
  Image:class{decode(){return Promise.resolve()}},
});
const people=JSON.parse(JSON.stringify(lore.people));
test('archive lists the requested 16 leads and 8 supporting characters in order',()=>{
  assert.deepEqual(people.filter(p=>p.group==='lead').map(p=>p.name),['마르에리','카니아','헤니아','헬렌','아란','클로네','레무','루냐','슈냐','시프','뮈르슈','엘렌','캐롤라','세이아','장위','???']);
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
