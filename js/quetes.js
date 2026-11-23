/* Gameplay de la salle d'armes (lot 9) : étoiles, quête du jour et coffre, carte du royaume, joute contre la montre.
   Tout est hors ligne. Données gardées dans la sauvegarde : etoiles, quete, conquis, joute. */

/* ---------- Étoiles : 3 sans indice, 2 avec un indice, 1 avec deux ---------- */
function etoilesDe(nIndices){return nIndices<=0?3:nIndices===1?2:1;}
function etoilesHTML(n){return `<span class="etoiles" aria-label="${n} étoile${n>1?"s":""} sur 3">${"★".repeat(n)}<i>${"★".repeat(3-n)}</i></span>`;}
function noterEtoiles(id,n){S.etoiles[id]=Math.max(S.etoiles[id]||0,n);}
function totalEtoiles(){let t=0;for(const k in S.etoiles)t+=S.etoiles[k];return t;}

/* ---------- Quête du jour : 5 épreuves tirées chaque jour, puis un coffre ---------- */
function jourCle(){const d=new Date();return `${d.getFullYear()}-${d.getMonth()+1}-${d.getDate()}`;}
function hasardGraine(txt){let h=1779033703^txt.length;for(let i=0;i<txt.length;i++){h=Math.imul(h^txt.charCodeAt(i),3432918353);h=h<<13|h>>>19;}
  return()=>{h=Math.imul(h^h>>>16,2246822507);h=Math.imul(h^h>>>13,3266489909);return((h^=h>>>16)>>>0)/4294967296;};}
function queteDuJour(){
  const jour=jourCle();
  if(S.quete&&S.quete.jour===jour&&S.quete.ids.every(id=>P.some(p=>p.id===id)))return S.quete;
  const r=hasardGraine(jour+(S.nom||"")),faits=new Set(S.reussis),ids=[];
  const themes=Object.keys(THEMES).sort(()=>r()-.5).slice(0,5);
  for(const t of themes){
    let c=P.filter(p=>p.t===t&&!faits.has(p.id)&&Math.abs(p.r-S.cote)<220);
    if(!c.length)c=P.filter(p=>p.t===t&&Math.abs(p.r-S.cote)<400);
    if(!c.length)c=P.filter(p=>p.t===t);
    ids.push(c[Math.floor(r()*c.length)].id);
  }
  S.quete={jour,ids,faits:[],coffre:false};save();return S.quete;
}
function queteSuivante(){const q=queteDuJour();const id=q.ids.find(i=>!q.faits.includes(i));return id?P.find(p=>p.id===id):null;}
function majQueteChip(){
  const b=document.querySelector('.chip[data-k="quete"]');if(!b)return;const q=queteDuJour();
  b.innerHTML=q.coffre?"Quête accomplie ✓":`Quête du jour <b>${q.faits.length}/5</b>`;b.classList.toggle("fini",q.coffre);
}
function queteApres(){ // après chaque épreuve finie (réussie ou non)
  const q=queteDuJour();
  if(!q.ids.includes(PZ.id)||q.faits.includes(PZ.id))return;
  q.faits.push(PZ.id);
  if(q.faits.length>=5&&!q.coffre){q.coffre=true;S.coffres=(S.coffres||0)+1;save();setTimeout(ouvrirCoffre,1600);}
  save();majQueteChip();
}
function ouvrirCoffre(){
  const et=queteDuJour().ids.reduce((t,id)=>t+(S.etoiles[id]||0),0);
  const gain=20+et;
  scene("coffre",`<div class="scene coffre-scene"><div class="rayons"></div>
    <svg class="coffre" viewBox="0 0 120 100" aria-hidden="true">
      <rect x="10" y="44" width="100" height="50" rx="6" fill="#7a4a1e" stroke="#3a210c" stroke-width="3"/>
      <rect x="10" y="60" width="100" height="8" fill="#e3b84b"/><rect x="52" y="54" width="16" height="22" rx="3" fill="#e3b84b" stroke="#8a6a1a" stroke-width="2"/>
      <g class="couvercle"><path d="M10 46 Q10 14 60 14 Q110 14 110 46 Z" fill="#8a5a2a" stroke="#3a210c" stroke-width="3"/><path d="M10 40 Q10 22 60 22 Q110 22 110 40" fill="none" stroke="#e3b84b" stroke-width="5"/></g>
    </svg></div>
    <p class="voix">Quête du jour accomplie !</p><h2>+${gain} XP</h2><p class="voix">${et} étoile${et>1?"s":""} gagnée${et>1?"s":""} pendant la quête.</p><p class="note">Touche l'écran pour continuer</p>`);
  SON.fanfare();
  setTimeout(()=>{const c=document.querySelector("#coffre .coffre");if(c){const[x,y]=centre(c);burst(x,y-20,60,["#e3b84b","#f3dc94","#fff4c4"]);}gagnerXP(gain);save();majEntete();hautsVerifier();},900);
}
// Fenêtre de fête plein écran (coffre, joute, conquête) ; un toucher la ferme.
function scene(id,html,ms=7000){
  let a=$(id);
  if(!a){a=document.createElement("div");a.id=id;a.className="adoube";a.setAttribute("role","dialog");document.body.appendChild(a);a.onclick=()=>a.classList.remove("on");}
  a.innerHTML=html;a.classList.remove("on");void a.offsetWidth;a.classList.add("on");
  clearTimeout(a._t);a._t=setTimeout(()=>a.classList.remove("on"),ms);
}

