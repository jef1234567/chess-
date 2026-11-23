#!/usr/bin/env node
/*
 * Import de problèmes depuis la base libre Lichess (CC0, https://database.lichess.org/#puzzles).
 * Lit le CSV décompressé sur l'entrée standard et écrit js/lichess.js.
 *   zstd -dc lichess_db_puzzle.csv.zst | node tools/importer-lichess.js
 * Colonnes : PuzzleId,FEN,Moves,Rating,RatingDeviation,Popularity,NbPlays,Themes,GameUrl,OpeningTags
 * Le premier coup de Moves est celui de l'adversaire ; l'appli le joue automatiquement.
 * Seuls les problèmes qui passent la vérification (tools/verif-lib.js) sont gardés.
 */
"use strict";
const fs = require("fs");
const path = require("path");
const readline = require("readline");
const { verifier, Chess } = require("./verif-lib.js");

const COTE_MIN = +(process.env.COTE_MIN || 400);
const COTE_MAX = +(process.env.COTE_MAX || 1500);
const TRANCHE = 100;
const QUOTAS = {
  mat1: 350, mat2: 350, fourchette: 300, attaqueDouble: 200, prise: 300,
  enfilade: 150, clouage: 250, decouverte: 200, defense: 150, finale: 200,
};
const MAX_COUPS_JOUEUR = 3;
const SORTIE = process.argv[2] || path.join(__dirname, "..", "js", "lichess.js");

// Mêmes noms que js/puzzles.js (vérifiés à la fin).
const THEMES = {
  mat1: "Mat en 1", mat2: "Mat en 2", fourchette: "Fourchette", attaqueDouble: "Attaque double",
  prise: "Pièce gratuite", enfilade: "Enfilade", clouage: "Clouage", decouverte: "Découverte",
  defense: "Défense", finale: "Finale",
};
const EXPLI = {
  mat1: "Échec et mat ! Le roi adverse n'a plus aucune case pour s'échapper.",
  mat2: "Le premier coup prépare le piège, le deuxième donne le mat.",
  fourchette: "Ta pièce a attaqué deux cibles en même temps. L'adversaire ne pouvait en sauver qu'une !",
  attaqueDouble: "Une seule pièce, deux attaques : l'adversaire ne pouvait pas tout protéger.",
  prise: "Cette pièce n'était pas assez protégée. Regarde toujours ce qui est gratuit !",
  enfilade: "Tu as attaqué une grosse pièce. Quand elle s'est écartée, celle de derrière est tombée.",
  clouage: "La pièce clouée ne pouvait plus bouger sans laisser tomber ce qui était derrière elle.",
  decouverte: "En bougeant une pièce, tu as ouvert la route d'une autre : c'est une attaque à la découverte !",
  defense: "Tout semblait perdu, mais tu as trouvé le seul coup qui sauve. Bien défendu !",
  finale: "En finale, chaque pion compte. Tu as trouvé le coup précis.",
};

// Thème de la Salle d'armes pour une ligne Lichess (null si aucun ne convient).
function themeDe(tags, fen, uci) {
  const t = new Set(tags);
  if (t.has("mateIn1")) return "mat1";
  if (t.has("mateIn2")) return "mat2";
  if (t.has("mate")) return null; // mats plus longs : pas pour l'instant
  if (t.has("defensiveMove")) return "defense";
  if (t.has("discoveredAttack")) return "decouverte";
  if (t.has("skewer")) return "enfilade";
  if (t.has("pin")) return "clouage";
  if (t.has("fork")) {
    const g = new Chess(fen); g.move(uciVers(uci[0]));
    const p = g.get(uci[1].slice(0, 2));
    return p && (p.type === "n" || p.type === "p") ? "fourchette" : "attaqueDouble";
  }
  if (t.has("hangingPiece")) return "prise";
  if (t.has("pawnEndgame") || t.has("rookEndgame")) return "finale";
  return null;
}
function uciVers(u) { return { from: u.slice(0, 2), to: u.slice(2, 4), promotion: u[4] }; }

