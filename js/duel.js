/* Duel à distance (lot 13) : deux joueurs, deux appareils, une partie.
   Pas de serveur à nous : les coups passent par un relais public gratuit (ntfy.sh, sans compte),
   chiffrés de bout en bout (AES-GCM, clé tirée du code du duel, jamais envoyée).
   Le sujet ntfy et la clé sont tous deux dérivés du code : qui n'a pas le code ne trouve ni ne lit rien.
   Chaque message porte toute la partie (liste des coups) : un message perdu est rattrapé par le suivant.
   Rôles : « h » (l'hôte, qui crée le duel) et « i » (l'invité). Partie : {p (numéro), blanc ("h"|"i"), coups:[SAN], fin}. */

const RELAIS=(()=>{try{return localStorage.getItem("salle-armes-relais")||"https://ntfy.sh";}catch(e){return "https://ntfy.sh";}})();
const D_ALPHA="ABCDEFGHJKMNPQRSTUVWXYZ23456789"; // sans 0, O, 1, I, L : rien à confondre en le dictant
const D={code:null,role:null,adv:"",jeu:null,cle:null,sujet:null,es:null,dernier:null,attente:null,delai:2000,etat:"hors",prochain:null,vu:false};

/* ---------- Code, clé et chiffrement ---------- */
function dNouveauCode(){const a=new Uint32Array(12);crypto.getRandomValues(a);return [...a].map(x=>D_ALPHA[x%D_ALPHA.length]).join("");}
function dNormaliser(c){return String(c||"").toUpperCase().split("").filter(x=>D_ALPHA.includes(x)).join("");}
function dJoli(c){return c.replace(/(.{4})(?=.)/g,"$1-");}
const dTexte=new TextEncoder(),dLire=new TextDecoder();
async function dHache(t){return new Uint8Array(await crypto.subtle.digest("SHA-256",dTexte.encode(t)));}
async function dPreparer(code){
  const h=await dHache("salle-armes/sujet/"+code);
  D.sujet="salle-armes-"+[...h.slice(0,16)].map(x=>x.toString(16).padStart(2,"0")).join("");
  D.cle=await crypto.subtle.importKey("raw",await dHache("salle-armes/cle/"+code),"AES-GCM",false,["encrypt","decrypt"]);
}
function dB64(u){let s="";for(const x of u)s+=String.fromCharCode(x);return btoa(s);}
function dDeB64(s){const b=atob(s),u=new Uint8Array(b.length);for(let i=0;i<b.length;i++)u[i]=b.charCodeAt(i);return u;}
async function dChiffrer(o){const iv=crypto.getRandomValues(new Uint8Array(12));
  const c=new Uint8Array(await crypto.subtle.encrypt({name:"AES-GCM",iv},D.cle,dTexte.encode(JSON.stringify(o))));
  const t=new Uint8Array(12+c.length);t.set(iv);t.set(c,12);return "sa1:"+dB64(t);}
async function dDechiffrer(s){if(typeof s!=="string"||!s.startsWith("sa1:"))return null;
  try{const t=dDeB64(s.slice(4));return JSON.parse(dLire.decode(await crypto.subtle.decrypt({name:"AES-GCM",iv:t.slice(0,12)},D.cle,t.slice(12))));}catch(e){return null;}}

/* ---------- Relais ---------- */
function dEcouter(){ // abonnement : flux SSE ; à la coupure, on se réabonne à partir du dernier message reçu
  dFermer();if(!D.sujet)return;
  const es=new EventSource(`${RELAIS}/${D.sujet}/sse?since=${D.dernier||"all"}`);D.es=es;
  es.onopen=()=>{D.delai=2000;dConnexion("ok");if(!D.annonce){D.annonce=true;dEnvoyerEtat();}}; // une annonce par ouverture de l'appli : le relais limite à 250 messages par jour
  es.onmessage=async e=>{let m;try{m=JSON.parse(e.data);}catch(x){return;}
    if(!m||m.event!=="message")return;D.dernier=m.id;const o=await dDechiffrer(m.message);if(o)dRecevoir(o);};
  es.onerror=()=>{if(D.es!==es)return;dFermer();dConnexion("perdu");
    D.prochain=setTimeout(dEcouter,D.delai);D.delai=Math.min(D.delai*2,30000);};
}
function dFermer(){clearTimeout(D.prochain);if(D.es){const es=D.es;D.es=null;es.close();}}
// Envoi : seul le dernier état compte, il remplace un envoi encore en attente. Nouvel essai si le réseau manque.
function dEnvoyer(o){D.attente=o;if(!D.envoiEnCours)dVider();}
async function dVider(){
  D.envoiEnCours=true;let essai=0;
  while(D.attente&&D.cle){const o=D.attente;
    try{const r=await fetch(`${RELAIS}/${D.sujet}?firebase=no`,{method:"POST",body:await dChiffrer(o)});
      if(!r.ok)throw new Error(r.status);if(D.attente===o)D.attente=null;essai=0;}
    catch(e){essai++;dConnexion("perdu");await new Promise(r=>setTimeout(r,Math.min(2000*2**essai,30000)));}}
  D.envoiEnCours=false;
}
function dEnvoyerEtat(){if(D.jeu||D.role==="i")dEnvoyer({de:D.role,nom:S.nom.trim()||"Chevalier",jeu:D.jeu});}
function dConnexion(e){D.etat=e;const t={ok:"En ligne",perdu:"Hors ligne",hors:"—"}[e];
  $("dLien").textContent=t;$("dLien").classList.toggle("ko",e==="perdu");
  if(e==="perdu"&&!$("dJeu").hidden)$("dTexte").textContent="Connexion perdue… je réessaie tout seul.";else dEntete();}

