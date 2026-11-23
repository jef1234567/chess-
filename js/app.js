/* Application : logique d'épreuve, blason et interface. */
/* ---------- Logique d'épreuve ---------- */
// Une épreuve : PZ.line alterne les coups à partir du trait de PZ.fen. Si PZ.a vaut 1,
// le premier coup est celui de l'adversaire et l'appli le joue toute seule (problèmes Lichess).
const MATS=["mat1","mat2"];
let partie=0; // change à chaque épreuve : les minuteries d'une ancienne épreuve s'annulent
function plus(fn,ms){const n=partie;setTimeout(()=>{if(n===partie)fn();},ms);}
function forcedMate1(g){ // après le coup du joueur : chaque réponse laisse un mat en 1
  const rep=g.moves();if(!rep.length)return g.in_checkmate();
  return rep.every(r=>{g.move(r);const ok=g.moves().some(m=>{g.move(m);const k=g.in_checkmate();g.undo();return k;});g.undo();return ok;});
}
function accepte(san){
  const restant=PZ.line.length-step_; // coups restants dans la ligne, celui-ci compris
  G.move(san);const mat=G.in_checkmate();
  let ok=san===PZ.line[step_]||mat; // un mat est toujours un bon coup
  if(!ok&&MATS.includes(PZ.t)&&restant>=3)ok=forcedMate1(G);
  G.undo();return ok;
}
const BUT={mat1:"Donne échec et mat en un coup.",mat2:"Échec et mat en deux coups.",fourchette:"Trouve le coup qui attaque deux pièces à la fois.",
  attaqueDouble:"Une seule pièce peut attaquer deux cibles. Trouve-la !",prise:"Une pièce est en danger… laquelle ?",enfilade:"Attaque une pièce pour gagner celle qui est derrière.",
  clouage:"Immobilise une pièce adverse.",decouverte:"Bouge une pièce pour ouvrir la route d'une autre.",defense:"Danger ! Trouve le seul coup qui sauve.",finale:"Finale : trouve le coup précis."};

/* Choix de l'épreuve : révision ciblée.
   - Une épreuve ratée revient plus tard (liste S.aRevoir), une fois sur quatre environ.
   - En mode « toutes les bottes », les thèmes les moins réussis sortent plus souvent.
   - On évite les épreuves déjà réussies et celles vues récemment, tant qu'il en reste. */
