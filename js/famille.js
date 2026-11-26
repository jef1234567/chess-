/* Famille (lot 15) : choix du joueur, règles et conseils selon l'âge, « Les pièces » pour les débutants,
   lecture à voix haute pour les petits, et suivi des progrès par joueur.
   Le registre des joueurs et la sauvegarde de chacun sont dans profile.js. */

/* ---------- Textes selon l'âge ---------- */
const BUT_AGE={
  petit:{mat1:"Coince le roi : échec et mat en un coup !",prise:"Une pièce n'est pas gardée. Mange-la !"},
  adulte:{mat1:"Mat en 1.",mat2:"Mat en 2.",fourchette:"Fourchette.",attaqueDouble:"Attaque double.",prise:"Gain de matériel.",enfilade:"Enfilade.",
    clouage:"Clouage.",decouverte:"Attaque à la découverte.",defense:"Un seul coup sauve la position.",finale:"Finale : le coup précis."}};
function butDe(t){const a=BUT_AGE[ageCat()];return (a&&a[t])||BUT[t]||"";}
const ASTUCES={
  petit:["Le cavalier saute en L, comme un petit cheval.","Le roi fait un seul petit pas à la fois.","Avant de jouer, regarde : est-ce qu'on peut manger ta pièce ?",
    "La tour va tout droit, comme une flèche.","Le fou glisse en diagonale, comme sur un toboggan.","La dame est la plus forte : elle va partout !"],
  enfant:["Avant chaque coup, cherche les échecs, les prises et les menaces.","Une pièce qui n'est pas protégée est une cible. Protège les tiennes !",
    "Le cavalier adore les fourchettes : il attaque deux pièces d'un coup.","Au début, sors tes cavaliers et tes fous, puis roque.",
    "Tu as trouvé un bon coup ? Cherches-en un meilleur !","Regarde aussi ce que veut faire l'adversaire."],
  adulte:["Méthode : d'abord les coups forcés (échecs, prises, menaces).","Compte attaquants et défenseurs avant de prendre.",
    "Une pièce clouée défend mal : exploite-la.","En finale, active ton roi.","Les pièces non défendues appellent les tactiques.",
    "Vérifie la meilleure réponse adverse avant de jouer."]};
function astuceHTML(t){
  const c=ageCat();
  if(c==="petit")return `<p class="astuce">${butDe(t)}</p>`; // pour les petits, le but compte plus qu'une astuce
  if(c==="adulte"&&Math.random()<.66)return "";
  const l=ASTUCES[c];return `<p class="astuce"><b>Astuce :</b> ${l[Math.floor(Math.random()*l.length)]}</p>`;
}

/* ---------- Les pièces : apprendre comment chaque pièce se déplace (pour les débutants) ----------
   Une pièce blanche seule et des pions noirs à manger. Il n'y a pas de roi : chess.js 0.10.3 l'accepte
   et donne les déplacements de la pièce. Après chaque coup, c'est de nouveau aux blancs. */
const PIECES_LECONS=[
  {p:"R",nom:"La tour",dit:"La tour va tout droit : en avant, en arrière, à droite, à gauche. Comme une flèche !",niv:[["d4",["d7","g4"]],["b2",["b6","f6","f3"]]]},
  {p:"B",nom:"Le fou",dit:"Le fou glisse en diagonale, comme sur un toboggan.",niv:[["c1",["f4"]],["d2",["g5","e7","b4"]]]},
  {p:"Q",nom:"La dame",dit:"La dame est la plus forte : elle va tout droit ET en diagonale !",niv:[["d1",["d6","h2"]],["a3",["e7","e2","b5"]]]},
  {p:"K",nom:"Le roi",dit:"Le roi est très important. Il fait un seul petit pas, dans tous les sens.",niv:[["e2",["e3"]],["e2",["e3","g4"]]]},
  {p:"N",nom:"Le cavalier",dit:"Le cavalier saute en L : deux cases tout droit, puis une sur le côté. Il saute par-dessus les pièces !",niv:[["b1",["c3"]],["g1",["f3","e5","c6"]]]},
  {p:"P",nom:"Le pion",dit:"Le pion avance tout droit. Mais pour manger, il va en diagonale !",niv:[["d2",["e5"]],["c2",["d4","c6"]]]}];
