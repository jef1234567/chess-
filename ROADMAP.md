# Feuille de route

Légende : ✅ fait · 🔄 en cours · ⏳ à faire

## Lot 0 — Prototype ✅
- Salle d'armes : 19 épreuves vérifiées (mat en 1, mat en 2, fourchette, pièce gratuite, enfilade, clouage), indices, correction par flèche, cote adaptative, blason et grades.
- Web app hors ligne (manifeste, service worker, polices locales).

## Lot 1 — Socle 🔄
- ✅ `index.html` découpé en modules : `js/puzzles.js`, `js/profile.js`, `js/sound.js`, `js/board.js`, `js/app.js`, `css/app.css`.
- ✅ Script de vérification des problèmes (`tools/verifier.js`, Node + chess.js) et GitHub Action qui le lance à chaque envoi, avec le contrôle du cache hors ligne (`tools/verifier-cache.js`).
- ✅ Corrections trouvées en route : les pièces ne s'affichaient pas (chess.js 0.10.3 ne donne pas la case dans `board()`) ; positions illégales dans m2 et m10 (roi noir déjà en échec) ; f1 ne gagnait que la qualité (cavalier piégé en a8), roi blanc rapproché.
- ⏳ Publication GitHub Pages. **Action de Jean-François** : passer le dépôt en public puis activer Pages (branche `main`, dossier racine) depuis un ordinateur.
- Terminé quand : l'appli tourne sur `jef1234567.github.io/chess-/`, s'installe sur la tablette et la vérification passe au vert.

## Lot 2 — Salle d'armes v2 ⏳
- Import de quelques milliers de problèmes de la base libre Lichess (CC0), filtrés par thème et par cote adaptée à un enfant.
- Révision ciblée : les thèmes ratés reviennent plus souvent.
- Nouveaux thèmes : attaque double, découverte, défense, finales simples.
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
