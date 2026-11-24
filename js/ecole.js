/* École de la salle d'armes (lot 14) : leçons d'ouvertures et mode « Trouve la menace ».
   Les deux utilisent l'échiquier de la salle. SM dit quel mode est actif (null : épreuves normales). */
let SM=null;

/* ---------- Leçons d'ouvertures ----------
   Passe 1 : l'enfant suit les flèches vertes, chaque coup est expliqué.
   Passe 2 : il rejoue l'ouverture de mémoire ; une erreur montre la flèche (au plus une erreur pour réussir). */
const L={o:null,i:0,passe:1,fautes:0,fauteIci:-1,msg:""};
function leconListe(){
  const html=OUVERTURES.map(o=>`<button type="button" class="ouv${S.ouvertures[o.k]?" appris":""}" data-k="${o.k}">
    <b>${S.ouvertures[o.k]?"✓ ":""}${o.nom}</b><span>${o.camp==="w"?"Avec les blancs":"Avec les noirs"} · ${o.x}</span></button>`).join("");
  scene("ouvListe",`<div class="parchemin-carte" onclick="event.stopPropagation()">
    <h2>Les ouvertures</h2><p class="note">Les premiers coups d'une partie. Choisis-en une : tu la joues d'abord avec les flèches, puis de mémoire.</p>
    <div class="ouvs">${html}</div><button type="button" class="or" id="ouvFermer">Retour à la salle</button></div>`,600000);
  $("ouvFermer").onclick=()=>$("ouvListe").classList.remove("on");
  document.querySelectorAll("#ouvListe .ouv").forEach(b=>b.onclick=()=>{$("ouvListe").classList.remove("on");leconCommencer(b.dataset.k);});
}
function leconCommencer(k){
  if(J.actif)jouteArreter();
  L.o=OUVERTURES.find(o=>o.k===k);if(!L.o)return;
  SM="lecon";L.passe=1;L.fautes=0;leconDepart();
}
function leconDepart(){
  partie++;L.i=0;L.fauteIci=-1;L.msg="";G=new Chess();sel=null;flip=L.o.camp==="b";
  draw();clearArrows();leconEntete();
  $("parch").innerHTML=`<p>${L.passe===1?`<b>${L.o.nom}</b> : ${L.o.x}`:"<b>De mémoire !</b> Rejoue la même ouverture, sans flèche."}</p>`;
  leconEtape();
}
function leconEntete(){
  $("trait").className="trait "+L.o.camp;$("mTitre").textContent=L.o.nom;
  $("mTexte").textContent=L.passe===1?"Suis les flèches vertes.":"De mémoire : à toi de retrouver les coups !";
  $("mTheme").textContent=L.passe===1?"Ouverture":"De mémoire";
  $("sceau").className="sceau";$("bExplique").hidden=true;
  $("bIndice").textContent="Indice";$("bIndice").disabled=L.passe===1;$("bSolution").disabled=true;
}
function leconAMoi(){return (L.i%2===0)===(L.o.camp==="w");}
function leconAttendu(){return new Chess(G.fen()).move(L.o.l[L.i][0]);}
function leconEtape(){
  clearArrows();clearMarks();
  if(L.i>=L.o.l.length){leconFinPasse();return;}
  if(!leconAMoi()){ // coup de l'adversaire, joué tout seul
    etat="attente";
    plus(()=>{const[san,c]=L.o.l[L.i];const m=G.move(san);animMove(m);L.i++;
      L.msg=`L'adversaire joue <b>${fr(m.san)}</b>. ${c}`;leconEtape();},L.i?1100:600);
    if(L.msg)$("parch").innerHTML=`<p>${L.msg}</p>`;
    return;
  }
  etat="jeu";
  const mv=leconAttendu();
  if(L.passe===1){arrow(mv.from,mv.to);sqEl(mv.from).classList.add("hint");}
  $("parch").innerHTML=`<p>${L.msg?L.msg+"<br>":""}<b>À toi :</b> ${L.passe===1?"joue le coup de la flèche verte.":"quel est le coup suivant ?"}</p>`;
}
function leconMontrer(){ // passe 2 : erreur ou indice, la flèche apparaît (une seule faute comptée par coup)
  const mv=leconAttendu();if(L.fauteIci!==L.i){L.fauteIci=L.i;L.fautes++;}
  clearArrows();arrow(mv.from,mv.to);sqEl(mv.from).classList.add("hint");
}
function leconJouer(vm){
  clearMarks();sel=null;const mv=leconAttendu();
  if(vm.from!==mv.from||vm.to!==mv.to){
    B.classList.add("shake");setTimeout(()=>B.classList.remove("shake"),420);
    if(L.passe===1){sqEl(mv.from).classList.add("hint");$("parch").innerHTML=`<p>Pas celui-là : suis la flèche verte, depuis la pièce qui brille !</p>`;}
    else{leconMontrer();$("parch").innerHTML=`<p><span class="ko">Pas tout à fait.</span> La flèche verte montre le bon coup : joue-le !</p>`;}
    return;
  }
  const[san,c]=L.o.l[L.i];const m=G.move(san);animMove(m);L.i++;
  L.msg=`<span class="ok">${fr(m.san)}</span> : ${c}`;leconEtape();
}
function leconFinPasse(){
  etat="fini";
  if(L.passe===1){
    $("parch").innerHTML=`<p>${L.msg}<br><span class="ok">Tu as joué toute l'ouverture !</span> Maintenant, rejoue-la <b>de mémoire</b>, sans flèche…</p>`;
    plus(()=>{L.passe=2;L.fautes=0;leconDepart();},4500);return;
  }
  if(L.fautes<=1){
    const deja=!!S.ouvertures[L.o.k],gain=deja?3:15;S.ouvertures[L.o.k]=true;gagnerXP(gain);save();majEntete();hautsVerifier();
    setTimeout(()=>{SON.victoire();burstAt($("board"),50,["#e3b84b","#f3dc94","#2f8f5b","#ffffff"]);sceau("Appris !",false,1600);},400);
    $("parch").innerHTML=`<p><span class="ok">Bravo ! Tu connais cette ouverture par cœur : ${L.o.nom}. +${gain} XP</span><br>Touche « Ouvertures » pour en apprendre une autre, ou « Suivante » pour une épreuve.</p>`;
  }else{
    $("parch").innerHTML=`<p>${L.fautes} erreurs cette fois. Ce n'est pas grave : on recommence de mémoire !</p>`;
    plus(()=>{L.fautes=0;leconDepart();},3000);
  }
}

