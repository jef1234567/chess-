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

## Lot 3 — Le tournoi ✅ (sauf essai sur tablette)
- ✅ Onglet « Tournoi » : partie contre Stockfish 19 lite (WebAssembly, un seul fil, 1,8 Mo, hors ligne) dans un Web Worker. Projet passé sous GPL-3 (choix de Jean-François, 23/11/2026).
- ✅ Niveaux Page, Écuyer, Chevalier, Baron, Duc : « Skill Level », profondeur et part de coups au hasard (réglages de départ, à ajuster avec le joueur).
- ✅ L'adversaire commente brièvement ses coups (prises, échecs, roque, et réaction quand l'évaluation bascule).
- ✅ Partie en cours gardée sur l'appareil et reprise au retour ; bilan par niveau dans le blason ; XP pour victoires et nulles.
- ✅ Testé dans Chromium : partie complète jusqu'au mat (90 demi-coups), réponse de l'adversaire en moins de 0,7 s (Page) et 1 s (Duc), reprise après rechargement, changement d'onglet en pleine réflexion.
- ⏳ Essai sur la tablette ; calibrage des niveaux avec le joueur.
- Terminé quand : une partie complète se joue sur la tablette sans saccade.

## Lot 4 — Le conseil de guerre ✅ (sauf essai sur tablette)
- ✅ Débrief hors ligne (`js/conseil.js`) : Stockfish à pleine force (profondeur 12) évalue chaque coup du joueur ; les 3 coups qui ont fait perdre le plus (au moins 1,2 pion) sont rejoués avec la flèche rouge (ton coup), la flèche verte (le meilleur) et une phrase simple (mat manqué, pièce laissée en prise, prise oubliée, échec possible).
- ✅ Bouton « Montre le bon coup » qui joue le meilleur coup sur l'échiquier.
- ✅ Les 20 dernières parties sont gardées dans le blason (« Mes parties ») avec un bouton « Conseil » ; sauvegarde migrée sans perte.
- ✅ Testé dans Chromium : mat manqué bien repéré ; partie de 80 demi-coups analysée en 3 s avec un processeur ralenti 4 fois.
- ⏳ Essai sur la tablette.

## Lot 5 — Mode connecté ✅ (sauf essai avec une vraie clé)
- ✅ Bouton « Explique-moi » après une épreuve ratée ou la solution, et sur chaque coup clé du conseil de guerre (`js/connecte.js`). Le maître d'armes répond en 3 phrases au plus, en s'appuyant sur les coups donnés par le moteur ou la solution.
- ✅ Clé saisie dans le blason, gardée sur l'appareil (clé `salle-armes-cle`, hors de la sauvegarde), bouton « Oublier la clé ». Sans clé ou sans réseau, les boutons restent cachés.
- ✅ Modèle `claude-opus-5-5`, effort bas, repli automatique en cas de refus ; appel direct depuis le navigateur (CORS vérifié). Environ 1 centime par explication (estimation).
- ✅ Testé dans Chromium avec une API simulée : requête, affichage (texte échappé), clé refusée, oubli de la clé.
- ⏳ Essai avec une vraie clé (Jean-François).

## Lot 6 — Habillage 🔄
- ✅ Pièces illustrées libres : jeux « Fantaisie » et « Celtiques » de Maurizio Monge ([chess-art](https://github.com/maurimo/chess-art), licence MIT vérifiée, fichiers tirés du dépôt de Lichess), plus les pièces classiques d'origine. Choix dans le blason.
- ✅ Sons : échec (trompette brève) et fanfare de haut fait, en plus des sons existants ; tous synthétisés, aucun fichier.
- ✅ Récompenses : 14 hauts faits (séries, mats, thèmes, grades, victoires au tournoi, conseil de guerre). Certains débloquent les pièces Celtiques et les échiquiers Forêt, Sable et Or royal.
- ⏳ Test réel avec l'enfant sur la Samsung (Jean-François, après publication) : fluidité, force des niveaux du tournoi, goût pour les pièces et les récompenses.

## Lot 7 — Plein écran ✅ (sauf essai sur tablette)
- ✅ L'appli tient dans la hauteur de l'écran : plus de défilement dans la Salle, le Tournoi et le Conseil ; le Blason défile seul.
- ✅ L'échiquier est le plus grand carré qui tient (requêtes de conteneur CSS) ; en-tête, thèmes, mission, parchemin et boutons réduits.
- ✅ Paysage : échiquier à gauche, texte et boutons à droite.
- ✅ Testé dans Chromium : tablette 800×1280 et 1280×800 (avec et sans barre de Chrome), téléphone 360×660 et 740×330 ; aucun défilement, échiquier de 745 px en portrait tablette.
- ⏳ Essai sur la tablette.

## Lot 8 — Graphisme et animations ✅ (sauf essai sur tablette)
Plan validé par Jean-François le 2026-11-23 (« je veux tout faire ») ; style « livre illustré » choisi par Claude, modifiable.
- ✅ Décor : mur de pierre éclairé par des torches, échiquier en bois sculpté avec filet doré, cases légèrement texturées.
- ✅ Coups : la pièce se lève, file en arc, se pose avec un rebond et un nuage de poussière ; le roque fait glisser la tour.
- ✅ Prise : la pièce prise éclate en éclats et étincelles, l'échiquier encaisse le choc.
- ✅ Échec : lueur rouge qui pulse sous le roi menacé. Mat : le roi vaincu bascule ; confettis aux couleurs du blason pour une victoire.
- ✅ Réussite : sceau de cire qui s'imprime, XP qui vole vers la barre. Montée de grade : écran d'adoubement (épée, nouveau titre en lettres d'or, grand cor).
- ✅ Indice : la case scintille ; flèches tracées progressivement.
- ✅ Sons plus riches, toujours synthétisés : bois posé, choc d'épées, trompette d'échec, cor de victoire.
- ✅ Vrai plein écran : appli installée en plein écran (manifeste), et dans Chrome au premier toucher ; réglage « Plein écran » dans le blason.
- ✅ Tout est coupé si l'appareil demande moins d'animations (vérifié : aucune animation ni particule).
- ✅ Testé dans Chromium : 60 images par seconde pendant une prise avec confettis, processeur ralenti 4 fois ; mise en page du lot 7 inchangée ; tests des lots 2, 4 et 6 au vert.
- ⏳ Essai sur la tablette.
