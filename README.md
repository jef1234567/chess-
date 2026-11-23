# La Salle d'armes

Web app d'entraînement aux échecs pour enfants, univers chevaliers. Fonctionne hors ligne une fois installée.

- Épreuves par thème : mat en 1, mat en 2, fourchette, pièce gratuite, enfilade, clouage
- Indices, correction animée, difficulté qui s'adapte (cote d'armes)
- Blason : grades de Page à Duc, maîtrise par thème, historique (sauvegardé sur l'appareil)

## Installer sur la tablette
Ouvrir l'adresse GitHub Pages dans Chrome, menu ⋮ puis « Ajouter à l'écran d'accueil ».

## Vérifier les problèmes
`node tools/verifier.js` contrôle chaque épreuve (position légale, ligne jouable, mat réel ou gain matériel). `node tools/verifier-cache.js` contrôle que `sw.js` liste toutes les ressources. Les deux tournent automatiquement sur GitHub à chaque envoi.

Règles du jeu : [chess.js](https://github.com/jhlywa/chess.js) (BSD-2). Polices : Uncial Antiqua, Nunito, Noto Sans Symbols 2 (SIL OFL).
