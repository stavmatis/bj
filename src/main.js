import './style.css';

const canvas = document.querySelector('#bj-canvas');
const stage = document.querySelector('#creature-stage');
const ctx = canvas.getContext('2d');
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
let audioEnabled = false;
let audioContext;
let pointer = { x: .5, y: .42, active: false };
let t = 0;
let drops = [];

function resizeCanvas() {
  const dpr = Math.min(devicePixelRatio || 1, 2);
  const rect = stage.getBoundingClientRect();
  canvas.width = Math.max(1, Math.floor(rect.width * dpr));
  canvas.height = Math.max(1, Math.floor(rect.height * dpr));
  canvas.style.width = `${rect.width}px`;
  canvas.style.height = `${rect.height}px`;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
}

function localPointer(event) {
  const r = stage.getBoundingClientRect();
  pointer.x = Math.max(0, Math.min(1, (event.clientX - r.left) / r.width));
  pointer.y = Math.max(0, Math.min(1, (event.clientY - r.top) / r.height));
  pointer.active = true;
}
stage.addEventListener('pointermove', localPointer);
stage.addEventListener('pointerleave', () => { pointer.active = false; });
window.addEventListener('resize', resizeCanvas);

function blobPath(cx, cy, rx, ry, phase) {
  const count = 56;
  ctx.beginPath();
  for (let i = 0; i <= count; i++) {
    const a = (i / count) * Math.PI * 2;
    const wobble = 1 + Math.sin(a * 3 + phase) * .045 + Math.sin(a * 7 - phase * 1.7) * .025;
    const gravity = Math.max(0, Math.sin(a)) * .06;
    const x = cx + Math.cos(a) * rx * wobble;
    const y = cy + Math.sin(a) * ry * (wobble + gravity);
    if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
  }
  ctx.closePath();
}