/* ---------- Trouve la menace ----------
   Une position d'épreuve (vérifiée) où l'adversaire menace quelque chose : l'enfant touche la pièce adverse qui menace.
   Deux essais ; ensuite la réponse est montrée. */
const M={fen:null,ms:[],essais:0,fini:false,id:null};
function menacePosition(){
  const rec=new Set(S.menaces.vus||[]);let repli=null;
  for(let essai=0;essai<120;essai++){
    const p=P[Math.floor(Math.random()*P.length)];
    if(Math.abs(p.r-S.cote)>(essai<60?250:600)||rec.has(p.id))continue;
    const fen=fenJoueur(p),ms=menacesDe(fen),n=new Set(ms.map(m=>m.from)).size;
    if(ms.length&&n<=2){return {fen,ms,id:p.id};}
    if(ms.length&&!repli)repli={fen,ms,id:p.id};
  }
  return repli||{fen:"6k1/5ppp/8/8/8/2n5/8/3QK3 w - - 0 1",ms:menacesDe("6k1/5ppp/8/8/8/2n5/8/3QK3 w - - 0 1"),id:"menace0"};
}
function menaceSuivante(){
  if(J.actif)jouteArreter();
  partie++;SM="menace";const pos=menacePosition();
  Object.assign(M,pos,{essais:0,fini:false});
  S.menaces.vus=[...(S.menaces.vus||[]),pos.id].slice(-30);save();
  menaceAfficher();
  $("parch").innerHTML=`<p>Si c'était à l'adversaire de jouer, que ferait-il ? <b>Touche la pièce adverse qui menace</b> quelque chose.</p>`;
}
function menaceAfficher(){
  G=new Chess(M.fen);sel=null;flip=G.turn()==="b";etat=M.fini?"fini":"jeu";draw();clearArrows();
  const blanc=G.turn()==="w";$("trait").className="trait "+(blanc?"w":"b");
  $("mTitre").textContent="Trouve la menace";$("mTexte").textContent=`Tu as les ${blanc?"blancs":"noirs"}. Quelle pièce adverse te menace ?`;
  $("mTheme").textContent="Menace";$("sceau").className="sceau";$("bExplique").hidden=true;
  $("bIndice").textContent="Indice";$("bIndice").disabled=true;$("bSolution").disabled=M.fini;
  if(M.fini)menaceFleches(M.ms);
}
function menaceFleches(ms){clearArrows();for(const m of ms)arrow(m.from,m.to,true);}
function menacePhrase(m){
  const qui=NOMS[m.piece]+" en "+m.from;
  return m.mat?`${qui} menace de faire <b>échec et mat</b> en ${m.to} !`
    :`${qui} menace de prendre ${NOM_PIECE[m.captured]} en ${m.to}${m.defendu?" (même si tu reprends, tu perds plus que lui)":`, qui n'est pas défendu${"qr".includes(m.captured)?"e":""}`}.`;
}
function menaceToucher(sq){
  if(M.fini||etat!=="jeu")return;
  const p=G.get(sq);if(!p)return;
  if(p.color===G.turn()){$("parch").innerHTML=`<p>C'est une de tes pièces. Touche une pièce de <b>l'adversaire</b> !</p>`;return;}
  const t=M.ms.filter(m=>m.from===sq);
  if(t.length){
    const gain=M.essais?1:3;M.fini=true;etat="fini";S.menaces.ok++;S.menaces.n++;gagnerXP(gain);save();majEntete();
    menaceFleches(t);sqEl(sq).classList.add("hint");
    setTimeout(()=>{SON.victoire();sceau("Bien vu !",false,1200);},200);
    $("parch").innerHTML=`<p><span class="ok">Bien vu ! +${gain} XP</span> ${t.map(menacePhrase).join(" ")}<br>Avant chaque coup, demande-toi : « Que veut faire mon adversaire ? »</p>`;
    $("bSolution").disabled=true;return;
  }
  M.essais++;SON.rate();B.classList.add("shake");setTimeout(()=>B.classList.remove("shake"),420);
  if(M.essais>=2){menaceSolution();return;}
  $("parch").innerHTML=`<p>Non, ${NOMS[p.type].toLowerCase()} ne menace rien de grave pour l'instant. Regarde les pièces qui attaquent tes pièces ou ton roi !</p>`;
}
function menaceSolution(){
  if(M.fini)return;M.fini=true;etat="fini";S.menaces.n++;save();
  menaceFleches(M.ms);const de=[...new Set(M.ms.map(m=>m.from))];de.forEach(s=>sqEl(s).classList.add("hint"));
  $("parch").innerHTML=`<p><span class="ko">Regarde les flèches rouges.</span> ${M.ms.slice(0,3).map(menacePhrase).join(" ")}<br>Touche « Suivante » pour une autre position.</p>`;
  $("bSolution").disabled=true;
}
