/* Sons synthétisés (Web Audio), aucun fichier externe.
   Bois posé, choc d'épées, trompette d'échec, cor de victoire, fanfare. */
let AC=null,BRUIT=null;
function ac(){if(!AC){try{AC=new (window.AudioContext||window.webkitAudioContext)();}catch(e){}}if(AC&&AC.state==="suspended")AC.resume().catch(()=>{});return AC;}
function tone(f,d,type,vol,when=0,filtre){const a=ac();if(!a||!S.son)return;const t=a.currentTime+when,o=a.createOscillator(),g=a.createGain();
  o.type=type;o.frequency.setValueAtTime(f,t);g.gain.setValueAtTime(.0001,t);g.gain.exponentialRampToValueAtTime(vol,t+.008);g.gain.exponentialRampToValueAtTime(.0001,t+d);
  let n=o;if(filtre){const b=a.createBiquadFilter();b.type="lowpass";b.frequency.value=filtre;o.connect(b);n=b;}
  n.connect(g).connect(a.destination);o.start(t);o.stop(t+d+.02);}
function bruit(d,freq,q,vol,when=0){const a=ac();if(!a||!S.son)return;
  if(!BRUIT){BRUIT=a.createBuffer(1,a.sampleRate*.5,a.sampleRate);const x=BRUIT.getChannelData(0);for(let i=0;i<x.length;i++)x[i]=Math.random()*2-1;}
  const t=a.currentTime+when,s=a.createBufferSource(),b=a.createBiquadFilter(),g=a.createGain();s.buffer=BRUIT;b.type="bandpass";b.frequency.value=freq;b.Q.value=q;
  g.gain.setValueAtTime(vol,t);g.gain.exponentialRampToValueAtTime(.0001,t+d);s.connect(b).connect(g).connect(a.destination);s.start(t);s.stop(t+d+.02);}
function cor(notes,pas,vol=.12){notes.forEach((f,i)=>{const d=i===notes.length-1?.7:pas*1.1;tone(f,d,"sawtooth",vol,i*pas,1800);tone(f/2,d,"triangle",vol*.6,i*pas);});}
const SON={
  coup(){bruit(.07,1100,2.5,.5);tone(140,.09,"sine",.35)},                         // pièce de bois posée
  prise(){[523,1381,2213,3170].forEach((f,i)=>tone(f,.55-i*.1,"sine",.09));bruit(.12,3200,1.2,.35);tone(120,.12,"triangle",.3)}, // choc métallique
  victoire(){cor([392,523,659,784],.13)},
  rate(){tone(220,.25,"sawtooth",.07,0,900);tone(165,.45,"sawtooth",.07,.18,700)},
  echec(){tone(880,.14,"sawtooth",.06,.02,2500);tone(660,.22,"sawtooth",.06,.16,2500)}, // « échec ! » : deux coups de trompette brefs
  fanfare(){cor([392,523,659,784,659,1046],.12,.1)},                                  // haut fait débloqué
  adoube(){cor([262,330,392,523,392,523,659,784],.2,.11);bruit(1.2,5000,.7,.05,1.4)}   // adoubement : grand cor
};
