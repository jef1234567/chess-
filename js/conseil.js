/* Conseil de guerre : débrief hors ligne d'une partie du tournoi.
   Stockfish (pleine force, profondeur fixe) évalue chaque position ; les 2 ou 3 coups du joueur
   qui ont fait perdre le plus sont rejoués avec la flèche rouge (ton coup), la flèche verte
   (le meilleur coup) et une phrase simple. */
const PROF_CONSEIL=12;
const SEUIL_ERREUR=120; // centipions perdus pour qu'un coup soit « clé »
const NOM_ADV={p:"son pion",n:"son cavalier",b:"son fou",r:"sa tour",q:"sa dame"};
const C={partie:null,cles:[],i:0,montre:false,jeton:0,cache:{}};

function cMsg(h){$("cParch").innerHTML=`<p>${h}</p>`;}
function uciCoup(u){return u&&u!=="(none)"?{from:u.slice(0,2),to:u.slice(2,4),promotion:u[4]||undefined}:null;}
function borne(x){return Math.max(-1500,Math.min(1500,x));}

async function conseilOuvrir(n){
  const p=S.parties[n];if(!p)return;
  if(mode!=="tournoi")onglet("tournoi");
  T.jeton++;MOTEUR.stop(); // une partie en cours attend pendant le conseil
  C.partie=p;C.cles=[];C.i=0;C.montre=false;const jeton=++C.jeton;
  S.conseils=(S.conseils||0)+1;save();hautsVerifier();
  $("tChoix").hidden=true;$("tJeu").hidden=true;$("cJeu").hidden=false;$("cSlot").appendChild($("plateau"));
  ["cPrec","cSuiv","cMontrer"].forEach(id=>$(id).disabled=true);$("cExplique").hidden=true;
  $("cTexte").textContent=`Ta partie contre ${(NIVEAUX.find(x=>x.k===p.niv)||NIVEAUX[0]).nom}`;$("cNum").textContent="…";
  // position finale pendant l'analyse
  const g=new Chess();for(const c of p.coups)g.move(c);G=g;flip=p.camp==="b";draw();clearArrows();
  const cles=C.cache[p.d]||await cAnalyser(p,jeton);
  if(!cles||jeton!==C.jeton)return;
  C.cache[p.d]=cles;C.cles=cles;
  if(!cles.length){$("cNum").textContent="0";cMsg(`<span class="ok">Le conseil n'a trouvé aucune grosse erreur. Bravo, belle partie !</span>`);return;}
  cAfficher();
}
async function cAnalyser(p,jeton){
  MOTEUR.demarrer();
  const g=new Chess(),pos=[g.fen()],coups=[];
  for(const c of p.coups){coups.push(g.move(c));pos.push(g.fen());}
  const E=new Array(pos.length).fill(null);
  const besoin=new Set();
  coups.forEach((m,i)=>{if(m.color===p.camp){besoin.add(i);besoin.add(i+1);}});
  const liste=[...besoin].filter(i=>i<pos.length).sort((a,b)=>a-b);
  let fait=0;
  for(const i of liste){
    if(jeton!==C.jeton)return null;
    cMsg(`Les sages étudient ta partie… ${Math.round(fait/liste.length*100)} %`);
    const gi=new Chess(pos[i]);
    if(gi.in_checkmate())E[i]={coup:null,score:-10000};
    else if(gi.game_over())E[i]={coup:null,score:0};
    else E[i]=await MOTEUR.analyser(pos[i],PROF_CONSEIL);
    fait++;
  }
  if(jeton!==C.jeton)return null;
  const cles=[];
  coups.forEach((m,i)=>{
    if(m.color!==p.camp||!E[i]||!E[i+1])return;
    const perte=borne(E[i].score)+borne(E[i+1].score); // avant (joueur) moins après (vu du joueur)
    const meilleur=uciCoup(E[i].coup);
    if(perte>=SEUIL_ERREUR&&meilleur&&!(meilleur.from===m.from&&meilleur.to===m.to))cles.push({i,perte,m,E0:E[i],E1:E[i+1],fen:pos[i]});
  });
  return cles.sort((a,b)=>b.perte-a.perte).slice(0,3).sort((a,b)=>a.i-b.i);
}
function cPhrase(k){
  const g=new Chess(k.fen),best=g.move(uciCoup(k.E0.coup));
  if(k.E0.score>=10000&&best)return `Il y avait un échec et mat avec <b>${best.san}</b> ! Regarde la flèche verte.`;
  if(k.E1.score>=10000)return `Après ce coup, l'adversaire pouvait te faire mat. Pense toujours à la sécurité de ton roi !`;
  const apres=new Chess(k.fen);apres.move(k.m.san);
  const rep=uciCoup(k.E1.coup),r=rep&&apres.move(rep);
  if(r&&r.captured&&!(best&&best.captured&&VAL_PIECE[best.captured]>=VAL_PIECE[r.captured]))
    return `Après ce coup, ${NOM_PIECE[r.captured]} en ${r.to} pouvait être pris. Avant de jouer, demande-toi : « Qu'est-ce que je laisse sans défense ? »`;
  if(best&&best.captured)return `Tu pouvais prendre ${NOM_ADV[best.captured]} en ${best.to} avec <b>${best.san}</b> !`;
  if(best&&best.san.includes("+"))return `<b>${best.san}</b> donnait échec et gagnait l'avantage. Cherche les échecs, les prises et les menaces !`;
  return `<b>${best?best.san:"Un autre coup"}</b> était plus fort. Regarde la flèche verte et cherche pourquoi.`;
}
const VAL_PIECE={p:1,n:3,b:3,r:5,q:9,k:0};
function cAfficher(){
  const k=C.cles[C.i];C.montre=false;
  G=new Chess(k.fen);flip=C.partie.camp==="b";draw();clearArrows();
  const best=uciCoup(k.E0.coup);
  arrow(k.m.from,k.m.to,true);if(best)arrow(best.from,best.to);
  const num=Math.floor(k.i/2)+1;
  $("cNum").textContent=`${C.i+1}/${C.cles.length}`;
  $("cTrait").className="trait "+(C.partie.camp==="w"?"w":"b");
  $("cTexte").textContent=`Coup ${num} : tu as joué ${k.m.san}`;
  cMsg(`<span class="ko">Flèche rouge : ton coup.</span> <span class="ok">Flèche verte : le meilleur.</span><br>${cPhrase(k)}`);
  $("cPrec").disabled=C.i===0;$("cSuiv").disabled=C.i>=C.cles.length-1;$("cMontrer").disabled=!best;
  $("cMontrer").textContent="Bon coup";
  iaBouton("cExplique","cParch",()=>iaQuestionConseil(k));
}
function cQuitter(){ // ferme le conseil sans toucher à l'échiquier (changement d'onglet)
  C.jeton++;MOTEUR.stop();$("cJeu").hidden=true;
  if(T.g)$("tJeu").hidden=false;else $("tChoix").hidden=false;
}
function cFermer(){
  cQuitter();
  $("tSlot").appendChild($("plateau"));tAfficher();tEntete();
  if(T.g&&T.etat==="pense")tAdversaire();
}
$("cPrec").onclick=()=>{if(C.i>0){C.i--;cAfficher();}};
$("cSuiv").onclick=()=>{if(C.i<C.cles.length-1){C.i++;cAfficher();}};
$("cMontrer").onclick=()=>{
  const k=C.cles[C.i];if(!k)return;
  if(C.montre){cAfficher();return;}
  clearArrows();const m=G.move(uciCoup(k.E0.coup));if(m)animMove(m);
  C.montre=true;$("cMontrer").textContent="Revoir";
};
$("cFermer").onclick=cFermer;
