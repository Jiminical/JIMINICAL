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
  function arrowShaft(x,y,angle,size,shake=0){
    const length=Math.max(26,size*.24),cs=Math.cos(angle),sn=Math.sin(angle),
      at=(along,across)=>[x+cs*along-sn*(across+shake),y+sn*along+cs*(across+shake)],
      shape=(points,color)=>polygon(points.map(([a,b])=>at(a,b)),color);
    shape([[-length,-2],[-4,-2],[-4,2],[-length,2]],'#42384d');
    shape([[-length,-1],[-4,-1],[-4,0],[-length,0]],'#ead39f');
    shape([[4,0],[-7,-4],[-5,0],[-7,4]],'#f8fff5');
    shape([[3,0],[-5,1],[-7,4]],'#9ec7cf');
    shape([[-length+8,0],[-length-4,-6],[-length-2,-1]],'#8ca89a');
    shape([[-length+8,1],[-length-4,6],[-length-2,1]],'#d5e2bf');
    shape([[-length+5,-1],[-length-3,-4],[-length-2,-2]],'#f4e8ba');
  }
  function lightning(x,y,angle,length,spread,phase,alpha=1){
    const cs=Math.cos(angle),sn=Math.sin(angle),points=[];
    for(let i=0;i<=12;i++){
      const p=i/12,jag=i===0||i===12?0:Math.sin(i*7.13+phase)*spread*Math.sin(p*Math.PI);
      points.push([Math.round(x+cs*length*p-sn*jag),Math.round(y+sn*length*p+cs*jag)]);
    }
    c.save();c.globalAlpha*=alpha;c.lineJoin='miter';
    for(const [color,width] of [['#287a51',4],['#89ef9b',2],['#efffd0',1]]){
      c.strokeStyle=color;c.lineWidth=width;c.beginPath();
      points.forEach(([xx,yy],i)=>i?c.lineTo(xx,yy):c.moveTo(xx,yy));c.stroke();
    }
    c.restore();
  }
  function enchantedTrail(x,y,angle,size,age){
    const cs=Math.cos(angle),sn=Math.sin(angle),length=size*.85,
      at=(along,across)=>[x+cs*along-sn*across,y+sn*along+cs*across],
      shape=(points,color,alpha)=>{c.globalAlpha=alpha;polygon(points.map(([a,b])=>at(a,b)),color);};
    shape([[-length,0],[-length*.5,-7],[-12,-9],[8,0],[-12,9],[-length*.5,7]],'#287a51',.55);
    shape([[-length*.9,0],[-28,-4],[7,0],[-28,4]],'#8feaa3',.9);
    shape([[-length*.72,0],[-12,-1],[8,0],[-12,1]],'#f1ffce',1);
    for(let i=0;i<3;i++){
      const [xx,yy]=at(-9,(i-1)*5);
      lightning(xx,yy,angle+Math.PI,length*(.64+i*.12),5+i*2,Math.floor(age*65)+i*4,.8);
    }
    for(let i=0;i<12;i++){
      const along=-12-((age*170+i*13)%length),across=Math.sin(i*9+age*24)*(5+(i%4)*2),[xx,yy]=at(along,across);
      c.globalAlpha=(1-Math.abs(along)/length)*.9;
      star(xx,yy,1+i%2,i%3?'#a9ef99':'#faffd5');
    }
    c.globalAlpha=1;
  }
  function forehead(enemy,sheet,frame){
    const anchors=[[.51,.35],[.46,.32],[.49,.37],[.50,.34],[.23,.34],[.77,.35],[.66,.16],[.36,.44]],
      f=sheet.frames[frame%sheet.frames.length],head=anchors[frame%anchors.length],s=enemy.height/sheet.height;
    return {x:enemy.x+(f.art.width*head[0]-f.anchor)*s,y:enemy.ground-(f.bottom-f.art.height*head[1])*s};
  }
  function arrowStrike({enemy,enemySheet,frame,previousFrame,poseBlend,stage,age,motion},scale,width,height){
    const actor={...enemy,ground:enemy.ground+(stage==='dissolve'?age*8:0)},
      target=forehead(actor,enemySheet,frame),previous=forehead(actor,enemySheet,previousFrame??frame),blend=poseBlend??1,
      x=(previous.x+(target.x-previous.x)*blend)/scale,y=(previous.y+(target.y-previous.y)*blend)/scale,size=enemy.height/scale,
      start={x:width+35,y:height*.15},angle=Math.atan2(y-start.y,x-start.x),
      cs=Math.cos(angle),sn=Math.sin(angle);
    if(stage==='arrow'){
      const t=clamp(age/.18),xx=start.x+(x-start.x)*t,yy=start.y+(y-start.y)*t;
      if(motion){
        enchantedTrail(xx,yy,angle,size,age);
      }
      arrowShaft(xx,yy,angle,size);
      return;
    }
    const dissolve=stage==='dissolve',time=dissolve?1.2+age:age;
    // The shaft remains lodged in the forehead and fades with the enemy.
    c.save(); c.globalAlpha=dissolve?1-ease((age-.35)/1.8):1;
    arrowShaft(x+cs*3,y+sn*3,angle,size,motion&&time<.27?Math.sin(time*105)*(1-time/.27)*1.7:0);
    if(motion&&time<1.05){
      const glow=1-ease(time/1.05);
      lightning(x-cs*6,y-sn*6,angle+Math.PI,size*.22,3,Math.floor(time*30),glow*.85);
    }
    c.restore();
    if(dissolve)return;
    if(!motion){if(age<.28)star(x,y,size*.055,'#ccf2ab');return;}
    if(age<.12&&enemySheet){
      m.clearRect(0,0,width,height);m.globalCompositeOperation='source-over';
      pixelAtlases.draw(m,enemySheet,frame,enemy.x/scale,enemy.ground/scale,enemy.height/scale);
      m.globalCompositeOperation='source-in';m.fillStyle='#e5ffd3';m.fillRect(0,0,width,height);
      c.globalAlpha=(1-age/.12)*.72;c.drawImage(mask,0,0);c.globalAlpha=1;
    }
    if(age<.16){
      const length=size*.6,thickness=(1-age/.16)*3;
      polygon([[x-cs*length-sn*thickness,y-sn*length+cs*thickness],
        [x+cs*length,y+sn*length],[x-cs*length+sn*thickness,y-sn*length-cs*thickness]],'#e7ffc0');
    }
    const flash=1-ease(age/.27);
    if(flash>0){
      star(x,y,size*.25*flash,'#399c66');star(x,y,size*.17*flash,'#a7ed96');
      star(x,y,size*.075*flash,'#fffef0');
    }
    if(age>.025&&age<.65){
      const p=clamp((age-.025)/.625),radius=size*(.055+ease(p)*.42);
      for(let ring=0;ring<2;ring++){
        const r=radius*(ring?.7:1);c.globalAlpha=(1-p)*(ring?.4:.9);c.strokeStyle=ring?'#e4ffc6':'#83db93';c.lineWidth=p<.25?2:1;
        c.beginPath();for(let i=0;i<=12;i++){const a=i*Math.PI/6;c.lineTo(Math.round(x+Math.cos(a)*r),Math.round(y+Math.sin(a)*r*.61));}c.stroke();
      }
      for(let i=0;i<6;i++){
        const a=i*Math.PI/3+.25,xx=x+Math.cos(a)*radius,yy=y+Math.sin(a)*radius*.61;
        c.globalAlpha=(1-p)*.75;star(xx,yy,2,'#dcffb6');
        if(age<.42)lightning(x+Math.cos(a)*5,y+Math.sin(a)*5,a,radius*.8,6,Math.floor(age*40)+i,(1-p)*.65);
      }
      c.globalAlpha=1;
    }
    if(age<1.05)for(let i=0;i<26;i++){
      const a=i*2.399,speed=size*(.18+(i%5)*.05),t=age,
        xx=x+Math.cos(a)*speed*t,yy=y+Math.sin(a)*speed*t+t*t*size*.28,
        r=(1-ease(t/1.05))*(1.4+i%3);
      c.globalAlpha=1-ease((t-.4)/.65);
      if(i%3===0){polygon([[xx-r,yy],[xx,yy-r*1.6],[xx+r,yy],[xx,yy+r]],'#403b56');c.fillStyle='#d5977a';c.fillRect(Math.round(xx),Math.round(yy-r),1,1);}
      else star(xx,yy,r,i%2?'#d8f5ad':'#70d595');
    }
    c.globalAlpha=1;
  }
  function draw(ctx,{w,h,enemy,enemySheet,frame,previousFrame,poseBlend,stage,age,reaction,damage,motion}){
    if(!['attack','arrow','impact','dissolve'].includes(stage))return;
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
    }else arrowStrike({enemy,enemySheet,frame,previousFrame,poseBlend,stage,age,motion},scale,width,height);
    ctx.save();ctx.imageSmoothingEnabled=false;ctx.drawImage(layer,0,0,width*scale,height*scale);ctx.restore();
  }
  return {draw,forehead};
})();
