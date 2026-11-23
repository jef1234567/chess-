/* Sons synthétisés (Web Audio), aucun fichier externe. */
let AC=null;
function ac(){if(!AC){try{AC=new (window.AudioContext||window.webkitAudioContext)();}catch(e){}}return AC;}
function tone(f,d,type,vol,when=0){const a=ac();if(!a||!S.son)return;const t=a.currentTime+when,o=a.createOscillator(),g=a.createGain();o.type=type;o.frequency.setValueAtTime(f,t);g.gain.setValueAtTime(vol,t);g.gain.exponentialRampToValueAtTime(.001,t+d);o.connect(g).connect(a.destination);o.start(t);o.stop(t+d);}
const SON={
  coup(){tone(180,.08,"triangle",.25);tone(90,.1,"sine",.2)},
  prise(){[523,1046,1568,2090].forEach((f,i)=>tone(f*1.01,.5-i*.08,"sine",.12));tone(140,.15,"square",.08)},
  victoire(){[523,659,784,1046].forEach((f,i)=>tone(f,.35,"triangle",.18,i*.11))},
  rate(){tone(220,.25,"sawtooth",.08);tone(165,.4,"sawtooth",.08,.18)}
};
