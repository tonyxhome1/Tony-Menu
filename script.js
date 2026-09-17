const menuPages=["3.png","4.png","5.png","6.png","7.png","8.png","9.png","10.png","11.png","12.png","13.png","14.png","15.png"];

const gallery=document.getElementById("gallery"),viewer=document.getElementById("viewer"),stage=document.getElementById("viewerStage"),image=document.getElementById("viewerImage");
const title=document.getElementById("viewerTitle"),counter=document.getElementById("viewerCounter"),errorBox=document.getElementById("loadError");
const closeBtn=document.getElementById("closeBtn"),prevBtn=document.getElementById("prevBtn"),nextBtn=document.getElementById("nextBtn");
const zoomInBtn=document.getElementById("zoomInBtn"),zoomOutBtn=document.getElementById("zoomOutBtn"),resetBtn=document.getElementById("resetBtn");

let index=0,scale=1,minScale=1,x=0,y=0,dragging=false,dragId=null,lastX=0,lastY=0;
let touches=new Map(),pinchStart=0,pinchScale=1,lastTap=0,swipeX=0,swipeY=0,swipeTime=0;
const cache=new Map();
const path=f=>`./menu/${encodeURIComponent(f)}`;

function buildGallery(){
  const frag=document.createDocumentFragment();
  menuPages.forEach((f,i)=>{
    const b=document.createElement("button");b.className="menu-card";b.type="button";b.setAttribute("aria-label",`เปิดเมนูหน้า ${f.slice(0,-4)}`);
    const img=document.createElement("img");img.src=path(f);img.alt=`เมนูหน้า ${f.slice(0,-4)}`;img.loading=i<2?"eager":"lazy";img.decoding="async";
    img.onerror=()=>errorBox.hidden=false;
    const label=document.createElement("span");label.className="page-label";label.textContent=`หน้า ${f.slice(0,-4)}`;
    b.append(img,label);b.onclick=()=>openViewer(i);frag.appendChild(b);
  });gallery.appendChild(frag);
}
function preload(i){[i-1,i+1].forEach(n=>{if(n<0||n>=menuPages.length)return;const f=menuPages[n];if(cache.has(f))return;const im=new Image();im.src=path(f);cache.set(f,im);});}
function fit(){
  if(!image.naturalWidth)return;
  const r=stage.getBoundingClientRect(),pad=Math.min(20,r.width*.03);
  minScale=Math.min((r.width-pad*2)/image.naturalWidth,(r.height-pad*2)/image.naturalHeight);
  scale=minScale;x=0;y=0;render();
}
function clamp(){
  const r=stage.getBoundingClientRect(),w=image.naturalWidth*scale,h=image.naturalHeight*scale;
  x=Math.max(-Math.max(0,(w-r.width)/2),Math.min(Math.max(0,(w-r.width)/2),x));
  y=Math.max(-Math.max(0,(h-r.height)/2),Math.min(Math.max(0,(h-r.height)/2),y));
}
function render(){clamp();image.style.transform=`translate3d(${x}px,${y}px,0) scale(${scale})`;}
function zoomTo(next,cx=stage.clientWidth/2,cy=stage.clientHeight/2){
  const old=scale,max=Math.max(minScale*5,4),ns=Math.max(minScale,Math.min(max,next));if(Math.abs(ns-old)<.001)return;
  const r=stage.getBoundingClientRect(),lx=cx-r.width/2,ly=cy-r.height/2;
  x=lx-(lx-x)*(ns/old);y=ly-(ly-y)*(ns/old);scale=ns;render();
}
function reset(){scale=minScale;x=0;y=0;render();}
function setPage(n){
  index=(n+menuPages.length)%menuPages.length;const f=menuPages[index];
  title.textContent=`Menu ${f.slice(0,-4)}`;counter.textContent=`${index+1} / ${menuPages.length}`;
  image.hidden=false;const c=cache.get(f);image.src=c?.src||path(f);
  image.onload=fit; if(image.complete&&image.naturalWidth)fit();preload(index);
}
function openViewer(n){viewer.classList.add("open");viewer.setAttribute("aria-hidden","false");document.body.style.overflow="hidden";setPage(n);closeBtn.focus({preventScroll:true});}
function closeViewer(){viewer.classList.remove("open");viewer.setAttribute("aria-hidden","true");document.body.style.overflow="";dragging=false;}
function page(d){setPage(index+d);}
function dist(a,b){return Math.hypot(a.clientX-b.clientX,a.clientY-b.clientY);}

