/* ======================================================================
   SCRIPT.JS
   ----------------------------------------------------------------------
   Logic utama: audio (musik & sound effect di-generate langsung, tanpa
   file mp3), render galeri foto dari js/photos-config.js, scroll reveal,
   lightbox, dan tombol hati.

   Kalau cuma mau ganti FOTO -> edit js/photos-config.js, JANGAN di sini.
   ====================================================================== */

/* ================= AUDIO ENGINE (synthesized, no external files) ================= */
let actx = null;
function ensureCtx(){
  if(!actx){ actx = new (window.AudioContext || window.webkitAudioContext)(); }
  if(actx.state === 'suspended') actx.resume();
  return actx;
}

function playClick(){
  try{
    const ctx = ensureCtx();
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = 'sine';
    o.frequency.setValueAtTime(720, ctx.currentTime);
    o.frequency.exponentialRampToValueAtTime(420, ctx.currentTime + 0.1);
    g.gain.setValueAtTime(0.0001, ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.18, ctx.currentTime + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.16);
    o.connect(g); g.connect(ctx.destination);
    o.start(); o.stop(ctx.currentTime + 0.18);
  }catch(e){}
}

function playPop(){
  try{
    const ctx = ensureCtx();
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = 'triangle';
    o.frequency.setValueAtTime(500, ctx.currentTime);
    o.frequency.exponentialRampToValueAtTime(900, ctx.currentTime + 0.12);
    g.gain.setValueAtTime(0.0001, ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.22, ctx.currentTime + 0.02);
    g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.22);
    o.connect(g); g.connect(ctx.destination);
    o.start(); o.stop(ctx.currentTime + 0.24);
  }catch(e){}
}

function playChime(){
  try{
    const ctx = ensureCtx();
    [880,1108,1318].forEach((f,i)=>{
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.type = 'sine';
      o.frequency.value = f;
      const t = ctx.currentTime + i*0.09;
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(0.14, t+0.02);
      g.gain.exponentialRampToValueAtTime(0.0001, t+0.5);
      o.connect(g); g.connect(ctx.destination);
      o.start(t); o.stop(t+0.55);
    });
  }catch(e){}
}

/* ---- generative romantic background pad loop ---- */
let musicGain, musicPlaying = false, musicNodes = [];
const chordProg = [
  [220.00,261.63,329.63],   // Am
  [174.61,220.00,261.63],   // F
  [130.81,164.81,196.00],   // C
  [196.00,246.94,293.66]    // G
];
let chordIdx = 0;
let loopTimer = null;

function initMusicGraph(){
  const ctx = ensureCtx();
  musicGain = ctx.createGain();
  musicGain.gain.value = 0.0;
  const filter = ctx.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.value = 1400;
  musicGain.connect(filter);
  filter.connect(ctx.destination);
  musicGain._filter = filter;
}

function playChord(freqs, duration){
  const ctx = ensureCtx();
  const now = ctx.currentTime;
  freqs.forEach((f)=>{
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = 'sine';
    o.frequency.value = f;
    g.gain.setValueAtTime(0.0001, now);
    g.gain.linearRampToValueAtTime(0.06, now + 1.2);
    g.gain.linearRampToValueAtTime(0.0001, now + duration);
    o.connect(g); g.connect(musicGain._filter || musicGain);
    o.start(now); o.stop(now + duration + 0.1);
    musicNodes.push(o);
  });
  const sp = ctx.createOscillator();
  const sg = ctx.createGain();
  sp.type = 'triangle';
  sp.frequency.value = freqs[2]*2;
  sg.gain.setValueAtTime(0.0001, now+0.4);
  sg.gain.linearRampToValueAtTime(0.03, now+1.0);
  sg.gain.linearRampToValueAtTime(0.0001, now+duration);
  sp.connect(sg); sg.connect(musicGain._filter || musicGain);
  sp.start(now+0.4); sp.stop(now+duration+0.1);
}

function musicLoopStep(){
  if(!musicPlaying) return;
  const chord = chordProg[chordIdx % chordProg.length];
  playChord(chord, 4.2);
  chordIdx++;
  loopTimer = setTimeout(musicLoopStep, 3800);
}

function startMusic(){
  const ctx = ensureCtx();
  if(!musicGain) initMusicGraph();
  musicPlaying = true;
  musicGain.gain.cancelScheduledValues(ctx.currentTime);
  musicGain.gain.linearRampToValueAtTime(1, ctx.currentTime + 1.2);
  musicLoopStep();
  document.getElementById('musicToggle').classList.remove('muted');
}

