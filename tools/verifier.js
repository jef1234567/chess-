#!/usr/bin/env node
/*
 * Vérifie automatiquement chaque problème de js/puzzles.js :
 *  - fiche complète (id unique, thème connu, cote, explication) ;
 *  - position légale (FEN valide, un roi de chaque couleur, pas de pion
 *    sur la 1re ou la 8e rangée, le camp qui ne joue pas n'est pas en échec) ;
 *  - ligne jouable (chaque coup est légal dans l'ordre) ;
 *  - thèmes de mat : la position finale est un mat réel ; en mat en 2,
 *    chaque défense adverse laisse un mat en 1 (c'est ce que l'appli accepte) ;
 *  - autres thèmes : le joueur gagne au moins une pièce mineure (3 points)
 *    avec le meilleur jeu des deux camps (petite recherche sur le matériel).
 * Usage : node tools/verifier.js [fichier]   (code de sortie 1 si un problème échoue)
 */
"use strict";
const fs = require("fs");
const path = require("path");
const vm = require("vm");
const { Chess } = require("../chess.js");

const fichier = process.argv[2] || path.join(__dirname, "..", "js", "puzzles.js");
const { THEMES, P } = vm.runInNewContext(fs.readFileSync(fichier, "utf8") + "\n;({THEMES,P})");

const VAL = { p: 1, n: 3, b: 3, r: 5, q: 9, k: 0 };
const MAT = 1000;
const GAIN_MIN = 3;
const PROF = 6; // demi-coups explorés après la ligne, puis captures seulement
const PROF_AUTRES = 4; // recherche plus courte pour signaler les autres coups gagnants

function materiel(g, c) {
  let s = 0;
  for (const row of g.board()) for (const p of row) if (p) s += (p.color === c ? 1 : -1) * VAL[p.type];
  return s;
}

// Négamax alpha-bêta sur le matériel, du point de vue du camp au trait.
function cherche(g, prof, a, b, qdepth = 0) {
  if (g.in_checkmate()) return -MAT - prof;
  if (g.in_stalemate()) return 0; // pat ; on ignore la nulle par manque de matériel : on mesure le gain matériel
  const moi = g.turn();
  let coups = g.moves({ verbose: true });
  if (prof <= 0) {
    const stand = materiel(g, moi);
    if (stand >= b) return stand;
    if (stand > a) a = stand;
    if (qdepth >= 6) return a;
    coups = coups.filter(m => m.captured);
    for (const m of coups) {
      g.move(m);
      const v = -cherche(g, 0, -b, -a, qdepth + 1);
      g.undo();
      if (v >= b) return v;
      if (v > a) a = v;
    }
    return a;
  }
  coups.sort((x, y) => (y.captured ? VAL[y.captured] : 0) - (x.captured ? VAL[x.captured] : 0));
  let best = -Infinity;
  for (const m of coups) {
    g.move(m);
    const v = -cherche(g, prof - 1, -b, -a);
    g.undo();
    if (v > best) best = v;
    if (v > a) a = v;
    if (a >= b) break;
  }
  return best;
}

function mateEn1Existe(g) {
  return g.moves().some(m => { g.move(m); const k = g.in_checkmate(); g.undo(); return k; });
}

function positionLegale(fen) {
  const err = [];
  const v = new Chess().validate_fen(fen);
  if (!v.valid) return [`FEN invalide : ${v.error}`];
  const champs = fen.split(" ");
  const rangs = champs[0].split("/");
  const compte = c => (champs[0].match(new RegExp(c, "g")) || []).length;
  if (compte("K") !== 1 || compte("k") !== 1) err.push("il faut exactement un roi de chaque couleur");
  if (/[pP]/.test(rangs[0]) || /[pP]/.test(rangs[7])) err.push("pion sur la 1re ou la 8e rangée");
  const autre = [champs[0], champs[1] === "w" ? "b" : "w", champs[2], "-", "0", "1"].join(" ");
  const g2 = new Chess(autre);
  if (g2.in_check()) err.push("le camp qui ne joue pas est en échec");
  return err;
}

