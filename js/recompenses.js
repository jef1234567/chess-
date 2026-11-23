/* Habillage et récompenses : hauts faits qui débloquent des jeux de pièces et des échiquiers. */
const PLATEAUX={
  nuit:{nom:"Nuit du château",claire:"#d6cfbd",sombre:"#56739a"},
  foret:{nom:"Forêt",claire:"#e6e2c3",sombre:"#5d8a5a"},
  sable:{nom:"Sable",claire:"#f0d9b5",sombre:"#b58863"},
  royal:{nom:"Or royal",claire:"#f6e7b8",sombre:"#a8772e"},
};
const vic=k=>(S.tournoi.bilan[k]||{}).v||0;
const okTh=t=>(S.th[t]||{}).ok||0;
// prix : ce que le haut fait débloque (« pieces:<jeu> » ou « plateau:<nom> »).
const HAUTS=[
  {k:"premier",nom:"Premier coup d'épée",desc:"Réussir une épreuve.",test:()=>S.reussi>=1},
  {k:"serie5",nom:"Lame affûtée",desc:"Réussir 5 épreuves de suite.",test:()=>S.best>=5,prix:"plateau:foret"},
  {k:"serie10",nom:"Lame invincible",desc:"Réussir 10 épreuves de suite.",test:()=>S.best>=10},
  {k:"cinquante",nom:"Vétéran",desc:"Réussir 50 épreuves.",test:()=>S.reussi>=50,prix:"plateau:sable"},
  {k:"cent",nom:"Légende de la salle",desc:"Réussir 100 épreuves.",test:()=>S.reussi>=100},
  {k:"mat10",nom:"Maître du mat",desc:"Réussir 10 épreuves de mat.",test:()=>okTh("mat1")+okTh("mat2")>=10},
  {k:"bottes",nom:"Toutes les bottes",desc:"Réussir au moins une épreuve de chaque thème.",test:()=>Object.keys(THEMES).every(t=>okTh(t)>0)},
  {k:"adoube",nom:"Adoubé",desc:"Devenir Chevalier.",test:()=>S.xp>=150,prix:"pieces:celtic"},
  {k:"page",nom:"Vainqueur du Page",desc:"Battre le Page au tournoi.",test:()=>vic("page")>0},
  {k:"ecuyer",nom:"Vainqueur de l'Écuyer",desc:"Battre l'Écuyer au tournoi.",test:()=>vic("ecuyer")>0},
  {k:"chevalier",nom:"Vainqueur du Chevalier",desc:"Battre le Chevalier au tournoi.",test:()=>vic("chevalier")>0},
  {k:"baron",nom:"Vainqueur du Baron",desc:"Battre le Baron au tournoi.",test:()=>vic("baron")>0},
  {k:"duc",nom:"Vainqueur du Duc",desc:"Battre le Duc au tournoi.",test:()=>vic("duc")>0,prix:"plateau:royal"},
  {k:"conseil",nom:"Sage écuyer",desc:"Écouter le conseil de guerre.",test:()=>S.conseils>=1},
];
function prixNom(p){const[t,k]=p.split(":");return t==="pieces"?`Pièces ${JEUX_PIECES[k]}`:`Échiquier ${PLATEAUX[k].nom}`;}
function debloque(prix){ // un prix est-il obtenu ? (ceux qu'aucun haut fait ne donne sont libres)
  const h=HAUTS.find(x=>x.prix===prix);return !h||S.hauts.includes(h.k);
}
// À appeler après chaque changement de progression : annonce les nouveaux hauts faits.
function hautsVerifier(){
  const nouveaux=HAUTS.filter(h=>!S.hauts.includes(h.k)&&h.test());
  if(!nouveaux.length)return;
  for(const h of nouveaux)S.hauts.push(h.k);
  save();
  if(nouveaux.length>2){ // plusieurs d'un coup (ancienne progression) : une seule annonce
    const prix=nouveaux.filter(h=>h.prix).map(h=>prixNom(h.prix));
    setTimeout(()=>annoncer(`${nouveaux.length} hauts faits débloqués !`,prix.length?`Tu débloques : ${prix.join(", ")}`:"Va les voir dans ton blason."),900);return;
  }
  nouveaux.forEach((h,i)=>setTimeout(()=>annoncer(`Haut fait : ${h.nom} !`,h.prix?`Tu débloques : ${prixNom(h.prix)}`:h.desc),900+i*3200));
}
function annoncer(titre,detail){
  let a=$("annonce");if(!a){a=document.createElement("div");a.id="annonce";a.className="annonce";a.setAttribute("role","status");document.body.appendChild(a);}
  a.innerHTML=`${esc(titre)}<small>${esc(detail)}</small>`;
  SON.fanfare();requestAnimationFrame(()=>a.classList.add("on"));
  clearTimeout(a._t);a._t=setTimeout(()=>a.classList.remove("on"),2800);
}
function appliquerPlateau(){
  const p=PLATEAUX[S.plateau]&&debloque("plateau:"+S.plateau)?PLATEAUX[S.plateau]:PLATEAUX.nuit;
  document.documentElement.style.setProperty("--case-claire",p.claire);document.documentElement.style.setProperty("--case-sombre",p.sombre);
}
function majApparence(){
  const puce=(groupe,k,nom,prix,actif)=>{const ok=!prix||debloque(prix);
    return `<button type="button" class="chip${actif?" on":""}" data-g="${groupe}" data-k="${k}"${ok?"":` disabled title="À débloquer"`}>${ok?"":"🔒 "}${nom}</button>`;};
  $("apPieces").innerHTML=Object.entries(JEUX_PIECES).map(([k,n])=>puce("pieces",k,n,HAUTS.some(h=>h.prix==="pieces:"+k)?"pieces:"+k:null,S.pieces===k)).join("");
  $("apPlateaux").innerHTML=Object.entries(PLATEAUX).map(([k,p])=>puce("plateau",k,p.nom,HAUTS.some(h=>h.prix==="plateau:"+k)?"plateau:"+k:null,S.plateau===k)).join("");
  $("hauts").innerHTML=HAUTS.map(h=>{const ok=S.hauts.includes(h.k);
    return `<div class="haut${ok?"":" verrou"}"><b>${h.nom}</b><span>${h.desc}</span>${h.prix?`<span class="prix">${ok?"Débloqué":"Récompense"} : ${prixNom(h.prix)}</span>`:""}</div>`;}).join("");
  $("hautsNb").textContent=`${S.hauts.length}/${HAUTS.length}`;
}
$("vBlason").addEventListener("click",e=>{
  const b=e.target.closest(".chip[data-g]");if(!b||b.disabled)return;
  if(b.dataset.g==="pieces")S.pieces=b.dataset.k;else{S.plateau=b.dataset.k;appliquerPlateau();}
  save();majApparence();
});
appliquerPlateau();

