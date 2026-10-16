// Scenic overlook: actual waterfall textures flow through fixed masks; wildlife crosses the vista.
const scenicLandscape = (() => {
  const falls=[
    {points:[[1295,285],[1439,276],[1434,405],[1422,500],[1407,548],[1354,550],[1317,524]],texture:[1350,355,35,72],speed:126},
    {points:[[1130,340],[1194,332],[1190,429],[1174,480],[1140,477]],texture:[1143,362,20,60],speed:104},
    {points:[[1024,471],[1083,472],[1091,547],[1066,570],[1029,558]],texture:[1043,493,21,40],speed:98},
  ];
  const birdFrames=[['#.....#','.##.##.','...#...'],['.......','.##.##.','#..#..#']];
  function bird(ctx,x,y,size,frame,color){ctx.fillStyle=color;birdFrames[frame%2].forEach((row,yy)=>[...row].forEach((p,xx)=>{if(p==='#')ctx.fillRect(Math.round(x+xx*size),Math.round(y+yy*size),size,size);}));}
  function fairy(ctx,x,y,t,index){
    const flap=Math.sin(t*13+index)>0,colors=['#d0fff0','#f7e6a0','#c8d8ff'],color=colors[index%3];
    ctx.save();ctx.globalCompositeOperation='lighter';
    for(let i=5;i>0;i--){ctx.globalAlpha=(1-i/6)*.22;ctx.fillStyle=color;ctx.fillRect(Math.round(x-i*4),Math.round(y+Math.sin(t*3-i*.35)*3),1,1);}
    ctx.globalAlpha=.24;ctx.fillStyle=color;ctx.fillRect(Math.round(x-4),Math.round(y-3),9,8);
    ctx.globalAlpha=.9;ctx.fillStyle='#f1fff7';
    const wing=flap?[[ -4,-3],[-3,-4],[2,-4],[3,-3]]:[[-4,0],[-3,1],[2,1],[3,0]];
    wing.forEach(([dx,dy])=>ctx.fillRect(Math.round(x+dx),Math.round(y+dy),2,2));
    ctx.fillStyle=color;ctx.fillRect(Math.round(x),Math.round(y-2),2,4);ctx.fillStyle='#ffffff';ctx.fillRect(Math.round(x),Math.round(y-3),1,1);ctx.restore();
  }
  function draw(ctx,image,seconds,moving=true){
    const t=moving?seconds:0,sw=1350,sh=sw*344/720,sx=100+Math.min(t,10.5)*6,sy=110;
    ctx.save();ctx.beginPath();ctx.rect(0,58,720,344);ctx.clip();
    ctx.translate(0,58);ctx.scale(720/sw,344/sh);ctx.translate(-sx,-sy);
    ctx.drawImage(image,0,0);
    if(moving)for(let index=0;index<falls.length;index++){
      const fall=falls[index],xs=fall.points.map(p=>p[0]),ys=fall.points.map(p=>p[1]),left=Math.min(...xs),right=Math.max(...xs),top=Math.min(...ys),bottom=Math.max(...ys),[tx,ty,tw,th]=fall.texture;
      ctx.save();ctx.beginPath();fall.points.forEach(([x,y],i)=>i?ctx.lineTo(x,y):ctx.moveTo(x,y));ctx.closePath();ctx.clip();
      ctx.globalAlpha=.30;
      for(let x=left-4;x<right+12;x+=tw){const offset=(t*fall.speed+(x-left)*.37)%th;
        for(let y=top-th+offset;y<bottom+th;y+=th)ctx.drawImage(image,tx,ty,tw,th,x,y,tw,th);}
      for(let i=0;i<16;i++){const x=left+5+(i*17)%(right-left-10),y=top+((t*(fall.speed+index*17)+i*29)%(bottom-top+55))-55;
        ctx.globalAlpha=.16+(i%3)*.08;ctx.fillStyle=i%2?'#e9ffff':'#a4e4f6';ctx.fillRect(x,y,2+i%2,13+i%4*8);}
      ctx.restore();
      // Ragged, translucent mist puffs and foam at the foot of the falls.
      for(let i=0;i<5;i++){const x=(left+right)/2+Math.sin(t*.55+i*1.7)*(right-left)*.45,y=bottom-8+Math.sin(t*.8+i)*7;
        ctx.globalAlpha=.10;ctx.fillStyle='#e1f9ff';ctx.fillRect(x-23,y,48,7);ctx.fillRect(x-15,y-5,32,17);}
      ctx.globalAlpha=.28;ctx.fillStyle='#d4faff';for(let i=0;i<6;i++){const x=left-20+((t*15+i*33)%(right-left+50));ctx.fillRect(x,bottom+7+i%2*7,15+i%3*7,2);}
    }
    ctx.restore();ctx.globalAlpha=1;
    for(let i=0;i<9;i++){
      const x=745-((t*17+i*29)%820),y=104+i%3*9+Math.sin(t*.8+i*.7)*8;
      bird(ctx,x,y,i<4?1:1.4,Math.floor(t*5+i)%2,i<4?'#526d7c':'#ebf7ee');
    }
    for(let i=0;i<5;i++)fairy(ctx,430+i*47+Math.sin(t*.8+i)*30,180+i%3*40+Math.sin(t*1.3+i*1.8)*15,t,i);
    return {pan:sx,flow:t*falls[0].speed,birds:9,fairies:5};
  }
  return {draw};
})();
