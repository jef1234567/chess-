# La Salle d'armes

Web app d'entraînement aux échecs pour enfants, univers chevaliers. Fonctionne hors ligne une fois installée.

- Épreuves par thème : mat en 1, mat en 2, fourchette, attaque double, pièce gratuite, enfilade, clouage, découverte, défense, finale
- Révision : les épreuves ratées reviennent, les thèmes difficiles sortent plus souvent
- Indices, correction animée, difficulté qui s'adapte (cote d'armes)
- Tournoi : partie contre Stockfish, du Page au Duc, avec un adversaire qui commente ses coups
- Conseil de guerre : après la partie, les coups clés rejoués avec la flèche du meilleur coup
- Mode connecté (facultatif) : avec une clé d'API Claude saisie dans le blason, le maître d'armes explique les erreurs en mots d'enfant
- Hauts faits qui débloquent des jeux de pièces et des échiquiers
- Étoiles, quête du jour avec son coffre, carte du royaume à conquérir, joute de 3 minutes
- Tournoi contre des chevaliers nommés, finales à gagner, jokers pour annuler un coup (Page et Écuyer)
- Blason : grades de Page à Duc, maîtrise par thème, historique (sauvegardé sur l'appareil)

## Installer sur la tablette
Ouvrir l'adresse GitHub Pages dans Chrome, menu ⋮ puis « Ajouter à l'écran d'accueil ».

## Vérifier les problèmes
`node tools/verifier.js` contrôle chaque épreuve (position légale, ligne jouable, mat réel ou gain matériel). `node tools/verifier-cache.js` contrôle que `sw.js` liste toutes les ressources. Les deux tournent automatiquement sur GitHub à chaque envoi.

Problèmes : en plus des épreuves faites main, une sélection de la [base de problèmes Lichess](https://database.lichess.org/#puzzles) (CC0, domaine public), importée par `tools/importer-lichess.js`.

Pièces illustrées : jeux « fantasy » et « celtic » de Maurizio Monge ([chess-art](https://github.com/maurimo/chess-art), licence MIT, texte dans `pieces/LICENSE-chess-art.txt`), récupérés depuis le dépôt de Lichess.

Moteur : [Stockfish.js](https://github.com/nmrugg/stockfish.js) 19 lite (GPL-3), basé sur [Stockfish](https://github.com/official-stockfish/Stockfish).

Règles du jeu : [chess.js](https://github.com/jhlywa/chess.js) (BSD-2). Polices : Uncial Antiqua, Nunito, Noto Sans Symbols 2 (SIL OFL).

## Duel à distance
L'onglet « Duel » permet de jouer à deux sur deux appareils. L'un crée le duel et envoie le code (ou le lien) à l'autre, qui le tape dans « Rejoindre ».
- Aucun compte à créer, aucun serveur à nous : les messages passent par le relais public gratuit [ntfy.sh](https://ntfy.sh) (logiciel libre, Apache-2.0/GPL-2), sans compte.
- Seuls les coups et le nom de chevalier sont envoyés, chiffrés de bout en bout (AES-GCM, clé tirée du code, jamais envoyée). Le relais voit l'adresse IP des appareils et l'heure des messages ; il garde les messages chiffrés 12 heures.
- Limites du relais gratuit, lues dans ses réponses (novembre 2026) : 60 requêtes par 5 minutes et 250 messages par jour et par adresse IP (un coup = un message, soit 5 parties environ par jour) ; aucune garantie de disponibilité. Les conditions de ntfy.sh demandent un utilisateur majeur : c'est le parent qui met en place le duel.
- Pour un autre relais ntfy (par exemple auto-hébergé) : `localStorage.setItem("salle-armes-relais","https://mon-relais")` dans la console.
- L'Action « Test du relais du duel » vérifie que ntfy.sh accepte les envois depuis un navigateur.

## Licence
GPL-3.0 (voir `LICENSE`). Le code source complet est dans ce dépôt ; celui de Stockfish.js est sur https://github.com/nmrugg/stockfish.js.
