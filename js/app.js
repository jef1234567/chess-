/* Application : logique d'épreuve, blason et interface. */
/* ---------- Logique d'épreuve ---------- */
// Une épreuve : PZ.line alterne les coups à partir du trait de PZ.fen. Si PZ.a vaut 1,
// le premier coup est celui de l'adversaire et l'appli le joue toute seule (problèmes Lichess).
const MATS=["mat1","mat2"];
for(let i=P.length-1;i>=0;i--)if(EXCLUS.includes(P[i].id))P.splice(i,1);
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
  let filtre=$("chips").dataset.f||"tous";
  if(filtre==="quete"){const q=queteSuivante();if(q)return q;filtre="tous";}
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
  $("bIndice").disabled=!!p.a||J.actif;$("bSolution").disabled=!!p.a||J.actif;$("bIndice").textContent="Indice";
  if(p.a){
    $("parch").innerHTML=`<p>Tu joues les <b>${blanc?"blancs":"noirs"}</b>. Regarde bien le coup de l'adversaire…</p>`;
    plus(()=>{const m=G.move(PZ.line[0]);animMove(m);step_=1;etat="jeu";$("bIndice").disabled=J.actif;$("bSolution").disabled=J.actif;
      $("parch").innerHTML=`<p>L'adversaire a joué <b>${m.san}</b>. À toi ! Touche une pièce, puis la case où tu veux la jouer.</p>`;},700);
  } else $("parch").innerHTML=`<p>Tu joues les <b>${blanc?"blancs":"noirs"}</b>. Touche une pièce, puis la case où tu veux la jouer.</p>`;
}
function tap(sq){
  const conseil=mode==="tournoi"&&!$("cJeu").hidden,tournoi=mode==="tournoi"&&!conseil,duel=mode==="duel";
  if(duel?!dPeutJouer():conseil?!cPeutJouer():tournoi?!tPeutJouer():(etat!=="jeu"&&etat!=="corrige"))return;
  const p=G.get(sq);
  if(sel&&sel!==sq){
    const mv=G.moves({square:sel,verbose:true}).find(m=>m.to===sq);
    if(mv){(duel?dJouer:conseil?cJouer:tournoi?tJouer:jouer)(mv);return;}
    const q=G.get(sq);if(!q||q.color!==G.turn()){pourquoiPas(sel,sq,duel?dMsg:conseil?cMsg:tournoi?tMsg:m=>$("parch").innerHTML=`<p>${m}</p>`);clearMarks();sel=null;return;}
  }
  clearMarks();
  if(p&&p.color===G.turn()&&sel!==sq){
    sel=sq;sqEl(sq).classList.add("sel");pieces[sq]&&pieces[sq].classList.add("up");setTimeout(()=>pieces[sq]&&pieces[sq].classList.remove("up"),260);
    G.moves({square:sq,verbose:true}).forEach(m=>{const s=document.createElement("div");s.className=m.captured?"ring":"dot";sqEl(m.to).appendChild(s);});
  } else sel=null;
}
function jouer(vm){
  if(etat==="corrige"){jouerCorrection(vm);return;}
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
  etat="fini";const et=etoilesDe(indice),gain={3:10,2:7,1:5}[et];noterEtoiles(PZ.id,et);
  setTimeout(()=>{
    SON.victoire();burstAt($("board"),50,["#e3b84b","#f3dc94","#2f8f5b","#ffffff","#b8343e"]);
    if(G.in_checkmate())confettis();
    sceau(["Bravo !","Touché !","Superbe !","Victoire !"][Math.floor(Math.random()*4)],false,1400,et);
  },420);
  bilan(true,gain);
  $("parch").innerHTML=`<p>${etoilesHTML(et)} <span class="ok">Bien joué, ${esc(nomOuEcuyer())} ! +${gain} XP</span><br>${PZ.x}</p>`;
  $("bIndice").disabled=true;$("bSolution").disabled=true;
  finEpreuve(true);
}
function finEpreuve(ok){if(J.actif){jouteApres(ok);return;}queteApres();conquetesVerifier();}
function echec(m){
  etat="fini";SON.rate();
  setTimeout(()=>{B.classList.add("shake");setTimeout(()=>B.classList.remove("shake"),420);
    sceau("Pas cette fois",true,1200);},300);
  plus(()=>{G=new Chess(PZ.fen);for(let i=0;i<step_;i++)G.move(PZ.line[i]);draw();corriger();},1200);
  bilan(false,0);
  $("parch").innerHTML=`<p><span class="ko">Ce coup (${m.san}) ne marche pas.</span>${J.actif?"":" La flèche verte montre le bon coup. <b>À toi de le jouer</b> pour voir ce qui se passe !"}</p>`;
  $("bIndice").disabled=true;$("bSolution").disabled=true;
  iaBouton("bExplique","parch",()=>iaQuestionEpreuve(m.san));
  finEpreuve(false);
}
/* Correction : après une erreur ou la solution, l'enfant joue lui-même le coup de la flèche verte,
   puis voit la réponse adverse et la suite, coup par coup, jusqu'à la fin de la ligne. */