const PIECES_NIV=PIECES_LECONS.flatMap((l,i)=>l.niv.map((n,j)=>({l:i,j,de:n[0],cibles:n[1]})));
const PQ={i:0,case:null,fini:false};
function piecesFen(pos,de,cibles,lettre){
  const g=new Chess();g.clear();g.put({type:lettre.toLowerCase(),color:"w"},de);for(const c of cibles)g.put({type:"p",color:"b"},c);
  return g.fen().split(" ")[0]+" w - - 0 1";
}
function piecesDemarrer(){PQ.i=Math.min(S.piecesNiv||0,PIECES_NIV.length-1);piecesCharger();}
function piecesSuivante(){PQ.i=(PQ.i+1)%PIECES_NIV.length;piecesCharger();}
function piecesCharger(){
  partie++;SM="pieces";const n=PIECES_NIV[PQ.i],l=PIECES_LECONS[n.l];
  PQ.case=n.de;PQ.fini=false;PQ.fen=piecesFen(null,n.de,n.cibles,l.p);
  piecesAfficher();
  $("parch").innerHTML=`<p><b>${l.nom}.</b> ${l.dit}</p><p class="astuce">Mange ${n.cibles.length>1?`les ${n.cibles.length} pions noirs`:"le pion noir"} !</p>`;
}
function piecesAfficher(){
  const n=PIECES_NIV[PQ.i],l=PIECES_LECONS[n.l];
  G=new Chess(PQ.fen);sel=null;flip=false;etat=PQ.fini?"fini":"jeu";draw();clearArrows();
  $("trait").className="trait w";$("mTitre").textContent=l.nom;$("mTexte").textContent=`Leçon ${n.l+1} sur ${PIECES_LECONS.length} · étape ${n.j+1} sur ${l.niv.length}`;
  $("mTheme").textContent="Les pièces";$("sceau").className="sceau";$("bExplique").hidden=true;
  $("bIndice").textContent="Indice";$("bIndice").disabled=PQ.fini;$("bSolution").disabled=true;
  if(!PQ.fini)piecesMontrer();
}
function piecesMontrer(){ // la pièce est déjà choisie : les points montrent où elle peut aller
  clearMarks();sel=PQ.case;sqEl(PQ.case).classList.add("sel");
  G.moves({square:PQ.case,verbose:true}).forEach(m=>{const s=document.createElement("div");s.className=m.captured?"ring":"dot";sqEl(m.to).appendChild(s);});
}
function piecesToucher(sq){
  if(etat!=="jeu")return;
  const mv=G.moves({square:PQ.case,verbose:true}).find(m=>m.to===sq);
  if(!mv){if(sq!==PQ.case)pourquoiPas(PQ.case,sq,m=>$("parch").innerHTML=`<p>${m}</p>`);piecesMontrer();return;}
  clearMarks();const m=G.move({from:mv.from,to:mv.to,promotion:"q"});animMove(m);PQ.case=m.to;
  G=new Chess(G.fen().split(" ")[0]+" w - - 0 1");PQ.fen=G.fen();
  const reste=G.board().flat().filter(x=>x&&x.color==="b").length;
  if(m.captured){burstAt(sqEl(m.to),18,["#e3b84b","#f3dc94","#ffffff"]);}
  if(!reste){
    PQ.fini=true;etat="fini";S.piecesNiv=Math.max(S.piecesNiv||0,PQ.i+1);if(S.piecesNiv>=PIECES_NIV.length)S.piecesFini=true;
    gagnerXP(5);save();majEntete();
    setTimeout(()=>{SON.victoire();sceau("Bravo !",false,1200,3);},300);
    const fin=PQ.i===PIECES_NIV.length-1;
    $("parch").innerHTML=`<p><span class="ok">Bravo ${esc(S.nom.trim()||"")} ! +5 XP</span> ${fin?"Tu connais toutes les pièces ! Va essayer les épreuves « Mat en 1 ».":"On passe à la suite…"}</p>`;
    if(!fin)plus(piecesSuivante,2200);
    return;
  }
  $("parch").innerHTML=`<p><span class="ok">Miam !</span> Encore ${reste} pion${reste>1?"s":""} à manger.</p>`;
  plus(piecesMontrer,350);
}
$("bIndice").addEventListener("click",()=>{if(SM!=="pieces"||etat!=="jeu")return; // indice : la case du prochain pion qui brille
  const m=G.moves({square:PQ.case,verbose:true}).find(x=>x.captured);
  if(m){sqEl(m.to).classList.add("hint");$("parch").innerHTML=`<p>Regarde la case qui brille : ta pièce peut y manger un pion !</p>`;}
  else $("parch").innerHTML=`<p>Aucun pion à manger d'ici. Avance d'abord sur une case avec un point, puis mange !</p>`;});

