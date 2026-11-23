/* Application : logique d'épreuve, blason et interface. */
/* ---------- Logique d'épreuve ---------- */
function joueur(){return new Chess(PZ.fen).turn();}
function forcedMate1(g){ // après le coup du joueur : chaque réponse laisse un mat en 1
  const rep=g.moves();if(!rep.length)return g.in_checkmate();
  return rep.every(r=>{g.move(r);const ok=g.moves().some(m=>{g.move(m);const k=g.in_checkmate();g.undo();return k;});g.undo();return ok;});
}
function accepte(san){
  const mate=PZ.t==="mat1"||PZ.t==="mat2";
  const restant=PZ.line.length-step_; // coups restants dans la ligne
  if(!mate)return san===PZ.line[step_];
  G.move(san);let ok;
  if(G.in_checkmate())ok=true; else if(restant>=3)ok=forcedMate1(G); else ok=false;
  G.undo();return ok;
}
function choisir(){
  const filtre=$("chips").dataset.f||"tous";
  let pool=P.filter(p=>filtre==="tous"||p.t===filtre);
  const recents=S.vus.slice(-Math.min(8,pool.length-1));
  let c=pool.filter(p=>!recents.includes(p.id));if(!c.length)c=pool;
  c.sort((a,b)=>Math.abs(a.r-S.cote)+Math.random()*180-(Math.abs(b.r-S.cote)+Math.random()*180));
  return c[0];
}
function charger(p){
  PZ=p;G=new Chess(p.fen);flip=G.turn()==="b";sel=null;step_=0;etat="jeu";indice=0;
  draw();clearArrows();
  const blanc=G.turn()==="w";
  $("trait").className="trait "+(blanc?"w":"b");
  const butM={mat1:"Donne échec et mat en un coup.",mat2:"Échec et mat en deux coups.",fourchette:"Trouve le coup qui attaque deux pièces à la fois.",prise:"Une pièce est en danger… laquelle ?",enfilade:"Attaque une pièce pour gagner celle qui est derrière.",clouage:"Immobilise une pièce adverse."}[p.t];
  $("mTitre").textContent=(blanc?"Les blancs":"Les noirs")+" jouent";$("mTexte").textContent=butM;$("mTheme").textContent=THEMES[p.t];
  $("parch").innerHTML=`<p>Tu joues les <b>${blanc?"blancs":"noirs"}</b>. Touche une pièce, puis la case où tu veux la jouer.</p>`;
  $("sceau").className="sceau";
  $("bIndice").disabled=false;$("bSolution").disabled=false;
}
function tap(sq){
  if(etat!=="jeu")return;
  const p=G.get(sq);
  if(sel&&sel!==sq){
    const mv=G.moves({square:sel,verbose:true}).find(m=>m.to===sq);
    if(mv){jouer(mv);return;}
  }
  clearMarks();
  if(p&&p.color===G.turn()&&sel!==sq){
    sel=sq;sqEl(sq).classList.add("sel");pieces[sq]&&pieces[sq].classList.add("up");setTimeout(()=>pieces[sq]&&pieces[sq].classList.remove("up"),260);
    G.moves({square:sq,verbose:true}).forEach(m=>{const s=document.createElement("div");s.className=m.captured?"ring":"dot";sqEl(m.to).appendChild(s);});
  } else sel=null;
}
function jouer(vm){
  clearMarks();sel=null;
  const san=G.move({from:vm.from,to:vm.to,promotion:"q"}).san;G.undo();
  const ok=accepte(san);
  const m=G.move({from:vm.from,to:vm.to,promotion:"q"});animMove(m);
  if(!ok){echec(m);return;}
  step_++;
  if(G.in_checkmate()||PZ.t!=="mat2"&&PZ.t!=="mat1"){reussite();return;}
  // réponse adverse (mat en 2)
  etat="attente";
  setTimeout(()=>{let r=PZ.line[step_];let mv=r&&G.move(r);if(!mv){mv=G.move(G.moves()[0]);}animMove(mv);step_++;etat="jeu";
    $("parch").innerHTML=`<p>L'adversaire répond. À toi de finir le travail !</p>`;},650);
}
function nomOuEcuyer(){return S.nom.trim()||"jeune écuyer";}
function reussite(){
  etat="fini";const gain=indice?5:10;
  setTimeout(()=>{
    SON.victoire();burstAt($("board"),70,["#e3b84b","#f3dc94","#2f8f5b","#ffffff","#b8343e"]);
    $("sceauTxt").textContent=["Bravo !","Touché !","Superbe !","Victoire !"][Math.floor(Math.random()*4)];$("sceau").className="sceau on";
    setTimeout(()=>$("sceau").className="sceau",1300);
  },320);
  bilan(true,gain);
  $("parch").innerHTML=`<p><span class="ok">Bien joué, ${esc(nomOuEcuyer())} ! +${gain} XP</span><br>${PZ.x}</p>`;
  $("bIndice").disabled=true;$("bSolution").disabled=true;
}
function echec(m){
  etat="fini";SON.rate();
  setTimeout(()=>{B.classList.add("shake");setTimeout(()=>B.classList.remove("shake"),420);
    $("sceauTxt").textContent="Pas cette fois";$("sceau").className="sceau on rate";setTimeout(()=>$("sceau").className="sceau",1100);},300);
  setTimeout(()=>{G=new Chess(PZ.fen);for(let i=0;i<step_;i++)G.move(PZ.line[i]);draw();montrerSolution(false);},1200);
  bilan(false,0);
  $("parch").innerHTML=`<p><span class="ko">Ce coup (${m.san}) ne marche pas.</span> Regarde la flèche verte : c'est le bon coup.<br>${PZ.x}</p>`;
  $("bIndice").disabled=true;$("bSolution").disabled=true;
}
function montrerSolution(rejouer){
  const g=new Chess(G.fen());const mv=g.move(PZ.line[step_]);if(!mv)return;
  clearArrows();arrow(mv.from,mv.to);sqEl(mv.from).classList.add("hint");
  if(rejouer){etat="fini";setTimeout(()=>{const m=G.move(PZ.line[step_]);animMove(m);step_++;
      const n=PZ.line[step_];if(n){setTimeout(()=>{const r=G.move(n);if(r){animMove(r);step_++;}const f=PZ.line[step_];if(f)setTimeout(()=>{const z=G.move(f);if(z)animMove(z);},700);},700);}
    },700);}
}
function bilan(ok,gain){
  const exp=1/(1+Math.pow(10,(PZ.r-S.cote)/400));const score=ok?(indice?.6:1):0;
  S.cote=Math.round(Math.max(200,S.cote+32*(score-exp)));
  S.xp+=gain;if(ok){S.reussi++;S.serie++;S.best=Math.max(S.best,S.serie);}else S.serie=0;
  const t=S.th[PZ.t]||{ok:0,n:0};t.n++;if(ok)t.ok++;S.th[PZ.t]=t;
  S.vus.push(PZ.id);S.vus=S.vus.slice(-30);
  S.hist.unshift({id:PZ.id,t:PZ.t,ok,d:Date.now()});S.hist=S.hist.slice(0,12);
  save();majEntete();
}
function majEntete(){
  const[g,n]=gradeDe(S.xp);
  $("gradeTop").textContent=g[1];$("xpTxt").textContent=S.xp+" XP";
  $("xpBar").style.width=(n?Math.round((S.xp-g[0])/(n[0]-g[0])*100):100)+"%";
  $("salut").textContent=S.nom.trim()?`En garde, ${S.nom.trim()} !`:"Entraîne-toi, jeune écuyer";
}
function majBlason(){
  const[g,n]=gradeDe(S.xp);
  $("gGrade").textContent=g[1];$("gProchain").textContent=n?`Encore ${n[0]-S.xp} XP pour devenir ${n[1]}`:"Grade le plus haut atteint !";
  $("nom").value=S.nom;$("sReussi").textContent=S.reussi;$("sSerie").textContent=S.best;$("sCote").textContent=S.cote;
  $("themes").innerHTML=Object.keys(THEMES).map(k=>{const t=S.th[k]||{ok:0,n:0};const pc=t.n?Math.round(t.ok/t.n*100):0;
    return `<div class="th"><span>${THEMES[k]}</span><em>${t.ok}/${t.n}</em><div class="bar"><i style="width:${pc}%"></i></div></div>`;}).join("");
  $("hist").innerHTML=S.hist.length?S.hist.map(h=>`<div><span>${THEMES[h.t]}</span><span style="color:${h.ok?"#9be3b8":"#ffb3b8"}">${h.ok?"Réussi":"Raté"}</span></div>`).join(""):'<p class="note">Aucune épreuve pour l\'instant. Va à la salle d\'armes !</p>';
}
function esc(s){return s.replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));}

