/* Tournoi : partie contre Stockfish (WebAssembly, hors ligne) à niveaux nommés.
   Le moteur tourne dans un Web Worker (vendor/stockfish/, GPL-3) : l'interface ne se fige pas. */

/* ---------- Niveaux ----------
   skill : option « Skill Level » de Stockfish (0 à 20) ; depth/ms : profondeur ou temps de recherche ;
   hasard : part de coups joués au hasard, pour que les premiers niveaux restent battables.
   Réglages de départ, à ajuster après les essais avec le joueur. */
const NIVEAUX=[
  {k:"page",nom:"Le Page",skill:0,depth:1,hasard:.35,xp:20},
  {k:"ecuyer",nom:"L'Écuyer",skill:1,depth:2,hasard:.2,xp:30},
  {k:"chevalier",nom:"Le Chevalier",skill:4,depth:5,hasard:.08,xp:40},
  {k:"baron",nom:"Le Baron",skill:9,depth:9,hasard:0,xp:60},
  {k:"duc",nom:"Le Duc",skill:16,ms:1000,hasard:0,xp:100},
];
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
const T={g:null,niv:null,camp:"w",etat:"choix",jeton:0,dernierScore:null};
function tPlus(fn,ms){const n=T.jeton;setTimeout(()=>{if(n===T.jeton)fn();},ms);}
function tMsg(h){$("tParch").innerHTML=`<p>${h}</p>`;}
function tPeutJouer(){return T.etat==="joueur"&&T.g&&T.g.turn()===T.camp;}

function tAfficher(){ // met l'échiquier du tournoi à l'écran
  G=T.g||new Chess();flip=T.camp==="b";draw();clearArrows();
  const h=T.g&&T.g.history({verbose:true});if(h&&h.length)markLast(h[h.length-1]);
}
function tEntete(){
  const n=T.niv;
  $("tTitre").textContent=n?`${n.nom} t'attend`:"Le tournoi";
  $("tNiv").textContent=n?n.nom.replace(/^(Le |L')/,""):"—";
  $("tTrait").className="trait "+(T.g&&T.g.turn()==="b"?"b":"w");
  $("tTexte").textContent=!T.g?"Choisis ton adversaire.":T.etat==="fini"?"La partie est finie.":tPeutJouer()?"À toi de jouer.":`${n.nom} réfléchit…`;
}
function tSauver(){S.tournoi.partie=T.g&&T.etat!=="fini"?{niv:T.niv.k,camp:T.camp,coups:T.g.history()}:null;save();}

function tCommencer(k,camp){
  T.jeton++;MOTEUR.stop();
  T.niv=NIVEAUX.find(n=>n.k===k)||NIVEAUX[0];
  T.camp=camp==="hasard"?(Math.random()<.5?"w":"b"):camp;
  T.g=new Chess();T.dernierScore=null;T.etat="joueur";
  $("tChoix").hidden=true;$("tJeu").hidden=false;
  tAfficher();tSauver();
  tMsg(`${T.niv.nom} te salue. ${T.camp==="w"?"Tu as les blancs : à toi de commencer !":"Tu as les noirs : il commence."}`);
  if(T.g.turn()!==T.camp)tAdversaire();
  tEntete();
}
function tReprendre(){ // au démarrage : reprendre la partie gardée sur l'appareil
  const p=S.tournoi.partie;if(!p)return false;
  const g=new Chess();for(const c of p.coups)if(!g.move(c))return false;
  T.niv=NIVEAUX.find(n=>n.k===p.niv)||NIVEAUX[0];T.camp=p.camp;T.g=g;
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
      tMsg(`<b>${T.niv.nom}</b> joue <b>${m.san}</b>. « ${tCommentaire(m,auHasard?null:score)} »`);
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
  const b=S.tournoi.bilan[T.niv.k]||{v:0,n:0,d:0};
  let gain=0,txt;
  if(g.in_checkmate()){
    const gagne=g.turn()!==T.camp;
    if(gagne){b.v++;gain=T.niv.xp;txt=`<span class="ok">Victoire ! Tu as battu ${T.niv.nom}. +${gain} XP</span>`;
      tPlus(()=>{SON.victoire();burstAt($("board"),80,["#e3b84b","#f3dc94","#2f8f5b","#ffffff","#b8343e"]);$("sceauTxt").textContent="Victoire !";$("sceau").className="sceau on";setTimeout(()=>$("sceau").className="sceau",1500);},350);}
    else{b.d++;txt=`<span class="ko">${T.niv.nom} a gagné cette fois.</span> Chaque défaite t'apprend quelque chose. Retente ta chance !`;}
  }else{
    b.n++;gain=Math.round(T.niv.xp/2);
    const pourquoi=g.in_stalemate()?"pat : le roi ne peut plus bouger sans être en échec":g.in_threefold_repetition()?"la même position est revenue trois fois":g.insufficient_material()?"il ne reste pas assez de pièces pour faire mat":"règle des 50 coups";
    txt=`<span class="ok">Partie nulle (${pourquoi}). +${gain} XP</span>`;
  }
  S.tournoi.bilan[T.niv.k]=b;S.xp+=gain;tArchiver(g.in_checkmate()?(g.turn()!==T.camp?"victoire":"defaite"):"nulle");tSauver();majEntete();hautsVerifier();
  tMsg(txt);tEntete();$("tAbandon").disabled=true;
  return true;
}
// Partie terminée : gardée dans le blason (les 20 dernières) pour le conseil de guerre.
function tArchiver(res){
  if(T.g.history().length<2)return;
  S.parties.unshift({d:Date.now(),niv:T.niv.k,camp:T.camp,coups:T.g.history(),res});S.parties=S.parties.slice(0,20);
  $("tConseil").hidden=false;
}
function tAbandonner(){
  if(!T.g||T.etat==="fini")return;
  T.jeton++;MOTEUR.stop();T.etat="fini";
  const b=S.tournoi.bilan[T.niv.k]||{v:0,n:0,d:0};b.d++;S.tournoi.bilan[T.niv.k]=b;tArchiver("abandon");tSauver();
  tMsg(`Tu as abandonné. Ce n'est que partie remise !`);tEntete();$("tAbandon").disabled=true;
}
function tChoisir(){ // retour à l'écran de choix
  $("tChoix").hidden=false;$("tJeu").hidden=true;
}

/* ---------- Écran de choix ---------- */
(function(){
  const nv=$("tNiveaux"),cp=$("tCamps");
  nv.innerHTML=NIVEAUX.map((n,i)=>`<button type="button" class="chip${i===0?" on":""}" data-k="${n.k}">${n.nom}</button>`).join("");
  cp.innerHTML=[["w","Les blancs"],["b","Les noirs"],["hasard","Au hasard"]].map(([k,v],i)=>`<button type="button" class="chip${i===0?" on":""}" data-k="${k}">${v}</button>`).join("");
  const radio=el=>el.onclick=e=>{const b=e.target.closest(".chip");if(!b)return;el.querySelectorAll(".chip").forEach(c=>c.classList.toggle("on",c===b));};
  radio(nv);radio(cp);
  $("tGo").onclick=()=>{ac();MOTEUR.demarrer();$("tConseil").hidden=true;tCommencer(nv.querySelector(".on").dataset.k,cp.querySelector(".on").dataset.k);$("tAbandon").disabled=false;};
  $("tNouvelle").onclick=()=>{T.jeton++;MOTEUR.stop();if(T.etat!=="fini"){T.etat="fini";S.tournoi.partie=null;save();}tChoisir();};
  $("tAbandon").onclick=tAbandonner;
  $("tConseil").onclick=()=>conseilOuvrir(0);
})();
