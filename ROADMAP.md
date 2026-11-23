# Feuille de route

Légende : ✅ fait · 🔄 en cours · ⏳ à faire

## Lot 0 — Prototype ✅
- Salle d'armes : 19 épreuves vérifiées (mat en 1, mat en 2, fourchette, pièce gratuite, enfilade, clouage), indices, correction par flèche, cote adaptative, blason et grades.
- Web app hors ligne (manifeste, service worker, polices locales).

## Lot 1 — Socle 🔄 (code fusionné ; reste la publication)
- ✅ `index.html` découpé en modules : `js/puzzles.js`, `js/profile.js`, `js/sound.js`, `js/board.js`, `js/app.js`, `css/app.css`.
- ✅ Script de vérification des problèmes (`tools/verifier.js`, Node + chess.js) et GitHub Action qui le lance à chaque envoi, avec le contrôle du cache hors ligne (`tools/verifier-cache.js`).
- ✅ Corrections trouvées en route : les pièces ne s'affichaient pas (chess.js 0.10.3 ne donne pas la case dans `board()`) ; positions illégales dans m2 et m10 (roi noir déjà en échec) ; f1 ne gagnait que la qualité (cavalier piégé en a8), roi blanc rapproché.
- ⏳ Publication GitHub Pages. **Action de Jean-François** : passer le dépôt en public puis activer Pages (branche `main`, dossier racine) depuis un ordinateur.
- Terminé quand : l'appli tourne sur `jef1234567.github.io/chess-/`, s'installe sur la tablette et la vérification passe au vert.

## Lot 2 — Salle d'armes v2 ✅ (sauf essai sur tablette)
- ✅ Import de la base libre Lichess (CC0) : `tools/importer-lichess.js`, lancé par la GitHub Action « Import Lichess » (le réseau des sessions Claude ne joint pas database.lichess.org). Filtre : cotes 400–1500, problèmes populaires et bien notés, au plus 3 coups du joueur, tirage stable par tranche de 100 points de cote.
- ✅ Les problèmes importés commencent par le coup de l'adversaire, joué automatiquement ; lignes de plusieurs coups gérées.
- ✅ Révision ciblée : une épreuve ratée revient plus tard, les thèmes les moins réussis sortent plus souvent, les épreuves déjà réussies passent après les nouvelles. Sauvegarde migrée sans perte (champs `aRevoir`, `reussis`).
- ✅ Nouveaux thèmes : attaque double, découverte, défense, finales (pions et tours).
- ✅ 2 373 problèmes Lichess importés et vérifiés (2 392 au total). Chargement mesuré à 0,5 s avec un processeur ralenti 6 fois ; 40 problèmes tirés au hasard résolus par l'interface.
- ⏳ Confirmer la fluidité sur la vraie tablette (après publication).
- Terminé quand : au moins 2 000 problèmes vérifiés, chargés hors ligne sans ralentir la tablette.

## Lot 3 — Le tournoi ⏳
- Partie contre Stockfish (version WebAssembly, hors ligne) à niveaux nommés : Page, Écuyer, Chevalier, Baron, Duc.
- Adversaire qui commente brièvement ses coups.
- Terminé quand : une partie complète se joue sur la tablette sans saccade.

## Lot 4 — Le conseil de guerre ⏳
- Débrief hors ligne : le moteur repère les 2 ou 3 coups clés, les rejoue avec la flèche du meilleur coup et une phrase simple.
- Parties sauvegardées dans le blason.

## Lot 5 — Mode connecté ⏳
- Explications par l'API Claude, en mots d'enfant, sur le débrief et les épreuves ratées.
- Clé saisie dans les réglages, stockée sur l'appareil ; l'appli reste pleinement utilisable sans réseau.

## Lot 6 — Habillage ⏳
- Pièces illustrées : jeu libre existant (licence vérifiée), pas de création sur mesure.
- Sons, récompenses à débloquer, test réel avec l'enfant sur la Samsung.