function corriger(){
  if(J.actif)return;
  const g=new Chess(G.fen());const mv=g.move(PZ.line[step_]);if(!mv){etat="fini";return;}
  clearArrows();clearMarks();sel=null;arrow(mv.from,mv.to);sqEl(mv.from).classList.add("hint");
  etat="corrige";
}
function jouerCorrection(vm){
  clearMarks();sel=null;
  const bon=new Chess(G.fen()).move(PZ.line[step_]);
  if(!bon||vm.from!==bon.from||vm.to!==bon.to){
    $("parch").innerHTML=`<p>Pas celui-là. Joue la pièce qui brille, en suivant la flèche verte !</p>`;
    B.classList.add("shake");setTimeout(()=>B.classList.remove("shake"),420);if(bon)sqEl(bon.from).classList.add("hint");return;}
  clearArrows();const m=G.move(PZ.line[step_]);animMove(m);step_++;etat="suite";
  const fin=r=>{etat="fini";plus(()=>{$("parch").innerHTML=`<p><span class="ok">Voilà ce qu'il fallait jouer : ${m.san} !</span>${r?` L'adversaire a répondu ${r.san}.`:""}<br>${PZ.x}</p>`;},600);};
  if(step_>=PZ.line.length||G.game_over()){fin(null);return;}
  $("parch").innerHTML=`<p>Bien ! Regarde maintenant ce que fait l'adversaire…</p>`;
  plus(()=>{const r=G.move(PZ.line[step_]);if(!r){fin(null);return;}animMove(r);step_++;
    if(step_>=PZ.line.length||G.game_over()){fin(r);return;}
    $("parch").innerHTML=`<p>L'adversaire répond <b>${r.san}</b>. Continue : joue le coup de la nouvelle flèche verte.</p>`;corriger();},900);
}
function bilan(ok,gain){
  const exp=1/(1+Math.pow(10,(PZ.r-S.cote)/400));const score=ok?(indice?.6:1):0;
  S.cote=Math.round(Math.max(200,S.cote+32*(score-exp)));
  gagnerXP(gain);if(ok){S.reussi++;S.serie++;S.best=Math.max(S.best,S.serie);}else S.serie=0;
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
  $("nom").value=S.nom;$("sReussi").textContent=S.reussi;$("sSerie").textContent=S.best;$("sCote").textContent=S.cote;$("sEtoiles").textContent=totalEtoiles();$("sJoute").textContent=S.joute.best;$("sRoyaume").textContent=`${LIEUX.filter(lieuConquis).length}/${LIEUX.length}`;
  $("themes").innerHTML=Object.keys(THEMES).map(k=>{const t=S.th[k]||{ok:0,n:0};const pc=t.n?Math.round(t.ok/t.n*100):0;
    return `<div class="th"><span>${THEMES[k]}</span><em>${t.ok}/${t.n}</em><div class="bar"><i style="width:${pc}%"></i></div></div>`;}).join("");
  $("tBilan").innerHTML=NIVEAUX.map(n=>{const b=S.tournoi.bilan[n.k]||{v:0,n:0,d:0};
    return `<div class="th"><span>${n.nom}</span><em>${b.v} victoire${b.v>1?"s":""} · ${b.n} nulle${b.n>1?"s":""} · ${b.d} défaite${b.d>1?"s":""}</em></div>`;}).join("")+
    (S.duels.v+S.duels.n+S.duels.d?`<div class="th"><span>Duels à distance</span><em>${S.duels.v} victoire${S.duels.v>1?"s":""} · ${S.duels.n} nulle${S.duels.n>1?"s":""} · ${S.duels.d} défaite${S.duels.d>1?"s":""}</em></div>`:"");
  const RES={victoire:["Victoire","#9be3b8"],defaite:["Défaite","#ffb3b8"],nulle:["Nulle","#f3dc94"],abandon:["Abandon","#ffb3b8"]};
  $("parties").innerHTML=S.parties.length?S.parties.map((p,i)=>{const n=nivDe(p.niv);const r=RES[p.res]||["?","#fff"];
    return `<div><span>${new Date(p.d).toLocaleDateString("fr-FR",{day:"numeric",month:"short"})} · ${n.finale?n.finale.nom:p.niv==="duel"?"Duel contre "+esc(p.adv||"?"):n.chev} · <b style="color:${r[1]}">${r[0]}</b></span><button type="button" class="petit" data-p="${i}">Conseil</button></div>`;}).join(""):'<p class="note">Aucune partie pour l\'instant. Va au tournoi !</p>';
  $("hist").innerHTML=S.hist.length?S.hist.map(h=>`<div><span>${THEMES[h.t]}</span><span style="color:${h.ok?"#9be3b8":"#ffb3b8"}">${h.ok?"Réussi":"Raté"}</span></div>`).join(""):'<p class="note">Aucune épreuve pour l\'instant. Va à la salle d\'armes !</p>';
}
function esc(s){return s.replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));}

/* ---------- Interface ---------- */
/* Un coup impossible n'est jamais refusé en silence : on explique pourquoi (règles des échecs). */
const NOMS={p:"Le pion",n:"Le cavalier",b:"Le fou",r:"La tour",q:"La dame",k:"Le roi"};
function pourquoiPas(de,a,dire){
  const p=G.get(de);if(!p)return;
  const g=new Chess(G.fen()),echecAvant=g.in_check();
  let msg;
  if(p.type==="k"&&Math.abs(files.indexOf(de[0])-files.indexOf(a[0]))===2&&de[1]===a[1])
    msg="Tu ne peux pas roquer maintenant : le roi ou la tour a déjà bougé, une pièce gêne, ou le roi passerait par une case attaquée.";
  else{
    g.remove(de);g.remove(a);g.put(p,a); // la pièce posée là : le roi serait-il en échec ?
    if(g.in_check())msg=echecAvant?"Ton roi est en échec : ce coup ne le sauve pas. Prends la pièce qui attaque, mets une pièce devant, ou bouge ton roi !"
      :p.type==="k"?"Ton roi serait en échec sur cette case : elle est attaquée.":`${NOMS[p.type]} protège ton roi : s'il bouge, ton roi est en échec. Il est cloué !`;
    else msg=`${NOMS[p.type]} ne peut pas aller là : ${{p:"il avance tout droit et prend en diagonale.",n:"il saute en L.",b:"il va en diagonale, sans sauter par-dessus les pièces.",r:"elle va tout droit, sans sauter par-dessus les pièces.",q:"elle va tout droit ou en diagonale, sans sauter par-dessus les pièces.",k:"il avance d'une case."}[p.type]}`;
  }
  dire(`<span class="ko">Coup impossible.</span> ${msg}`);
}
/* Toucher (une case puis une autre) ou glisser une pièce avec le doigt. */
function caseDe(e){const r=B.getBoundingClientRect();let f=Math.floor((e.clientX-r.left)/r.width*8),rr=Math.floor((e.clientY-r.top)/r.height*8);
  if(f<0||f>7||rr<0||rr>7)return null;if(flip){f=7-f;rr=7-rr;}return files[f]+(8-rr);}
let glis=null;
B.addEventListener("pointerdown",e=>{if(e.button>0)return;const sq=caseDe(e);if(!sq)return;ac();
  if(mode==="tournoi"&&$("cJeu").hidden&&T.g&&T.etat==="pense"){tMsg(`Attends ton tour : <b>${T.niv.chev}</b> réfléchit…`);return;}
  if(mode==="duel"&&D.jeu&&!dTermine()&&G.turn()!==dCamp()){dMsg(`Attends ton tour : <b>${esc(D.adv||"ton adversaire")}</b> réfléchit…`);return;}
  tap(sq);
  if(sel===sq&&pieces[sq]){glis={de:sq,el:pieces[sq],x:e.clientX,y:e.clientY,bouge:false};try{B.setPointerCapture(e.pointerId);}catch(x){}}});
B.addEventListener("pointermove",e=>{if(!glis)return;const dx=e.clientX-glis.x,dy=e.clientY-glis.y;
  if(!glis.bouge&&Math.hypot(dx,dy)<8)return;glis.bouge=true;glis.el.style.zIndex=6;glis.el.style.transform=tr(glis.de,` translate(${dx}px,${dy}px) scale(1.15)`);});
function finGlisse(e){if(!glis)return;const g=glis;glis=null;if(!g.bouge)return;
  g.el.style.zIndex="";place(g.el,g.de);const sq=caseDe(e);if(sq&&sq!==g.de&&sel===g.de){poseDirecte=true;tap(sq);poseDirecte=false;}}
B.addEventListener("pointerup",finGlisse);B.addEventListener("pointercancel",e=>{if(glis){glis.el.style.zIndex="";place(glis.el,glis.de);glis=null;}});
$("bSuivant").onclick=()=>{ac();charger(choisir());};
/* Indice gradué : 1) la pièce à jouer, 2) la case d'arrivée, 3) la solution. Chaque indice coûte une étoile. */
$("bIndice").onclick=()=>{if(etat!=="jeu")return;const g=new Chess(G.fen());const mv=g.move(PZ.line[step_]);if(!mv)return;
  if(indice>=2){$("bSolution").onclick();return;}
  indice++;clearMarks();sel=null;sqEl(mv.from).classList.add("hint");
  if(indice===1){$("parch").innerHTML=`<p>Indice 1 : la pièce qui brille est celle à jouer. ${etoilesHTML(2)}</p>`;$("bIndice").textContent="Indice 2";}
  else{sqEl(mv.to).classList.add("hint");$("parch").innerHTML=`<p>Indice 2 : elle va sur l'autre case qui brille. ${etoilesHTML(1)}</p>`;$("bIndice").textContent="Solution";}};
$("bSolution").onclick=()=>{if(etat!=="jeu")return;indice=3;bilan(false,0);$("parch").innerHTML=`<p><span class="ko">Voici la solution.</span> <b>Joue toi-même le coup de la flèche verte</b> pour voir ce qui se passe.</p>`;corriger();$("bIndice").disabled=true;$("bSolution").disabled=true;iaBouton("bExplique","parch",()=>iaQuestionEpreuve(null));finEpreuve(false);};
$("bSon").onclick=()=>{S.son=!S.son;save();$("bSon").textContent="Son : "+(S.son?"oui":"non");$("bSon").setAttribute("aria-pressed",S.son);};
$("bSon").textContent="Son : "+(S.son?"oui":"non");
$("nom").addEventListener("input",e=>{S.nom=e.target.value;save();majEntete();});
/* Onglets. L'échiquier est partagé : il passe d'un onglet à l'autre avec sa partie. */
let mode="salle";
function onglet(v){
  if(v===mode&&v!=="blason"){scrollTo(0,0);return;}
  if(mode==="salle"){partie++;if(J.actif){jouteArreter();$("mTheme").textContent=THEMES[PZ.t];}} // les minuteries d'épreuve en cours s'annulent
  if(mode==="tournoi"){if(!$("cJeu").hidden)cQuitter();T.jeton++;MOTEUR.stop();} // la réflexion de l'adversaire reprendra au retour
  mode=v;
  for(const[k,id,t]of[["salle","vSalle","tSalle"],["tournoi","vTournoi","tTournoiB"],["duel","vDuel","tDuelB"],["blason","vBlason","tBlason"]]){
    $(id).hidden=k!==v;$(t).setAttribute("aria-current",k===v);}
  clearMarks();sel=null;
  if(v==="salle"){
    $("sSlot").appendChild($("plateau"));
    if(etat==="attente")charger(PZ); // une réponse adverse était en route : on reprend l'épreuve
    else if(etat==="suite"){etat="fini";G=new Chess(PZ.fen);for(let i=0;i<step_;i++)G.move(PZ.line[i]);draw();} // la correction s'arrête là
    else{G=new Chess(PZ.fen);for(let i=0;i<step_;i++)G.move(PZ.line[i]);flip=(PZ.a?(new Chess(PZ.fen).turn()==="w"?"b":"w"):new Chess(PZ.fen).turn())==="b";draw();if(etat==="corrige")corriger();}
  }else if(v==="tournoi"){
    $("tSlot").appendChild($("plateau"));
    MOTEUR.demarrer();tAfficher();tEntete();
    if(T.g&&T.etat==="pense")tAdversaire(); // la réflexion avait été interrompue
  }else if(v==="duel")dOnglet();
  else majBlason();
  scrollTo(0,0);
}
$("parties").onclick=e=>{const b=e.target.closest("button[data-p]");if(b)conseilOuvrir(+b.dataset.p);};
$("tSalle").onclick=()=>onglet("salle");$("tTournoiB").onclick=()=>onglet("tournoi");$("tBlason").onclick=()=>onglet("blason");$("tDuelB").onclick=()=>onglet("duel");
const ch=$("chips");ch.dataset.f="tous";
ch.innerHTML=`<button type="button" class="chip special" data-k="quete">Quête du jour</button><button type="button" class="chip special" data-k="carte">Carte du royaume</button><button type="button" class="chip special" data-k="joute">Joute 3 min</button>`+
  [["tous","Toutes les bottes"],...Object.entries(THEMES)].map(([k,v])=>`<button type="button" class="chip${k==="tous"?" on":""}" data-k="${k}">${v}</button>`).join("");
function choisirFiltre(k){
  if(J.actif)jouteArreter();
  ch.dataset.f=k;ch.querySelectorAll(".chip").forEach(c=>c.classList.toggle("on",c.dataset.k===k));
  const b=ch.querySelector(`.chip[data-k="${k}"]`);b&&b.scrollIntoView({block:"nearest",inline:"center",behavior:"smooth"});
  charger(choisir());
}
ch.onclick=e=>{const b=e.target.closest(".chip");if(!b)return;const k=b.dataset.k;ac();
  if(k==="carte"){ouvrirCarte();return;}
  if(k==="joute"){ch.dataset.f="tous";ch.querySelectorAll(".chip").forEach(c=>c.classList.toggle("on",c===b));jouteDemarrer();return;}
  choisirFiltre(k);};
majQueteChip();
/* Vrai plein écran (barre de Chrome masquée) au premier toucher de chaque visite, sauf si l'appli installée l'est déjà. */
let pleinTente=false;
function pleinEcran(){
  if(pleinTente||!S.pleinEcran)return;pleinTente=true;
  const d=document.documentElement;
  if(document.fullscreenElement||matchMedia("(display-mode: fullscreen)").matches||!d.requestFullscreen)return;
  d.requestFullscreen({navigationUI:"hide"}).catch(()=>{});
}
addEventListener("pointerdown",pleinEcran,{passive:true});
function majPlein(){$("apPlein").classList.toggle("on",!!S.pleinEcran);$("apPlein").setAttribute("aria-pressed",!!S.pleinEcran);$("apPlein").textContent="Plein écran : "+(S.pleinEcran?"oui":"non");}
$("apPlein").onclick=()=>{S.pleinEcran=!S.pleinEcran;save();majPlein();
  if(!S.pleinEcran&&document.fullscreenElement)document.exitFullscreen().catch(()=>{});
  else if(S.pleinEcran){pleinTente=false;pleinEcran();}};
majPlein();
majEntete();charger(choisir());
if(tReprendre()){tMsg(`Ta partie contre <b>${T.niv.nom}</b> t'attend. À toi de jouer !`);}
// Duel à distance : reprise d'un duel en cours, ou lien d'invitation (#duel=CODE)
dReprendre().then(()=>{const m=location.hash.match(/duel=([A-Za-z0-9-]+)/);if(!m)return;
  history.replaceState(null,"",location.pathname+location.search);const c=dNormaliser(m[1]);
  onglet("duel");if(D.code===c)return;if(!D.code){$("dCode").value=dJoli(c);$("dErreur").textContent="Touche « Rejoindre » pour entrer dans le duel.";}
  else $("dErreur").textContent="Un autre duel est en cours : quitte-le d'abord pour rejoindre celui-ci.";});
if("serviceWorker" in navigator){addEventListener("load",()=>navigator.serviceWorker.register("sw.js").catch(()=>{}));}