/* ---------- Interface ---------- */
B.addEventListener("click",e=>{const r=B.getBoundingClientRect();let f=Math.floor((e.clientX-r.left)/r.width*8),rr=Math.floor((e.clientY-r.top)/r.height*8);
  if(f<0||f>7||rr<0||rr>7)return;if(flip){f=7-f;rr=7-rr;}ac();tap(files[f]+(8-rr));});
$("bSuivant").onclick=()=>{ac();charger(choisir());};
$("bIndice").onclick=()=>{if(etat!=="jeu")return;indice++;const g=new Chess(G.fen());const mv=g.move(PZ.line[step_]);
  if(indice===1){clearMarks();sqEl(mv.from).classList.add("hint");$("parch").innerHTML=`<p>Indice : la pièce qui brille est celle à jouer.</p>`;}
  else{clearArrows();arrow(mv.from,mv.to);$("parch").innerHTML=`<p>Dernier indice : suis la flèche !</p>`;$("bIndice").disabled=true;}};
$("bSolution").onclick=()=>{if(etat!=="jeu")return;indice=2;bilan(false,0);$("parch").innerHTML=`<p><span class="ko">Voici la solution.</span><br>${PZ.x}</p>`;montrerSolution(true);$("bIndice").disabled=true;$("bSolution").disabled=true;};
$("bSon").onclick=()=>{S.son=!S.son;save();$("bSon").textContent="Son : "+(S.son?"oui":"non");$("bSon").setAttribute("aria-pressed",S.son);};
$("bSon").textContent="Son : "+(S.son?"oui":"non");
$("nom").addEventListener("input",e=>{S.nom=e.target.value;save();majEntete();});
function onglet(b){$("vSalle").hidden=b;$("vSalle").style.display=b?"none":"flex";$("vBlason").hidden=!b;$("tSalle").setAttribute("aria-current",!b);$("tBlason").setAttribute("aria-current",b);if(b)majBlason();scrollTo(0,0);}
$("tSalle").onclick=()=>onglet(false);$("tBlason").onclick=()=>onglet(true);
const ch=$("chips");ch.dataset.f="tous";
ch.innerHTML=[["tous","Toutes les bottes"],...Object.entries(THEMES)].map(([k,v])=>`<button type="button" class="chip${k==="tous"?" on":""}" data-k="${k}">${v}</button>`).join("");
ch.onclick=e=>{const b=e.target.closest(".chip");if(!b)return;ch.dataset.f=b.dataset.k;ch.querySelectorAll(".chip").forEach(c=>c.classList.toggle("on",c===b));charger(choisir());};
majEntete();charger(choisir());
if("serviceWorker" in navigator){addEventListener("load",()=>navigator.serviceWorker.register("sw.js").catch(()=>{}));}
