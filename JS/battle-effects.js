// Effects are composed on a small canvas and enlarged on the same pixel grid as the enemy.
const battleEffects = (() => {
  const layer=document.createElement('canvas'),mask=document.createElement('canvas');
  const c=layer.getContext('2d'),m=mask.getContext('2d');
  const clamp=v=>Math.max(0,Math.min(1,v)),ease=v=>{v=clamp(v);return v*v*(3-2*v);};
  function polygon(points,color){c.fillStyle=color;c.beginPath();points.forEach(([x,y],i)=>i?c.lineTo(Math.round(x),Math.round(y)):c.moveTo(Math.round(x),Math.round(y)));c.closePath();c.fill();}
  function star(x,y,r,color){polygon([[x,y-r],[x+2,y-2],[x+r*.7,y],[x+2,y+2],[x,y+r],[x-2,y+2],[x-r*.7,y],[x-2,y-2]],color);}
  function ribbon(x,y,rx,ry,head,length,width,color){
    const points=[];
    for(let i=0;i<=18;i++){const t=i/18,a=head-length+length*t,thickness=Math.sin(t*Math.PI*.85)*width;points.push([x+Math.cos(a)*(rx+thickness),y+Math.sin(a)*(ry+thickness)]);}
    for(let i=18;i>=0;i--){const t=i/18,a=head-length+length*t;points.push([x+Math.cos(a)*rx,y+Math.sin(a)*ry]);}
    polygon(points,color);
  }
  function sparks(x,y,t,size,guard){
    const duration=.64,p=clamp(t/duration);
    c.globalAlpha=1-ease(p);
    for(let i=0;i<25;i++){
      const a=i*2.399+Math.sin(i*8.3)*.3,speed=size*(.16+(i%7)*.053),r=speed*(p*.95),
        xx=x+Math.cos(a)*r,yy=y+Math.sin(a)*r+p*p*size*.12,
        length=(1-p)*(3+i%4),dx=Math.cos(a)*length,dy=Math.sin(a)*length;
      const color=guard?['#ffe4a2','#a5c5d8','#c99057'][i%3]:['#fff0b9','#e98379','#f7bb72'][i%3];
      polygon([[xx,yy],[xx+dx,yy+dy],[xx+dx+2,yy+dy+1],[xx+1,yy+2]],color);
      if(i%6===0)c.fillRect(Math.round(xx+2),Math.round(yy+2),2,2);
    }
    c.globalAlpha=1;
  }
  function draw(ctx,{w,h,enemy,enemySheet,frame,stage,age,reaction,damage,motion}){
    if(!['attack','impact'].includes(stage))return;
    const scale=2,width=Math.ceil(w/scale),height=Math.ceil(h/scale);
    if(layer.width!==width||layer.height!==height){layer.width=mask.width=width;layer.height=mask.height=height;}
    c.clearRect(0,0,width,height);c.imageSmoothingEnabled=false;
    const x=enemy.x/scale,y=(enemy.ground-enemy.height*.53)/scale,size=enemy.height/scale;
    if(stage==='attack'){
      const t=age-.4,guard=reaction==='guard',glance=reaction==='dodge',p=clamp((age-.23)/.36),head=-1.05+p*3.0;
      if(motion&&age>.1&&age<.3){const light=Math.sin((age-.1)/.2*Math.PI);c.globalAlpha=light;star(x+size*.51,y-size*.26,4,'#ffefba');c.globalAlpha=1;}
      if(age>=.23&&age<.85){
        const fade=1-ease((age-.58)/.27);c.globalAlpha=(motion?1:.6)*fade;
        if(motion){ribbon(x,y,size*.42,size*.34,head,1.7,9,'#294c68');ribbon(x,y,size*.42,size*.34,head,1.55,6,'#76c5e2');}
        ribbon(x,y,size*.42,size*.34,head,1.4,3.5,'#fff6cf');
        if(motion)ribbon(x-size*.035,y+size*.025,size*.41,size*.34,head-.30,1.2,1.3,'#e4bb72');
        c.globalAlpha=1;
      }
      const hitX=x+size*(guard?.045:glance?-.18:.02),hitY=y-size*.015;
      if(t>=0&&t<.72){
        if(!glance&&enemySheet&&t<.13){
          m.clearRect(0,0,width,height);m.globalCompositeOperation='source-over';
          pixelAtlases.draw(m,enemySheet,frame,enemy.x/scale,enemy.ground/scale,enemy.height/scale);
          m.globalCompositeOperation='source-in';m.fillStyle=guard?'#e6cb8c':'#fff0ce';m.fillRect(0,0,width,height);
          c.globalAlpha=(1-t/.13)*.55;c.drawImage(mask,0,0);c.globalAlpha=1;
        }
        if(guard){
          const r=size*(.11+ease(t/.3)*.10);c.globalAlpha=1-ease(t/.55);c.strokeStyle='#dfb974';c.lineWidth=2;
          c.beginPath();for(let i=0;i<=8;i++){const a=i*Math.PI/4;c.lineTo(Math.round(hitX+Math.cos(a)*r),Math.round(hitY+Math.sin(a)*r));}c.stroke();c.globalAlpha=1;
        }
        if(glance){
          c.globalAlpha=1-ease(t/.5);
          for(let i=0;i<3;i++)ribbon(x+size*.10,y+(i-1)*size*.10,size*.33,size*.13,.9+t*2,1.3,1.2,'#9cafc7');
          c.globalAlpha=1;
        }else{
          if(motion)sparks(hitX,hitY,t,size,guard);
          const flash=(1-ease(t/.27))*(guard?.11:.16)*size;
          if(flash>0){star(hitX,hitY,flash,guard?'#e8e1b0':'#f7c278');star(hitX,hitY,flash*.62,'#fff8e2');}
        }
      }
      if(t>=.05&&t<1.17){
        const rise=motion?Math.sin(clamp(t/.26)*Math.PI/2)*10+t*5:8,numberY=y-size*.43-rise;
        c.globalAlpha=1-ease((t-.76)/.3);c.textAlign='center';c.textBaseline='middle';
        c.font=`${Math.max(16,Math.round(size*.15))}px Galmuri,monospace`;c.lineWidth=3;c.strokeStyle='#080b12';c.strokeText(String(damage),x,numberY);c.fillStyle=guard?'#d4d7e7':glance?'#b8cadc':'#ffe9a6';c.fillText(String(damage),x,numberY);
        c.font=`${Math.max(8,Math.round(size*.058))}px Galmuri,monospace`;c.strokeText(guard?'방어':glance?'스침':'적중',x,numberY+size*.12);c.fillText(guard?'방어':glance?'스침':'적중',x,numberY+size*.12);c.globalAlpha=1;
      }
    }else if(stage==='impact'&&age<.8){
      const impactY=(enemy.ground-enemy.height*.60)/scale,p=ease(age/.8);
      c.globalAlpha=1-p;
      if(motion){sparks(x,impactY,age,size*.65,true);c.globalAlpha=1-p;}
      star(x,impactY,Math.max(0,1-ease(age/.3))*size*.15,'#eaffca');
      if(motion)for(let i=0;i<8;i++){const a=i*Math.PI/4,r=size*(.06+p*.30);star(x+Math.cos(a)*r,impactY+Math.sin(a)*r,2,'#c8efbb');}
      c.globalAlpha=1;
    }
    ctx.save();ctx.imageSmoothingEnabled=false;ctx.drawImage(layer,0,0,width*scale,height*scale);ctx.restore();
  }
  return {draw};
})();
