const {test} = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs'), vm = require('node:vm'), path = require('node:path');
const root = path.join(__dirname,'..');
const chats = vm.runInNewContext(fs.readFileSync(path.join(root,'JS/character-chats.js'),'utf8')+';characterChats');
const modelFactory = vm.runInNewContext(fs.readFileSync(path.join(root,'JS/objective-guide.js'),'utf8')+';createObjectiveGuideModel');
test('replacement identities retain save IDs and three distinct finite topics',()=>{
  assert.deepEqual(Object.keys(chats).sort(),['bran','edan','leon','lucy','mia','nara','rael','sena','tobin']);
  for (const [id,person] of Object.entries(chats)) {
    assert.equal(person.topics.length,3,id);
    assert.equal(new Set(person.topics.map(t=>t.label)).size,3);
    assert.equal(Object.keys(person.poses).length,6);
    for (const topic of person.topics) for (const line of topic.lines) {
      assert.ok(['hero',id].includes(line.kind));
      if (line.expression) assert.ok(line.expression in person.poses,`${id}/${line.expression}`);
    }
  }
  assert.ok(chats.leon.helpTopic.dynamic);
  assert.equal(chats.mia.partyJoin,false);
  assert.equal(chats.nara.rumorConfirmed,false);
});
test('objective guide is locked for old saves and requires explicit reveal',()=>{
  const model=modelFactory(), world={active:true,inputLocked:false,phase:'free',location:'guild',questAccepted:false};
  model.reset(); assert.equal(model.view(world).visible,false);
  model.reveal(); assert.equal(model.view(world).visible,true);
  model.dismiss(); const saved=JSON.parse(JSON.stringify(model.snapshot()));
  const next=modelFactory(); next.reset(saved); assert.equal(next.view(world).visible,false);
  next.reveal(); assert.equal(next.view(world).visible,true);
});
test('objectives follow quest, travel and library progression',()=>{
  const model=modelFactory();
  const world={questAccepted:false,location:'guild'};
  assert.equal(model.describe(world).id,'accept');
  world.questAccepted=true;
  for(const [location,id] of Object.entries({guild:'leave-guild',city:'board-carriage',checkpoint:'checkpoint',gate:'enter-grove',grove:'reach-library',library:'read-letter'})) {
    assert.equal(model.describe({...world,location}).id,id);
  }
  assert.equal(model.describe({...world,location:'grove',fieldFlags:{libraryAmbushCleared:true}}).id,'enter-library');
  assert.equal(model.describe({...world,location:'library',fieldFlags:{libraryLetterRead:true}}).id,'read-records');
  assert.equal(model.describe({...world,location:'cliff'}).id,'return-to-city');
});
test('guide stays hidden through every modal, event, battle and transition phase',()=>{
  const model=modelFactory(); model.reveal();
  const world={active:true,inputLocked:false,phase:'free',location:'guild',questAccepted:true};
  for(const phase of ['idle','dialogue','board','event','action','vista','battle','menu','inspect','shop','reading','letter','transition']) assert.equal(model.view({...world,phase}).visible,false,phase);
  assert.equal(model.view({...world,inputLocked:true}).visible,false);
  assert.equal(model.view({...world,active:false}).visible,false);
  assert.equal(model.view({...world,location:'carriage'}).visible,false);
});