/* ---------- Voix : les petits entendent les messages (synthèse vocale de l'appareil, sans réseau de notre part) ---------- */
const PIECE_DITE={R:"roi",D:"dame",T:"tour",F:"fou",C:"cavalier"};
function parler(txt){
  if(!S.voix||!("speechSynthesis" in window)||!txt)return;
  txt=txt.replace(/[★☆✓]/g,"").replace(/\bXP\b/g,"points").replace(/\b([RDTFC])x?([a-h][1-8])/g,(m,p,c)=>PIECE_DITE[p]+" en "+c);
  try{speechSynthesis.cancel();const u=new SpeechSynthesisUtterance(txt);u.lang="fr-FR";u.rate=.95;speechSynthesis.speak(u);}catch(e){}
}
for(const id of ["parch","tParch","dParch"]){const el=$(id);
  new MutationObserver(()=>{if(el.offsetParent)parler(el.textContent);}).observe(el,{childList:true,subtree:true,characterData:true});
  el.addEventListener("click",()=>parler(el.textContent)); // toucher le parchemin le relit
}

/* ---------- Bilan par jour, pour « Mes progrès » ---------- */
function jourISO(d=new Date()){return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;}
function noterJour(t,ok){
  const k=jourISO(),j=S.jours[k]||{n:0,ok:0,th:{}};j.n++;if(ok)j.ok++;
  const x=j.th[t]||[0,0];if(ok)x[0]++;x[1]++;j.th[t]=x;S.jours[k]=j;
  const cles=Object.keys(S.jours).sort();for(const c of cles.slice(0,Math.max(0,cles.length-120)))delete S.jours[c]; // 120 jours au plus
}
function joursAvant(n){const d=new Date();d.setDate(d.getDate()-n);return jourISO(d);}
function cumul(de,a){ // de inclus, a exclu (dates ISO)
  const r={n:0,ok:0,th:{}};for(const[k,j]of Object.entries(S.jours))if(k>=de&&k<a){r.n+=j.n;r.ok+=j.ok;
    for(const[t,[o,n]]of Object.entries(j.th)){const x=r.th[t]||[0,0];x[0]+=o;x[1]+=n;r.th[t]=x;}}return r;}