/* ---------- Réception : on garde la partie la plus avancée ---------- */
function dRecevoir(o){
  if(!o||o.de===D.role||(o.de!=="h"&&o.de!=="i"))return; // son propre message, revenu du relais
  if(typeof o.nom==="string"){const n=o.nom.slice(0,24);if(n!==D.adv){D.adv=n;dSauver();}}
  if(!D.vu){D.vu=true;if(D.role==="h"){$("dEtatInv").textContent=`${D.adv} a rejoint le duel !`;SON.victoire&&SON.victoire();dMontrerJeu();}}
  const j=o.jeu,l=D.jeu;
  if(!j||typeof j!=="object"||!Array.isArray(j.coups)||typeof j.p!=="number"){if(l)dEnvoyerEtat();return;} // l'invité arrive : on lui envoie la partie
  if(!l||j.p>l.p){dAdopter(j,true);return;}
  if(j.p<l.p){dEnvoyerEtat();return;}
  const n=l.coups.length,pref=j.coups.slice(0,n).every((c,i)=>c===l.coups[i]);
  if(pref&&j.coups.length>n){dAdopter(j,false);return;}
  if(j.fin&&!l.fin&&pref&&j.coups.length===n){l.fin=j.fin;dSauver();dAfficher();dFin();return;}
  if(!pref||j.coups.length<n||(l.fin&&!j.fin))dEnvoyerEtat(); // l'autre est en retard : on lui renvoie la partie
}
function dAdopter(j,nouvelle){ // partie reçue : on joue les coups qui manquent, avec animation
  const g=new Chess();for(const c of j.coups)if(!g.move(c))return; // partie illisible : ignorée
  const avant=D.jeu&&!nouvelle?D.jeu.coups.length:0;
  D.jeu={p:j.p,blanc:j.blanc==="i"?"i":"h",coups:g.history(),fin:j.fin||null};dSauver();
  if(mode!=="duel"||$("dJeu").hidden){dMontrerJeu();return;}
  if(nouvelle||j.coups.length-avant!==1){dAfficher();}
  else{G.move(j.coups[avant]);const h=G.history({verbose:true});animMove(h[h.length-1]);}
  if(nouvelle)dMsg(`${j.p>1?"Revanche !":"Le duel commence !"} Tu as les <b>${dCamp()==="w"?"blancs":"noirs"}</b>.${dPeutJouer()?" À toi de jouer.":""}`);
  else if(!dFin())dMsg(`<b>${esc(D.adv||"Ton adversaire")}</b> a joué <b>${D.jeu.coups[D.jeu.coups.length-1]}</b>. À toi !`);
  dEntete();
}

/* ---------- Partie ---------- */
function dCamp(){return D.jeu&&D.jeu.blanc===D.role?"w":"b";}
function dG(){const g=new Chess();if(D.jeu)for(const c of D.jeu.coups)g.move(c);return g;}
function dTermine(){return !D.jeu||!!D.jeu.fin||dG().game_over();}
function dPeutJouer(){return D.jeu&&!dTermine()&&G.turn()===dCamp();}
function dMsg(h){$("dParch").innerHTML=`<p>${h}</p>`;}
function dSauver(){S.duel=D.code?{code:D.code,role:D.role,adv:D.adv,jeu:D.jeu,dernier:D.dernier,vu:D.vu}:null;save();}
function dAfficher(){if(mode!=="duel")return;G=dG();flip=dCamp()==="b";draw();clearArrows();
  const h=G.history({verbose:true});if(h.length)markLast(h[h.length-1]);dEntete();}
