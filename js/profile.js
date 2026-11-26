/* Profil du joueur : grades et sauvegarde sur l'appareil (localStorage, clé salle-armes-v1). */
const GRADES=[[0,"Page"],[50,"Écuyer"],[150,"Chevalier"],[300,"Chevalier banneret"],[500,"Baron"],[800,"Comte"],[1200,"Duc"]];

/* ---------- Sauvegarde (sur cet appareil) ---------- */
// Format v1 (lot 0) : nom, xp, cote, serie, best, reussi, th, hist, vus, son.
// Ajouts du lot 2 : aRevoir (épreuves ratées à revoir), reussis (épreuves déjà réussies).
// Ajout du lot 3 : tournoi {partie en cours, bilan par niveau}.
// Ajout du lot 4 : parties (les 20 dernières parties du tournoi, pour le conseil de guerre).
// Ajout du lot 6 : pieces (jeu de pièces), plateau (couleurs), hauts (hauts faits débloqués), conseils (nombre de conseils ouverts).
// Ajout du lot 8 : pleinEcran (passer en plein écran au premier toucher).
// Ajouts du lot 9 : etoiles (meilleur nombre d'étoiles par épreuve), quete (quête du jour), coffres, conquis (lieux de la carte),
// joute (record du contre-la-montre), finales (finales gagnées).
// Ajouts du lot 13 : duel (duel à distance en cours), duels (bilan v/d/n), duelArchive (dernière partie comptée).
// Ajouts du lot 14 : ouvertures (leçons réussies de mémoire), menaces {ok, n, vus} (mode « Trouve la menace ») ;
// la partie du tournoi en cours garde aussi sa pendule (pendule, temps), le duel aussi (dans duel.jeu).
// Les anciennes données sont gardées telles quelles ; les champs absents prennent leur valeur par défaut.
function defauts(){return {nom:"",xp:0,cote:600,serie:0,best:0,reussi:0,th:{},hist:[],vus:[],son:true,aRevoir:[],reussis:[],tournoi:{partie:null,bilan:{}},parties:[],pieces:"fantasy",plateau:"nuit",hauts:[],conseils:0,pleinEcran:true,etoiles:{},quete:null,coffres:0,conquis:[],joute:{best:0,n:0},finales:{},duel:null,duels:{v:0,d:0,n:0},duelArchive:null,ouvertures:{},menaces:{ok:0,n:0,vus:[]},jours:{},aides:true,voix:false};}
function migrer(o){
  const d=defauts(),s=Object.assign(d,o&&typeof o==="object"?o:{});
  for(const k of ["hist","vus","aRevoir","reussis","parties","hauts","conquis"])if(!Array.isArray(s[k]))s[k]=[];
  for(const k of ["th","etoiles","finales","ouvertures","jours"])if(!s[k]||typeof s[k]!=="object"||Array.isArray(s[k]))s[k]={};
  if(!s.joute||typeof s.joute!=="object")s.joute={best:0,n:0};
  if(!s.menaces||typeof s.menaces!=="object")s.menaces={ok:0,n:0,vus:[]};
  for(const k of ["ok","n"])if(typeof s.menaces[k]!=="number")s.menaces[k]=0;
  if(!Array.isArray(s.menaces.vus))s.menaces.vus=[];
  if(s.quete&&(typeof s.quete!=="object"||!Array.isArray(s.quete.ids)||!Array.isArray(s.quete.faits)))s.quete=null;
  if(!s.tournoi||typeof s.tournoi!=="object")s.tournoi={};
  if(s.duel&&(typeof s.duel!=="object"||typeof s.duel.code!=="string"))s.duel=null;
  if(!s.duels||typeof s.duels!=="object")s.duels={v:0,d:0,n:0};
  for(const k of ["v","d","n"])if(typeof s.duels[k]!=="number")s.duels[k]=0;
  if(!s.tournoi.bilan||typeof s.tournoi.bilan!=="object")s.tournoi.bilan={};
  if(!("partie" in s.tournoi))s.tournoi.partie=null;
  return s;
}
// Ajout du lot 15 : jours (bilan par jour, pour « Mes progrès »), aides (points des coups possibles), voix (lecture à voix haute).

/* ---------- Famille (lot 15) : plusieurs joueurs sur le même appareil ----------
   Registre « salle-armes-famille » : {profils:[{id,nom,age,adulte,c,e}], dernier, ancien}.
   Chaque joueur a sa sauvegarde sous « salle-armes-v1:<id> ».
   L'ancienne sauvegarde « salle-armes-v1 » (un seul joueur) n'est jamais effacée : quand la famille dit
   à qui elle appartient (ancien), elle est copiée dans la sauvegarde de ce joueur. ancien vaut null si
   personne ne la reprend, et reste absent tant que la question n'a pas été posée. */
