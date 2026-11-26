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

## Lot 9 — Gameplay ✅ (sauf essai sur tablette)
- ✅ Indice gradué : 1er appui la pièce, 2e la case d'arrivée, 3e la solution. Étoiles par épreuve (3 sans indice, 2 avec un, 1 avec deux) ; XP de 10, 7 ou 5.
- ✅ Quête du jour : 5 épreuves tirées chaque jour (thèmes variés, proches de la cote), puis un coffre (+20 XP et 1 XP par étoile).
- ✅ Carte du royaume : 10 lieux (un par thème) ; un lieu est conquis après 5 épreuves réussies et ouvre le suivant. Toucher un lieu lance son thème.
- ✅ Joute de 3 minutes : un maximum d'épreuves sans indice, record gardé, 2 XP par épreuve.
- ✅ Tournoi : chaque niveau est un chevalier nommé avec blason et phrases (Tristan, Iseult, Perceval, le Baron Noir, le Duc d'Or).
- ✅ Finales à gagner contre Stockfish à pleine force (dame, tour, deux tours, pion), vérifiées par `tools/verifier.js`.
- ✅ Annuler un coup : 3 jokers par partie, contre le Page et l'Écuyer seulement.
- ✅ 5 nouveaux hauts faits ; blason : étoiles, record de joute, lieux conquis. Sauvegarde migrée sans perte (testé avec une sauvegarde du lot 6).
- ✅ Testé dans Chromium : quête complète jusqu'au coffre, carte, joute, jokers, finale gagnée et reprise après rechargement ; tests des lots précédents au vert.
- ⏳ Essai sur la tablette avec l'enfant (réglage des 5 épreuves par lieu, durée de la joute).

## Lot 10 — Rejouer le bon coup ✅ (sauf essai sur tablette)
Demande de Jean-François (2026-11-23) : après une erreur, la flèche verte seule ne suffit pas à comprendre.
- ✅ Salle d'armes : après une erreur ou la solution, l'enfant joue lui-même le coup de la flèche verte ; l'adversaire répond, puis une nouvelle flèche montre le coup suivant, jusqu'à la fin de la ligne. L'explication vient à la fin. Un autre coup est refusé avec un message. (La joute garde l'enchaînement rapide.)
- ✅ Conseil de guerre : l'enfant peut jouer le coup vert (ou toucher « Bon coup ») ; Stockfish montre alors la meilleure réponse de l'adversaire.
- ✅ Corrigé au passage : toucher l'échiquier pendant le conseil ne joue plus de coup dans la partie du tournoi en cours.

