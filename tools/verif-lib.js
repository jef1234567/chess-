/*
 * Bibliothèque de vérification des problèmes, partagée par tools/verifier.js
 * (contrôle du dépôt) et tools/importer-lichess.js (import de la base Lichess).
 *
 * Format d'un problème : {id, t, r, fen, line, x, a}
 *  - line : coups en notation SAN, en alternance à partir du camp au trait de fen ;
 *  - a: 1 si le premier coup de line est celui de l'adversaire (joué automatiquement
 *    par l'appli, comme sur Lichess). Le joueur est alors l'autre camp.
 * La ligne finit toujours par un coup du joueur.
 */
"use strict";
const { Chess } = require("../chess.js");

const VAL = { p: 1, n: 3, b: 3, r: 5, q: 9, k: 0 };
const MAT = 1000;
const GAIN_MIN = 3; // au moins une pièce mineure
const THEMES_MAT = ["mat1", "mat2"];

function materiel(g, c) {
  let s = 0;
  for (const row of g.board()) for (const p of row) if (p) s += (p.color === c ? 1 : -1) * VAL[p.type];
  return s;
}

// Négamax alpha-bêta sur le matériel, du point de vue du camp au trait, puis captures seulement.
// Le pat vaut 0 ; la nulle par manque de matériel est ignorée (on mesure un gain matériel).
function cherche(g, prof, a, b, q = 0) {
  if (g.in_checkmate()) return -MAT - prof;
  if (g.in_stalemate()) return 0;
  let coups = g.moves({ verbose: true });
  if (prof <= 0) {
    const stand = materiel(g, g.turn());
    if (stand >= b) return stand;
    if (stand > a) a = stand;
    if (q >= 6) return a;
    coups = coups.filter(m => m.captured).sort((x, y) => VAL[y.captured] - VAL[x.captured]);
    for (const m of coups) {
      g.move(m);
      const v = -cherche(g, 0, -b, -a, q + 1);
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

// Score matériel du point de vue de `camp` après recherche.
function evalPour(g, camp, prof) {
  const s = g.in_checkmate() ? -MAT : cherche(g, prof, -Infinity, Infinity);
  return g.turn() === camp ? s : -s;
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
  if (new Chess(autre).in_check()) err.push("le camp qui ne joue pas est en échec");
  return err;
}

/*
 * Vérifie un problème. opts : {prof, autres}
 *  - prof : profondeur de recherche après la ligne (6 pour les problèmes faits main, 1 suffit
 *    pour Lichess dont les lignes vont jusqu'à la prise : réponse adverse puis captures) ;
 *  - seulCoup : pour la défense, vérifier que c'est le seul coup qui sauve (coûteux ; désactivé
 *    pour Lichess, dont l'unicité est déjà garantie par son analyse) ;
 *  - autres : signaler les autres premiers coups qui gagnent aussi (avertissement seulement).
 * Retourne {err:[], info:[]}.
 */
function verifier(pz, THEMES, opts = {}) {
  const prof = opts.prof ?? 6;
  const err = [], info = [];
  if (!THEMES[pz.t]) err.push(`thème inconnu « ${pz.t} »`);
  if (typeof pz.r !== "number" || pz.r < 100 || pz.r > 3000) err.push("cote absente ou hors bornes");
  if (!pz.x || !pz.x.trim()) err.push("explication absente");
  if (!Array.isArray(pz.line) || !pz.line.length) { err.push("ligne absente"); return { err, info }; }
  const debut = pz.a ? 1 : 0; // indice du premier coup du joueur
  if ((pz.line.length - debut) % 2 === 0) err.push("la ligne doit finir par un coup du joueur");
  const legal = positionLegale(pz.fen);
  if (legal.length) return { err: err.concat(legal), info };

  const g = new Chess(pz.fen);
  const avant = materiel(g, pz.a ? (g.turn() === "w" ? "b" : "w") : g.turn()); // avant le coup adverse éventuel
  let fenJoueur = null, joueur = null;
  for (let i = 0; i < pz.line.length; i++) {
    if (i === debut) { fenJoueur = g.fen(); joueur = g.turn(); }
    if (!g.move(pz.line[i])) { err.push(`coup ${i + 1} (${pz.line[i]}) illégal`); return { err, info }; }
    if (i < pz.line.length - 1 && g.game_over()) { err.push(`partie finie avant la fin de la ligne (après ${pz.line[i]})`); return { err, info }; }
  }
  const nJoueur = (pz.line.length - debut + 1) / 2;

  if (THEMES_MAT.includes(pz.t)) {
    const attendu = pz.t === "mat1" ? 1 : 2;
    if (nJoueur !== attendu) err.push(`un ${THEMES[pz.t]} doit avoir ${attendu} coup(s) du joueur`);
    if (!g.in_checkmate()) err.push("la position finale n'est pas un mat");
    if (pz.t === "mat2") {
      const g1 = new Chess(fenJoueur);
      g1.move(pz.line[debut]);
      if (g1.in_checkmate()) err.push("le premier coup mate déjà : c'est un mat en 1");
      const defenses = g1.moves();
      const trous = defenses.filter(d => { g1.move(d); const ok = mateEn1Existe(g1); g1.undo(); return !ok; });
      if (trous.length) err.push(`défense sans mat en 1 après ${pz.line[debut]} : ${trous.join(", ")}`);
      else info.push(`${defenses.length} défense(s), toutes matées`);
    }
    return { err, info };
  }

  const apres = evalPour(g, joueur, prof);
  const gain = apres - avant;

  if (pz.t === "defense") {
    // Défense : la ligne ne perd pas de matériel, et tout autre premier coup perd au moins 2 points de plus.
    if (gain <= -2 && apres < MAT / 2) err.push(`la défense perd du matériel (${gain})`);
    if (opts.seulCoup === false) { info.push(`ne perd rien (${gain >= 0 ? "+" : ""}${gain})`); return { err, info }; }
    // Comparaison à profondeur égale : chaque premier coup possible, y compris celui de la solution.
    const D = Math.max(prof, pz.line.length - debut + 1);
    const g0 = new Chess(fenJoueur);
    const note = m => { g0.move(m); const s = evalPour(g0, joueur, D); g0.undo(); return s; };
    const sol = note(pz.line[debut]);
    const aussiBons = g0.moves().filter(m => m !== pz.line[debut] && note(m) > sol - 2);
    if (aussiBons.length) err.push(`d'autres coups défendent aussi : ${aussiBons.slice(0, 5).join(", ")}`);
    else info.push(`seul coup qui sauve (${gain >= 0 ? "+" : ""}${gain})`);
    return { err, info };
  }

  if (apres >= MAT / 2) info.push("mène au mat");
  else info.push(`gain matériel : ${gain >= 0 ? "+" : ""}${gain}`);
  if (gain < GAIN_MIN) err.push(`gain matériel insuffisant (${gain} < ${GAIN_MIN})`);

  if (opts.autres && nJoueur === 1) {
    const g0 = new Chess(fenJoueur);
    const autres = g0.moves().filter(m => {
      if (m === pz.line[debut]) return false;
      g0.move(m); const s = evalPour(g0, joueur, Math.min(prof, 4)); g0.undo();
      return s - avant >= GAIN_MIN;
    });
    if (autres.length) info.push(`attention, d'autres coups gagnent aussi : ${autres.join(", ")}`);
  }
  return { err, info };
}

module.exports = { verifier, positionLegale, materiel, cherche, Chess, VAL, MAT, GAIN_MIN };
