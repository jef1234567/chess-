#!/usr/bin/env node
/*
 * Vérifie automatiquement chaque problème de js/puzzles.js (et js/lichess.js s'il existe) :
 *  - fiche complète (id unique, thème connu, cote, explication) ;
 *  - position légale (FEN valide, un roi de chaque couleur, pas de pion
 *    sur la 1re ou la 8e rangée, le camp qui ne joue pas n'est pas en échec) ;
 *  - ligne jouable (chaque coup est légal dans l'ordre) ;
 *  - thèmes de mat : la position finale est un mat réel ; en mat en 2,
 *    chaque défense adverse laisse un mat en 1 (c'est ce que l'appli accepte) ;
 *  - défense : la ligne ne perd pas de matériel et c'est le seul coup qui sauve ;
 *  - autres thèmes : le joueur gagne au moins une pièce mineure (3 points)
 *    avec le meilleur jeu des deux camps (petite recherche sur le matériel).
 * Usage : node tools/verifier.js [fichier...]   (code de sortie 1 si un problème échoue)
 */
"use strict";
const fs = require("fs");
const path = require("path");
const vm = require("vm");
const { verifier, positionLegale, Chess } = require("./verif-lib.js");

const js = path.join(__dirname, "..", "js");
const fichiers = process.argv.length > 2 ? process.argv.slice(2)
  : [path.join(js, "puzzles.js"), path.join(js, "lichess.js")].filter(f => fs.existsSync(f));
const code = fichiers.map(f => fs.readFileSync(f, "utf8")).join("\n;\n");
const { THEMES, P, FINALES, OUVERTURES, menacesDe, fenJoueur } = vm.runInNewContext(code + "\n;({THEMES,P,FINALES:typeof FINALES===\"undefined\"?[]:FINALES,OUVERTURES:typeof OUVERTURES===\"undefined\"?[]:OUVERTURES,menacesDe:typeof menacesDe===\"undefined\"?null:menacesDe,fenJoueur:typeof fenJoueur===\"undefined\"?null:fenJoueur})", { Chess });

let ko = 0, n = 0;
const vus = new Set();
for (const pz of P) {
  const importe = /^L/.test(pz.id);
  const { err, info } = verifier(pz, THEMES, importe ? { prof: 1, seulCoup: false } : { prof: 6, autres: true });
  if (vus.has(pz.id)) err.push("identifiant en double");
  vus.add(pz.id);
  if (err.length) { ko++; console.log(`✗ ${pz.id} (${pz.t}) : ${err.join(" ; ")}`); }
  else if (!importe) console.log(`✓ ${pz.id} (${pz.t})${info.length ? " — " + info.join(" ; ") : ""}`);
  else n++;
}
if (n) console.log(`✓ ${n} problèmes importés de Lichess`);
// Finales à gagner : position légale, trait aux blancs, le roi noir est seul, la partie n'est pas finie.
for (const f of FINALES) {
  const err = positionLegale(f.fen);
  if (!err.length) {
    const g = new Chess(f.fen);
    if (g.turn() !== "w") err.push("le trait doit être aux blancs");
    if (/[pnbrq]/.test(f.fen.split(" ")[0])) err.push("le roi noir doit être seul");
    if (g.game_over()) err.push("la partie est déjà finie");
  }
  if (!f.k || !f.nom || !f.x) err.push("fiche incomplète");
  if (err.length) { ko++; console.log(`✗ finale ${f.k} : ${err.join(" ; ")}`); }
  else console.log(`✓ finale ${f.k}`);
}
// Leçons d'ouvertures : chaque coup est légal depuis la position de départ, chaque coup a sa phrase.
const cles = new Set();
for (const o of OUVERTURES) {
  const err = [], g = new Chess();
  if (!o.k || !o.nom || !o.x || !["w", "b"].includes(o.camp)) err.push("fiche incomplète");
  if (cles.has(o.k)) err.push("clé en double");
  cles.add(o.k);
  o.l.forEach(([san, c], i) => { if (!err.length && !g.move(san)) err.push(`coup ${i + 1} (${san}) illégal`); if (!c) err.push(`coup ${i + 1} sans phrase`); });
  // la leçon finit sur un coup de l'enfant
  if (o.l.length % 2 !== (o.camp === "w" ? 1 : 0)) err.push("la ligne doit finir par un coup de l'enfant");
  if (err.length) { ko++; console.log(`✗ ouverture ${o.k} : ${err.join(" ; ")}`); }
  else console.log(`✓ ouverture ${o.k} (${o.l.length} coups)`);
}
// Trouve la menace : assez de positions où l'adversaire menace un mat ou une prise gagnante.
if (menacesDe) {
  let nb = 0;
  for (const p of P) { const ms = menacesDe(fenJoueur(p)); if (ms.length && new Set(ms.map(m => m.from)).size <= 2) nb++; }
  if (nb < 100) { ko++; console.log(`✗ trouve la menace : seulement ${nb} positions`); }
  else console.log(`✓ trouve la menace : ${nb} positions utilisables`);
}
console.log(`\n${P.length - ko}/${P.length} problèmes vérifiés.`);
process.exit(ko ? 1 : 0);
