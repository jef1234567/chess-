/* Tournoi : partie contre Stockfish (WebAssembly, hors ligne) à niveaux nommés.
   Le moteur tourne dans un Web Worker (vendor/stockfish/, GPL-3) : l'interface ne se fige pas. */

/* ---------- Niveaux ----------
   skill : option « Skill Level » de Stockfish (0 à 20) ; depth/ms : profondeur ou temps de recherche ;
   hasard : part de coups joués au hasard, pour que les premiers niveaux restent battables.
   Réglages issus de simulations (lot 12) : chaque niveau gagne environ 3 parties sur 4 contre le précédent,
   au lieu de 9 sur 10 avant ; le Roi est le défi final. À ajuster après les essais avec le joueur. */
/* Chaque niveau est un chevalier nommé (lot 9) : blason (fond, motif), phrase d'accueil, de victoire et de défaite. */
const NIVEAUX=[
  {k:"page",nom:"Le Page",skill:0,depth:1,hasard:.3,xp:20,chev:"Messire Tristan",bl:["#2f8f5b","#f3dc94"],
    salut:"Je suis Tristan, page du château. Je débute, comme toi… ou presque !",gagne:"Ha ! Même un page peut gagner. Revanche ?",perd:"Bien joué ! Tu as battu Tristan. L'Écuyer t'attend."},
  {k:"ecuyer",nom:"L'Écuyer",skill:1,depth:2,hasard:.2,xp:30,chev:"Dame Iseult",bl:["#24427f","#e3b84b"],
    salut:"Je suis Iseult, écuyère de la reine. Mes pièces sont bien entraînées.",gagne:"La reine sera fière de moi ! Reviens quand tu veux.",perd:"Quel duel ! Tu mérites de croiser le fer avec le Chevalier."},
  {k:"chevalier",nom:"Le Chevalier",skill:2,depth:3,hasard:.12,xp:40,chev:"Sire Perceval",bl:["#b8343e","#f3dc94"],
    salut:"Je suis Perceval, chevalier de la Table ronde. En garde !",gagne:"Ma lame a été plus rapide aujourd'hui.",perd:"Je m'incline. Tu as l'âme d'un vrai chevalier !"},
  {k:"baron",nom:"Le Baron",skill:3,depth:4,hasard:.06,xp:50,chev:"Le Baron Noir",bl:["#1e1b2b","#b8343e"],
    salut:"On m'appelle le Baron Noir. Je ne fais jamais de cadeau.",gagne:"Hé hé… Le Baron Noir ne perd pas si facilement.",perd:"Impossible ! Personne ne bat le Baron Noir… sauf toi."},
  {k:"comte",nom:"Le Comte",skill:5,depth:5,hasard:.02,xp:60,chev:"Sire Gauvain",bl:["#5b3a8c","#e3b84b"],
    salut:"Je suis Gauvain, comte et neveu du roi. Mon épée ne recule jamais.",gagne:"Gauvain garde son honneur aujourd'hui !",perd:"Je salue ta victoire, tu joues comme un comte !"},
  {k:"duc",nom:"Le Duc",skill:7,depth:7,hasard:0,xp:80,chev:"Le Duc d'Or",bl:["#a8772e","#fff4c4"],
    salut:"Je suis le Duc d'Or. Seul le roi est plus fort que moi. Prouve ta valeur !",gagne:"Le trône reste à moi. Entraîne-toi encore, jeune chevalier.",perd:"Tu as battu le Duc d'Or ! Tout le royaume chante ton nom !"},
  {k:"roi",nom:"Le Roi",skill:10,depth:10,hasard:0,xp:120,chev:"Le Roi Arthur",bl:["#7a1420","#f3dc94"],
    salut:"Je suis Arthur, roi de ce royaume. Seuls les plus grands me battent.",gagne:"Le royaume garde son roi. Tu deviens redoutable !",perd:"Tu as vaincu le Roi Arthur ! Ton nom entre dans la légende !"},
];
// Finales à gagner (FINALES dans puzzles.js) : Stockfish défend à pleine force.
const GARDIEN={k:"finale",nom:"Le Gardien",skill:20,ms:400,hasard:0,xp:25,chev:"Le Gardien des finales",bl:["#4d566e","#dfe6f5"]};
function nivDe(k){
  if(typeof k==="string"&&k.startsWith("finale:")){const f=FINALES.find(x=>x.k===k.slice(7));if(f)return Object.assign({},GARDIEN,{k,finale:f});}
  if(k==="duel")return {k:"duel",nom:"Duel",chev:"ton adversaire du duel",bl:["#24427f","#f3dc94"],xp:0};
  return NIVEAUX.find(n=>n.k===k)||NIVEAUX[0];
}
function portrait(n){const[f,m]=n.bl;
  return `<svg class="portrait" viewBox="0 0 40 48" aria-hidden="true"><path d="M3 3h34v18c0 13-9 21-17 24C12 42 3 34 3 21z" fill="${f}" stroke="#e3b84b" stroke-width="2"/>
    <path d="M12 30v-9c0-6 3.5-10 8-10s8 4 8 10v9z" fill="${m}"/><path d="M14 21h12M20 14v16" stroke="${f}" stroke-width="2.2"/><path d="M12 30h16" stroke="${m}" stroke-width="3"/></svg>`;}