function tauxTheme(t){const s=S.th[t]||{ok:0,n:0};return (s.ok+1)/(s.n+2);}
function tirage(poids){let tot=0;for(const[,w]of poids)tot+=w;let x=Math.random()*tot;for(const[k,w]of poids){x-=w;if(x<=0)return k;}return poids[poids.length-1][0];}
function choisir(){
  const filtre=$("chips").dataset.f||"tous";
  const recents=new Set(S.vus.slice(-12));
  const ok=p=>(filtre==="tous"||p.t===filtre)&&p.id!==(PZ&&PZ.id);
  const revoir=S.aRevoir.map(id=>P.find(p=>p.id===id)).filter(p=>p&&ok(p)&&!recents.has(p.id));
  if(revoir.length&&Math.random()<.25)return revoir[0];
  let t=filtre;
  if(filtre==="tous"){
    const nb={};for(const p of P)nb[p.t]=(nb[p.t]||0)+1;
    // de 0,4 (tout réussi) à 2 (tout raté), réduit pour un thème qui a peu d'épreuves
    t=tirage(Object.keys(nb).map(k=>[k,(.4+(1-tauxTheme(k))*1.6)*Math.min(1,nb[k]/20)]));
  }
  const pool=P.filter(p=>p.t===t&&ok(p));
  const faits=new Set(S.reussis);
  let c=pool.filter(p=>!recents.has(p.id)&&!faits.has(p.id));
  if(!c.length)c=pool.filter(p=>!recents.has(p.id));
  if(!c.length)c=pool.length?pool:P;
  // proche de la cote du joueur, avec un peu de hasard
  let best=null,bs=Infinity;for(const p of c){const s=Math.abs(p.r-S.cote)+Math.random()*180;if(s<bs){bs=s;best=p;}}
  return best;
}
function charger(p){
  partie++;
  PZ=p;G=new Chess(p.fen);sel=null;step_=0;indice=0;
  const camp=p.a?(G.turn()==="w"?"b":"w"):G.turn();
  flip=camp==="b";etat=p.a?"attente":"jeu";
  draw();clearArrows();
  const blanc=camp==="w";
  $("trait").className="trait "+(blanc?"w":"b");
  $("mTitre").textContent=(blanc?"Les blancs":"Les noirs")+" jouent";$("mTexte").textContent=BUT[p.t]||"";$("mTheme").textContent=THEMES[p.t];
  $("sceau").className="sceau";$("bExplique").hidden=true;
  $("bIndice").disabled=!!p.a;$("bSolution").disabled=!!p.a;
  if(p.a){
    $("parch").innerHTML=`<p>Tu joues les <b>${blanc?"blancs":"noirs"}</b>. Regarde bien le coup de l'adversaire…</p>`;
    plus(()=>{const m=G.move(PZ.line[0]);animMove(m);step_=1;etat="jeu";$("bIndice").disabled=false;$("bSolution").disabled=false;
      $("parch").innerHTML=`<p>L'adversaire a joué <b>${m.san}</b>. À toi ! Touche une pièce, puis la case où tu veux la jouer.</p>`;},700);
  } else $("parch").innerHTML=`<p>Tu joues les <b>${blanc?"blancs":"noirs"}</b>. Touche une pièce, puis la case où tu veux la jouer.</p>`;
}
function tap(sq){
  const tournoi=mode==="tournoi";
  if(tournoi?!tPeutJouer():etat!=="jeu")return;
  const p=G.get(sq);
  if(sel&&sel!==sq){
    const mv=G.moves({square:sel,verbose:true}).find(m=>m.to===sq);
    if(mv){(tournoi?tJouer:jouer)(mv);return;}
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
  if(G.in_checkmate()||step_>=PZ.line.length){reussite();return;}
  // réponse de l'adversaire : celle de la ligne si elle est jouable, sinon un coup légal
  etat="attente";
  plus(()=>{const r=PZ.line[step_];let mv=r&&G.move(r);if(!mv){mv=G.move(G.moves()[0]);}animMove(mv);step_++;etat="jeu";
    $("parch").innerHTML=`<p>L'adversaire répond <b>${mv.san}</b>. Continue, tu y es presque !</p>`;},650);
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
  plus(()=>{G=new Chess(PZ.fen);for(let i=0;i<step_;i++)G.move(PZ.line[i]);draw();montrerSolution(false);},1200);
  bilan(false,0);
  $("parch").innerHTML=`<p><span class="ko">Ce coup (${m.san}) ne marche pas.</span> Regarde la flèche verte : c'est le bon coup.<br>${PZ.x}</p>`;
  $("bIndice").disabled=true;$("bSolution").disabled=true;
  iaBouton("bExplique","parch",()=>iaQuestionEpreuve(m.san));
}
function montrerSolution(rejouer){
  const g=new Chess(G.fen());const mv=g.move(PZ.line[step_]);if(!mv)return;
  clearArrows();arrow(mv.from,mv.to);sqEl(mv.from).classList.add("hint");
  if(rejouer){etat="fini";const suite=()=>{const c=PZ.line[step_];if(!c)return;const m=G.move(c);if(!m)return;animMove(m);step_++;plus(suite,700);};plus(suite,700);}
}
function bilan(ok,gain){
  const exp=1/(1+Math.pow(10,(PZ.r-S.cote)/400));const score=ok?(indice?.6:1):0;
  S.cote=Math.round(Math.max(200,S.cote+32*(score-exp)));
  S.xp+=gain;if(ok){S.reussi++;S.serie++;S.best=Math.max(S.best,S.serie);}else S.serie=0;
  const t=S.th[PZ.t]||{ok:0,n:0};t.n++;if(ok)t.ok++;S.th[PZ.t]=t;
  S.vus.push(PZ.id);S.vus=S.vus.slice(-30);
  // révision : une épreuve ratée revient plus tard ; réussie (sans solution), elle sort de la liste
  S.aRevoir=S.aRevoir.filter(id=>id!==PZ.id);
  if(!ok||indice>=2)S.aRevoir.push(PZ.id);S.aRevoir=S.aRevoir.slice(-50);
  if(ok&&!S.reussis.includes(PZ.id))S.reussis.push(PZ.id);
  S.hist.unshift({id:PZ.id,t:PZ.t,ok,d:Date.now()});S.hist=S.hist.slice(0,12);
  save();majEntete();hautsVerifier();
}
function majEntete(){
  const[g,n]=gradeDe(S.xp);
  $("gradeTop").textContent=g[1];$("xpTxt").textContent=S.xp+" XP";
  $("xpBar").style.width=(n?Math.round((S.xp-g[0])/(n[0]-g[0])*100):100)+"%";
  $("salut").textContent=S.nom.trim()?`En garde, ${S.nom.trim()} !`:"Entraîne-toi, jeune écuyer";
}
function majBlason(){
  iaMajReglages();majApparence();
  const[g,n]=gradeDe(S.xp);
  $("gGrade").textContent=g[1];$("gProchain").textContent=n?`Encore ${n[0]-S.xp} XP pour devenir ${n[1]}`:"Grade le plus haut atteint !";
  $("nom").value=S.nom;$("sReussi").textContent=S.reussi;$("sSerie").textContent=S.best;$("sCote").textContent=S.cote;
  $("themes").innerHTML=Object.keys(THEMES).map(k=>{const t=S.th[k]||{ok:0,n:0};const pc=t.n?Math.round(t.ok/t.n*100):0;
    return `<div class="th"><span>${THEMES[k]}</span><em>${t.ok}/${t.n}</em><div class="bar"><i style="width:${pc}%"></i></div></div>`;}).join("");
  $("tBilan").innerHTML=NIVEAUX.map(n=>{const b=S.tournoi.bilan[n.k]||{v:0,n:0,d:0};
    return `<div class="th"><span>${n.nom}</span><em>${b.v} victoire${b.v>1?"s":""} · ${b.n} nulle${b.n>1?"s":""} · ${b.d} défaite${b.d>1?"s":""}</em></div>`;}).join("");
  const RES={victoire:["Victoire","#9be3b8"],defaite:["Défaite","#ffb3b8"],nulle:["Nulle","#f3dc94"],abandon:["Abandon","#ffb3b8"]};
  $("parties").innerHTML=S.parties.length?S.parties.map((p,i)=>{const n=NIVEAUX.find(x=>x.k===p.niv)||NIVEAUX[0];const r=RES[p.res]||["?","#fff"];
    return `<div><span>${new Date(p.d).toLocaleDateString("fr-FR",{day:"numeric",month:"short"})} · ${n.nom} · <b style="color:${r[1]}">${r[0]}</b></span><button type="button" class="petit" data-p="${i}">Conseil</button></div>`;}).join(""):'<p class="note">Aucune partie pour l\'instant. Va au tournoi !</p>';
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
$("bSolution").onclick=()=>{if(etat!=="jeu")return;indice=2;bilan(false,0);$("parch").innerHTML=`<p><span class="ko">Voici la solution.</span><br>${PZ.x}</p>`;montrerSolution(true);$("bIndice").disabled=true;$("bSolution").disabled=true;iaBouton("bExplique","parch",()=>iaQuestionEpreuve(null));};
$("bSon").onclick=()=>{S.son=!S.son;save();$("bSon").textContent="Son : "+(S.son?"oui":"non");$("bSon").setAttribute("aria-pressed",S.son);};
$("bSon").textContent="Son : "+(S.son?"oui":"non");
$("nom").addEventListener("input",e=>{S.nom=e.target.value;save();majEntete();});
/* Onglets. L'échiquier est partagé : il passe d'un onglet à l'autre avec sa partie. */
let mode="salle";
function onglet(v){
  if(v===mode&&v!=="blason"){scrollTo(0,0);return;}
  if(mode==="salle"){partie++;} // les minuteries d'épreuve en cours s'annulent
  if(mode==="tournoi"){if(!$("cJeu").hidden)cQuitter();T.jeton++;MOTEUR.stop();} // la réflexion de l'adversaire reprendra au retour
  mode=v;
  for(const[k,id,t]of[["salle","vSalle","tSalle"],["tournoi","vTournoi","tTournoiB"],["blason","vBlason","tBlason"]]){
    $(id).hidden=k!==v;$(t).setAttribute("aria-current",k===v);}
  $("vSalle").style.display=v==="salle"?"flex":"none";
  clearMarks();sel=null;
  if(v==="salle"){
    $("sSlot").appendChild($("plateau"));
    if(etat==="attente")charger(PZ); // une réponse adverse était en route : on reprend l'épreuve
    else{G=new Chess(PZ.fen);for(let i=0;i<step_;i++)G.move(PZ.line[i]);flip=(PZ.a?(new Chess(PZ.fen).turn()==="w"?"b":"w"):new Chess(PZ.fen).turn())==="b";draw();}
  }else if(v==="tournoi"){
    $("tSlot").appendChild($("plateau"));
    MOTEUR.demarrer();tAfficher();tEntete();
    if(T.g&&T.etat==="pense")tAdversaire(); // la réflexion avait été interrompue
  }else majBlason();
  scrollTo(0,0);
}
$("parties").onclick=e=>{const b=e.target.closest("button[data-p]");if(b)conseilOuvrir(+b.dataset.p);};
$("tSalle").onclick=()=>onglet("salle");$("tTournoiB").onclick=()=>onglet("tournoi");$("tBlason").onclick=()=>onglet("blason");
const ch=$("chips");ch.dataset.f="tous";
ch.innerHTML=[["tous","Toutes les bottes"],...Object.entries(THEMES)].map(([k,v])=>`<button type="button" class="chip${k==="tous"?" on":""}" data-k="${k}">${v}</button>`).join("");
ch.onclick=e=>{const b=e.target.closest(".chip");if(!b)return;ch.dataset.f=b.dataset.k;ch.querySelectorAll(".chip").forEach(c=>c.classList.toggle("on",c===b));charger(choisir());};
majEntete();charger(choisir());
if(tReprendre()){tMsg(`Ta partie contre <b>${T.niv.nom}</b> t'attend. À toi de jouer !`);}
if("serviceWorker" in navigator){addEventListener("load",()=>navigator.serviceWorker.register("sw.js").catch(()=>{}));}
