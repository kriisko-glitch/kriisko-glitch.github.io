/**
 * Kriisko-Studio Juice Library v1
 * -------------------------------
 * Drop-in polish layer for 2D browser games. Adds screen shake, hit-flash,
 * particles, hit-stop, audio-beep, and common metadata hooks (highscore,
 * pause, community link) WITHOUT requiring game-engine-specific wiring.
 *
 * Usage:
 *   <script src="../shared/kriisko-juice.js"></script>
 *   // Then call from game code:
 *   KJ.shake(8, 180);                 // magnitude (px), duration (ms)
 *   KJ.flash('#fff', 90);              // color, duration (ms)
 *   KJ.particles(x, y, 16, '#ffc107'); // count, color
 *   KJ.hitStop(60);                    // ms pause
 *   KJ.beep(880, 60, 'square', 0.12);  // freq, ms, wave, volume
 *   KJ.thud();                         // low impact
 *   KJ.chime();                        // pickup
 *   KJ.hit();                          // damage
 *   KJ.onAction(fn)                    // called whenever player inputs
 *
 * Integration notes:
 *   - shake() applies a transform to the detected game canvas (first <canvas>)
 *     OR to document.body if no canvas — games can override via KJ.setTarget(el).
 *   - flash() overlays a full-screen color div (z-index 9999) briefly.
 *   - particles() paints on a dedicated overlay canvas at exactly the viewport
 *     dimensions — requires no coord translation.
 *   - hitStop() momentarily replaces requestAnimationFrame with a delayed
 *     version; safe across frame-loops.
 *   - All audio uses a single lazy AudioContext per page. User gesture unlocks it.
 *
 * MIT-like: internal use only, do not ship to itch.io customers without review.
 */
