/**
 * Kriisko-Studio Universal Mobile Touch Controls
 *
 * Reads `document.body.dataset.mobileControls` to select a scheme:
 *   swipe    – Snake (swipe gestures → arrow key events)
 *   drag     – Breakout (finger position → mousemove events)
 *   dpad     – Platformer / Space Shooter / Dungeon Crawl (overlay D-pad + action btn)
 *   joystick – Survivors Arena / Void Drift / Tower Defense (virtual stick + fire btn)
 *   click    – Whiskers & Wands / Particle Forge (tap = click, no overlay)
 *
 * Desktop is completely unaffected — the script exits immediately on non-touch devices.
 */
(function () {
  'use strict';

  var isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
  if (!isTouchDevice) return;

  var scheme = (document.body.dataset.mobileControls || 'click').toLowerCase();

  // --- Helpers -----------------------------------------------------------

  function dispatch(type, code, key) {
    var ev = new KeyboardEvent(type, {
      code: code, key: key, bubbles: true, cancelable: true
    });
    document.dispatchEvent(ev);
  }

  function dispatchDown(code, key) { dispatch('keydown', code, key); }
  function dispatchUp(code, key)   { dispatch('keyup', code, key); }

  function injectCSS(css) {
    var s = document.createElement('style');
    s.textContent = css;
    document.head.appendChild(s);
  }

  var BTN_SIZE = 64;
  var BTN_GAP = 6;

  var OVERLAY_CSS =
    '.mc-overlay{position:fixed;bottom:0;left:0;width:100%;height:100%;' +
    'pointer-events:none;z-index:9999;touch-action:none;}' +
    '.mc-overlay *{pointer-events:auto;}' +
    '.mc-btn{position:absolute;width:' + BTN_SIZE + 'px;height:' + BTN_SIZE + 'px;' +
    'border-radius:14px;background:rgba(255,255,255,0.12);' +
    'border:2px solid rgba(255,255,255,0.18);display:flex;' +
    'align-items:center;justify-content:center;font-size:22px;' +
    'color:rgba(255,255,255,0.55);user-select:none;-webkit-user-select:none;' +
    'touch-action:none;}' +
    '.mc-btn:active,.mc-btn.held{background:rgba(255,255,255,0.28);}';

  function createOverlay() {
    injectCSS(OVERLAY_CSS);
    var el = document.createElement('div');
    el.className = 'mc-overlay';
    document.body.appendChild(el);
    return el;
  }

  function addBtn(parent, label, bottom, left, right) {
    var btn = document.createElement('div');
    btn.className = 'mc-btn';
    btn.textContent = label;
    btn.style.bottom = bottom + 'px';
    if (left !== undefined) btn.style.left = left + 'px';
    if (right !== undefined) btn.style.right = right + 'px';
    parent.appendChild(btn);
    return btn;
  }

  function bindBtn(btn, code, key) {
    var active = false;
    btn.addEventListener('touchstart', function (e) {
      e.preventDefault();
      if (!active) { active = true; btn.classList.add('held'); dispatchDown(code, key); }
    }, { passive: false });
    btn.addEventListener('touchend', function (e) {
      e.preventDefault();
      if (active) { active = false; btn.classList.remove('held'); dispatchUp(code, key); }
    }, { passive: false });
    btn.addEventListener('touchcancel', function () {
      if (active) { active = false; btn.classList.remove('held'); dispatchUp(code, key); }
    });
  }

  // --- SWIPE (Snake) -----------------------------------------------------

  if (scheme === 'swipe') {
    var startX = 0, startY = 0;
    document.addEventListener('touchstart', function (e) {
      var t = e.touches[0];
      startX = t.clientX; startY = t.clientY;
    }, { passive: true });

    document.addEventListener('touchend', function (e) {
      var t = e.changedTouches[0];
      var dx = t.clientX - startX, dy = t.clientY - startY;
      var absDx = Math.abs(dx), absDy = Math.abs(dy);

      if (absDx < 30 && absDy < 30) {
        dispatchDown('Enter', 'Enter');
        setTimeout(function () { dispatchUp('Enter', 'Enter'); }, 60);
        return;
      }

      if (absDx > absDy) {
        var code = dx > 0 ? 'ArrowRight' : 'ArrowLeft';
        dispatchDown(code, code);
        setTimeout(function () { dispatchUp(code, code); }, 60);
      } else {
        var code2 = dy > 0 ? 'ArrowDown' : 'ArrowUp';
        dispatchDown(code2, code2);
        setTimeout(function () { dispatchUp(code2, code2); }, 60);
      }
    }, { passive: true });

    return;
  }

  // --- DRAG (Breakout) ---------------------------------------------------

  if (scheme === 'drag') {
    var canvas = document.querySelector('canvas');
    if (canvas) canvas.style.touchAction = 'none';

    document.addEventListener('touchstart', function (e) {
      e.preventDefault();
      var t = e.touches[0];
      var ev = new MouseEvent('mousemove', {
        clientX: t.clientX, clientY: t.clientY, bubbles: true
      });
      (canvas || document).dispatchEvent(ev);

      var click = new MouseEvent('mousedown', {
        clientX: t.clientX, clientY: t.clientY, bubbles: true
      });
      (canvas || document).dispatchEvent(click);
    }, { passive: false });

    document.addEventListener('touchmove', function (e) {
      e.preventDefault();
      var t = e.touches[0];
      var ev = new MouseEvent('mousemove', {
        clientX: t.clientX, clientY: t.clientY, bubbles: true
      });
      (canvas || document).dispatchEvent(ev);
    }, { passive: false });

    document.addEventListener('touchend', function () {
      var ev = new MouseEvent('mouseup', { bubbles: true });
      (canvas || document).dispatchEvent(ev);
    }, { passive: true });

    return;
  }

  // --- DPAD (Platformer / Space Shooter / Dungeon Crawl) -----------------

  if (scheme === 'dpad') {
    var overlay = createOverlay();
    var pad = BTN_SIZE + BTN_GAP;
    var baseL = 16;
    var baseB = 24;

    var up    = addBtn(overlay, '\u25B2', baseB + pad * 2, baseL + pad);
    var down  = addBtn(overlay, '\u25BC', baseB,           baseL + pad);
    var left  = addBtn(overlay, '\u25C0', baseB + pad,     baseL);
    var right = addBtn(overlay, '\u25B6', baseB + pad,     baseL + pad * 2);

    bindBtn(up,    'ArrowUp',    'ArrowUp');
    bindBtn(down,  'ArrowDown',  'ArrowDown');
    bindBtn(left,  'ArrowLeft',  'ArrowLeft');
    bindBtn(right, 'ArrowRight', 'ArrowRight');

    var actionBtn = addBtn(overlay, '\u26A1', baseB + pad, undefined, 24);
    actionBtn.style.width = (BTN_SIZE * 1.3) + 'px';
    actionBtn.style.height = (BTN_SIZE * 1.3) + 'px';
    actionBtn.style.borderRadius = '50%';
    actionBtn.style.fontSize = '28px';
    bindBtn(actionBtn, 'Space', ' ');

    var action2 = addBtn(overlay, 'X', baseB + pad * 2 + BTN_GAP, undefined, 24);
    action2.style.width = BTN_SIZE + 'px';
    action2.style.height = (BTN_SIZE * 0.7) + 'px';
    action2.style.fontSize = '16px';
    bindBtn(action2, 'KeyX', 'x');

    return;
  }

  // --- JOYSTICK (Survivors Arena / Void Drift / Tower Defense) -----------

  if (scheme === 'joystick') {
    var jOverlay = createOverlay();

    injectCSS(
      '.mc-jbase{position:absolute;bottom:30px;left:24px;width:120px;height:120px;' +
      'border-radius:50%;background:rgba(255,255,255,0.08);' +
      'border:2px solid rgba(255,255,255,0.15);}' +
      '.mc-knob{position:absolute;width:50px;height:50px;border-radius:50%;' +
      'background:rgba(255,255,255,0.3);border:2px solid rgba(255,255,255,0.4);' +
      'top:35px;left:35px;touch-action:none;}'
    );

    var jBase = document.createElement('div');
    jBase.className = 'mc-jbase';
    var knob = document.createElement('div');
    knob.className = 'mc-knob';
    jBase.appendChild(knob);
    jOverlay.appendChild(jBase);

    var fireBtn = addBtn(jOverlay, '\u26A1', 55, undefined, 24);
    fireBtn.style.width = '80px';
    fireBtn.style.height = '80px';
    fireBtn.style.borderRadius = '50%';
    fireBtn.style.fontSize = '30px';
    bindBtn(fireBtn, 'Space', ' ');

    var jActive = false;
    var held = { w: false, a: false, s: false, d: false };
    var DEAD_ZONE = 0.25;

    function setKey(k, state) {
      var map = { w: ['KeyW','w'], a: ['KeyA','a'], s: ['KeyS','s'], d: ['KeyD','d'] };
      if (held[k] === state) return;
      held[k] = state;
      if (state) dispatchDown(map[k][0], map[k][1]);
      else       dispatchUp(map[k][0], map[k][1]);
    }

    function releaseAll() {
      setKey('w', false); setKey('a', false);
      setKey('s', false); setKey('d', false);
    }

    function updateKnob(tx, ty) {
      var rect = jBase.getBoundingClientRect();
      var cx = rect.left + rect.width / 2;
      var cy = rect.top + rect.height / 2;
      var dx = tx - cx, dy = ty - cy;
      var dist = Math.sqrt(dx * dx + dy * dy);
      var maxR = rect.width / 2;

      if (dist > maxR) { dx = dx / dist * maxR; dy = dy / dist * maxR; dist = maxR; }

      knob.style.left = (35 + dx) + 'px';
      knob.style.top  = (35 + dy) + 'px';

      var norm = dist / maxR;
      if (norm < DEAD_ZONE) { releaseAll(); return; }

      var angle = Math.atan2(dy, dx);
      setKey('d', angle > -Math.PI * 0.625 && angle < Math.PI * 0.375);
      setKey('a', angle > Math.PI * 0.625 || angle < -Math.PI * 0.375);
      setKey('w', angle < -Math.PI * 0.125 && angle > -Math.PI * 0.875);
      setKey('s', angle > Math.PI * 0.125 && angle < Math.PI * 0.875);
    }

    var jTouchId = null;
    jBase.addEventListener('touchstart', function (e) {
      e.preventDefault();
      jActive = true;
      jTouchId = e.changedTouches[0].identifier;
      updateKnob(e.changedTouches[0].clientX, e.changedTouches[0].clientY);
    }, { passive: false });

    document.addEventListener('touchmove', function (e) {
      if (!jActive) return;
      for (var i = 0; i < e.changedTouches.length; i++) {
        if (e.changedTouches[i].identifier === jTouchId) {
          updateKnob(e.changedTouches[i].clientX, e.changedTouches[i].clientY);
          break;
        }
      }
    }, { passive: true });

    function endJoystick() {
      jActive = false; jTouchId = null;
      knob.style.left = '35px'; knob.style.top = '35px';
      releaseAll();
    }

    document.addEventListener('touchend', function (e) {
      if (!jActive) return;
      for (var i = 0; i < e.changedTouches.length; i++) {
        if (e.changedTouches[i].identifier === jTouchId) { endJoystick(); break; }
      }
    }, { passive: true });
    document.addEventListener('touchcancel', endJoystick, { passive: true });

    return;
  }

  // --- CLICK (Whiskers & Wands / Particle Forge) -------------------------

  var cvs = document.querySelector('canvas');
  if (cvs) cvs.style.touchAction = 'none';
})();
