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
const { THEMES, P, FINALES } = vm.runInNewContext(code + "\n;({THEMES,P,FINALES:typeof FINALES===\"undefined\"?[]:FINALES})");

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
console.log(`\n${P.length - ko}/${P.length} problèmes vérifiés.`);
process.exit(ko ? 1 : 0);
