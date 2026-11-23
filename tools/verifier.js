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
const { verifier } = require("./verif-lib.js");

const js = path.join(__dirname, "..", "js");
const fichiers = process.argv.length > 2 ? process.argv.slice(2)
  : [path.join(js, "puzzles.js"), path.join(js, "lichess.js")].filter(f => fs.existsSync(f));
const code = fichiers.map(f => fs.readFileSync(f, "utf8")).join("\n;\n");
const { THEMES, P } = vm.runInNewContext(code + "\n;({THEMES,P})");

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
console.log(`\n${P.length - ko}/${P.length} problèmes vérifiés.`);
process.exit(ko ? 1 : 0);