/* ---------- Fêtes : sceau de cire, XP qui vole, adoubement ---------- */
function sceau(txt,rate,ms=1400){
  const s=$("sceau");$("sceauTxt").textContent=txt;s.className="sceau";void s.offsetWidth;
  s.className="sceau on"+(rate?" rate":"");clearTimeout(s._t);s._t=setTimeout(()=>s.className="sceau",ms);
}
function xpVole(n){
  if(!n)return;const bar=$("xpBar");
  if(REDUIT()||!document.body.animate)return;
  const d=document.createElement("div");d.className="xpvol";d.textContent=`+${n} XP`;document.body.appendChild(d);
  const[x,y]=centre($("board")),[x2,y2]=centre(bar);d.style.left=x+"px";d.style.top=y+"px";
  d.animate([{transform:"translate(-50%,-50%) scale(.5)",opacity:0},{transform:"translate(-50%,-50%) scale(1.25)",opacity:1,offset:.3},
    {transform:`translate(calc(-50% + ${x2-x}px),calc(-50% + ${y2-y}px)) scale(.45)`,opacity:.8}],{duration:1150,delay:500,easing:"cubic-bezier(.55,0,.35,1)",fill:"backwards"})
   .onfinish=()=>{d.remove();bar.parentElement.animate([{boxShadow:"0 0 0 0 #f3dc9400"},{boxShadow:"0 0 14px 5px #f3dc94"},{boxShadow:"0 0 0 0 #f3dc9400"}],{duration:600});};
}
// Toute l'XP passe par ici : une montée de grade déclenche l'adoubement.
function gagnerXP(n){
  const avant=gradeDe(S.xp)[0][1];S.xp+=n;const apres=gradeDe(S.xp)[0][1];
  xpVole(n);if(apres!==avant)setTimeout(()=>adouber(apres),2200);
}
function adouber(grade){
  let a=$("adoube");
  if(!a){a=document.createElement("div");a.id="adoube";a.className="adoube";a.setAttribute("role","dialog");a.setAttribute("aria-label","Nouveau grade");document.body.appendChild(a);
    a.onclick=()=>{a.classList.remove("on");};}
  a.innerHTML=`<div class="scene">
    <svg class="ecu-ad" viewBox="0 0 40 48" aria-hidden="true"><path d="M3 3h34v18c0 13-9 21-17 24C12 42 3 34 3 21z" fill="#24427f" stroke="#e3b84b" stroke-width="2"/><path d="M20 10l3 6h6l-5 4 2 7-6-4-6 4 2-7-5-4h6z" fill="#e3b84b"/></svg>
    <svg class="epee" viewBox="0 0 40 200" aria-hidden="true"><defs><linearGradient id="lame" x1="0" x2="1"><stop offset="0" stop-color="#9aa6c0"/><stop offset=".5" stop-color="#f4f7ff"/><stop offset="1" stop-color="#8590aa"/></linearGradient></defs>
      <path d="M16 46h8v128l-4 14-4-14z" fill="url(#lame)"/><rect x="2" y="38" width="36" height="8" rx="4" fill="#e3b84b"/><rect x="16" y="8" width="8" height="30" rx="3" fill="#6b3f1f"/><circle cx="20" cy="7" r="6" fill="#e3b84b"/></svg>
  </div>
  <p class="voix">Par cette épée, ${esc(nomOuEcuyer())}, je te fais</p><h2>${esc(grade)}</h2><p class="note">Touche l'écran pour continuer</p>`;
  a.classList.remove("on");void a.offsetWidth;a.classList.add("on");
  SON.adoube();setTimeout(()=>confettis(180),1100);
  clearTimeout(a._t);a._t=setTimeout(()=>a.classList.remove("on"),7000);
}