function verifier(pz) {
  const err = [], info = [];
  if (!THEMES[pz.t]) err.push(`thème inconnu « ${pz.t} »`);
  if (typeof pz.r !== "number" || pz.r < 100 || pz.r > 3000) err.push("cote absente ou hors bornes");
  if (!pz.x || !pz.x.trim()) err.push("explication absente");
  if (!Array.isArray(pz.line) || !pz.line.length) { err.push("ligne absente"); return { err, info }; }
  if (pz.line.length % 2 === 0) err.push("la ligne doit finir par un coup du joueur");
  const legal = positionLegale(pz.fen);
  if (legal.length) return { err: err.concat(legal), info };

  const g = new Chess(pz.fen);
  const joueur = g.turn();
  const avant = materiel(g, joueur);
  for (let i = 0; i < pz.line.length; i++) {
    if (!g.move(pz.line[i])) { err.push(`coup ${i + 1} (${pz.line[i]}) illégal`); return { err, info }; }
    if (i < pz.line.length - 1 && g.game_over()) { err.push(`partie finie avant la fin de la ligne (après ${pz.line[i]})`); return { err, info }; }
  }

  if (pz.t === "mat1" || pz.t === "mat2") {
    const attendu = pz.t === "mat1" ? 1 : 3;
    if (pz.line.length !== attendu) err.push(`un ${THEMES[pz.t]} doit avoir ${attendu} demi-coup(s)`);
    if (!g.in_checkmate()) err.push("la position finale n'est pas un mat");
    if (pz.t === "mat2") {
      const g1 = new Chess(pz.fen);
      g1.move(pz.line[0]);
      if (g1.in_checkmate()) err.push("le premier coup mate déjà : c'est un mat en 1");
      const defenses = g1.moves();
      const trous = defenses.filter(d => { g1.move(d); const ok = mateEn1Existe(g1); g1.undo(); return !ok; });
      if (trous.length) err.push(`défense sans mat en 1 après ${pz.line[0]} : ${trous.join(", ")}`);
      else info.push(`${defenses.length} défense(s), toutes matées`);
    }
  } else {
    const camp = g.turn();
    let score = g.in_checkmate() ? -MAT : cherche(g, PROF, -Infinity, Infinity);
    if (camp !== joueur) score = -score;
    const gain = score - avant;
    if (gain >= MAT / 2) info.push("mène au mat");
    else info.push(`gain matériel : ${gain >= 0 ? "+" : ""}${gain}`);
    if (gain < GAIN_MIN) err.push(`gain matériel insuffisant (${gain} < ${GAIN_MIN})`);
    // L'appli n'accepte que le coup de la ligne : on signale les autres coups gagnants.
    if (pz.line.length === 1) {
      const g0 = new Chess(pz.fen);
      const autres = g0.moves().filter(m => {
        if (m === pz.line[0]) return false;
        g0.move(m);
        const s = g0.in_checkmate() ? MAT : -cherche(g0, PROF_AUTRES, -Infinity, Infinity);
        g0.undo();
        return s - avant >= GAIN_MIN;
      });
      if (autres.length) info.push(`attention, d'autres coups gagnent aussi : ${autres.join(", ")}`);
    }
  }
  return { err, info };
}

let ko = 0;
const vus = new Set();
for (const pz of P) {
  const { err, info } = verifier(pz);
  if (vus.has(pz.id)) err.push("identifiant en double");
  vus.add(pz.id);
  if (err.length) { ko++; console.log(`✗ ${pz.id} (${pz.t}) : ${err.join(" ; ")}`); }
  else console.log(`✓ ${pz.id} (${pz.t})${info.length ? " — " + info.join(" ; ") : ""}`);
}
console.log(`\n${P.length - ko}/${P.length} problèmes vérifiés.`);
process.exit(ko ? 1 : 0);