function majProgres(){
  const demain=joursAvant(-1),sem=cumul(joursAvant(6),demain),avant=cumul(joursAvant(13),joursAvant(6));
  const recent=cumul(joursAvant(13),demain),ancien=cumul("0000",joursAvant(13));
  const pc=(o,n)=>n?Math.round(o/n*100):0;
  // 14 barres : épreuves réussies (or) et ratées (gris) par jour
  let max=1;const jours=[];for(let i=13;i>=0;i--){const k=joursAvant(i),j=S.jours[k]||{n:0,ok:0};jours.push([k,j]);max=Math.max(max,j.n);}
  const barres=jours.map(([k,j])=>`<div class="jour" title="${k} : ${j.ok}/${j.n}"><i class="ko" style="height:${(j.n-j.ok)/max*100}%"></i><i class="okb" style="height:${j.ok/max*100}%"></i><span>${+k.slice(8)}</span></div>`).join("");
  const mieux=[],travail=[];
  for(const t of Object.keys(THEMES).filter(themePermis)){
    const r=recent.th[t],a=ancien.th[t];
    if(r&&r[1]>=3&&a&&a[1]>=3&&r[0]/r[1]>a[0]/a[1]+.1)mieux.push(`${THEMES[t]} (${pc(a[0],a[1])} % → ${pc(r[0],r[1])} %)`);
    const s=S.th[t];if(s&&s.n>=3)travail.push([s.ok/s.n,t]);
  }
  travail.sort((x,y)=>x[0]-y[0]);
  const c=ageCat(),bravo=c==="adulte"?"En progrès":"Tu progresses en";
  const evol=avant.n?` (semaine d'avant : ${avant.ok}/${avant.n})`:"";
  $("progres").innerHTML=`<div class="jours" aria-label="Épreuves des 14 derniers jours">${barres}</div>
    <p class="note">Cette semaine : <b>${sem.ok}</b> épreuve${sem.ok>1?"s":""} réussie${sem.ok>1?"s":""} sur ${sem.n}${evol}.</p>
    ${mieux.length?`<p class="mieux"><b>${bravo} :</b> ${mieux.join(", ")}.</p>`:`<p class="note">${sem.n?"Continue : les progrès s'affichent dès qu'un thème s'améliore.":"Joue quelques épreuves pour voir tes progrès ici."}</p>`}
    ${travail.length&&travail[0][0]<.7?`<p class="travail"><b>À travailler :</b> ${THEMES[travail[0][1]]} (${Math.round(travail[0][0]*100)} % réussi).</p>`:""}
    ${c==="petit"?`<p class="note">Les pièces : ${Math.min(S.piecesNiv||0,PIECES_NIV.length)}/${PIECES_NIV.length} étapes.</p>`:""}`;
}

/* ---------- Écusson du joueur ---------- */
function ecusson(p,cls="ecusson"){
  return `<span class="${cls}" style="--c:${p.c}"><svg viewBox="0 0 40 48" aria-hidden="true"><path d="M3 3h34v18c0 13-9 21-17 24C12 42 3 34 3 21z" fill="${p.c}" stroke="#e3b84b" stroke-width="2.5"/></svg><img src="pieces/fantasy/w${p.e}.svg" alt="" draggable="false"></span>`;}
function majAvatar(){$("avatar").innerHTML=ecusson(PROFIL);$("avatar").setAttribute("aria-label",`${PROFIL.nom} : changer de joueur`);}
function ageTexte(p){return p.adulte?"Adulte":p.age?`${p.age} ans`:"Âge ?";}