## Lot 11 — Coups impossibles expliqués ✅ (sauf essai sur tablette)
Retour de Jean-François (2026-11-23) : « au tournoi, il me bloque des coups ». Vérifié : tout coup légal est accepté (48 coups au hasard joués par l'interface). Les coups refusés sont ceux que les règles interdisent ; ils l'étaient en silence.
- ✅ Chaque coup impossible est expliqué : pièce clouée, roi en échec qu'il faut sauver, case attaquée pour le roi, roque interdit, déplacement de la pièce (partout : salle, tournoi, conseil).
- ✅ Toucher pendant que l'adversaire réfléchit : message « Attends ton tour ».
- ✅ Glisser-déposer au doigt, en plus du toucher case par case.

## Lot 12 — Simulations et équilibrage ✅ (sauf essai avec le joueur)
Demande de Jean-François (2026-11-23) : simuler des centaines de parties et d'épreuves pour trouver bugs, équilibrage et ergonomie.
- ✅ 2 392 épreuves revérifiées par Stockfish (profondeur 12, 3 meilleurs coups) : aucune solution fausse ; 1 épreuve Lichess (LvDjYg) où un autre coup gagne autant que la solution, désormais écartée (`EXCLUS` dans `js/puzzles.js` et dans l'importeur).
- ✅ Les 2 391 épreuves jouées dans le navigateur (bon coup, puis erreur suivie de la correction) : aucune erreur, aucun blocage.
- ✅ Tournoi : 2 000 parties simulées entre niveaux. Avant, chaque niveau battait le précédent 9 fois sur 10 (Page→Écuyer 88 %, Écuyer→Chevalier 91 %, Chevalier→Baron 98 %) : des marches trop hautes. Après réglage (1 000 parties de plus), environ 3 sur 4 entre niveaux voisins pour les quatre premiers. 7 chevaliers : Page, Écuyer, Chevalier, Baron, Comte (Gauvain, nouveau), Duc, Roi (Arthur, nouveau, défi final), et un haut fait « Vainqueur du Roi ».
- ⏳ Constat non corrigé : la promotion se fait toujours en dame (aucun problème n'exige une sous-promotion). Le calibrage réel dépend du niveau de l'enfant : à ajuster après essais.

## Lot 13 — Duel à distance ✅ (sauf essai sur deux vrais téléphones)
Demande de Jean-François (2026-11-23) : jouer père contre fils sur deux téléphones, à distance.
- ✅ Onglet « Duel » (`js/duel.js`) : créer un duel (couleur au choix), envoyer le code de 12 caractères ou le lien, rejoindre en tapant le code. Abandon, revanche en changeant de couleur, partie gardée sur l'appareil et reprise au retour, bilan dans le blason, partie archivée pour le conseil de guerre, 30 XP par victoire.
- ✅ Relais public ntfy.sh sans compte ; coups chiffrés de bout en bout ; le service worker ne met plus en cache les requêtes vers d'autres sites.
- ✅ Testé dans Chromium avec un relais local imitant ntfy : 70 demi-coups entre deux « téléphones », rechargement d'un côté en pleine partie, coupure du relais, abandon, revanche. Envoi et lecture sur le vrai ntfy.sh vérifiés par l'Action « Test du relais du duel ».
- ⏳ Essai réel père et fils (4G et Wi-Fi).

## Lot 14 — Promotion, coups, nulles, ouvertures, pendule, menaces ✅ (sauf essai sur tablette)
Demande de Jean-François (2026-11-24) : points 1 à 6 de la liste proposée, pendule facultative.
- ✅ Promotion au choix (dame, tour, fou, cavalier) : petite fenêtre sur l'échiquier, au tournoi, au duel et dans les épreuves. L'adversaire dit en quoi son pion se change.
- ✅ Liste des coups sous l'échiquier (tournoi et duel), en notation française (R, D, T, F, C) ; toucher un coup montre la position d'alors, toucher l'échiquier ramène à la partie. Les messages des coups passent aussi en notation française.
- ✅ Partie nulle expliquée : écran « Partie nulle » avec la raison (pat, plus assez de pièces, trois fois la même position, 50 coups) et un conseil ; au pat, le roi bloqué brille en jaune.
- ✅ Leçons d'ouvertures (puce « Ouvertures » de la salle) : italienne, espagnole, Londres, gambit dame (blancs) ; déjouer le coup du berger, scandinave, Caro-Kann (noirs). Passe 1 avec flèches et une phrase par coup, passe 2 de mémoire (au plus une erreur) : +15 XP la première fois. Coups vérifiés par `tools/verifier.js`.
- ✅ Pendule facultative (sans, 15, 10 ou 5 min) au tournoi et au duel. Elle ne tourne que quand l'échiquier est à l'écran. Au duel, chaque appareil décompte son temps et l'envoie avec ses coups ; seul celui dont le temps est fini déclare la défaite.
- ✅ « Trouve la menace » (puce de la salle) : dans une position d'épreuve vérifiée, l'enfant touche la pièce adverse qui menace un mat ou une prise gagnante ; deux essais, puis la réponse. 675 positions utilisables (contrôlé par `tools/verifier.js`). Bilan dans le blason.
- ✅ Sauvegarde migrée sans perte (champs `ouvertures`, `menaces`).
- ✅ Testé dans Chromium : promotion en cavalier, revue des coups pendant la réflexion de l'adversaire, temps écoulé, pat, leçon complète avec une erreur, menace trouvée et solution, duel entre deux « téléphones » (relais local) avec pendule, revue et perte au temps ; aucun défilement en 360×660, 800×1280, 1280×800 et 740×330.
- ⏳ Essai sur la tablette ; choix des ouvertures et durée des pendules à ajuster avec le joueur.

## Lot 15 — Profils famille et règles selon l'âge ✅ (sauf essai sur tablette)
Demande de Jean-François (2026-11-26) : un profil par joueur (Jean-François, Eva, Charles, Gautier), suivi des progrès par profil, niveau, règles, exigences et conseils adaptés à l'âge, rendu plus ludique.
- ✅ Écran « Qui joue aujourd'hui ? » à chaque visite (écussons : roi, dame, cavalier, tour) ; écusson du joueur en haut pour changer ; une sauvegarde par joueur.
- ✅ L'ancienne progression est attribuée une fois (question à l'écran) et copiée ; l'originale reste intacte.
- ✅ Règles par âge (`REGLES` dans `js/profile.js`) : petits (Gautier, 5 ans) : mode « Les pièces » (12 étapes, une pièce et des pions à manger), seulement Mat en 1 et Pièce gratuite, indices gratuits, Marmiton (nouvel adversaire très facile), Page et Écuyer, annulation sans limite, pas de pendule, voix qui lit les messages, interface agrandie. Enfants (Charles, 8 ans) : comme avant. Adultes (Jean-François, Eva) : cote de départ 1100, un indice coûte deux étoiles, pas de joker, pas de points des coups possibles ni d'explication des coups impossibles (réglable), consignes techniques.
- ✅ Astuces et explications du mode connecté adaptées à l'âge.
- ✅ « Mes progrès » dans le blason : épreuves des 14 derniers jours, semaine comparée à la précédente, thèmes en progrès, thème à travailler.
- ✅ Habillage : couleur du joueur, onglets avec icônes, parchemin clair pour les enfants, boutons en relief.
- ✅ Testé dans Chromium : attribution de l'ancienne sauvegarde, changement de joueur, première leçon des pièces, adversaires et règles par profil, aucune erreur.
- ⏳ Essai sur la tablette avec chacun ; le Marmiton n'est pas calibré par simulation ; la voix dépend des voix françaises installées sur la tablette.
