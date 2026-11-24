/* Échiquier : dessin, pièces, flèches, animations et étincelles. */
const GLY={k:"♚",q:"♛",r:"♜",b:"♝",n:"♞",p:"♟︎"};
// Jeux de pièces : « glyphes » (police locale) ou images SVG libres dans pieces/<jeu>/ (voir README).
const JEUX_PIECES={fantasy:"Fantaisie",celtic:"Celtiques",glyphes:"Classiques"};
function pieceHTML(c,t){const j=S.pieces;
  return j&&j!=="glyphes"&&JEUX_PIECES[j]?`<img src="pieces/${j}/${c}${t.toUpperCase()}.svg" alt="" draggable="false">`:`<span>${GLY[t]}</span>`;}
const $=id=>document.getElementById(id);
// Notation française pour l'affichage : R(oi), D(ame), T(our), F(ou), C(avalier). Les coups restent en anglais dans les données.
function fr(san){return String(san).replace(/[KQRBN]/g,c=>({K:"R",Q:"D",R:"T",B:"F",N:"C"}[c]));}

/* ---------- Particules (un seul canvas plein écran) ----------
   o : étincelle ronde · e : éclat qui tourne · c : confetti qui virevolte · d : nuage de poussière */
const fx=$("fx"),cx=fx.getContext("2d");let parts=[],anim=false;
const REDUIT=()=>matchMedia("(prefers-reduced-motion: reduce)").matches;
function sizeFx(){fx.width=innerWidth*devicePixelRatio;fx.height=innerHeight*devicePixelRatio;}
addEventListener("resize",sizeFx);sizeFx();
function lancer(){if(!anim){anim=true;requestAnimationFrame(step);}}
function ajoute(p){parts.push(Object.assign({t:"o",g:.25,fr:1,dl:.018,a:0,va:0,l:1},p));}
function burst(x,y,n,cols){if(REDUIT())return;
  for(let i=0;i<n;i++){const a=Math.random()*Math.PI*2,v=2+Math.random()*7;ajoute({x,y,vx:Math.cos(a)*v,vy:Math.sin(a)*v-3,c:cols[i%cols.length],s:2+Math.random()*4});}
  lancer();}
function eclats(x,y,taille,cols){if(REDUIT())return;
  for(let i=0;i<14;i++){const a=Math.random()*Math.PI*2,v=1.5+Math.random()*5;
    ajoute({t:"e",x,y,vx:Math.cos(a)*v,vy:Math.sin(a)*v-3.5,g:.3,fr:.98,dl:.022,va:(Math.random()-.5)*.5,a:Math.random()*6,c:cols[i%cols.length],s:taille*(.05+Math.random()*.06)});}
  lancer();}
function poussiere(x,y,taille){if(REDUIT())return;
  for(let i=0;i<7;i++){const a=Math.PI*(i/6),v=.6+Math.random()*.9;
    ajoute({t:"d",x:x+Math.cos(a)*taille*.2,y,vx:Math.cos(a)*v*(i<3.5?-1:1)*Math.abs(Math.cos(a))+(Math.random()-.5)*.3,vy:-.3-Math.random()*.4,g:-.005,fr:.96,dl:.03,c:"#d8ccb0",s:taille*.07});}
  lancer();}
function confettis(n=140){if(REDUIT())return;
  const cols=["#e3b84b","#f3dc94","#b8343e","#24427f","#2f8f5b","#ffffff"];
  for(let i=0;i<n;i++)ajoute({t:"c",x:Math.random()*innerWidth,y:-20-Math.random()*innerHeight*.4,vx:(Math.random()-.5)*2,vy:1.5+Math.random()*2.5,g:.03,fr:.995,dl:.0045,va:.08+Math.random()*.2,a:Math.random()*6,c:cols[i%cols.length],s:5+Math.random()*5});
  lancer();}
