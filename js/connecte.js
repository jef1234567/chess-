/* Mode connecté (facultatif) : explications en mots d'enfant par l'API Claude.
   - La clé d'API est saisie dans le blason et gardée sur cet appareil seulement
     (localStorage, clé « salle-armes-cle »). Elle n'est jamais dans le dépôt.
   - Sans clé ou sans réseau, les boutons « Explique-moi » restent cachés : l'appli marche comme avant.
   - Appel direct depuis le navigateur (en-tête anthropic-dangerous-direct-browser-access),
     sans bibliothèque ni étape de build. */
const IA={
  CLE:"salle-armes-cle",
  MODELE:"claude-opus-5-5",
  cle(){try{return localStorage.getItem(this.CLE)||"";}catch(e){return "";}},
  garder(k){try{if(k)localStorage.setItem(this.CLE,k);else localStorage.removeItem(this.CLE);}catch(e){}},
  dispo(){return !!this.cle()&&navigator.onLine!==false;},
  SYSTEME:`Tu es le maître d'armes de « La Salle d'armes », un jeu d'échecs pour un enfant de 8 ans qui joue déjà bien.
Tu expliques un coup d'échecs en français, en tutoyant l'enfant, avec des phrases courtes et des mots simples.
Règles :
- 3 phrases au maximum, 60 mots au maximum, sans titre ni liste.
- Appuie-toi uniquement sur les coups et les faits donnés (ils viennent d'un moteur d'échecs) : n'invente pas d'autres variantes.
- Dis pourquoi le bon coup marche (la menace, la pièce gagnée, le roi coincé) et, s'il y en a un, ce que le coup joué oubliait.
- Termine par un encouragement ou une astuce à retenir. Ton chaleureux, univers des chevaliers bienvenu, sans en faire trop.`,
  async expliquer(question){
    const r=await fetch("https://api.anthropic.com/v1/messages",{method:"POST",headers:{
      "content-type":"application/json","x-api-key":this.cle(),"anthropic-version":"2026-10-21",
      "anthropic-beta":"server-side-fallback-2026-07-01","anthropic-dangerous-direct-browser-access":"true"},
      body:JSON.stringify({model:this.MODELE,max_tokens:2000,output_config:{effort:"low"},fallbacks:"default",
        system:this.SYSTEME,messages:[{role:"user",content:question}]})});
    let d=null;try{d=await r.json();}catch(e){}
    if(!r.ok){
      const t=d&&d.error&&d.error.type;
      if(r.status===401||t==="authentication_error")throw new Error("La clé n'est pas valable. Vérifie-la dans ton blason.");
      if(r.status===429)throw new Error("Le maître d'armes est très demandé. Réessaie dans une minute.");
      throw new Error("Le maître d'armes ne répond pas pour l'instant.");
    }
    if(d.stop_reason==="refusal")throw new Error("Le maître d'armes n'a pas de réponse cette fois.");
    const txt=(d.content||[]).filter(b=>b.type==="text").map(b=>b.text).join("").trim();
    if(!txt)throw new Error("Le maître d'armes n'a pas de réponse cette fois.");
    return txt;
  }
};

// Description d'une position pour le modèle : FEN + liste des pièces en clair (plus fiable que la FEN seule).
function iaPosition(fen){
  const g=new Chess(fen),N={p:"pion",n:"cavalier",b:"fou",r:"tour",q:"dame",k:"roi"},l={w:[],b:[]};
  g.board().forEach((row,i)=>row.forEach((p,j)=>{if(p)l[p.color].push(`${N[p.type]} ${"abcdefgh"[j]}${8-i}`);}));
  return `FEN : ${fen}\nBlancs : ${l.w.join(", ")}\nNoirs : ${l.b.join(", ")}\nTrait aux ${g.turn()==="w"?"blancs":"noirs"}.`;
}

// Bouton « Explique-moi » : zone = élément où écrire la réponse, question = fonction qui construit la demande.
function iaBouton(id,zone,question){
  const b=$(id);b.hidden=!IA.dispo();
  b.onclick=async()=>{
    if(!IA.dispo())return;
    b.disabled=true;const avant=b.textContent;b.textContent="Le maître d'armes réfléchit…";
    const z=$(zone);
    try{const t=await IA.expliquer(question());z.insertAdjacentHTML("beforeend",`<p class="ia"><b>Le maître d'armes :</b> ${esc(t)}</p>`);b.hidden=true;}
    catch(e){z.insertAdjacentHTML("beforeend",`<p class="ia ko">${esc(e.message)}</p>`);b.disabled=false;}
    b.textContent=avant;if(!b.hidden)b.disabled=false;
  };
  b.disabled=false;
}

/* ---------- Questions ---------- */
function iaQuestionEpreuve(coupJoue){
  const g=new Chess(PZ.fen),avant=[];
  for(let i=0;i<(PZ.a?1:0);i++)avant.push(g.move(PZ.line[i]).san);
  const camp=g.turn()==="w"?"blancs":"noirs";
  const sol=PZ.line.slice(PZ.a?1:0);
  return `Épreuve « ${THEMES[PZ.t]} ». L'enfant joue les ${camp}.
${avant.length?`L'adversaire vient de jouer ${avant[0]}.\n`:""}${iaPosition(g.fen())}
Solution (coups alternés, en commençant par l'enfant) : ${sol.join(" ")}.
${coupJoue?`L'enfant a joué ${coupJoue}, ce qui ne marchait pas.`:"L'enfant a demandé la solution."}
Explique-lui la solution.`;
}
function iaQuestionConseil(k){
  const g=new Chess(k.fen),best=g.move(uciCoup(k.E0.coup));
  const camp=C.partie.camp==="w"?"blancs":"noirs";
  return `Débrief d'une partie. L'enfant joue les ${camp}.
${iaPosition(k.fen)}
L'enfant a joué ${k.m.san}. Le moteur préférait ${best?best.san:"un autre coup"} (${k.E0.score>=10000?"il y avait un mat":k.E1.score>=10000?"le coup joué permettait un mat":`le coup joué perdait environ ${Math.round(k.perte/100)} pion(s) d'avantage`}).
Constat du moteur : ${cPhrase(k).replace(/<[^>]+>/g,"")}
Explique-lui simplement l'erreur et le meilleur coup.`;
}

/* ---------- Réglages dans le blason ---------- */
function iaMajReglages(){
  const k=IA.cle();
  $("iaEtat").textContent=k?`Clé enregistrée sur cet appareil (…${k.slice(-4)}).`:"Aucune clé : l'appli marche sans réseau, comme d'habitude.";
  $("iaOublier").hidden=!k;$("iaCle").value="";
}
$("iaGarder").onclick=()=>{const v=$("iaCle").value.trim();if(!v)return;IA.garder(v);iaMajReglages();};
$("iaOublier").onclick=()=>{IA.garder("");iaMajReglages();};