function stopMusic(){
  if(!musicGain) return;
  const ctx = ensureCtx();
  musicGain.gain.cancelScheduledValues(ctx.currentTime);
  musicGain.gain.linearRampToValueAtTime(0.0001, ctx.currentTime + 0.6);
  musicPlaying = false;
  clearTimeout(loopTimer);
  document.getElementById('musicToggle').classList.add('muted');
}

document.getElementById('musicToggle').addEventListener('click', ()=>{
  ensureCtx();
  if(musicPlaying){ stopMusic(); } else { startMusic(); }
  playClick();
});

/* ================= SCROLL PROGRESS BAR ================= */
const scrollBar = document.getElementById('scrollProgress');
function updateScrollProgress(){
  const h = document.documentElement;
  const scrolled = h.scrollTop;
  const max = h.scrollHeight - h.clientHeight;
  const pct = max > 0 ? (scrolled / max) * 100 : 0;
  scrollBar.style.width = pct + '%';
}
document.addEventListener('scroll', updateScrollProgress, {passive:true});
updateScrollProgress();

/* ================= CLICK SPARKLE BURST ================= */
const sparkleLayer = document.getElementById('sparkleLayer');
function burstSparkles(x, y, count = 8){
  for(let i=0; i<count; i++){
    const s = document.createElement('div');
    s.className = 'click-sparkle';
    const angle = (Math.PI * 2 * i) / count + Math.random()*0.4;
    const dist = 30 + Math.random()*40;
    s.style.setProperty('--sx', Math.cos(angle)*dist + 'px');
    s.style.setProperty('--sy', Math.sin(angle)*dist + 'px');
    s.style.left = x + 'px';
    s.style.top = y + 'px';
    sparkleLayer.appendChild(s);
    setTimeout(()=> s.remove(), 750);
  }
}
document.addEventListener('click', (e)=>{
  const interactive = e.target.closest('button, .polaroid, .gcard');
  if(interactive){ burstSparkles(e.clientX, e.clientY, 7); }
});

/* ================= FLOATING SPARKLES DI HERO ================= */
const heroSection = document.getElementById('hero');
function spawnHeroSparkle(){
  const el = document.createElement('span');
  el.className = 'hero-sparkle';
  el.textContent = '✨';
  el.style.left = (10 + Math.random()*80) + '%';
  el.style.top = (10 + Math.random()*70) + '%';
  el.style.animationDelay = (Math.random()*2) + 's';
  el.style.fontSize = (12 + Math.random()*10) + 'px';
  heroSection.appendChild(el);
}
for(let i=0;i<10;i++) spawnHeroSparkle();
function openGate(){
  ensureCtx();
  playChime();
  startMusic();
  document.getElementById('gate').classList.add('hidden');
}
document.getElementById('openBtn').addEventListener('click', openGate);
document.getElementById('envelopeBtn').addEventListener('click', openGate);

/* ================= AMBIENT FLOATING HEARTS ================= */
const ambient = document.getElementById('ambient');
const heartChars = ['💗','💕','✨','🩷'];
function spawnAmbient(){
  const el = document.createElement('div');
  el.className = 'amb-heart';
  el.textContent = heartChars[Math.floor(Math.random()*heartChars.length)];
  el.style.left = Math.random()*100 + 'vw';
  el.style.fontSize = (14 + Math.random()*18) + 'px';
  const dur = 9 + Math.random()*9;
  el.style.animationDuration = dur + 's';
  ambient.appendChild(el);
  setTimeout(()=> el.remove(), dur*1000 + 200);
}
setInterval(spawnAmbient, 900);
for(let i=0;i<6;i++) setTimeout(spawnAmbient, i*300);

/* ================= GALERI (dibangun dari PHOTOS di photos-config.js) ================= */
const grid = document.getElementById('gallery-grid');

// pola dekorasi & ukuran diulang biar variatif tapi tetap konsisten tiap reload
const decorations = ['tape-tl','pin','tape-tr','pin','tape-tl','tape-tr','pin','tape-tl'];
const sizes = ['size-lg','size-md','size-sm','size-md','size-sm','size-lg','size-md','size-sm'];
const rotations = [-3, 2, -5, 4, -2, 3, -4, 2.5]; // derajat, dibuat manual biar terasa "acak tangan"
const staggers = [0, 26, 10, 0, 34, 6, 18, 0]; // px, bikin baris atas tidak rata sejajar

