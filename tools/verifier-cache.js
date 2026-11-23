#!/usr/bin/env node
/* Vérifie que chaque ressource de l'appli (js/, css/, fonts/, icons/ et fichiers racine)
 * est listée dans sw.js, et que chaque fichier listé existe. Code de sortie 1 sinon. */
"use strict";
const fs = require("fs");
const path = require("path");
const racine = path.join(__dirname, "..");
const sw = fs.readFileSync(path.join(racine, "sw.js"), "utf8");
const liste = JSON.parse(sw.match(/const FICHIERS=(\[[^\]]*\])/)[1]);
const attendus = ["index.html", "chess.js", "manifest.webmanifest"];
for (const d of ["js", "css", "fonts", "icons"])
  if (fs.existsSync(path.join(racine, d)))
    for (const f of fs.readdirSync(path.join(racine, d))) attendus.push(`${d}/${f}`);
let ko = 0;
for (const f of attendus) if (!liste.includes(f)) { console.log(`✗ absent de sw.js : ${f}`); ko++; }
for (const f of liste) if (f !== "./" && !fs.existsSync(path.join(racine, f))) { console.log(`✗ listé dans sw.js mais introuvable : ${f}`); ko++; }
console.log(ko ? `${ko} erreur(s).` : `✓ ${liste.length} ressources en cache, toutes présentes.`);
process.exit(ko ? 1 : 0);