const NOM_PIECE={p:"ton pion",n:"ton cavalier",b:"ton fou",r:"ta tour",q:"ta dame"};

/* ---------- Moteur ---------- */
const MOTEUR={
  w:null,cb:null,score:null,ok:true,ignorer:0, // ignorer : réponses de recherches arrêtées, à jeter
  demarrer(){
    if(this.w)return;
    try{
      this.w=new Worker("vendor/stockfish/stockfish-19-lite-single.js");
      this.w.onmessage=e=>this.recu(String(e.data));
      this.w.onerror=()=>{this.ok=false;tMsg("Le moteur n'a pas pu démarrer. Recharge la page.");};
      this.w.postMessage("uci");this.w.postMessage("isready");
    }catch(e){this.ok=false;}
  },
  recu(l){
    if(this.ignorer>0&&!l.startsWith("bestmove"))return; // fin d'une recherche arrêtée
    const s=l.match(/ score (cp|mate) (-?\d+)/);
    if(s)this.score=s[1]==="cp"?+s[2]:(+s[2]>0?10000:-10000);
    if(l.startsWith("bestmove")){if(this.ignorer>0){this.ignorer--;return;}const cb=this.cb;this.cb=null;if(cb)cb(l.split(" ")[1],this.score);}
  },
  chercher(fen,niv,cb){
    this.demarrer();this.cb=cb;this.score=null;
    this.w.postMessage(`setoption name Skill Level value ${niv.skill}`);
    this.w.postMessage(`position fen ${fen}`);
    this.w.postMessage(niv.ms?`go movetime ${niv.ms}`:`go depth ${niv.depth}`);
  },
  stop(){if(this.w&&this.cb){this.cb=null;this.ignorer++;this.w.postMessage("stop");}},
  // Analyse à pleine force : renvoie {coup (UCI), score (centipions, du point de vue du camp au trait)}.
  analyser(fen,depth){return new Promise(ok=>this.chercher(fen,{skill:20,depth},(coup,score)=>ok({coup,score})));}
};

/* ---------- État de la partie ----------
   S.tournoi.partie = {niv, camp, coups:[SAN]} : la partie en cours est gardée sur l'appareil. */
const T={g:null,niv:null,camp:"w",etat:"choix",jeton:0,dernierScore:null,fen:null,jokers:3};
const JOKERS=3; // coups annulables par partie, aux niveaux Page et Écuyer seulement
function tPeutAnnuler(){return T.g&&!T.niv.finale&&["page","ecuyer"].includes(T.niv.k)&&T.etat!=="fini";}
function tPlus(fn,ms){const n=T.jeton;setTimeout(()=>{if(n===T.jeton)fn();},ms);}
function tMsg(h){$("tParch").innerHTML=`<p>${h}</p>`;}
function tPeutJouer(){return T.etat==="joueur"&&T.g&&T.g.turn()===T.camp;}

