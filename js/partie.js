/* Outils de partie partagés par le tournoi et le duel (lot 14) :
   choix de la promotion, liste des coups (et revoir une position), pendule facultative, partie nulle expliquée. */

/* ---------- Promotion : le pion arrivé au bout devient la pièce choisie ---------- */
const NOM_PROMO={q:"Dame",r:"Tour",b:"Fou",n:"Cavalier"};
function choisirPromotion(couleur,fait){
  promoFermer();
  const o=document.createElement("div");o.className="promo";o.setAttribute("role","dialog");
  o.innerHTML=`<div class="promo-boite"><p>Ton pion devient…</p><div class="promo-choix">${["q","r","b","n"].map(t=>
    `<button type="button" data-t="${t}" aria-label="${NOM_PROMO[t]}"><i class="pp ${couleur}">${pieceHTML(couleur,t)}</i><em>${NOM_PROMO[t]}</em></button>`).join("")}</div>
    <button type="button" class="petit" data-t="">Annuler</button></div>`;
  o.addEventListener("pointerdown",e=>e.stopPropagation()); // l'échiquier ne voit pas ces touchers
  o.onclick=e=>{const b=e.target.closest("button");if(!b&&e.target!==o)return;o.remove();if(b&&b.dataset.t)fait(b.dataset.t);};
  B.appendChild(o);
}
function promoFermer(){const o=B.querySelector(".promo");if(o)o.remove();}

/* ---------- Liste des coups ----------
   Un bandeau sous l'échiquier montre les coups joués. En touchant un coup, on revoit la position d'alors ;
   un toucher sur l'échiquier (ou un coup de l'adversaire) ramène à la partie. La partie elle-même n'est jamais modifiée. */
const RV={actif:false,idx:-1};
function coupsSource(){
  if(mode==="tournoi"&&$("cJeu").hidden&&!$("tJeu").hidden&&T.g)return {el:$("tCoups"),fen:T.fen,coups:T.g.history(),texte:$("tTexte")};
  if(mode==="duel"&&!$("dJeu").hidden&&D.jeu)return {el:$("dCoups"),fen:null,coups:D.jeu.coups,texte:$("dTexte")};
  return null;
}
function coupsMaj(){
  const s=coupsSource();if(!s)return;
  if(!s.coups.length){s.el.innerHTML='<span class="note">Les coups joués s\'afficheront ici.</span>';return;}
  const f=(s.fen||"rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1").split(" ");
  let num=+f[5]||1,noir=f[1]==="b",h="";
  s.coups.forEach((c,i)=>{
    if(!noir)h+=`<span class="num">${num}.</span>`;else if(i===0)h+=`<span class="num">${num}…</span>`;
    const cl=RV.actif?(i===RV.idx?" on":""):(i===s.coups.length-1?" der":"");
    h+=`<button type="button" class="cp${cl}" data-i="${i}">${fr(c)}</button>`;
    if(noir)num++;noir=!noir;});
  if(RV.actif)h+=`<button type="button" class="cp retour" data-i="fin">Revenir à la partie ▶</button>`;
  s.el.innerHTML=h;
  const b=s.el.querySelector(RV.actif?".cp.on":".cp.der");
  if(b)s.el.scrollLeft=RV.actif?b.offsetLeft-s.el.clientWidth/2:s.el.scrollWidth;
}
function revueVoir(i){
  const s=coupsSource();if(!s)return;
  if(i==="fin"||i>=s.coups.length-1){revueQuitter();return;}
  promoFermer();clearMarks();sel=null;
  const g=s.fen?new Chess(s.fen):new Chess();for(let j=0;j<=i;j++)g.move(s.coups[j]);
  RV.actif=true;RV.idx=i;G=g;draw();clearArrows();
  const h=g.history({verbose:true});if(h.length)markLast(h[h.length-1]);
  s.texte.textContent=`Tu revois le coup ${Math.floor(i/2)+1}. Touche l'échiquier pour revenir.`;
}
function revueQuitter(){ // retour à la position de la partie
  if(!RV.actif)return false;RV.actif=false;
  if(mode==="tournoi"){tAfficher();tEntete();}else if(mode==="duel")dAfficher();
  return true;
}
for(const id of ["tCoups","dCoups"])$(id).addEventListener("click",e=>{const b=e.target.closest(".cp");if(!b)return;
  revueVoir(b.dataset.i==="fin"?"fin":+b.dataset.i);});

/* ---------- Pendule (facultative) ----------
   Chaque camp a un temps total ; le temps de celui qui a le trait descend, à partir du premier coup.
   Elle ne tourne que quand l'échiquier est à l'écran : un enfant interrompu ne perd pas au temps.
   Au duel, chaque appareil décompte son propre temps et l'envoie avec ses coups ; seul le joueur
   dont le temps est écoulé déclare la fin (pas de dispute à cause du réseau). */
const PENDULES=[[0,"Sans pendule"],[15,"15 min"],[10,"10 min"],[5,"5 min"]];
function penduleChips(id){$(id).innerHTML=PENDULES.map(([m,t],i)=>`<button type="button" class="chip${i===0?" on":""}" data-m="${m}">${t}</button>`).join("");
  $(id).onclick=e=>{const b=e.target.closest(".chip");if(!b)return;$(id).querySelectorAll(".chip").forEach(c=>c.classList.toggle("on",c===b));};}
