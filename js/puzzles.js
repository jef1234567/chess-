/* Épreuves : thèmes et problèmes. Chaque problème est vérifié par tools/verifier.js. */
// Épreuves écartées par la vérification Stockfish (lot 12) : un autre coup gagne autant que la solution.
const EXCLUS=["LvDjYg"];
const THEMES={mat1:"Mat en 1",mat2:"Mat en 2",fourchette:"Fourchette",prise:"Pièce gratuite",enfilade:"Enfilade",clouage:"Clouage",attaqueDouble:"Attaque double",decouverte:"Découverte",defense:"Défense",finale:"Finale"};
const P=[
{id:"m1",t:"mat1",r:500,fen:"6k1/5ppp/8/8/8/8/5PPP/3R2K1 w - - 0 1",line:["Rd8#"],x:"La tour donne échec sur la dernière rangée et les pions noirs bouchent la sortie du roi : c'est le mat du couloir."},
{id:"m2",t:"mat1",r:450,fen:"k7/8/1K6/8/8/8/7Q/8 w - - 0 1",line:["Qh8#"],x:"Ton roi garde les cases a7, b7 et c7. La dame n'a plus qu'à donner échec sur la 8e rangée."},
{id:"m3",t:"mat1",r:750,fen:"6rk/6pp/8/6N1/8/8/8/6K1 w - - 0 1",line:["Nf7#"],x:"Mat à l'étouffée : le roi noir est enfermé par ses propres pièces, et le cavalier saute par-dessus tout le monde."},
{id:"m4",t:"mat1",r:500,fen:"3r2k1/5ppp/8/8/8/8/5PPP/6K1 b - - 0 1",line:["Rd1#"],x:"Même piège de l'autre côté : le roi blanc est prisonnier de ses pions, la tour noire frappe en d1."},
{id:"m5",t:"mat1",r:550,fen:"r1bqkbnr/pppp1ppp/2n5/4p3/2B1P3/5Q2/PPPP1PPP/RNB1K1NR w KQkq - 0 1",line:["Qxf7#"],x:"Le coup du berger : f7 n'est défendue que par le roi, et ton fou protège la dame. Le roi ne peut pas la prendre."},
{id:"m6",t:"mat1",r:450,fen:"rnbqkbnr/pppp1ppp/8/4p3/6P1/5P2/PPPPP2P/RNBQKBNR b KQkq - 0 1",line:["Qh4#"],x:"Les blancs ont ouvert la diagonale de leur roi. La dame noire s'y glisse : c'est le mat le plus rapide du jeu !"},
{id:"m7",t:"mat1",r:600,fen:"4r1k1/5ppp/8/8/8/8/5PPP/3RR1K1 w - - 0 1",line:["Rxe8#"],x:"La tour noire était la seule gardienne de la 8e rangée. En la prenant, tu donnes échec et le roi reste coincé."},
{id:"m8",t:"mat1",r:800,fen:"6k1/5p1p/6pB/8/8/8/8/3Q2K1 w - - 0 1",line:["Qd8#"],x:"Le fou en h6 surveille f8 et g7. La dame descend en d8 et le roi n'a plus aucune case."},
{id:"m9",t:"mat1",r:700,fen:"6k1/8/8/8/5n2/6q1/7P/7K b - - 0 1",line:["Qg2#"],x:"Le cavalier f4 protège la dame : le roi blanc ne peut pas la prendre en g2. (Dame e1 marchait aussi !)"},
{id:"m10",t:"mat1",r:500,fen:"7k/8/6K1/8/8/8/Q7/8 w - - 0 1",line:["Qa8#"],x:"Ton roi enferme le roi noir dans le coin, ta dame porte le coup final."},
{id:"f1",t:"fourchette",r:700,fen:"r3k3/8/8/1N6/1K6/8/8/8 w - - 0 1",line:["Nc7+"],x:"Le cavalier attaque le roi ET la tour en même temps. Le roi doit fuir, la tour tombe au coup suivant."},
{id:"f2",t:"fourchette",r:800,fen:"3q4/6k1/8/8/3N4/8/8/4K3 w - - 0 1",line:["Ne6+"],x:"Échec au roi et attaque sur la dame : une fourchette royale ! La dame est perdue."},
{id:"h1",t:"prise",r:400,fen:"4k3/8/8/8/3q4/8/1B6/4K3 w - - 0 1",line:["Bxd4"],x:"La dame noire n'était défendue par personne. Avant tout, regarde toujours ce qui est gratuit !"},
{id:"h2",t:"prise",r:420,fen:"4k3/1r6/8/8/8/8/1Q6/4K3 b - - 0 1",line:["Rxb2"],x:"La dame blanche est seule sur la colonne b : ta tour la prend sans danger."},
{id:"s1",t:"enfilade",r:950,fen:"4q3/8/8/4k3/8/8/8/R6K w - - 0 1",line:["Re1+"],x:"Une enfilade : la tour attaque le roi, il doit s'écarter de la colonne, et la dame cachée derrière lui tombe."},
{id:"p1",t:"clouage",r:1000,fen:"4k3/8/2q5/8/P7/8/8/4KB2 w - - 0 1",line:["Bb5"],x:"Le fou cloue la dame contre son roi : elle ne peut plus bouger. Si elle prend le fou, ton pion a4 la reprend."},
{id:"d1",t:"mat2",r:950,fen:"6k1/8/8/8/8/8/R7/1R4K1 w - - 0 1",line:["Ra7","Kf8","Rb8#"],x:"L'escalier des tours : une tour ferme la 7e rangée, l'autre donne mat sur la 8e."},
{id:"d2",t:"mat2",r:1050,fen:"7k/8/8/6K1/8/8/8/R7 w - - 0 1",line:["Kg6","Kg8","Ra8#"],x:"Le roi est aussi un guerrier : il s'approche pour garder les cases de fuite, puis la tour donne mat."},
{id:"d3",t:"mat2",r:1100,fen:"k7/8/2K5/8/8/8/8/1R6 w - - 0 1",line:["Kc7","Ka7","Ra1#"],x:"Ton roi verrouille b7 et b8. Le roi noir n'a plus que a7, et la tour l'attend sur la colonne a."}
];

