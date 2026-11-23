/* Généré par tools/importer-lichess.js — ne pas modifier à la main.
 * Problèmes de la base Lichess (CC0, https://database.lichess.org/#puzzles), cotes 400–1500.
 * Format compact : [id Lichess, thème, cote, FEN, ligne SAN]. Le 1er coup est celui de l'adversaire. */
(function(){const X={"mat1":"Échec et mat ! Le roi adverse n'a plus aucune case pour s'échapper.","mat2":"Le premier coup prépare le piège, le deuxième donne le mat.","fourchette":"Ta pièce a attaqué deux cibles en même temps. L'adversaire ne pouvait en sauver qu'une !","attaqueDouble":"Une seule pièce, deux attaques : l'adversaire ne pouvait pas tout protéger.","prise":"Cette pièce n'était pas assez protégée. Regarde toujours ce qui est gratuit !","enfilade":"Tu as attaqué une grosse pièce. Quand elle s'est écartée, celle de derrière est tombée.","clouage":"La pièce clouée ne pouvait plus bouger sans laisser tomber ce qui était derrière elle.","decouverte":"En bougeant une pièce, tu as ouvert la route d'une autre : c'est une attaque à la découverte !","defense":"Tout semblait perdu, mais tu as trouvé le seul coup qui sauve. Bien défendu !","finale":"En finale, chaque pion compte. Tu as trouvé le coup précis."};
const D=[

];
for(const d of D)P.push({id:"L"+d[0],t:d[1],r:d[2],fen:d[3],line:d[4].split(" "),x:X[d[1]],a:1});})();