/* ---------- Choix du joueur ---------- */
function resumeDe(p){
  const o=lireJSON(cleProfil(p.id))||(FAM.ancien===p.id?lireJSON(CLE_ANCIENNE):null);
  if(!o)return "Nouveau";
  const xp=o.xp||0,[g]=gradeDe(xp);let et=0;for(const k in (o.etoiles||{}))et+=o.etoiles[k];
  return `${g[1]} · ${xp} XP · ${et} ★`;
}
function choixOuvrir(){
  let a=$("choix");
  if(!a){a=document.createElement("div");a.id="choix";a.className="choix";a.setAttribute("role","dialog");a.setAttribute("aria-label","Qui joue ?");document.body.appendChild(a);}
  if(ancienneEnAttente()){ // une seule fois : à qui est la partie commencée avant les profils ?
    const o=lireJSON(CLE_ANCIENNE)||{},[g]=gradeDe(o.xp||0);
    a.innerHTML=`<div class="choix-boite"><h2>Une progression existe déjà</h2>
      <p>Sur cet appareil, quelqu'un a déjà joué : <b>${esc(String(o.nom||"sans nom"))}</b>, ${g[1]}, ${o.xp||0} XP. À qui est-elle ?</p>
      <div class="choix-grille">${FAM.profils.map(p=>`<button type="button" class="profil${p.id==="charles"?" conseille":""}" data-ancien="${p.id}">${ecusson(p)}<b>${esc(p.nom)}</b><span>${ageTexte(p)}</span></button>`).join("")}</div>
      <button type="button" data-ancien="">À personne (elle reste gardée de côté)</button></div>`;
  }else{
    a.innerHTML=`<div class="choix-boite"><h2>Qui joue aujourd'hui ?</h2>
      <div class="choix-grille">${FAM.profils.map((p,i)=>`<button type="button" class="profil" style="--i:${i}" data-id="${p.id}">${ecusson(p)}<b>${esc(p.nom)}</b><span>${ageTexte(p)}</span><em>${resumeDe(p)}</em></button>`).join("")}</div></div>`;
  }
  a.classList.add("on");
}
document.addEventListener("click",e=>{
  const b=e.target.closest("#choix button");if(!b)return;ac();
  if("ancien" in b.dataset){FAM.ancien=b.dataset.ancien||null;famSave();choixOuvrir();return;}
  const id=b.dataset.id;if(!id)return;
  try{sessionStorage.setItem("salle-armes-actif",id);}catch(e){}
  FAM.dernier=id;famSave();
  if(id===PROFIL.id&&!CHOIX_RECHARGER){$("choix").classList.remove("on");return;}
  location.reload(); // chaque joueur a ses propres règles et sa sauvegarde : on repart proprement
});
const CHOIX_RECHARGER=ancienneEnAttente(); // la sauvegarde chargée était vide en attendant la réponse
$("avatar").onclick=()=>{ac();choixOuvrir();};
$("bChanger").onclick=()=>{ac();choixOuvrir();};

/* ---------- Réglages du joueur dans le blason ---------- */
function majJoueur(){
  $("jEcu").innerHTML=ecusson(PROFIL,"ecusson grand");$("jNom").textContent=PROFIL.nom;
  $("jRegles").textContent={petit:"Règles des petits : les pièces pas à pas, les indices sont gratuits, annulation sans limite au tournoi, la voix lit les messages.",
    enfant:"Règles des enfants : tous les thèmes, 3 jokers aux premiers niveaux du tournoi, les coups impossibles sont expliqués.",
    adulte:"Règles des adultes : épreuves plus difficiles, un indice coûte deux étoiles, pas de joker au tournoi."}[ageCat()];
  $("jAges").hidden=PROFIL.adulte;
  $("jAges").innerHTML=[4,5,6,7,8,9,10,11,12].map(n=>`<button type="button" class="chip${PROFIL.age===n?" on":""}" data-age="${n}">${n} ans</button>`).join("");
  for(const[id,k,txt]of[["jAides","aides","Aides (points des coups possibles)"],["jVoix","voix","Voix qui lit les messages"]]){
    $(id).classList.toggle("on",!!S[k]);$(id).setAttribute("aria-pressed",!!S[k]);$(id).textContent=`${txt} : ${S[k]?"oui":"non"}`;}
  $("iaCarte").hidden=ageCat()!=="adulte"; // la clé d'API est une affaire de parents
}
$("jAges").onclick=e=>{const b=e.target.closest("[data-age]");if(!b)return;PROFIL.age=+b.dataset.age;famSave();location.reload();};
$("jAides").onclick=()=>{S.aides=!S.aides;save();majJoueur();};
$("jVoix").onclick=()=>{S.voix=!S.voix;save();majJoueur();if(S.voix)parler("La voix est en marche.");};

/* ---------- Habillage selon le joueur ---------- */
document.documentElement.style.setProperty("--perso",PROFIL.c);
document.body.classList.add("age-"+ageCat());
if(!REG().pendule)document.querySelectorAll(".pendule-choix").forEach(x=>x.hidden=true);
addEventListener("DOMContentLoaded",()=>{if(!ACTIF||ancienneEnAttente())choixOuvrir();}); // après app.js (esc, gradeDe…)