function step(){cx.clearRect(0,0,fx.width,fx.height);const k=devicePixelRatio;
  for(const p of parts){p.x+=p.vx;p.y+=p.vy;p.vy+=p.g;p.vx*=p.fr;p.l-=p.dl;p.a+=p.va;
    cx.globalAlpha=Math.max(0,Math.min(1,p.t==="c"?p.l*2:p.l));cx.fillStyle=p.c;
    if(p.t==="o"){cx.beginPath();cx.arc(p.x*k,p.y*k,p.s*k,0,7);cx.fill();continue;}
    cx.save();cx.translate(p.x*k,p.y*k);cx.rotate(p.a);const s=p.s*k;
    if(p.t==="e"){cx.beginPath();cx.moveTo(-s,-s*.6);cx.lineTo(s,-s*.2);cx.lineTo(-s*.2,s);cx.closePath();cx.fill();}
    else if(p.t==="c"){cx.scale(1,Math.cos(p.a*1.7));cx.fillRect(-s/2,-s/4,s,s/2);}
    else{cx.globalAlpha*=.5;cx.beginPath();cx.arc(0,0,s*(1.8-p.l),0,7);cx.fill();}
    cx.restore();}
  parts=parts.filter(p=>p.l>0&&p.y<innerHeight+40);if(parts.length)requestAnimationFrame(step);else{anim=false;cx.clearRect(0,0,fx.width,fx.height);}}
function centre(el){const r=el.getBoundingClientRect();return[r.left+r.width/2,r.top+r.height/2,r.width];}
function burstAt(el,n,cols){if(!el)return;const[x,y]=centre(el);burst(x,y,n,cols);}

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
  svg.innerHTML='<defs><marker id="pt" markerWidth="3" markerHeight="3" refX="1.6" refY="1.5" orient="auto"><path d="M0,0L3,1.5L0,3z" fill="#2f8f5b"/></marker><marker id="ptr" markerWidth="3" markerHeight="3" refX="1.6" refY="1.5" orient="auto"><path d="M0,0L3,1.5L0,3z" fill="#b8343e"/></marker></defs>';
  B.appendChild(svg);
  // chess.js 0.10.3 ne fournit pas p.square : on calcule la case depuis la position dans le tableau.
  G.board().forEach((row,i)=>row.forEach((p,j)=>{if(p)addPiece(files[j]+(8-i),p);}));
  marquerEchec();
  if(typeof coupsMaj==="function")coupsMaj();
}
function addPiece(sq,p){const e=document.createElement("div");e.className="pc "+p.color;e.innerHTML=pieceHTML(p.color,p.type);place(e,sq);B.appendChild(e);pieces[sq]=e;}
function tr(sq,plus=""){const[f,r]=xy(sq);return `translate(${f*100}%,${r*100}%)${plus}`;}
function place(e,sq){e.style.transform=tr(sq);}
/* Déplacement en arc : la pièce se lève, file, puis se pose avec un rebond et un peu de poussière. */
let poseDirecte=false; // pièce lâchée au doigt : pas de vol en arc
function glisse(e,from,to){
  place(e,to);
  if(poseDirecte){poseDirecte=false;return 0;}
  if(REDUIT()||!e.animate)return 0;
  const[f1,r1]=xy(from),[f2,r2]=xy(to),dist=Math.hypot(f2-f1,r2-r1);
  const h=Math.min(55,18+dist*6),dur=Math.round(300+dist*35);
  e.style.zIndex=4;
  const a=e.animate([{transform:tr(from)},{transform:`translate(${(f1+f2)*50}%,${(r1+r2)*50-h}%) scale(1.16)`,offset:.55},{transform:tr(to)}],{duration:dur,easing:"cubic-bezier(.45,.05,.4,1)"});
  a.onfinish=()=>{e.style.zIndex="";const c=e.firstElementChild;
    if(c&&e.isConnected){c.animate([{transform:"scale(1.12,.86)"},{transform:"scale(.96,1.05)"},{transform:"none"}],{duration:220,easing:"ease-out"});
      const[x,y,w]=centre(e);poussiere(x,y+w*.36,w);}};
  return dur;
}
function marquerEchec(){
  B.querySelectorAll(".sq.echec").forEach(s=>s.classList.remove("echec"));
  if(!G||!G.in_check())return;
  G.board().forEach((row,i)=>row.forEach((p,j)=>{if(p&&p.type==="k"&&p.color===G.turn()){const s=sqEl(files[j]+(8-i));s&&s.classList.add("echec");}}));
}
function basculeRoi(couleur){ // échec et mat : le roi vaincu tombe
  if(REDUIT())return;
  for(const e of Object.values(pieces)){if(!e||!e.classList.contains(couleur))continue;const c=e.firstElementChild;
    if(c&&/[kK]\.svg|♚/.test(c.outerHTML)){c.style.transformOrigin="50% 92%";
      c.animate([{transform:"none"},{transform:"rotate(-12deg)",offset:.3},{transform:"rotate(80deg) translateY(8%)",offset:.8},{transform:"rotate(74deg) translateY(8%)"}],{duration:900,easing:"cubic-bezier(.5,0,.6,1)",fill:"forwards"});}}
}
function sqEl(sq){return B.querySelector(`.sq[data-sq="${sq}"]`);}
function clearMarks(){B.querySelectorAll(".sq").forEach(s=>{s.classList.remove("sel","hint");s.querySelectorAll(".dot,.ring").forEach(x=>x.remove());});}
function markLast(m){B.querySelectorAll(".sq.last").forEach(s=>s.classList.remove("last"));sqEl(m.from).classList.add("last");sqEl(m.to).classList.add("last");}
function arrow(from,to,rouge){const[a,b]=xy(from),[c,d]=xy(to);const l=document.createElementNS("http://www.w3.org/2000/svg","line");
  l.setAttribute("x1",a+.5);l.setAttribute("y1",b+.5);l.setAttribute("x2",c+.5);l.setAttribute("y2",d+.5);l.setAttribute("stroke",rouge?"#b8343e":"#2f8f5b");l.setAttribute("stroke-width",".2");l.setAttribute("stroke-linecap","round");l.setAttribute("opacity",".9");l.setAttribute("marker-end",rouge?"url(#ptr)":"url(#pt)");l.setAttribute("pathLength","1");l.setAttribute("class","trace");$("fl").appendChild(l);}