const CLE_FAMILLE="salle-armes-famille",CLE_ANCIENNE="salle-armes-v1";
const FAMILLE_DEFAUT=[
  {id:"jf",nom:"Jean-François",age:null,adulte:true,c:"#24427f",e:"K"},
  {id:"eva",nom:"Eva",age:36,adulte:true,c:"#b8343e",e:"Q"},
  {id:"charles",nom:"Charles",age:8,adulte:false,c:"#2f8f5b",e:"N"},
  {id:"gauthier",nom:"Gautier",age:5,adulte:false,c:"#a8772e",e:"R"}];
function lireJSON(k){try{const r=localStorage.getItem(k);return r?JSON.parse(r):null;}catch(e){return null;}}
function ecrireJSON(k,v){try{localStorage.setItem(k,JSON.stringify(v));}catch(e){}}
const FAM=(()=>{const f=lireJSON(CLE_FAMILLE);
  if(f&&Array.isArray(f.profils)&&f.profils.length)return f;
  return {profils:FAMILLE_DEFAUT.map(p=>Object.assign({},p)),dernier:"jf"};})();
function famSave(){ecrireJSON(CLE_FAMILLE,FAM);}
// Correction du prénom (2026-11-26) : « Gautier », sans h. L'identifiant « gauthier » reste, pour garder la sauvegarde.
for(const p of FAM.profils)if(p.id==="gauthier"&&p.nom==="Gauthier"){p.nom="Gautier";famSave();}
function cleProfil(id){return CLE_ANCIENNE+":"+id;}
function ancienneEnAttente(){return !("ancien" in FAM)&&!!lireJSON(CLE_ANCIENNE);}
let ACTIF=null;try{ACTIF=sessionStorage.getItem("salle-armes-actif");}catch(e){}
const PROFIL=FAM.profils.find(p=>p.id===ACTIF)||FAM.profils.find(p=>p.id===FAM.dernier)||FAM.profils[0];
/* Âge → catégorie : « petit » (6 ans et moins), « enfant » (7 à 12 ans), « adulte ». Âge inconnu : enfant. */
function ageCat(p=PROFIL){if(p.adulte)return "adulte";if(!p.age)return "enfant";return p.age<=6?"petit":p.age>=13?"adulte":"enfant";}
/* Règles et exigences selon l'âge.
   themes : thèmes proposés (null = tous) ; cote : cote de départ ; niveaux : adversaires du tournoi ;
   jokers : coups annulables par partie (et à quels niveaux) ; etoiles : étoiles selon le nombre d'indices ;
   aides : points des coups possibles et coups impossibles expliqués ; voix : lecture à voix haute. */
const REGLES={
  petit:{themes:["mat1","prise"],cote:400,debut:"pieces",niveaux:["marmiton","page","ecuyer"],jokers:99,jokersNiv:null,etoiles:()=>3,aides:true,voix:true,
    extras:["pieces","quete","carte"],pendule:false},
  enfant:{themes:null,cote:600,niveaux:null,jokers:3,jokersNiv:["marmiton","page","ecuyer"],etoiles:n=>n<=0?3:n===1?2:1,aides:true,voix:false,
    extras:null,pendule:true},
  adulte:{themes:null,cote:1100,niveaux:["page","ecuyer","chevalier","baron","comte","duc","roi"],jokers:0,jokersNiv:[],etoiles:n=>n<=0?3:1,aides:false,voix:false,
    extras:null,pendule:true}};
function REG(){return REGLES[ageCat()];}
function themePermis(t){const l=REG().themes;return !l||l.includes(t);}
function chargerProfil(id){
  let o=lireJSON(cleProfil(id));
  if(!o&&FAM.ancien===id)o=lireJSON(CLE_ANCIENNE); // reprise de l'ancienne sauvegarde (copie, l'originale reste)
  if(o)return migrer(o);
  const s=defauts(),p=FAM.profils.find(x=>x.id===id)||PROFIL,r=REGLES[ageCat(p)];
  s.nom=p.nom;s.cote=r.cote;s.aides=r.aides;s.voix=r.voix;return s;
}
let S=defauts();
if(!ancienneEnAttente())S=chargerProfil(PROFIL.id);
if(S.nom==="Gauthier")S.nom="Gautier";
function save(){if(ancienneEnAttente())return;ecrireJSON(cleProfil(PROFIL.id),S);}
function gradeDe(xp){let g=GRADES[0],n=null;for(let i=0;i<GRADES.length;i++){if(xp>=GRADES[i][0]){g=GRADES[i];n=GRADES[i+1]||null;}}return[g,n];}