function eye(x, y, w, h, tilt, targetX, targetY) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(tilt);
  ctx.fillStyle = '#f6f5e9';
  ctx.beginPath();
  ctx.ellipse(0, 0, w, h, 0, 0, Math.PI * 2);
  ctx.fill();
  const glintX = Math.max(-w * .1, Math.min(w * .1, (targetX - x) * .015));
  const glintY = Math.max(-h * .08, Math.min(h * .08, (targetY - y) * .012));
  ctx.globalAlpha = .12;
  ctx.fillStyle = '#a7a99d';
  ctx.beginPath();
  ctx.ellipse(glintX, glintY, w * .2, h * .12, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function addDrop(width, height) {
  drops.push({
    x: width * (.18 + Math.random() * .64),
    y: height * (.72 + Math.random() * .12),
    r: 2 + Math.random() * 8,
    vy: .3 + Math.random() * .8,
    life: 180 + Math.random() * 180
  });
}

function drawCreature() {
  const dpr = Math.min(devicePixelRatio || 1, 2);
  const w = canvas.width / dpr;
  const h = canvas.height / dpr;
  ctx.clearRect(0, 0, w, h);
  t += reducedMotion ? 0 : .018;

  const cx = w * (.50 + Math.sin(t * .45) * .018);
  const cy = h * (.59 + Math.sin(t * .7) * .012);
  const rx = Math.min(w * .39, 280);
  const ry = Math.min(h * .37, 300);
  const tx = pointer.active ? pointer.x * w : w * (.52 + Math.sin(t * .5) * .15);
  const ty = pointer.active ? pointer.y * h : h * (.31 + Math.sin(t * .4) * .05);

  ctx.save();
  ctx.shadowColor = 'rgba(0,0,0,.22)';
  ctx.shadowBlur = 24;
  ctx.shadowOffsetY = 18;
  ctx.fillStyle = '#080b08';
  blobPath(cx, cy, rx, ry, t);
  ctx.fill();
  ctx.restore();

  ctx.save();
  blobPath(cx, cy, rx, ry, t);
  ctx.clip();
  const shine = ctx.createRadialGradient(cx - rx * .25, cy - ry * .34, 0, cx, cy, rx * 1.2);
  shine.addColorStop(0, 'rgba(255,255,255,.14)');
  shine.addColorStop(.23, 'rgba(255,255,255,.02)');
  shine.addColorStop(.67, 'rgba(0,0,0,0)');
  shine.addColorStop(1, 'rgba(0,0,0,.65)');
  ctx.fillStyle = shine;
  ctx.fillRect(cx-rx, cy-ry, rx*2, ry*2);
  ctx.restore();

  const eyeSpread = rx * .34;
  const eyeY = cy - ry * .18;
  eye(cx - eyeSpread, eyeY + Math.sin(t) * 3, rx * .16, ry * .25, -.13, tx, ty);
  eye(cx + eyeSpread, eyeY + Math.cos(t * .9) * 3, rx * .16, ry * .25, .13, tx, ty);

  ctx.strokeStyle = '#181e18';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(cx - rx * .12, cy + ry * .27);
  ctx.quadraticCurveTo(cx, cy + ry * (.22 + Math.sin(t * 1.3) * .015), cx + rx * .12, cy + ry * .27);
  ctx.stroke();

  if (!reducedMotion && Math.random() < .013) addDrop(w, h);
  drops.forEach(d => {
    d.y += d.vy; d.life -= 1;
    ctx.globalAlpha = Math.min(1, d.life / 40);
    ctx.fillStyle = '#080b08';
    ctx.beginPath(); ctx.arc(d.x, d.y, d.r, 0, Math.PI*2); ctx.fill();
  });
  ctx.globalAlpha = 1;
  drops = drops.filter(d => d.life > 0 && d.y < h + 20);

  requestAnimationFrame(drawCreature);
}

function tone(kind='eat') {
  if (!audioEnabled) return;
  audioContext ||= new (window.AudioContext || window.webkitAudioContext)();
  const now = audioContext.currentTime;
  const osc = audioContext.createOscillator();
  const gain = audioContext.createGain();
  const filter = audioContext.createBiquadFilter();
  osc.type = kind === 'eat' ? 'sawtooth' : 'square';
  osc.frequency.setValueAtTime(kind === 'eat' ? 105 : 68, now);
  osc.frequency.exponentialRampToValueAtTime(kind === 'eat' ? 42 : 31, now + .42);
  filter.type = 'lowpass'; filter.frequency.value = 380;
  gain.gain.setValueAtTime(.0001, now);
  gain.gain.exponentialRampToValueAtTime(.09, now + .03);
  gain.gain.exponentialRampToValueAtTime(.0001, now + .48);
  osc.connect(filter).connect(gain).connect(audioContext.destination);
  osc.start(now); osc.stop(now + .5);
}

const soundToggle = document.querySelector('#sound-toggle');
soundToggle.addEventListener('click', () => {
  audioEnabled = !audioEnabled;
  soundToggle.textContent = `sound: ${audioEnabled ? 'on' : 'off'}`;
  soundToggle.setAttribute('aria-pressed', String(audioEnabled));
  if (audioEnabled) tone('spit');
});

const machine = document.querySelector('.machine-belly');
const status = document.querySelector('#machine-status');
const result = document.querySelector('#slop-result');
const resultCopy = document.querySelector('#slop-copy');
const cards = [...document.querySelectorAll('.content-card')];
const slop = {
  poem: '“A POIGNANT TAPESTRY OF LOVE, LOSS & HEALING.”',
  photo: '“A STUNNING VISUAL JOURNEY THAT TRANSCENDS BOUNDARIES.”',
  idea: '“REVOLUTIONISING CREATIVITY, ONE BOLD IDEA AT A TIME.”'
};
let busy = false;

cards.forEach(card => card.addEventListener('click', () => {
  if (busy) return;
  busy = true;
  status.textContent = 'CHEWING';
  result.classList.remove('done');
  resultCopy.textContent = 'PROCESSING YOUR LIVED EXPERIENCE…';
  card.classList.add('consumed');
  machine.classList.add('processing');
  tone('eat');

  setTimeout(() => {
    status.textContent = 'REGURGITATING';
    tone('spit');
  }, 650);
  setTimeout(() => {
    resultCopy.textContent = slop[card.dataset.type];
    result.classList.add('done');
    status.textContent = 'SLOP COMPLETE';
    machine.classList.remove('processing');
  }, 1050);
  setTimeout(() => {
    card.classList.remove('consumed');
    status.textContent = 'READY';
    busy = false;
  }, 2300);
}));

const waitlist = document.querySelector('#waitlist-form');
const email = document.querySelector('#email');
const formStatus = document.querySelector('#form-status');
waitlist.addEventListener('submit', event => {
  event.preventDefault();
  const valid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.value.trim());
  formStatus.className = `form-status ${valid ? 'success' : 'error'}`;
  formStatus.textContent = valid
    ? 'You’re on the prototype list. No backend yet — your address stayed on this device.'
    : 'That does not look like an email a human could answer.';
  if (valid) localStorage.setItem('bj-waitlist-prototype', email.value.trim());
});

resizeCanvas();
drawCreature();
