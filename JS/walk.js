// One character drawing, articulated limbs, and ground-locked support feet.
const kaniaWalk = (() => {
  const cache = new WeakMap(), COUNT = 60, STRIDE = 80, SUPPORT = .62;
  const ease = v => v*v*(3-2*v);
  function pose(phase) {
    phase = ((phase % 1) + 1) % 1;
    const bob = 2.7 * Math.cos(phase * Math.PI * 4);
    const legs = [0, .5].map((offset, index) => {
      const u = (phase + offset) % 1, planted = u < SUPPORT,
        swing = Math.max(0, (u - SUPPORT) / (1 - SUPPORT)),
        x = planted ? STRIDE/2 - STRIDE*u/SUPPORT : -STRIDE/2 + STRIDE*ease(swing),
        lift = planted ? 0 : 24 * Math.sin(Math.PI*swing),
        hip = { x:279 + (index ? 5 : -7), y:294+bob },
        ankle = { x:279+x+(index?5:-7), y:410-lift },
        dx=ankle.x-hip.x, dy=ankle.y-hip.y, distance=Math.hypot(dx,dy),
        upper=59, lower=65, a=(upper*upper-lower*lower+distance*distance)/(2*distance),
        bend=Math.sqrt(Math.max(0,upper*upper-a*a)),
        knee={x:hip.x+dx*a/distance+dy*bend/distance,y:hip.y+dy*a/distance-dx*bend/distance};
      return {hip,knee,ankle,planted,lift,footAngle:planted?0:-.16*Math.sin(swing*Math.PI)};
    });
    return {bob,legs,arm:Math.cos(phase*Math.PI*2)*.17};
  }
  function prepare(image) {
    if(cache.has(image))return cache.get(image);
    const source=pixelAtlases.make(image,4,2).frames[0].art;
    const make = () => { const art=document.createElement('canvas');art.width=source.width;art.height=source.height;return art; };
    function path(ctx,points){ctx.beginPath();points.forEach(([x,y],i)=>i?ctx.lineTo(x,y):ctx.moveTo(x,y));ctx.closePath();}
    function cut(points) {const art=make(),ctx=art.getContext('2d');path(ctx,points);ctx.clip();ctx.drawImage(source,0,0);return art;}
    const nearMask=[[231,218],[257,228],[246,257],[238,276],[235,303],[224,321],[207,325],[188,313],[190,286],[202,260],[214,239]],
      farMask=[[326,234],[345,242],[365,257],[391,259],[405,272],[400,292],[379,298],[353,287],[335,278],[325,258]],
      nearArm=cut(nearMask),farArm=cut(farMask),
      calf=cut([[295,339],[328,337],[340,368],[353,398],[347,411],[314,410],[306,389],[299,366]]),
      foot=cut([[316,396],[347,393],[365,398],[388,398],[402,408],[405,425],[387,436],[321,438],[309,423]]),
      body=cut([[0,0],[444,0],[444,306],[346,306],[329,296],[302,294],[288,311],[254,312],[228,333],[203,349],[164,357],[123,341],[0,330]]),
      ctx=body.getContext('2d');
    ctx.globalCompositeOperation='destination-out';ctx.drawImage(nearArm,0,0);ctx.drawImage(farArm,0,0);ctx.globalCompositeOperation='source-over';
    // Cloth stays behind the moving arm; the face, armour and torso never swap drawings.
    const lining=make(),l=lining.getContext('2d');l.drawImage(nearArm,0,0);l.globalCompositeOperation='source-in';l.fillStyle='#1b4736';l.fillRect(0,0,444,444);
    const frames=[];
    function poly(p,points,color,stroke){path(p,points);p.fillStyle=color;p.fill();if(stroke){p.strokeStyle=stroke;p.lineWidth=2;p.stroke();}}
    function limb(p,art,pivot,angle,x,y,scale=1){p.save();p.translate(x,y);p.rotate(angle);p.scale(scale,scale);p.drawImage(art,-pivot.x,-pivot.y);p.restore();}
    function leg(p,leg,dark){
      const {hip,knee,ankle}=leg,dx=knee.x-hip.x,dy=knee.y-hip.y,len=Math.hypot(dx,dy),nx=dy/len,ny=-dx/len;
      poly(p,[[hip.x-nx*17,hip.y-ny*17],[hip.x+nx*17,hip.y+ny*17],[knee.x+nx*13,knee.y+ny*13],[knee.x-nx*13,knee.y-ny*13]],dark?'#19252a':'#253336','#0b161c');
      poly(p,[[hip.x+nx*5,hip.y+ny*5],[hip.x+nx*12,hip.y+ny*12],[knee.x+nx*8,knee.y+ny*8],[knee.x+nx*2,knee.y+ny*2]],dark?'#263337':'#3c4945');
      const angle=Math.atan2(ankle.y-knee.y,ankle.x-knee.x)-Math.atan2(59,26);
      limb(p,calf,{x:310,y:350},angle,knee.x,knee.y,65/Math.hypot(59,26));
      limb(p,foot,{x:336,y:410},leg.footAngle,ankle.x,ankle.y);
      if(dark){p.save();p.globalCompositeOperation='source-atop';p.globalAlpha=.13;poly(p,[[hip.x-22,hip.y],[hip.x+23,hip.y],[ankle.x+68,ankle.y+29],[ankle.x-30,ankle.y+29]],'#081726');p.restore();}
    }
    for(let i=0;i<COUNT;i++){
      const art=document.createElement('canvas');art.width=280;art.height=240;
      const p=art.getContext('2d',{willReadFrequently:true}),s=pose(i/COUNT);p.imageSmoothingEnabled=false;
      p.translate(5.5,11);p.scale(.5,.5);
      leg(p,s.legs[0],true);
      limb(p,farArm,{x:329,y:241},s.arm,329,241+s.bob);
      leg(p,s.legs[1],false);
      p.drawImage(lining,0,s.bob);p.drawImage(body,0,s.bob);
      limb(p,nearArm,{x:242,y:228},-s.arm,242,228+s.bob);
      p.setTransform(1,0,0,1,0,0);
      const pixels=p.getImageData(0,0,280,240);for(let j=3;j<pixels.data.length;j+=4)pixels.data[j]=pixels.data[j]>=96?255:0;p.putImageData(pixels,0,0);
      frames.push(art);
    }
    const rig={frames,height:211,anchor:145,ground:230};cache.set(image,rig);return rig;
  }
  function phaseAt(seconds,height=222,speed=72){return seconds/(STRIDE*(height/211*.5)/(speed*SUPPORT));}
  function draw(ctx,rig,seconds,x,ground,height=222,moving=true){
    const phase=moving?phaseAt(seconds,height):0,index=Math.floor(((phase%1)+1)%1*COUNT),scale=height/rig.height;
    ctx.drawImage(rig.frames[index],Math.round(x-rig.anchor*scale),Math.round(ground-rig.ground*scale),rig.frames[index].width*scale,rig.frames[index].height*scale);
    return {frame:index,phase:((phase%1)+1)%1,pose:pose(phase)};
  }
  return {prepare,draw,pose,phaseAt};
})();
