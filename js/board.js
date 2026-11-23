/* Échiquier : dessin, pièces, flèches, animations et étincelles. */
const GLY={k:"♚",q:"♛",r:"♜",b:"♝",n:"♞",p:"♟︎"};
const $=id=>document.getElementById(id);

/* ---------- Étincelles ---------- */
const fx=$("fx"),cx=fx.getContext("2d");let parts=[],anim=false;
function sizeFx(){fx.width=innerWidth*devicePixelRatio;fx.height=innerHeight*devicePixelRatio;}
addEventListener("resize",sizeFx);sizeFx();
function burst(x,y,n,cols){if(matchMedia("(prefers-reduced-motion: reduce)").matches)return;
  for(let i=0;i<n;i++){const a=Math.random()*Math.PI*2,v=2+Math.random()*7;parts.push({x,y,vx:Math.cos(a)*v,vy:Math.sin(a)*v-3,l:1,c:cols[i%cols.length],s:2+Math.random()*4});}
  if(!anim){anim=true;requestAnimationFrame(step);}}
function step(){cx.clearRect(0,0,fx.width,fx.height);const k=devicePixelRatio;
  parts.forEach(p=>{p.x+=p.vx;p.y+=p.vy;p.vy+=.25;p.l-=.018;cx.globalAlpha=Math.max(p.l,0);cx.fillStyle=p.c;cx.beginPath();cx.arc(p.x*k,p.y*k,p.s*k,0,7);cx.fill();});
  parts=parts.filter(p=>p.l>0);if(parts.length)requestAnimationFrame(step);else{anim=false;cx.clearRect(0,0,fx.width,fx.height);}}
function burstAt(el,n,cols){const r=el.getBoundingClientRect();burst(r.left+r.width/2,r.top+r.height/2,n,cols);}

/* ---------- Échiquier ---------- */
const B=$("board");let G,PZ,flip=false,sel=null,step_=0,etat="jeu",indice=0,pieces={};
const files="abcdefgh";
function xy(sq){let f=files.indexOf(sq[0]),r=8-+sq[1];if(flip){f=7-f;r=7-r;}return[f,r];}
function draw(){
  B.innerHTML="";pieces={};
  for(let r=0;r<8;r++)for(let f=0;f<8;f++){
    const ff=flip?7-f:f,rr=flip?7-r:r,sq=files[ff]+(8-rr);
    const d=document.createElement("div");d.className="sq "+((ff+rr)%2?"d":"l");d.dataset.sq=sq;
    d.style.left=f*12.5+"%";d.style.top=r*12.5+"%";
    if(f===0)d.innerHTML+=`<span class="co r">${8-rr}</span>`;
    if(r===7)d.innerHTML+=`<span class="co f">${files[ff]}</span>`;
    B.appendChild(d);}
  const svg=document.createElementNS("http://www.w3.org/2000/svg","svg");svg.setAttribute("class","fleches");svg.setAttribute("viewBox","0 0 8 8");svg.id="fl";
  svg.innerHTML='<defs><marker id="pt" markerWidth="3" markerHeight="3" refX="1.6" refY="1.5" orient="auto"><path d="M0,0L3,1.5L0,3z" fill="#2f8f5b"/></marker></defs>';
  B.appendChild(svg);
  // chess.js 0.10.3 ne fournit pas p.square : on calcule la case depuis la position dans le tableau.
  G.board().forEach((row,i)=>row.forEach((p,j)=>{if(p)addPiece(files[j]+(8-i),p);}));
}
function addPiece(sq,p){const e=document.createElement("div");e.className="pc "+p.color;e.innerHTML=`<span>${GLY[p.type]}</span>`;place(e,sq);B.appendChild(e);pieces[sq]=e;}
function place(e,sq){const[f,r]=xy(sq);e.style.transform=`translate(${f*100}%,${r*100}%)`;}
function sqEl(sq){return B.querySelector(`.sq[data-sq="${sq}"]`);}
function clearMarks(){B.querySelectorAll(".sq").forEach(s=>{s.classList.remove("sel","hint");s.querySelectorAll(".dot,.ring").forEach(x=>x.remove());});}
function markLast(m){B.querySelectorAll(".sq.last").forEach(s=>s.classList.remove("last"));sqEl(m.from).classList.add("last");sqEl(m.to).classList.add("last");}
function arrow(from,to){const[a,b]=xy(from),[c,d]=xy(to);const l=document.createElementNS("http://www.w3.org/2000/svg","line");
  l.setAttribute("x1",a+.5);l.setAttribute("y1",b+.5);l.setAttribute("x2",c+.5);l.setAttribute("y2",d+.5);l.setAttribute("stroke","#2f8f5b");l.setAttribute("stroke-width",".2");l.setAttribute("stroke-linecap","round");l.setAttribute("opacity",".9");l.setAttribute("marker-end","url(#pt)");$("fl").appendChild(l);}
function clearArrows(){const f=$("fl");if(f)f.querySelectorAll("line").forEach(l=>l.remove());}

function animMove(m){
  const e=pieces[m.from];
  let capSq=m.captured?(m.flags.includes("e")?m.to[0]+m.from[1]:m.to):null;
  if(capSq&&pieces[capSq]){const c=pieces[capSq];delete pieces[capSq];c.classList.add("out");const[f,r]=xy(capSq);c.style.transform=`translate(${f*100}%,${r*100-60}%) rotate(${Math.random()<.5?-40:40}deg) scale(.6)`;setTimeout(()=>c.remove(),520);
    setTimeout(()=>burstAt(sqEl(m.to),22,["#e3b84b","#f3dc94","#ffffff"]),180);SON.prise();} else SON.coup();
  delete pieces[m.from];pieces[m.to]=e;place(e,m.to);
  if(m.flags.includes("k")||m.flags.includes("q")){const rk=m.color==="w"?"1":"8",[rf,rt]=m.flags.includes("k")?["h","f"]:["a","d"];const re=pieces[rf+rk];delete pieces[rf+rk];pieces[rt+rk]=re;place(re,rt+rk);}
  if(m.promotion){setTimeout(()=>{e.innerHTML=`<span>${GLY[m.promotion]}</span>`;},300);}
  markLast(m);
}