function dEntete(){
  if(!D.jeu){$("dTexte").textContent="En attente de ton adversaire…";return;}
  const g=dG();$("dTrait").className="trait "+(g.turn()==="b"?"b":"w");
  $("dTitre").textContent=D.adv?`Duel contre ${D.adv}`:"Duel à distance";
  $("dTexte").textContent=dTermine()?"La partie est finie.":g.turn()===dCamp()?"À toi de jouer.":`${D.adv||"Ton adversaire"} réfléchit…`;
  $("dRevanche").hidden=!dTermine();$("dAbandon").disabled=dTermine();
}
function dJouer(vm){
  clearMarks();sel=null;
  const m=G.move({from:vm.from,to:vm.to,promotion:"q"});if(!m)return;
  animMove(m);D.jeu.coups.push(m.san);dSauver();dEnvoyerEtat();
  if(!dFin())dMsg(`Tu as joué <b>${m.san}</b>. ${esc(D.adv||"Ton adversaire")} réfléchit…`);
  dEntete();
}
const D_RES={victoire:"Victoire",defaite:"Défaite",nulle:"Nulle",abandon:"Abandon"};
function dFin(){ // vrai si la partie est finie ; bilan et archive une seule fois par partie
  const g=dG(),j=D.jeu;if(!j||!(j.fin||g.game_over()))return false;
  let res,txt;
  if(j.fin&&j.fin.abandon){const moi=j.fin.abandon===D.role;res=moi?"abandon":"victoire";
    txt=moi?"Tu as abandonné. Ce n'est que partie remise !":`<span class="ok">${esc(D.adv||"Ton adversaire")} abandonne : tu gagnes !</span>`;}
  else if(g.in_checkmate()){const gagne=g.turn()!==dCamp();res=gagne?"victoire":"defaite";
    txt=gagne?`<span class="ok">Échec et mat ! Tu as gagné le duel !</span>`:`Échec et mat… ${esc(D.adv||"Ton adversaire")} gagne cette fois. Le conseil de guerre peut t'aider !`;}
  else{res="nulle";txt=`<span class="ok">Partie nulle (${g.in_stalemate()?"pat":g.in_threefold_repetition()?"même position trois fois":g.insufficient_material()?"plus assez de pièces pour faire mat":"règle des 50 coups"}).</span>`;}
  if(S.duelArchive!==D.code+":"+j.p){S.duelArchive=D.code+":"+j.p;
    const b=S.duels;b[{victoire:"v",defaite:"d",abandon:"d",nulle:"n"}[res]]++;
    if(res==="victoire"){gagnerXP(30);setTimeout(()=>{SON.victoire();confettis();sceau("Victoire !",false,1800);},900);}
    if(j.coups.length>=2){S.parties.unshift({d:Date.now(),niv:"duel",adv:D.adv,camp:dCamp(),coups:j.coups.slice(),res});S.parties=S.parties.slice(0,20);}
    save();majEntete();hautsVerifier();}
  dMsg(txt+" Touche « Revanche » pour rejouer en changeant de couleur.");dEntete();return true;
}
function dAbandonner(){if(!D.jeu||dTermine())return;D.jeu.fin={abandon:D.role};dSauver();dEnvoyerEtat();dFin();}
function dRevanche(){if(!D.jeu||!dTermine())return;
  D.jeu={p:D.jeu.p+1,blanc:D.jeu.blanc==="h"?"i":"h",coups:[],fin:null};dSauver();dEnvoyerEtat();dAfficher();
  dMsg(`Revanche ! Tu as les <b>${dCamp()==="w"?"blancs":"noirs"}</b>.${dCamp()==="w"?" À toi de commencer.":""}`);}

/* ---------- Écrans ---------- */
function dEcran(e){$("dAccueil").hidden=e!=="accueil";$("dAttente").hidden=e!=="attente";$("dJeu").hidden=e!=="jeu";
  if(e==="attente")$("dCodeTxt").textContent=dJoli(D.code);
  if(e==="jeu"){$("dSlot").appendChild($("plateau"));dAfficher();}}
function dMontrerJeu(){if(mode==="duel"&&D.jeu){dEcran("jeu");
  dMsg(!D.vu&&D.role==="h"?"Ton adversaire n'est pas encore là. Tu peux jouer ton premier coup.":dTermine()?"La partie est finie.":G.turn()===dCamp()?"À toi de jouer !":`${esc(D.adv||"Ton adversaire")} réfléchit…`);}}
