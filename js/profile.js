/* Profil du joueur : grades et sauvegarde sur l'appareil (localStorage, clé salle-armes-v1). */
const GRADES=[[0,"Page"],[50,"Écuyer"],[150,"Chevalier"],[300,"Chevalier banneret"],[500,"Baron"],[800,"Comte"],[1200,"Duc"]];

/* ---------- Sauvegarde (sur cet appareil) ---------- */
const DEF={nom:"",xp:0,cote:600,serie:0,best:0,reussi:0,th:{},hist:[],vus:[],son:true};
let S=Object.assign({},DEF);
try{const raw=localStorage.getItem("salle-armes-v1");if(raw)S=Object.assign({},DEF,JSON.parse(raw));}catch(e){}
function save(){try{localStorage.setItem("salle-armes-v1",JSON.stringify(S));}catch(e){}}
function gradeDe(xp){let g=GRADES[0],n=null;for(let i=0;i<GRADES.length;i++){if(xp>=GRADES[i][0]){g=GRADES[i];n=GRADES[i+1]||null;}}return[g,n];}