(function () {
  'use strict';
  if (window.KJ) return; // idempotent

  // -----------------------------------------------------------------------
  // Target canvas detection
  // -----------------------------------------------------------------------
  let _target = null;
  let _rafHooked = false;
  let _origRaf = window.requestAnimationFrame.bind(window);

  function getTarget() {
    if (_target) return _target;
    _target = document.querySelector('canvas') || document.body;
    return _target;
  }

  function setTarget(el) { _target = el; }

  // -----------------------------------------------------------------------
  // Overlay layers
  // -----------------------------------------------------------------------
  let _flashDiv = null;
  let _particleCanvas = null;
  let _particleCtx = null;
  let _particles = [];

  function ensureFlashDiv() {
    if (_flashDiv) return _flashDiv;
    _flashDiv = document.createElement('div');
    _flashDiv.style.cssText = 'position:fixed;inset:0;pointer-events:none;z-index:9999;opacity:0;transition:opacity 60ms linear;background:#fff;';
    document.body.appendChild(_flashDiv);
    return _flashDiv;
  }

  function ensureParticleLayer() {
    if (_particleCanvas) return _particleCanvas;
    _particleCanvas = document.createElement('canvas');
    const resize = () => {
      _particleCanvas.width = window.innerWidth;
      _particleCanvas.height = window.innerHeight;
    };
    _particleCanvas.style.cssText = 'position:fixed;inset:0;pointer-events:none;z-index:9998;';
    resize();
    window.addEventListener('resize', resize);
    document.body.appendChild(_particleCanvas);
    _particleCtx = _particleCanvas.getContext('2d');
    requestAnimationFrame(tickParticles);
    return _particleCanvas;
  }

  function tickParticles(now) {
    if (!_particleCtx) return;
    _particleCtx.clearRect(0, 0, _particleCanvas.width, _particleCanvas.height);
    for (let i = _particles.length - 1; i >= 0; i--) {
      const p = _particles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.15; // gravity
      p.life -= 16;
      if (p.life <= 0) { _particles.splice(i, 1); continue; }
      const a = Math.max(0, Math.min(1, p.life / p.maxLife));
      _particleCtx.globalAlpha = a;
      _particleCtx.fillStyle = p.color;
      _particleCtx.fillRect(p.x - p.size / 2, p.y - p.size / 2, p.size, p.size);
    }
    _particleCtx.globalAlpha = 1;
    requestAnimationFrame(tickParticles);
  }

  // -----------------------------------------------------------------------
  // Shake
  // -----------------------------------------------------------------------
  let _shakeUntil = 0;
  let _shakeMag = 0;
  let _shakeStart = 0;

  function shake(mag, ms) {
    const now = performance.now();
    _shakeUntil = Math.max(_shakeUntil, now + (ms || 180));
    _shakeMag = Math.max(_shakeMag, mag || 6);
    _shakeStart = now;
    if (!_rafHooked) {
      _rafHooked = true;
      const step = () => {
        const t = performance.now();
        const el = getTarget();
        if (t < _shakeUntil) {
          const remain = (_shakeUntil - t) / (_shakeUntil - _shakeStart);
          const m = _shakeMag * remain;
          const dx = (Math.random() - 0.5) * 2 * m;
          const dy = (Math.random() - 0.5) * 2 * m;
          if (el) el.style.transform = `translate(${dx.toFixed(2)}px,${dy.toFixed(2)}px)`;
          requestAnimationFrame(step);
        } else {
          if (el) el.style.transform = '';
          _shakeMag = 0;
          _rafHooked = false;
        }
      };
      requestAnimationFrame(step);
    }
  }

  // -----------------------------------------------------------------------
  // Flash
  // -----------------------------------------------------------------------
  function flash(color, ms) {
    const d = ensureFlashDiv();
    d.style.background = color || '#fff';
    d.style.opacity = '0.6';
    setTimeout(() => { d.style.opacity = '0'; }, Math.max(30, (ms || 80) / 2));
  }

  // -----------------------------------------------------------------------
  // Particles
  // -----------------------------------------------------------------------
  function particles(x, y, count, color) {
    ensureParticleLayer();
    const n = count || 12;
    const c = color || '#ffc107';
    for (let i = 0; i < n; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 1 + Math.random() * 4;
      _particles.push({
        x: x, y: y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 1,
        size: 2 + Math.random() * 3,
        color: c,
        life: 600 + Math.random() * 400,
        maxLife: 900
      });
    }
  }

  // -----------------------------------------------------------------------
  // Hit-stop
  // -----------------------------------------------------------------------
  let _inHitStop = false;
  function hitStop(ms) {
    if (_inHitStop) return;
    _inHitStop = true;
    const origRaf = window.requestAnimationFrame;
    window.requestAnimationFrame = function (cb) {
      return setTimeout(() => origRaf(cb), ms || 60);
    };
    setTimeout(() => {
      window.requestAnimationFrame = origRaf;
      _inHitStop = false;
    }, ms || 60);
  }

  // -----------------------------------------------------------------------
  // Audio
  // -----------------------------------------------------------------------
  let _ac = null;
  function getAC() {
    if (_ac) return _ac;
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    try { _ac = new AC(); } catch (_) { return null; }
    // Unlock on first user gesture
    const unlock = () => { if (_ac && _ac.state === 'suspended') _ac.resume(); };
    ['click', 'keydown', 'touchstart'].forEach(ev => window.addEventListener(ev, unlock, { once: true, capture: true }));
    return _ac;
  }

  function beep(freq, ms, type, vol) {
    const ac = getAC();
    if (!ac) return;
    try {
      const osc = ac.createOscillator();
      const gn = ac.createGain();
      osc.type = type || 'square';
      osc.frequency.value = freq || 440;
      gn.gain.value = 0;
      osc.connect(gn).connect(ac.destination);
      const now = ac.currentTime;
      const v = vol != null ? vol : 0.12;
      gn.gain.linearRampToValueAtTime(v, now + 0.005);
      gn.gain.linearRampToValueAtTime(0, now + (ms || 80) / 1000);
      osc.start(now);
      osc.stop(now + (ms || 80) / 1000 + 0.02);
    } catch (_) {}
  }

  function thud()  { beep(160, 90,  'sawtooth', 0.14); }
  function chime() { beep(880, 70,  'triangle', 0.10); setTimeout(() => beep(1320, 70, 'triangle', 0.08), 40); }
  function hit()   { beep(330, 60,  'square',   0.12); setTimeout(() => beep(220, 80, 'square',   0.10), 20); }
  function shoot() { beep(1200, 35, 'square',   0.07); }
  function pickup(){ beep(660, 50,  'sine',     0.10); setTimeout(() => beep(990, 60, 'sine',     0.08), 30); }
  function gameOver() { beep(220, 200, 'sawtooth', 0.14); setTimeout(() => beep(140, 300, 'sawtooth', 0.12), 160); }
  function levelUp()  { beep(440, 80, 'triangle', 0.10); setTimeout(() => beep(660, 80, 'triangle', 0.10), 80); setTimeout(() => beep(880, 120, 'triangle', 0.10), 160); }

  // -----------------------------------------------------------------------
  // Combined impact — for use in game code
  // -----------------------------------------------------------------------
  function impact(x, y, opts) {
    opts = opts || {};
    shake(opts.shakeMag || 6, opts.shakeMs || 160);
    flash(opts.flashColor || '#fff', opts.flashMs || 70);
    if (x != null && y != null) particles(x, y, opts.particleCount || 12, opts.particleColor || '#ffc107');
    if (opts.hitStop !== false) hitStop(opts.hitStopMs || 45);
    if (opts.sound !== false) hit();
  }

  // -----------------------------------------------------------------------
  // Action tracking (for juice per input)
  // -----------------------------------------------------------------------
  const _actionListeners = [];
  function onAction(fn) { _actionListeners.push(fn); }

  function _emitAction(type, evt) {
    for (const fn of _actionListeners) { try { fn(type, evt); } catch (_) {} }
  }

  window.addEventListener('keydown', e => _emitAction('key', e), true);
  window.addEventListener('click',   e => _emitAction('click', e), true);
  window.addEventListener('mousedown', e => _emitAction('mouse', e), true);

  // -----------------------------------------------------------------------
  // Public API
  // -----------------------------------------------------------------------
  window.KJ = {
    version: '1.0.0',
    setTarget, getTarget,
    shake, flash, particles, hitStop,
    beep, thud, chime, hit, shoot, pickup, gameOver, levelUp,
    impact, onAction
  };
})();
