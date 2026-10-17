// Seven ASCII code units store six bytes without changing the payload.
// Exclude NUL, CR/LF, quotes, '<', and backslash for an HTML raw-text script.
// Every 48-bit block is an exactly representable JavaScript integer.
function decodePortable(text, length) {
  const alphabet = Array.from({length:128}, (_,i)=>i).filter(i=>![0,10,13,34,39,60,92].includes(i));
  const values = new Int16Array(128).fill(-1);
  alphabet.forEach((code,index)=>values[code]=index);
  if (text.length !== Math.ceil(length/6)*7) throw Error('Invalid portable payload length');
  const bytes = new Uint8Array(Math.ceil(length/6)*6);
  for(let i=0,o=0;i<text.length;i+=7,o+=6) {
    let value=0;
    for(let j=0;j<7;j++) {
      const digit=values[text.charCodeAt(i+j)];
      if(digit===undefined || digit<0) throw Error('Invalid portable payload character');
      value=value*121+digit;
    }
    if(value>=2**48) throw Error('Invalid portable payload block');
    for(let j=5;j>=0;j--) { bytes[o+j]=value%256; value=Math.floor(value/256); }
  }
  return bytes.subarray(0,length);
}
if(typeof module!=='undefined') module.exports={decodePortable};