/* ---------- Carte du royaume : chaque thème est un lieu à conquérir (5 épreuves réussies) ---------- */
const LIEUX=[
  {t:"prise",nom:"Village des pièces gratuites",x:22,y:122},
  {t:"mat1",nom:"Pont du premier mat",x:58,y:116},
  {t:"fourchette",nom:"Forêt des fourchettes",x:80,y:96},
  {t:"attaqueDouble",nom:"Moulin de l'attaque double",x:44,y:88},
  {t:"clouage",nom:"Tour des clouages",x:16,y:70},
  {t:"enfilade",nom:"Défilé de l'enfilade",x:48,y:60},
  {t:"decouverte",nom:"Grotte des découvertes",x:82,y:50},
  {t:"defense",nom:"Remparts de la défense",x:56,y:34},
  {t:"mat2",nom:"Donjon du mat en deux",x:22,y:28},
  {t:"finale",nom:"Château des finales",x:56,y:10},
];
const CONQUETE=5;
function lieuConquis(l){return ((S.th[l.t]||{}).ok||0)>=CONQUETE;}
function lieuOuvert(i){return i===0||lieuConquis(LIEUX[i-1])||lieuConquis(LIEUX[i]);}
function conquetesVerifier(){
  const nouveaux=LIEUX.filter(l=>lieuConquis(l)&&!S.conquis.includes(l.t));
  if(!nouveaux.length)return;
  for(const l of nouveaux)S.conquis.push(l.t);save();
  if(nouveaux.length===1){const i=LIEUX.indexOf(nouveaux[0]),suiv=LIEUX[i+1];
    setTimeout(()=>annoncer(`Tu as conquis : ${nouveaux[0].nom} !`,suiv?`La route s'ouvre vers : ${suiv.nom}.`:"Tout le royaume est à toi !"),1400);}
}
function ouvrirCarte(){
  const pts=LIEUX.map(l=>`${l.x},${l.y}`).join(" ");
  const lieux=LIEUX.map((l,i)=>{const c=lieuConquis(l),o=lieuOuvert(i),n=Math.min(CONQUETE,(S.th[l.t]||{}).ok||0);
    const cl=c?"conquis":o?"ouvert":"ferme";
    return `<g class="lieu ${cl}" data-t="${l.t}" data-i="${i}" transform="translate(${l.x} ${l.y})" role="button" aria-label="${l.nom}${c?", conquis":o?`, ${n} sur ${CONQUETE}`:", fermé"}">
      <circle r="7.5" class="socle"/>${c?'<path d="M-1 -11v-9" stroke="#3a210c" stroke-width=".9"/><path d="M-1 -20h7l-2 2.5 2 2.5h-7z" fill="#b8343e"/>':""}
      <path class="tourelle" d="M-4 4v-6h1.5v-2h1.6v2h1.8v-2h1.6v2h1.5v6z"/>${o||c?"":'<text class="cadenas" y="2.4">🔒</text>'}
      <text class="nom" y="12.5">${l.nom}</text>${!c&&o?`<text class="compte" y="17">${n}/${CONQUETE}</text>`:""}</g>`;}).join("");
  scene("carteRoyaume",`<div class="parchemin-carte" onclick="event.stopPropagation()">
    <h2>La carte du royaume</h2><p class="note">Réussis ${CONQUETE} épreuves d'un lieu pour le conquérir et ouvrir la route suivante. Touche un lieu ouvert pour t'y entraîner.</p>
    <svg viewBox="0 0 100 138" class="carte-svg"><path d="M${pts.replace(/ /g," L")}" class="route"/>${lieux}</svg>
    <button type="button" class="or" id="carteFermer">Retour à la salle</button></div>`,600000);
  $("carteFermer").onclick=()=>$("carteRoyaume").classList.remove("on");
  document.querySelectorAll("#carteRoyaume .lieu").forEach(g=>g.onclick=()=>{
    if(!lieuOuvert(+g.dataset.i)){g.animate&&g.animate([{transform:g.getAttribute("transform")+" translate(-1 0)"},{transform:g.getAttribute("transform")+" translate(1 0)"}],{duration:90,iterations:3});return;}
    $("carteRoyaume").classList.remove("on");choisirFiltre(g.dataset.t);});
}

