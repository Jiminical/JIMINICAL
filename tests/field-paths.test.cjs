const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('fs'),vm=require('vm'),path=require('path');
const read=name=>fs.readFileSync(path.join(__dirname,'../JS/'+name+'.js'),'utf8');
const routes=vm.runInNewContext(read('field-paths')+';fieldPaths');
const terrain=vm.runInNewContext(read('terrain')+';fieldTerrain');
test('palace and riverside paths are reachable from the existing city square',()=>{
  const starts=[[140,239]],seen=new Set(starts.map(p=>p.join(',')));let palace=false,south=false;
  for(let i=0;i<starts.length;i++) {
    const [x,y]=starts[i];palace ||= x>330&&x<395&&y<90;south ||= x>310&&x<415&&y>445;
    if(palace&&south)break;
    for(const [dx,dy] of [[4,0],[-4,0],[0,4],[0,-4]]){
      const nx=x+dx,ny=y+dy,key=nx+','+ny;
      if(nx<0||nx>720||ny<0||ny>480||seen.has(key)||terrain.blocked('city',nx,ny)||routes.blocked('city',nx,ny))continue;
      seen.add(key);starts.push([nx,ny]);
    }
  }
  assert.ok(palace,'palace approach connects around the fountain');assert.ok(south,'southern route connects to square');
});
test('new lookout floor ends before the cliff and connects back to the city',()=>{
  for(let y=30;y<=125;y++)assert.equal(terrain.blocked('cliff',360,y),false,'walkable return path '+y);
  assert.equal(terrain.blocked('cliff',360,150),true);assert.equal(terrain.blocked('cliff',360,300),true);
  assert.equal(routes.contact('city',{x:360,y:462},1).destination,'cliff');
  assert.equal(routes.contact('cliff',{x:360,y:28},-1).destination,'city');
});
test('closed paths stop forward travel while retreat stays available',()=>{
  for(const [location,x,y,dy] of [['city',360,75,-1],['checkpoint',374,216,-1],['gate',360,430,1],['grove',390,210,-1]]){
    const route=routes.contact(location,{x,y},dy);assert.ok(route,location);
    assert.equal(routes.blocked(location,x,route.limit+dy),true);
    assert.equal(routes.blocked(location,x,route.trigger-dy*10),false);
    assert.equal(routes.contact(location,{x,y},-dy),undefined);
    assert.equal(routes.near(location,route.id,{x,y}),true);
    assert.equal(routes.near(location,route.id,{x,y:route.trigger-dy*40}),false);
  }
});
test('old saves beyond new seals are placed on the safe side without changing progress',()=>{
  for(const [location,y] of [['checkpoint',100],['gate',468],['grove',195]]){
    const player={x:location==='grove'?390:360,y,dir:'up'};routes.settle(location,player);
    assert.equal(routes.blocked(location,player.x,player.y),false);assert.equal(terrain.blocked(location,player.x,player.y),false);
    assert.equal(player.dir,'up');
  }
  const p={x:500,y:365,dir:'down'};routes.settle('city',p);assert.equal(p.y,365);
});
test('magical southern seal covers the full walkable width with no side bypass',()=>{
  for(const y of [442,455,470])for(let x=0;x<=720;x+=2)
    if(!terrain.blocked('gate',x,y))assert.equal(routes.blocked('gate',x,y),true,'sealed floor '+x+','+y);
});