async function dOuvrir(code,role,camp){
  await dPreparer(code);D.annonce=false;D.code=code;D.role=role;D.adv="";D.vu=false;D.dernier=null;
  D.jeu=role==="h"?{p:1,blanc:camp==="b"?"i":"h",coups:[],fin:null}:null;
  dSauver();dEcouter();
  if(role==="h")dEcran("attente");else{dEcran("jeu");dMsg("Je cherche le duel…");dEntete();dEnvoyerEtat();}
}
function dQuitter(){dFermer();D.code=null;D.jeu=null;D.cle=null;D.sujet=null;D.attente=null;dSauver();dConnexion("hors");dEcran("accueil");}
function dLienInvitation(){return location.origin+location.pathname+"#duel="+D.code;}
async function dReprendre(){const s=S.duel;if(!s||!s.code)return;
  try{await dPreparer(s.code);}catch(e){return;}
  Object.assign(D,{code:s.code,role:s.role,adv:s.adv||"",jeu:s.jeu||null,dernier:s.dernier||null,vu:!!s.vu});
  if(mode==="duel")D.jeu?dEcran("jeu"):dEcran(D.role==="h"?"attente":"jeu");}
function dOnglet(){ // à l'ouverture de l'onglet Duel
  if(!crypto.subtle){$("dErreur").textContent="Ce navigateur ne permet pas le duel à distance.";dEcran("accueil");return;}
  if(!D.code){dEcran("accueil");return;}
  if(D.role==="h"&&!D.vu&&!D.jeu.coups.length)dEcran("attente");else dEcran("jeu");
  if(!D.es)dEcouter();
  dMontrerJeu();
}

(function(){
  const cp=$("dCamps");
  cp.innerHTML=[["w","Les blancs"],["b","Les noirs"],["hasard","Au hasard"]].map(([k,v],i)=>`<button type="button" class="chip${i===0?" on":""}" data-k="${k}">${v}</button>`).join("");
  cp.onclick=e=>{const b=e.target.closest(".chip");if(!b)return;cp.querySelectorAll(".chip").forEach(c=>c.classList.toggle("on",c===b));};
  $("dCreer").onclick=()=>{ac();let c=cp.querySelector(".on").dataset.k;if(c==="hasard")c=Math.random()<.5?"w":"b";dOuvrir(dNouveauCode(),"h",c);};
  $("dRejoindre").onclick=()=>{ac();const c=dNormaliser($("dCode").value);
    if(c.length!==12){$("dErreur").textContent="Le code a 12 lettres et chiffres. Vérifie-le !";return;}
    $("dErreur").textContent="";dOuvrir(c,"i");};
  $("dPartager").onclick=()=>{const url=dLienInvitation(),texte=`Viens me défier aux échecs dans La Salle d'armes ! Code du duel : ${dJoli(D.code)}`;
    if(navigator.share)navigator.share({title:"Duel à distance",text:texte,url}).catch(()=>{});else $("dCopier").onclick();};
  $("dCopier").onclick=()=>{const t=`${dJoli(D.code)} ${dLienInvitation()}`;
    (navigator.clipboard?navigator.clipboard.writeText(t):Promise.reject()).then(()=>$("dEtatInv").textContent="Copié ! Colle-le dans un message.",()=>$("dEtatInv").textContent=`Code : ${dJoli(D.code)}`);};
  $("dAnnulerInv").onclick=dQuitter;$("dJouerDeja").onclick=()=>dEcran("jeu")||dMontrerJeu();
  $("dAbandon").onclick=dAbandonner;$("dRevanche").onclick=dRevanche;
  $("dQuitter").onclick=()=>{if(D.jeu&&!dTermine()&&D.jeu.coups.length&&!$("dQuitter").dataset.sur){$("dQuitter").dataset.sur=1;$("dQuitter").textContent="Sûr ?";
      setTimeout(()=>{delete $("dQuitter").dataset.sur;$("dQuitter").textContent="Quitter";},3000);return;}
    delete $("dQuitter").dataset.sur;$("dQuitter").textContent="Quitter";dQuitter();};
  $("dCodeB").onclick=()=>{if(D.code)dMsg(`Code du duel : <b>${dJoli(D.code)}</b>`);};
  addEventListener("online",()=>{if(D.code&&!D.es)dEcouter();if(D.attente&&!D.envoiEnCours)dVider();});
  document.addEventListener("visibilitychange",()=>{if(!document.hidden&&D.code&&(!D.es||D.es.readyState===2))dEcouter();});
})();
