const {test}=require('node:test');
const assert=require('node:assert/strict');
const {decodePortable}=require('../scripts/portable-codec.cjs');
test('portable decoder preserves all byte values and partial blocks',()=>{
 const alphabet=Array.from({length:128},(_,i)=>i).filter(i=>![0,10,13,34,39,60,92].includes(i));
 for(let length=0;length<520;length++) {
  const bytes=Uint8Array.from({length},(_,i)=>i%256);let encoded='';
  for(let i=0;i<length;i+=6){let value=0n;for(let j=0;j<6;j++)value=value*256n+BigInt(bytes[i+j]||0);let block='';for(let j=0;j<7;j++){block=String.fromCharCode(alphabet[Number(value%121n)])+block;value/=121n;}encoded+=block;}
  assert.deepEqual(decodePortable(encoded,length),bytes);
 }
 assert.throws(()=>decodePortable('bad',6));
 assert.throws(()=>decodePortable('<<<<<<<',6));
 assert.throws(()=>decodePortable('\x7f'.repeat(7),6));
});
