// First-person artwork is rasterized once onto a 160px grid, then enlarged without smoothing.
const firstPersonArms = (() => {
  const cache=new WeakMap(), SIZE=160, pivots=[[.62,.69],[.41,.63],[.62,.63],[.12,.96]];
  function prepare(image){
    if(cache.has(image))return cache.get(image);
    const source=pixelAtlases.make(image,2,2);
    const frames=source.frames.map(f=>{
      const art=document.createElement('canvas');art.width=SIZE;art.height=SIZE;
      const p=art.getContext('2d',{willReadFrequently:true});p.imageSmoothingEnabled=false;
      const s=SIZE/f.art.width;p.drawImage(f.art,0,SIZE-f.art.height*s,SIZE,f.art.height*s);
      const data=p.getImageData(0,0,SIZE,SIZE);for(let i=3;i<data.data.length;i+=4)data.data[i]=data.data[i]>=112?255:0;p.putImageData(data,0,0);
      return art;
    });
    const sheet={frames};cache.set(image,sheet);return sheet;
  }
  function draw(ctx,sheet,{width:w,height:h,portrait,stage,age,elapsed,motion,opacity=1}){
    let frame=0,progress=0;
    if(stage==='attack'){frame=age<.23?1:age<.76?2:0;progress=Math.sin(Math.min(1,age/1.1)*Math.PI);}
    const height=h*(portrait?.31:.54),hand={x:w*(portrait?.47:.61)-progress*w*.065,y:h*(portrait?.73:.70)-progress*h*.035},
      settle=motion?Math.sin(elapsed*1.4)*.9:0,pivot=pivots[frame];
    ctx.save();ctx.imageSmoothingEnabled=false;ctx.globalAlpha=opacity;
    // The off hand is independent of the sword arm.
    const leftHeight=h*(portrait?.17:.26);
    ctx.drawImage(sheet.frames[3],Math.round(w*.035),Math.round(h*.91-leftHeight+settle),leftHeight,leftHeight);
    ctx.translate(Math.round(hand.x),Math.round(hand.y+settle));
    if(stage==='attack'&&motion)ctx.rotate(-progress*.08);
    ctx.drawImage(sheet.frames[frame],-Math.round(pivot[0]*height),-Math.round(pivot[1]*height),Math.round(height),Math.round(height));
    ctx.restore();
  }
  return {prepare,draw};
})();
