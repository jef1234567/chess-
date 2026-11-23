# La Salle d'armes — règles du projet

Jeu d'échecs d'entraînement pour un enfant de 8 ans qui joue déjà relativement bien. Univers chevaliers. Web app installable (PWA), hors ligne d'abord.

## Public et ton
- Joueur : enfant de 8 ans, lecteur. Phrases courtes, vocabulaire simple, tutoiement, ton encourageant.
- Toute l'interface est en français.
- Univers : chevaliers (grades Page → Duc, salle d'armes, tournoi, conseil de guerre, blason).

## Cibles techniques
- Appareil principal : tablette Samsung Android (achetée vers 2022), Chrome. Test de développement : smartphone Android.
- L'iPad 1re génération n'est PAS une cible.
- Hors ligne obligatoire pour tout sauf le mode connecté (lot 5). Aucun appel réseau dans les autres lots.
- Pas de framework, pas d'étape de build : HTML, CSS et JavaScript simples servis tels quels par GitHub Pages.
- Toute ressource (police, script, image, son) est dans le dépôt et listée dans `sw.js`. Changer `V` dans `sw.js` à chaque version.

## Architecture
- `index.html` : squelette de la page ; charge `css/app.css` puis les scripts dans l'ordre ci-dessous (scripts classiques, sans module ni build).
- `js/puzzles.js` (thèmes, problèmes faits main), `js/lichess.js` (problèmes Lichess, généré par `tools/importer-lichess.js` via `.github/workflows/import-lichess.yml`, ne pas modifier à la main), `js/profile.js` (grades, sauvegarde), `js/sound.js` (sons), `js/board.js` (échiquier, animations), `js/app.js` (logique d'épreuve, blason, interface).
- `tools/verif-lib.js` : règles de vérification partagées ; `tools/verifier.js` : vérification des problèmes ; `tools/verifier-cache.js` : contrôle de la liste de `sw.js`. Lancés par `.github/workflows/verifier.yml`.
- `chess.js` : règles du jeu (chess.js 0.10.3, BSD-2), ne pas modifier.
- `sw.js` + `manifest.webmanifest` : installation et cache hors ligne.
- `fonts/`, `icons/` : ressources locales.

## Règles de travail
- Une branche par lot (`lot-1-socle`, …), fusion dans `main` après vérification.
- Chaque problème d'échecs ajouté doit être vérifié automatiquement (position légale, ligne jouable, mat réel pour les thèmes de mat, gain matériel pour les autres).
- Progression enregistrée dans `localStorage` (clé `salle-armes-v1`) ; toute évolution du format doit migrer les anciennes données, jamais les effacer.
- Animations fluides sur tablette milieu de gamme ; respecter `prefers-reduced-motion`.
- Ressources tierces : licence libre vérifiée et citée dans le README.
- Clé d'API (lot 5) : saisie par l'utilisateur, stockée sur l'appareil, jamais dans le dépôt.

## Suivi
L'état des lots est dans `ROADMAP.md`. Le mettre à jour à la fin de chaque séance.