stage.addEventListener("wheel",e=>{e.preventDefault();const r=stage.getBoundingClientRect();zoomTo(scale*Math.exp(-e.deltaY*.0015),e.clientX-r.left,e.clientY-r.top)},{passive:false});

stage.addEventListener("pointerdown",e=>{
  if(e.pointerType==="touch"){touches.set(e.pointerId,e);swipeX=e.clientX;swipeY=e.clientY;swipeTime=performance.now();
    if(touches.size===2){const [a,b]=[...touches.values()];pinchStart=dist(a,b);pinchScale=scale;dragging=false;return;}
    const now=performance.now();if(now-lastTap<280){const r=stage.getBoundingClientRect();zoomTo(scale<=minScale*1.01?minScale*2.5:minScale,e.clientX-r.left,e.clientY-r.top);lastTap=0;}else lastTap=now;
  }
  if(e.pointerType==="touch"&&touches.size===2)return;
  dragging=true;dragId=e.pointerId;lastX=e.clientX;lastY=e.clientY;stage.setPointerCapture?.(e.pointerId);
});
stage.addEventListener("pointermove",e=>{
  if(e.pointerType==="touch"&&touches.has(e.pointerId))touches.set(e.pointerId,e);
  if(e.pointerType==="touch"&&touches.size===2){const [a,b]=[...touches.values()];if(pinchStart)zoomTo(pinchScale*dist(a,b)/pinchStart);return;}
  if(!dragging||e.pointerId!==dragId)return;
  const dx=e.clientX-lastX,dy=e.clientY-lastY;lastX=e.clientX;lastY=e.clientY;
  if(scale>minScale+.001){x+=dx;y+=dy;render();}
});
stage.addEventListener("pointerup",e=>{
  if(e.pointerType==="touch")touches.delete(e.pointerId);
  if(e.pointerId!==dragId)return;
  const dx=e.clientX-swipeX,dy=e.clientY-swipeY,dt=performance.now()-swipeTime;dragging=false;dragId=null;
  if(e.pointerType==="touch"&&scale<=minScale*1.01&&dt<450&&Math.abs(dx)>70&&Math.abs(dx)>Math.abs(dy)*1.25)page(dx<0?1:-1);
});
stage.addEventListener("pointercancel",e=>{touches.delete(e.pointerId);dragging=false;pinchStart=0;});

closeBtn.onclick=closeViewer;prevBtn.onclick=()=>page(-1);nextBtn.onclick=()=>page(1);
zoomInBtn.onclick=()=>zoomTo(scale*1.35);zoomOutBtn.onclick=()=>zoomTo(scale/1.35);resetBtn.onclick=reset;
image.onerror=()=>{image.hidden=true;};

document.addEventListener("keydown",e=>{
  if(!viewer.classList.contains("open"))return;
  if(e.key==="Escape")closeViewer();else if(e.key==="ArrowLeft")page(-1);else if(e.key==="ArrowRight")page(1);
  else if(e.key==="+"||e.key==="=")zoomTo(scale*1.35);else if(e.key==="-"||e.key==="_")zoomTo(scale/1.35);else if(e.key==="0")reset();
});
window.addEventListener("resize",()=>{if(viewer.classList.contains("open"))fit();});
buildGallery();