/* Finales à gagner contre Stockfish (tournoi). Les blancs (le joueur) gagnent avec le bon plan ;
   vérifiées par tools/verifier.js : position légale, trait aux blancs, roi noir seul. */
const FINALES=[
{k:"dame",nom:"Roi et dame contre roi",fen:"8/8/8/4k3/8/8/8/3QK3 w - - 0 1",x:"Avec ta dame, pousse le roi noir vers un bord. Approche ton roi, puis donne le mat. Attention au pat !"},
{k:"tour",nom:"Roi et tour contre roi",fen:"8/8/8/4k3/8/8/8/R3K3 w - - 0 1",x:"La tour coupe le roi noir rangée par rangée. Ton roi doit venir l'aider."},
{k:"tours",nom:"Deux tours contre roi",fen:"8/8/8/3k4/8/8/8/R3K2R w - - 0 1",x:"L'escalier : une tour coupe la route, l'autre donne échec, et on recommence jusqu'au bord."},
{k:"pion",nom:"Roi et pion contre roi",fen:"4k3/8/4K3/4P3/8/8/8/8 w - - 0 1",x:"Ton roi marche devant ton pion pour lui ouvrir la route jusqu'à la promotion."}
];

/* Leçons d'ouvertures (lot 14). l : coups en SAN depuis la position de départ, avec une phrase chacun.
   camp : le côté joué par l'enfant. Vérifiées par tools/verifier.js (chaque coup est légal). */