PHOTOS.forEach((p, i)=>{
  const d = document.createElement('div');
  const deco = decorations[i % decorations.length];
  const size = sizes[i % sizes.length];
  const rot = rotations[i % rotations.length];
  const stagger = staggers[i % staggers.length];
  d.className = `polaroid ${deco} ${size}`;
  d.style.setProperty('--rot', rot + 'deg');
  d.style.setProperty('--stagger', (i * 110) + 'ms');
  d.style.marginBottom = '26px';
  d.style.marginTop = stagger + 'px';
  d.innerHTML = `<div class="photo-frame">
      <img src="${p.src}" alt="foto Yuna" loading="lazy">
    </div>
    <span class="cap">${p.cap || ''}</span>`;
  d.addEventListener('click', ()=>{
    playClick();
    openLightbox(p.src);
  });
  grid.appendChild(d);
});

/* ---- efek tilt 3D mengikuti kursor (khusus mouse, bukan touch) ---- */
if(window.matchMedia('(hover: hover) and (pointer: fine)').matches){
  document.querySelectorAll('.polaroid').forEach(card=>{
    card.addEventListener('mouseenter', ()=>{
      card.style.transition = 'transform .12s ease, box-shadow .35s ease';
    });
    card.addEventListener('mousemove', (e)=>{
      const r = card.getBoundingClientRect();
      const px = (e.clientX - r.left) / r.width - 0.5;
      const py = (e.clientY - r.top) / r.height - 0.5;
      card.style.transform = `perspective(700px) rotateX(${(-py*10).toFixed(2)}deg) rotateY(${(px*10).toFixed(2)}deg) translateY(-10px) scale(1.06)`;
    });
    card.addEventListener('mouseleave', ()=>{
      card.style.transition = '';
      card.style.transform = '';
    });
  });
}

const lightbox = document.getElementById('lightbox');
const lbImg = lightbox.querySelector('img');
function openLightbox(src){
  lbImg.src = src;
  lightbox.classList.add('open');
}
lightbox.querySelector('.close-lb').addEventListener('click', ()=>{
  playClick();
  lightbox.classList.remove('open');
});
lightbox.addEventListener('click', (e)=>{
  if(e.target === lightbox){ lightbox.classList.remove('open'); playClick(); }
});

/* ================= SCROLL REVEAL ================= */
const revealEls = document.querySelectorAll('.reveal, .polaroid');
const io = new IntersectionObserver((entries)=>{
  entries.forEach(entry=>{
    if(entry.isIntersecting){
      entry.target.classList.add('in');
      io.unobserve(entry.target);
    }
  });
},{threshold:0.15});
revealEls.forEach(el=> io.observe(el));

/* ================= HEART BUTTON + POP EFFECT ================= */
let heartCount = parseInt(localStorage.getItem('yuna-heart-count') || '0', 10);
const heartBtn = document.getElementById('heartBtn');
const heartCountEl = document.getElementById('heartCount');
const popLayer = document.getElementById('popHearts');

/* tampilkan jumlah klik yang sudah tersimpan saat halaman dibuka */
heartCountEl.textContent = heartCount + ' cinta terkirim';
if(heartCount > 0){ heartBtn.textContent = '💗'; }

heartBtn.addEventListener('click', ()=>{
  playPop();
  heartCount++;
  localStorage.setItem('yuna-heart-count', heartCount);
  heartCountEl.textContent = heartCount + ' cinta terkirim';
  heartBtn.textContent = '💗';
  for(let i=0;i<6;i++){
    const p = document.createElement('div');
    p.className = 'pop';
    p.textContent = ['💗','💕','🩷','✨'][Math.floor(Math.random()*4)];
    const rect = heartBtn.getBoundingClientRect();
    p.style.left = (rect.left + rect.width/2 + (Math.random()*80-40)) + 'px';
    p.style.top = (rect.top + (Math.random()*20-10)) + 'px';
    popLayer.appendChild(p);
    setTimeout(()=> p.remove(), 1500);
  }
});

/* click sound on game cards */
document.querySelectorAll('.gcard').forEach(c=>{
  c.addEventListener('click', playClick);
});