/* ---------- Joute contre la montre : 3 minutes, un maximum d'épreuves ---------- */
const J={actif:false,fin:0,score:0,minuterie:null};
function jouteChoisir(){
  const rec=new Set(S.vus.slice(-20));
  let c=P.filter(p=>p.r<=S.cote+50&&p.r>=S.cote-300&&!rec.has(p.id)&&p.id!==(PZ&&PZ.id));
  if(c.length<5)c=P.filter(p=>p.r<=S.cote+100&&!rec.has(p.id));
  return c[Math.floor(Math.random()*c.length)]||P[0];
}
function jouteDemarrer(){
  ac();J.actif=true;J.score=0;J.fin=Date.now()+180000;
  document.body.classList.add("joute");jouteTic();clearInterval(J.minuterie);J.minuterie=setInterval(jouteTic,250);
  charger(jouteChoisir());
}
function jouteTic(){
  const r=Math.max(0,J.fin-Date.now()),s=Math.ceil(r/1000);
  $("mTheme").textContent=`${Math.floor(s/60)}:${String(s%60).padStart(2,"0")} · ${J.score} ✓`;
  $("mTheme").classList.toggle("urgent",s<=20);
  if(r<=0)jouteFin();
}
function jouteApres(ok){ // épreuve finie pendant la joute : on enchaîne
  if(!J.actif)return;
  if(ok)J.score++;
  plus(()=>{if(J.actif)charger(jouteChoisir());},ok?900:1500);
}
function jouteArreter(){J.actif=false;clearInterval(J.minuterie);document.body.classList.remove("joute");$("mTheme").classList.remove("urgent");}
function jouteFin(){
  if(!J.actif)return;jouteArreter();partie++;etat="fini";clearMarks();
  const avant=S.joute.best,record=J.score>avant;S.joute.n++;if(record)S.joute.best=J.score;
  const gain=J.score*2;if(gain)gagnerXP(gain);save();majEntete();hautsVerifier();
  scene("jouteFin",`<div class="scene"><svg class="ecu-ad" viewBox="0 0 40 48" aria-hidden="true"><path d="M3 3h34v18c0 13-9 21-17 24C12 42 3 34 3 21z" fill="#b8343e" stroke="#e3b84b" stroke-width="2"/><path d="M12 12l16 22M28 12L12 34" stroke="#e3b84b" stroke-width="3.5" stroke-linecap="round"/></svg></div>
    <p class="voix">Fin de la joute !</p><h2>${J.score} épreuve${J.score>1?"s":""}</h2>
    <p class="voix">${record?"Nouveau record ! ":avant?`Ton record : ${avant}. `:""}${gain?`+${gain} XP`:"Tu feras mieux la prochaine fois !"}</p><p class="note">Touche l'écran pour continuer</p>`);
  if(record&&J.score)setTimeout(()=>confettis(),600);SON.victoire();
  $("parch").innerHTML=`<p>La joute est finie : <b>${J.score}</b> épreuve${J.score>1?"s":""} réussie${J.score>1?"s":""}. Touche « Suivante » pour continuer l'entraînement.</p>`;
  $("mTheme").textContent=THEMES[PZ.t];
}