// Hachage stable pour un tirage déterministe (même base → même sélection).
function hache(s) { let h = 2166136261; for (const c of s) { h ^= c.charCodeAt(0); h = Math.imul(h, 16777619); } return h >>> 0; }

const nbTranches = Math.ceil((COTE_MAX - COTE_MIN) / TRANCHE);
const cand = {}; // thème → tranche → [{h, ligne}]
const garde = (th) => Math.ceil(QUOTAS[th] / nbTranches) * 4; // marge pour les rejets

// Problèmes écartés après vérification par Stockfish (lot 12) : un autre coup gagne autant que la solution.
const EXCLUS = new Set(["vDjYg"]);
let lus = 0;
const rl = readline.createInterface({ input: process.stdin, crlfDelay: Infinity });
rl.on("line", (l) => {
  if (!lus++ && l.startsWith("PuzzleId")) return;
  const c = l.split(",");
  if (c.length < 8) return;
  const [id, fen, moves, rating, dev, pop, plays, themes] = c;
  if (EXCLUS.has(id)) return;
  const r = +rating;
  if (r < COTE_MIN || r >= COTE_MAX || +dev > 100 || +pop < 85 || +plays < 300) return;
  const uci = moves.split(" ");
  if (uci.length / 2 > MAX_COUPS_JOUEUR) return;
  if (uci.some(u => u.length === 5 && u[4] !== "q")) return; // sous-promotion : l'appli promeut toujours en dame
  let th;
  try { th = themeDe(themes.split(" "), fen, uci); } catch (e) { return; }
  if (!th) return;
  const tr = Math.floor((r - COTE_MIN) / TRANCHE);
  const liste = ((cand[th] ||= {})[tr] ||= []);
  liste.push({ h: hache(id), c });
  if (liste.length > garde(th) * 2) { liste.sort((a, b) => a.h - b.h); liste.length = garde(th); }
});

rl.on("close", () => {
  const D = [];
  const bilan = [];
  for (const th of Object.keys(QUOTAS)) {
    const parTranche = Math.ceil(QUOTAS[th] / nbTranches);
    let pris = 0, rejets = 0;
    for (let tr = 0; tr < nbTranches; tr++) {
      const liste = ((cand[th] || {})[tr] || []).sort((a, b) => a.h - b.h);
      let n = 0;
      for (const { c } of liste) {
        if (n >= parTranche) break;
        const [id, fen, moves, rating] = c;
        const g = new Chess(fen);
        const line = [];
        let ok = true;
        for (const u of moves.split(" ")) { const m = g.move(uciVers(u)); if (!m) { ok = false; break; } line.push(m.san); }
        if (!ok) { rejets++; continue; }
        const pz = { id: "L" + id, t: th, r: +rating, fen, line, x: EXPLI[th], a: 1 };
        const { err } = verifier(pz, THEMES, { prof: 1, seulCoup: false });
        if (err.length) { rejets++; continue; }
        D.push([id, th, +rating, fen, line.join(" ")]);
        n++; pris++;
      }
    }
    bilan.push(`${THEMES[th]} : ${pris} gardés, ${rejets} rejetés par la vérification`);
  }
  const entete = `/* Généré par tools/importer-lichess.js — ne pas modifier à la main.
 * Problèmes de la base Lichess (CC0, https://database.lichess.org/#puzzles), cotes ${COTE_MIN}–${COTE_MAX}.
 * Format compact : [id Lichess, thème, cote, FEN, ligne SAN]. Le 1er coup est celui de l'adversaire. */\n`;
  const corps = `(function(){const X=${JSON.stringify(EXPLI)};\nconst D=[\n${D.map(d => JSON.stringify(d)).join(",\n")}\n];\nfor(const d of D)P.push({id:"L"+d[0],t:d[1],r:d[2],fen:d[3],line:d[4].split(" "),x:X[d[1]],a:1});})();\n`;
  fs.writeFileSync(SORTIE, entete + corps);
  console.log(`${lus} lignes lues, ${D.length} problèmes écrits dans ${path.relative(process.cwd(), SORTIE)}`);
  for (const b of bilan) console.log("  " + b);
});
