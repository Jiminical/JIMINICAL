"""Package the game as index.html plus a few media scripts, each below 25 MB."""
from pathlib import Path
import base64
import re
import shutil

ROOT=Path(__file__).resolve().parent.parent
OUT=ROOT/'dist-cloudflare-compact'
LIMIT=20_000_000
if OUT.exists() and not (OUT/'.greenstoa-compact-build').exists():
    raise SystemExit('Refusing to replace an unmarked output directory.')
# Use the template's exact dependency order; no prebuilt HTML is required.
page=(ROOT/'templates/index.html').read_text(encoding='utf-8')
css=re.findall(r'<link rel="stylesheet" href="(CSS/[^"]+)"',page)
programs=re.findall(r'<script src="(JS/[^"]+)" defer></script>',page)
styles='\n'.join((ROOT/name).read_text(encoding='utf-8') for name in css)
script='\n'.join((ROOT/name).read_text(encoding='utf-8') for name in programs)
for ref in sorted(set(re.findall(r'(?:\.\./)?assets/[a-zA-Z0-9_./-]+\.(?:png|webp|woff2|svg)',styles))):
 path=ROOT/ref.removeprefix('../')
 mime={'.png':'image/png','.webp':'image/webp','.woff2':'font/woff2','.svg':'image/svg+xml'}[path.suffix]
 styles=styles.replace(ref,'data:'+mime+';base64,'+base64.b64encode(path.read_bytes()).decode('ascii'))
styles='/* Galmuri font license:\n'+(ROOT/'assets/fonts/LICENSE.txt').read_text(encoding='utf-8')+'\n*/\n'+styles
refs=sorted(set(re.findall(r'assets/[a-zA-Z0-9_./-]+\.(?:png|webp)',page)))
entries=[]
for ref in refs:
    path=ROOT/ref
    mime='image/webp' if path.suffix=='.webp' else 'image/png'
    uri=f'data:{mime};base64,'+base64.b64encode(path.read_bytes()).decode('ascii')
    entries.append(f'window.__greenstoaMedia[{ref!r}]={uri!r};\n')
chunks=[];current=''
for entry in entries:
    if len(entry.encode())>=LIMIT:raise SystemExit('One media entry exceeds the chunk budget.')
    if current and len((current+entry).encode())>LIMIT:
        chunks.append(current);current=''
    current+=entry
if current:chunks.append(current)
page=re.sub(r'\s*<link rel="stylesheet" href="CSS/[^"]+"\s*/?>','',page)
page=re.sub(r'\s*<script src="JS/[^"]+" defer></script>','',page)
page=page.replace('</head>','<style id="greenstoa-styles">\n'+styles+'\n</style>\n</head>')
loader='''<script>
window.__greenstoaMedia=Object.create(null);
window.__greenstoaParts=0;
window.__greenstoaLoadFailed=false;
window.__greenstoaProgress=function(){
 if(window.__greenstoaLoadFailed)return;
 const label=document.querySelector('#boot-status');label.hidden=false;
 label.textContent='게임 자료를 불러오는 중… ('+(++window.__greenstoaParts)+' / PARTS)';
};
window.__greenstoaFailure=function(){
 window.__greenstoaLoadFailed=true;const label=document.querySelector('#boot-status');label.hidden=false;
 label.textContent='게임 자료를 불러오지 못했습니다. index.html과 media-숫자.js 파일을 모두 같은 폴더에 올렸는지 확인해 주세요.';
};
new MutationObserver(function(records,observer){
 if(!document.documentElement.classList.contains('is-loading')){document.querySelector('#boot-status').hidden=true;observer.disconnect();}
}).observe(document.documentElement,{attributes:true,attributeFilter:['class']});
document.querySelector('#boot-status').hidden=false;
document.querySelector('#boot-status').textContent='게임 자료를 불러오는 중…';
</script>
'''.replace('PARTS',str(len(chunks)))
for i in range(len(chunks)):
    loader+=f'<script src="media-{i+1}.js" onload="__greenstoaProgress()" onerror="__greenstoaFailure()"></script>\n'
loader+='''<script>
if(!window.__greenstoaLoadFailed){
 for(const element of document.querySelectorAll('*'))for(const attribute of element.attributes){
  if(window.__greenstoaMedia[attribute.value])element.setAttribute(attribute.name,window.__greenstoaMedia[attribute.value]);
 }
}
</script>
<script id="greenstoa-script" type="text/plain">
'''+script+'''
</script>
<script>
if(!window.__greenstoaLoadFailed){
 const program=document.createElement('script');
 program.textContent=document.querySelector('#greenstoa-script').textContent;
 document.body.appendChild(program);
}
</script>
'''
page=page.replace('</body>',loader+'\n</body>')
if len(page.encode())>=25_000_000:raise SystemExit('index.html exceeds 25 MB.')
if OUT.exists():shutil.rmtree(OUT)
OUT.mkdir()
(OUT/'index.html').write_text(page,encoding='utf-8')
for i,chunk in enumerate(chunks):(OUT/f'media-{i+1}.js').write_text(chunk,encoding='utf-8')
(OUT/'.greenstoa-compact-build').write_text('Generated compact deployment.\n')
for file in OUT.iterdir():
 if not file.name.startswith('.'):
  print(f'{file.name}: {file.stat().st_size/1024/1024:.2f} MiB')
print(f'{len(chunks)+1} upload files; original images preserved byte-for-byte.')
