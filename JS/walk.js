// A steady, waist-up tracking shot. The portrait never changes anatomy or pose.
const kaniaWalk = (() => {
  const cache=new WeakMap(), PERIOD=1.12;
  function prepare(image){
    if(cache.has(image))return cache.get(image);
    const original=pixelAtlases.make(image,2,2).frames[1].art,
      body=document.createElement('canvas');body.width=original.width;body.height=original.height;
    body.getContext('2d').drawImage(original,0,0);
    const portrait={body,scale:.72,x:230-490*.72,y:34,period:PERIOD};
    cache.set(image,portrait);return portrait;
  }
  function pose(seconds,moving=true){
    const angle=moving?seconds/PERIOD*Math.PI*2:0;
    return {x:moving?Math.sin(angle)*.45:0,y:moving?Math.cos(angle*2)*1.15:0,roll:moving?Math.sin(angle)*.0018:0};
  }
  function draw(ctx,portrait,seconds,x=0,y=58,moving=true){
    const p=pose(seconds,moving);
    ctx.save();ctx.imageSmoothingEnabled=true;
    ctx.translate(x+230+p.x,y+300+p.y);ctx.rotate(p.roll);
    ctx.drawImage(portrait.body,portrait.x-230,portrait.y-300,portrait.body.width*portrait.scale,portrait.body.height*portrait.scale);
    ctx.restore();
    return {frame:Math.floor(((seconds/PERIOD)%1+1)%1*60),pose:p};
  }
  return {prepare,draw,pose,period:PERIOD};
})();