function tAfficher(){ // met l'échiquier du tournoi à l'écran
  G=T.g||new Chess();flip=T.camp==="b";draw();clearArrows();
  const h=T.g&&T.g.history({verbose:true});if(h&&h.length)markLast(h[h.length-1]);
}
function tEntete(){
  const n=T.niv;
  $("tTitre").textContent=n?(n.finale?n.finale.nom:`${n.chev} t'attend`):"Le tournoi";
  $("tNiv").textContent=n?(n.finale?"Finale":n.nom.replace(/^(Le |L')/,"")):"—";
  const a=$("tAnnuler");a.hidden=!tPeutAnnuler();a.textContent=`Annuler (${T.jokers})`;
  a.disabled=!T.jokers||!tPeutJouer()||T.g.history().length<2;
  $("tTrait").className="trait "+(T.g&&T.g.turn()==="b"?"b":"w");
  $("tTexte").textContent=!T.g?"Choisis ton adversaire.":T.etat==="fini"?"La partie est finie.":tPeutJouer()?"À toi de jouer.":`${n.chev} réfléchit…`;
}
function tSauver(){S.tournoi.partie=T.g&&T.etat!=="fini"?{niv:T.niv.k,camp:T.camp,coups:T.g.history(),fen:T.fen,jokers:T.jokers}:null;save();}

function tCommencer(k,camp){
  T.jeton++;MOTEUR.stop();
  T.niv=nivDe(k);T.fen=T.niv.finale?T.niv.finale.fen:null;T.jokers=JOKERS;
  T.camp=T.niv.finale?"w":camp==="hasard"?(Math.random()<.5?"w":"b"):camp;
  T.g=T.fen?new Chess(T.fen):new Chess();T.dernierScore=null;T.etat="joueur";
  $("tChoix").hidden=true;$("tJeu").hidden=false;
  tAfficher();tSauver();
  if(T.niv.finale)tMsg(`<b>${T.niv.finale.nom}</b>. ${T.niv.finale.x} Le Gardien défend de toutes ses forces : fais mat pour gagner !`);
  else tMsg(`<b>${T.niv.chev}</b> : « ${T.niv.salut} » ${T.camp==="w"?"Tu as les blancs : à toi de commencer !":"Tu as les noirs : il commence."}`);
  if(T.g.turn()!==T.camp)tAdversaire();
  tEntete();
}
function tReprendre(){ // au démarrage : reprendre la partie gardée sur l'appareil
  const p=S.tournoi.partie;if(!p)return false;
  const g=p.fen?new Chess(p.fen):new Chess();for(const c of p.coups)if(!g.move(c))return false;
  T.niv=nivDe(p.niv);T.camp=p.camp;T.g=g;T.fen=p.fen||null;T.jokers=typeof p.jokers==="number"?p.jokers:JOKERS;
  T.etat=g.turn()===T.camp?"joueur":"pense"; // « pense » : l'adversaire jouera à l'ouverture de l'onglet
  $("tChoix").hidden=true;$("tJeu").hidden=false;return true;
}

function tJouer(vm){ // coup du joueur
  clearMarks();sel=null;
  const m=T.g.move({from:vm.from,to:vm.to,promotion:"q"});if(!m)return;
  animMove(m);tSauver();
  if(tFin())return;
  tAdversaire();
}
function tAdversaire(){
  T.etat="pense";tEntete();
  const n=T.niv,fen=T.g.fen(),t0=Date.now(),jeton=T.jeton;
  MOTEUR.chercher(fen,n,(uci,score)=>{
    if(jeton!==T.jeton)return;
    let coup={from:uci.slice(0,2),to:uci.slice(2,4),promotion:uci[4]};
    const legaux=T.g.moves({verbose:true});
    const auHasard=n.hasard&&Math.random()<n.hasard;
    if(auHasard||!legaux.some(x=>x.from===coup.from&&x.to===coup.to)){const r=legaux[Math.floor(Math.random()*legaux.length)];coup={from:r.from,to:r.to,promotion:r.promotion};}
    tPlus(()=>{
      const m=T.g.move(coup);if(!m)return;
      animMove(m);tSauver();
      tMsg(`<b>${T.niv.chev}</b> joue <b>${m.san}</b>. « ${tCommentaire(m,auHasard?null:score)} »`);
      if(tFin())return;
      T.etat="joueur";tEntete();
    },Math.max(0,650-(Date.now()-t0)));
  });
}
// Phrase courte de l'adversaire. score : évaluation de Stockfish de son point de vue (centipions).
function tCommentaire(m,score){
  let txt=null;
  if(score!=null&&T.dernierScore!=null){
    const d=score-T.dernierScore;
    if(d>=250)txt=["Hé hé, merci pour ce cadeau !","Oh, tu as laissé une ouverture…","Je crois que tu as fait une erreur !"][Math.floor(Math.random()*3)];
    else if(d<=-250)txt=["Aïe ! Joli coup, je ne l'avais pas vu.","Tu es redoutable !","Bien joué, tu m'as surpris."][Math.floor(Math.random()*3)];
  }
  T.dernierScore=score; // null après un coup joué au hasard : pas de comparaison au coup suivant
  if(txt)return txt;
  if(m.san.includes("#"))return "Échec et mat ! Belle partie quand même.";
  if(m.san.includes("+"))return "Échec ! Protège ton roi.";
  if(m.flags.includes("k")||m.flags.includes("q"))return "Je mets mon roi à l'abri.";
  if(m.promotion)return "Mon pion devient une dame !";
  if(m.captured)return `Je prends ${NOM_PIECE[m.captured]} !`;
  const calme=["À toi de jouer.","Hmm, voyons voir…","Je prépare mon attaque.","Attention à tes pièces !","Je renforce ma position."];
  if(m.piece==="n"||m.piece==="b")calme.push("Je sors mes pièces.");
  if(m.piece==="p"&&"de".includes(m.to[0]))calme.push("Je prends de la place au centre.");
  return calme[Math.floor(Math.random()*calme.length)];
}
function tFin(){
  const g=T.g;if(!g.game_over())return false;
  T.etat="fini";T.jeton++;
  if(T.niv.finale)return tFinFinale(g);
  const b=S.tournoi.bilan[T.niv.k]||{v:0,n:0,d:0};
  let gain=0,txt;
  if(g.in_checkmate()){
    const gagne=g.turn()!==T.camp;
    if(gagne){b.v++;gain=T.niv.xp;txt=`<span class="ok">Victoire ! +${gain} XP</span><br><b>${T.niv.chev}</b> : « ${T.niv.perd} »`;
      tPlus(()=>{SON.victoire();confettis();sceau("Victoire !",false,1800);},900);}
    else{b.d++;txt=`<b>${T.niv.chev}</b> : « ${T.niv.gagne} »<br>Chaque défaite t'apprend quelque chose. Le conseil de guerre peut t'aider !`;}
  }else{
    b.n++;gain=Math.round(T.niv.xp/2);
    const pourquoi=g.in_stalemate()?"pat : le roi ne peut plus bouger sans être en échec":g.in_threefold_repetition()?"la même position est revenue trois fois":g.insufficient_material()?"il ne reste pas assez de pièces pour faire mat":"règle des 50 coups";
    txt=`<span class="ok">Partie nulle (${pourquoi}). +${gain} XP</span>`;
  }
  S.tournoi.bilan[T.niv.k]=b;gagnerXP(gain);tArchiver(g.in_checkmate()?(g.turn()!==T.camp?"victoire":"defaite"):"nulle");tSauver();majEntete();hautsVerifier();
  tMsg(txt);tEntete();$("tAbandon").disabled=true;
  return true;
}
// Partie terminée : gardée dans le blason (les 20 dernières) pour le conseil de guerre.
function tFinFinale(g){
  const f=T.niv.finale,gagne=g.in_checkmate()&&g.turn()!==T.camp,deja=!!S.finales[f.k];
  let txt;
  if(gagne){const gain=deja?5:T.niv.xp;S.finales[f.k]=true;gagnerXP(gain);
    txt=`<span class="ok">Mat ! Tu as gagné la finale « ${f.nom} ». +${gain} XP</span>`;
    tPlus(()=>{SON.victoire();confettis();sceau("Finale gagnée !",false,1800);},900);}
  else txt=`<span class="ko">Partie nulle : la finale n'est pas gagnée.</span> ${g.in_stalemate()?"Pat ! Laisse toujours une case au roi adverse avant le mat.":"Il faut faire mat avant 50 coups sans prise ni coup de pion."} Réessaie !`;
  tArchiver(gagne?"victoire":"nulle");tSauver();majEntete();hautsVerifier();tChoixMaj();
  tMsg(txt);tEntete();$("tAbandon").disabled=true;
  return true;
}
function tArchiver(res){
  if(T.g.history().length<2)return;
  S.parties.unshift({d:Date.now(),niv:T.niv.k,camp:T.camp,coups:T.g.history(),res,fen:T.fen||undefined});S.parties=S.parties.slice(0,20);
  $("tConseil").hidden=false;
}
function tAbandonner(){
  if(!T.g||T.etat==="fini")return;
  T.jeton++;MOTEUR.stop();T.etat="fini";
  if(!T.niv.finale){const b=S.tournoi.bilan[T.niv.k]||{v:0,n:0,d:0};b.d++;S.tournoi.bilan[T.niv.k]=b;}
  tArchiver("abandon");tSauver();
  tMsg(`Tu as abandonné. Ce n'est que partie remise !`);tEntete();$("tAbandon").disabled=true;
}
function tChoisir(){ // retour à l'écran de choix
  $("tChoix").hidden=false;$("tJeu").hidden=true;tChoixMaj();
}
function tAnnuler(){ // joker : on reprend son dernier coup et la réponse de l'adversaire
  if(!tPeutAnnuler()||!tPeutJouer()||!T.jokers||T.g.history().length<2)return;
  T.g.undo();T.g.undo();T.jokers--;T.dernierScore=null;
  tAfficher();tSauver();tEntete();
  tMsg(`Coup annulé. Il te reste ${T.jokers} joker${T.jokers>1?"s":""} pour cette partie. Réfléchis bien !`);
}
function tDuel(k){const n=nivDe(k);$("tDuel").innerHTML=`${portrait(n)}<div><b>${n.chev}</b><span>${n.nom}</span><p>« ${n.salut} »</p></div>`;}
function tChoixMaj(){
  $("tFinales").innerHTML=FINALES.map(f=>`<button type="button" class="chip${S.finales[f.k]?" gagne":""}" data-f="${f.k}">${S.finales[f.k]?"✓ ":""}${f.nom}</button>`).join("");
}

/* ---------- Écran de choix ---------- */
(function(){
  const nv=$("tNiveaux"),cp=$("tCamps");
  nv.innerHTML=NIVEAUX.map((n,i)=>`<button type="button" class="chip${i===0?" on":""}" data-k="${n.k}">${n.nom}</button>`).join("");
  cp.innerHTML=[["w","Les blancs"],["b","Les noirs"],["hasard","Au hasard"]].map(([k,v],i)=>`<button type="button" class="chip${i===0?" on":""}" data-k="${k}">${v}</button>`).join("");
  const radio=el=>el.onclick=e=>{const b=e.target.closest(".chip");if(!b)return;el.querySelectorAll(".chip").forEach(c=>c.classList.toggle("on",c===b));};
  radio(nv);radio(cp);
  nv.addEventListener("click",()=>tDuel(nv.querySelector(".on").dataset.k));tDuel("page");tChoixMaj();
  $("tFinales").onclick=e=>{const b=e.target.closest(".chip");if(!b)return;ac();MOTEUR.demarrer();$("tConseil").hidden=true;tCommencer("finale:"+b.dataset.f,"w");$("tAbandon").disabled=false;};
  $("tAnnuler").onclick=tAnnuler;
  $("tGo").onclick=()=>{ac();MOTEUR.demarrer();$("tConseil").hidden=true;tCommencer(nv.querySelector(".on").dataset.k,cp.querySelector(".on").dataset.k);$("tAbandon").disabled=false;};
  $("tNouvelle").onclick=()=>{T.jeton++;MOTEUR.stop();if(T.etat!=="fini"){T.etat="fini";S.tournoi.partie=null;save();}tChoisir();};
  $("tAbandon").onclick=tAbandonner;
  $("tConseil").onclick=()=>conseilOuvrir(0);
})();
