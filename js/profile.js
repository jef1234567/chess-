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
// Les anciennes données sont gardées telles quelles ; les champs absents prennent leur valeur par défaut.
function defauts(){return {nom:"",xp:0,cote:600,serie:0,best:0,reussi:0,th:{},hist:[],vus:[],son:true,aRevoir:[],reussis:[],tournoi:{partie:null,bilan:{}},parties:[],pieces:"fantasy",plateau:"nuit",hauts:[],conseils:0,pleinEcran:true,etoiles:{},quete:null,coffres:0,conquis:[],joute:{best:0,n:0},finales:{}};}
function migrer(o){
  const d=defauts(),s=Object.assign(d,o&&typeof o==="object"?o:{});
  for(const k of ["hist","vus","aRevoir","reussis","parties","hauts","conquis"])if(!Array.isArray(s[k]))s[k]=[];
  for(const k of ["th","etoiles","finales"])if(!s[k]||typeof s[k]!=="object"||Array.isArray(s[k]))s[k]={};
  if(!s.joute||typeof s.joute!=="object")s.joute={best:0,n:0};
  if(s.quete&&(typeof s.quete!=="object"||!Array.isArray(s.quete.ids)||!Array.isArray(s.quete.faits)))s.quete=null;
  if(!s.tournoi||typeof s.tournoi!=="object")s.tournoi={};
  if(!s.tournoi.bilan||typeof s.tournoi.bilan!=="object")s.tournoi.bilan={};
  if(!("partie" in s.tournoi))s.tournoi.partie=null;
  return s;
}
let S=defauts();
try{const raw=localStorage.getItem("salle-armes-v1");if(raw)S=migrer(JSON.parse(raw));}catch(e){}
function save(){try{localStorage.setItem("salle-armes-v1",JSON.stringify(S));}catch(e){}}
function gradeDe(xp){let g=GRADES[0],n=null;for(let i=0;i<GRADES.length;i++){if(xp>=GRADES[i][0]){g=GRADES[i];n=GRADES[i+1]||null;}}return[g,n];}