const OUVERTURES=[
{k:"italienne",nom:"La partie italienne",camp:"w",x:"On sort vite les pièces, et le fou vise f7.",l:[
 ["e4","Le pion prend le centre et ouvre la route à ta dame et à ton fou."],
 ["e5","Les noirs prennent aussi leur part du centre."],
 ["Nf3","Le cavalier sort et attaque le pion e5."],
 ["Nc6","Le cavalier noir défend son pion."],
 ["Bc4","Le fou vise f7, la case faible à côté du roi noir."],
 ["Bc5","Les noirs font pareil : leur fou vise f2."],
 ["c3","Ce petit pion prépare d4, pour avoir deux pions au centre."],
 ["Nf6","Le cavalier noir sort et attaque ton pion e4."],
 ["d4","Deux pions au centre ! Tes pièces ont de la place. Ensuite : le roque."]]},
{k:"espagnole",nom:"La partie espagnole",camp:"w",x:"Le fou attaque le cavalier qui défend le centre.",l:[
 ["e4","Le pion prend le centre."],
 ["e5","Les noirs répondent au centre."],
 ["Nf3","Le cavalier attaque e5."],
 ["Nc6","Le cavalier noir le défend."],
 ["Bb5","Le fou attaque le cavalier qui défend e5."],
 ["a6","Les noirs chassent le fou avec un pion."],
 ["Ba4","Le fou recule, mais il garde l'œil sur le cavalier."],
 ["Nf6","Le cavalier noir sort et attaque e4."],
 ["O-O","Le roque : ton roi est à l'abri, et ta tour va pouvoir aider au centre."]]},
{k:"londres",nom:"Le système de Londres",camp:"w",x:"Un plan simple et solide, presque toujours le même.",l:[
 ["d4","Le pion de la dame prend le centre."],
 ["d5","Les noirs bloquent ton pion."],
 ["Bf4","Le fou sort tout de suite, avant que le pion e3 lui ferme la route."],
 ["Nf6","Le cavalier noir sort."],
 ["e3","Ce pion soutient d4 et ouvre la route à ton autre fou."],
 ["e6","Les noirs ouvrent la route de leur fou."],
 ["Nf3","Ton cavalier sort vers le centre."],
 ["c5","Les noirs attaquent ton pion d4."],
 ["c3","Le pion c3 soutient d4 : ton centre tient bon."],
 ["Nc6","Les noirs attaquent encore d4."],
 ["Nbd2","Ton dernier cavalier sort. Ensuite : le fou en d3 et le roque."]]},
{k:"gambit",nom:"Le gambit dame",camp:"w",x:"Tu offres un pion pour attirer un pion noir loin du centre.",l:[
 ["d4","Le pion prend le centre."],
 ["d5","Les noirs bloquent."],
 ["c4","Tu offres ton pion c4 : si les noirs le prennent, ton pion e4 viendra au centre."],
 ["e6","Les noirs refusent et soutiennent leur pion d5."],
 ["Nc3","Le cavalier attaque d5 une fois de plus."],
 ["Nf6","Le cavalier noir défend d5."],
 ["Bg5","Le fou cloue le cavalier : s'il bouge, la dame noire est prise."],
 ["Be7","Le fou noir se met devant la dame : le clouage est fini."],
 ["e3","Ce pion ouvre la route à ton fou f1. Ensuite : le cavalier en f3 et le roque."]]},
{k:"berger",nom:"Déjouer le coup du berger",camp:"b",x:"Le piège le plus connu des débutants. Apprends à le déjouer !",l:[
 ["e4","Les blancs prennent le centre."],
 ["e5","Toi aussi, tu prends le centre."],
 ["Bc4","Le fou blanc vise f7…"],
 ["Nc6","Tu sors un cavalier, qui défend aussi e5."],
 ["Qh5","Attention ! La dame et le fou visent f7 : les blancs menacent la dame en f7, échec et mat !"],
 ["g6","Le pion chasse la dame et ferme sa route vers f7."],
 ["Qf3","La dame revient viser f7 par un autre chemin !"],
 ["Nf6","Ton cavalier bouche la route de la dame. f7 est sauvé, et tu as sorti une pièce de plus !"]]},
{k:"scandinave",nom:"La défense scandinave",camp:"b",x:"Avec les noirs, tu attaques le pion e4 dès le premier coup.",l:[
 ["e4","Les blancs prennent le centre."],
 ["d5","Tu attaques tout de suite le pion e4."],
 ["exd5","Les blancs prennent ton pion."],
 ["Qxd5","Ta dame reprend : la voilà au centre."],
 ["Nc3","Le cavalier blanc attaque ta dame."],
 ["Qa5","Ta dame se met à l'abri sur le côté, sur une case qu'aucune pièce n'attaque."],
 ["d4","Les blancs prennent le centre."],
 ["Nf6","Ton cavalier sort."],
 ["Nf3","Le cavalier blanc sort aussi."],
 ["c6","Ce pion donne une case de repli à ta dame. Ensuite : ton fou en f5, e6 et le roque."]]},
{k:"carokann",nom:"La défense Caro-Kann",camp:"b",x:"Une défense solide : on prépare d5 avec un petit pion.",l:[
 ["e4","Les blancs prennent le centre."],
 ["c6","Ce petit pion prépare d5."],
 ["d4","Les blancs mettent un deuxième pion au centre."],
 ["d5","Tu attaques e4, et ton pion d5 est soutenu par c6."],
 ["Nc3","Le cavalier blanc défend e4."],
 ["dxe4","Tu prends le pion."],
 ["Nxe4","Le cavalier blanc reprend."],
 ["Bf5","Ton fou sort et chasse le cavalier."],
 ["Ng3","Le cavalier attaque ton fou."],
 ["Bg6","Le fou recule, mais il reste bien placé. Ta position est solide !"]]},
];

/* Mode « Trouve la menace » (lot 14) : dans une position où l'enfant a le trait, que menace l'adversaire
   s'il pouvait jouer ? On le fait jouer « à la place » (trait inversé) et on garde :
   - un échec et mat ;
   - une prise qui gagne au moins 2 points (pièce non défendue, ou plus forte que celle qui prend).
   Renvoie [{from,to,piece,captured,mat,defendu}]. Les positions viennent des épreuves vérifiées. */
function menacesDe(fen){
  const V={p:1,n:3,b:3,r:5,q:9,k:0};
  const g=new Chess(fen);if(g.in_check()||g.game_over())return [];
  const f=fen.split(" ");f[1]=f[1]==="w"?"b":"w";f[3]="-";
  const h=new Chess();if(!h.load(f.join(" ")))return [];
  const res=[];
  for(const m of h.moves({verbose:true})){
    h.move(m);
    if(h.in_checkmate())res.push({from:m.from,to:m.to,piece:m.piece,mat:true});
    else if(m.captured){const defendu=h.moves({verbose:true}).some(r=>r.to===m.to);
      if(V[m.captured]-(defendu?V[m.piece]:0)>=2)res.push({from:m.from,to:m.to,piece:m.piece,captured:m.captured,defendu});}
    h.undo();
  }
  return res;
}
// Position de départ d'une épreuve, du point de vue du joueur (après le coup adverse automatique).
function fenJoueur(p){if(!p.a)return p.fen;const g=new Chess(p.fen);g.move(p.line[0]);return g.fen();}
