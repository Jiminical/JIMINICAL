// Small native-resolution canvases keep the command plaques and emblems on a pixel grid.
const battleMenuArt = (() => {
  const cache = new WeakMap();
  const outline = [[4,6],[15,6],[15,4],[45,4],[45,2],[75,2],[75,3],[108,3],[108,5],[116,5],[116,8],[119,8],[119,17],[117,17],[117,29],[119,29],[119,39],[116,39],[116,44],[95,44],[95,46],[70,46],[70,44],[40,44],[40,46],[9,46],[9,44],[3,44],[3,37],[1,37],[1,23],[3,23],[3,10],[4,10]];
  function frame(selected, variant) {
    const canvas=document.createElement('canvas');canvas.width=120;canvas.height=48;
    const c=canvas.getContext('2d');c.beginPath();outline.forEach(([x,y],i)=>i?c.lineTo(x,y):c.moveTo(x,y));c.closePath();c.fill();
    const mask=c.getImageData(0,0,120,48).data, image=c.createImageData(120,48),d=image.data;
    const ink=selected?[38,32,40]:[15,19,29],edge=selected?[255,225,157]:[181,152,110];
    const inside=(x,y)=>x>=0&&x<120&&y>=0&&y<48&&mask[(y*120+x)*4+3]>200;
    for(let y=0;y<48;y++)for(let x=0;x<120;x++){
      if(!inside(x,y))continue;
      let distance=4;
      for(let r=1;r<=3;r++)if(!inside(x-r,y)||!inside(x+r,y)||!inside(x,y-r)||!inside(x,y+r)){distance=r;break;}
      let rgb=ink;
      if(distance===1)rgb=[63,44,49];
      if(distance===2)rgb=edge;
      if(distance===3)rgb=y<24?[233,206,155]:[104,76,64];
      if(distance===4&&(x*17+y*31+variant*19)%137===0)rgb=selected?[67,54,49]:[36,32,39];
      const i=(y*120+x)*4;d[i]=rgb[0];d[i+1]=rgb[1];d[i+2]=rgb[2];d[i+3]=255;
    }
    c.putImageData(image,0,0);
    for(const [x,y] of [[8,10],[110,10],[9,38]]){c.fillStyle='#5b4040';c.fillRect(x,y,3,3);c.fillStyle=selected?'#fff1bd':'#d6b580';c.fillRect(x,y,2,1);}
    // A tiny wax seal and a hand-cut gilt star lend the old plaque some playful character.
    c.fillStyle='#583245';c.fillRect(105,33,8,8);c.fillRect(103,35,12,4);
    c.fillStyle=selected?'#de6f80':'#a75064';c.fillRect(106,34,6,6);c.fillRect(104,36,10,2);
    c.fillStyle='#f0c18c';c.fillRect(108,35,2,4);c.fillRect(107,36,4,1);
    c.fillStyle=selected?'#fff2b8':'#b7a080';c.fillRect(98,12,1,5);c.fillRect(96,14,5,1);c.fillRect(101,10,1,1);
    return c.getImageData(0,0,120,48);
  }
  function icon(canvas,kind){
    const c=canvas.getContext('2d');c.clearRect(0,0,16,16);
    const rect=(color,x,y,w,h)=>{c.fillStyle=color;c.fillRect(x,y,w,h);};
    if(kind==='attack'){
      for(let i=0;i<9;i++){rect('#c4cbd0',11-i,1+i,2,2);rect('#f6efe0',11-i,1+i,1,1);}
      rect('#4a3740',3,10,4,3);rect('#e4b46e',2,9,7,2);rect('#e4b46e',6,8,2,5);rect('#714b42',2,12,3,3);rect('#f0cf8a',1,14,2,2);
    }else if(kind==='info'){
      rect('#553e45',1,3,14,11);rect('#c9ad79',2,2,12,11);rect('#f0dec0',3,3,4,8);rect('#dfcba3',8,3,5,8);rect('#795e52',7,3,1,10);
      rect('#aa5b69',10,3,2,7);rect('#8d8171',4,5,2,1);rect('#8d8171',4,8,2,1);rect('#ece0bf',2,12,11,1);
    }else{
      rect('#4c3540',4,1,8,3);rect('#d0ad75',5,1,6,1);rect('#62463e',2,5,12,9);rect('#a7744e',3,4,10,9);rect('#d8a46a',3,4,10,2);rect('#765146',2,7,12,3);
      rect('#ecd09b',6,7,4,4);rect('#77bfa8',7,8,2,2);rect('#d8a46a',4,12,2,1);rect('#493745',4,14,8,1);
    }
  }
  function update(buttons){buttons.forEach(button=>{const entry=cache.get(button);if(!entry)return;const active=button.classList.contains('is-selected')||button.matches(':hover,:focus-visible');entry.canvas.getContext('2d').putImageData(entry.frames[Number(active)],0,0);});}
  function prepare(buttons){buttons.forEach((button,i)=>{if(cache.has(button))return;let canvas=button.querySelector('.battle-command-frame');if(!canvas){canvas=document.createElement('canvas');canvas.width=120;canvas.height=48;canvas.className='battle-command-frame';canvas.setAttribute('aria-hidden','true');button.append(canvas);}cache.set(button,{canvas,frames:[frame(false,i),frame(true,i)]});const emblem=button.querySelector('.battle-command-icon');if(emblem)icon(emblem,button.dataset.battleCommand);button.addEventListener('pointerenter',()=>update(buttons));button.addEventListener('pointerleave',()=>update(buttons));button.addEventListener('focus',()=>update(buttons));button.addEventListener('blur',()=>update(buttons));});update(buttons);}
  return {prepare,update};
})();