penduleChips("tPendules");penduleChips("dPendules");
function penduleChoisie(id){const b=$(id).querySelector(".chip.on");return b?+b.dataset.m*60000:0;}
function hms(ms){const s=Math.ceil(Math.max(0,ms)/1000);return `${Math.floor(s/60)}:${String(s%60).padStart(2,"0")}`;}
function tempsValide(t,total){const ok=x=>typeof x==="number"&&isFinite(x)?Math.max(0,Math.min(total,x)):total;return {w:ok(t&&t.w),b:ok(t&&t.b)};}
function penduleAff(id,temps,moi,nomAdv,actif){
  const el=$(id);if(!temps){el.hidden=true;return;}el.hidden=false;const adv=moi==="w"?"b":"w";
  const h=(c,nom)=>`<span class="horloge${actif===c?" actif":""}${temps[c]<30000?" urgent":""}"><i class="trait ${c}"></i>${nom}<b>${hms(temps[c])}</b></span>`;
  el.innerHTML=h(adv,esc(nomAdv))+h(moi,"Toi");
}
let pDernier=Date.now();
function penduleTic(){
  const now=Date.now(),dt=Math.min(1000,now-pDernier);pDernier=now;
  if(document.hidden)return;
  if(mode==="tournoi"&&T.g&&T.temps&&!$("tJeu").hidden&&$("cJeu").hidden){
    const enCours=T.etat!=="fini"&&T.g.history().length>0,c=T.g.turn();
    if(enCours){T.temps[c]=Math.max(0,T.temps[c]-dt);if(!T.temps[c])tFinTemps(c);}
    penduleAff("tPendule",T.temps,T.camp,T.niv.chev,T.etat!=="fini"&&T.g.history().length>0?T.g.turn():null);
  }
  if(mode==="duel"&&D.jeu&&D.jeu.temps&&!$("dJeu").hidden){
    const n=D.jeu.coups.length,c=n%2?"b":"w",enCours=n>0&&!D.termine;
    if(enCours){D.jeu.temps[c]=Math.max(0,D.jeu.temps[c]-dt);
      if(!D.jeu.temps[c]&&c===dCamp()){D.jeu.fin={temps:D.role};D.termine=true;dSauver();dEnvoyerEtat();dFin();}}
    penduleAff("dPendule",D.jeu.temps,dCamp(),D.adv||"Adversaire",enCours?c:null);
  }
}
setInterval(penduleTic,250);
document.addEventListener("visibilitychange",()=>{if(!document.hidden)pDernier=Date.now();else{if(T.temps)tSauver();if(D.jeu&&D.jeu.temps)dSauver();}});

/* ---------- Partie nulle expliquée ----------
   Un écran simple dit pourquoi la partie est nulle, avec un conseil adapté. */
function nulleRaison(g){return g.in_stalemate()?"pat":g.insufficient_material()?"materiel":g.in_threefold_repetition()?"repetition":"cinquante";}
function nulleExpliquer(g,camp){
  const r=nulleRaison(g),bloque=g.turn(),moi=bloque===camp;
  const coul=bloque==="w"?"blanc":"noir";
  const T_={
    pat:["Pat !",`Le roi ${coul} n'est pas en échec, mais aucune pièce ${bloque==="w"?"blanche":"noire"} ne peut bouger. Ce n'est pas un mat : la partie est nulle.`,
      moi?"Bien sauvé : tu n'avais plus de coup, mais tu n'as pas perdu !":"Quand tu as beaucoup d'avance, laisse toujours une case au roi adverse, ou donne échec."],
    materiel:["Plus assez de pièces",`Avec les pièces qui restent, personne ne peut faire échec et mat (par exemple roi contre roi, ou roi et fou contre roi).`,
      "Garde des pions : ils peuvent devenir des dames !"],
    repetition:["Trois fois la même position",`La même position est revenue trois fois : personne n'avance, la partie est nulle.`,
      "Si tu as l'avantage, change de plan au lieu de rejouer les mêmes coups."],
    cinquante:["La règle des 50 coups",`50 coups de chaque camp sans prise ni coup de pion : la partie est nulle.`,
      "Pour gagner une finale, pousse tes pions et resserre le roi adverse."]}[r];
  return {raison:r,titre:T_[0],texte:T_[1],conseil:T_[2]};
}
function nulleScene(g,camp,gain){
  const n=nulleExpliquer(g,camp);
  if(n.raison==="pat")setTimeout(()=>marquerPat(g),500);
  setTimeout(()=>scene("nulleScene",`<div class="scene"><svg class="ecu-ad" viewBox="0 0 40 48" aria-hidden="true"><path d="M3 3h34v18c0 13-9 21-17 24C12 42 3 34 3 21z" fill="#4d566e" stroke="#e3b84b" stroke-width="2"/><path d="M11 18h18M11 28h18" stroke="#f3dc94" stroke-width="4" stroke-linecap="round"/></svg></div>
    <p class="voix">Partie nulle</p><h2>${n.titre}</h2><p class="voix">${n.texte}</p><p class="voix conseil">${n.conseil}</p>${gain?`<p class="voix">+${gain} XP</p>`:""}<p class="note">Touche l'écran pour continuer</p>`,12000),1300);
  return n;
}
function marquerPat(g){ // le roi bloqué brille en jaune
  g.board().forEach((row,i)=>row.forEach((p,j)=>{if(p&&p.type==="k"&&p.color===g.turn()){const s=sqEl(files[j]+(8-i));s&&s.classList.add("pat");}}));
}