function clearArrows(){const f=$("fl");if(f)f.querySelectorAll("line").forEach(l=>l.remove());}

function animMove(m){
  const e=pieces[m.from];
  const capSq=m.captured?(m.flags.includes("e")?m.to[0]+m.from[1]:m.to):null;
  const cap=capSq&&pieces[capSq];if(cap)delete pieces[capSq];
  delete pieces[m.from];if(e)pieces[m.to]=e;
  const dur=e?glisse(e,m.from,m.to):0;
  if(m.flags.includes("k")||m.flags.includes("q")){const rk=m.color==="w"?"1":"8",[rf,rt]=m.flags.includes("k")?["h","f"]:["a","d"];const re=pieces[rf+rk];delete pieces[rf+rk];pieces[rt+rk]=re;if(re)setTimeout(()=>glisse(re,rf+rk,rt+rk),120);}
  if(cap){ // la pièce prise éclate quand l'attaquant arrive
    setTimeout(()=>{const[x,y,w]=centre(cap);SON.prise();
      eclats(x,y,w,cap.classList.contains("w")?["#f6f1e3","#d9d2bf","#fffdf5"]:["#2a2638","#4a4458","#6b6380"]);burst(x,y,16,["#e3b84b","#f3dc94","#ffffff"]);
      if(!REDUIT()&&cap.animate){cap.animate([{opacity:1,transform:cap.style.transform},{opacity:0,transform:cap.style.transform+" scale(1.4)"}],{duration:200,fill:"forwards"});
        $("plateau").animate([{transform:"none"},{transform:"translate(2px,-3px)"},{transform:"translate(-3px,2px)"},{transform:"none"}],{duration:220});}
      setTimeout(()=>cap.remove(),210);},Math.max(0,dur-60));
  } else setTimeout(()=>SON.coup(),Math.max(0,dur-40));
  if(m.san.includes("+")&&!m.san.includes("#"))setTimeout(()=>SON.echec(),dur);
  if(m.promotion){setTimeout(()=>{if(e)e.innerHTML=pieceHTML(m.color,m.promotion);},dur);}
  markLast(m);marquerEchec();
  if(m.san.includes("#"))setTimeout(()=>basculeRoi(m.color==="w"?"b":"w"),dur+150);
  if(typeof coupsMaj==="function")coupsMaj();
}
