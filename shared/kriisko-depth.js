/**
 * Kriisko-Studio Depth Library v1
 * -------------------------------
 * Gives 2D canvas games a 3D-like feel without changing their render loops.
 *
 * Three layers:
 *   1. CSS-based depth — drop-shadow on canvas, vignette, floor-glow plate,
 *      ambient overlay, subtle perspective on wrappers. Zero-config.
 *   2. Canvas helpers (window.KD.sphere, KD.bevel, KD.tile, KD.shadow) —
 *      optional: games can call these to draw primitives with auto-shading.
 *   3. Runtime tilt/lift on HUD chips — CSS transform + shadow pop.
 *
 * Usage: automatic. kriisko-meta.js loads this script. Call KD.enable() to
 * override defaults, e.g. KD.enable({ tilt: 6 }) for a subtle pitch.
 *
 * All effects are additive and non-destructive — canvas pixels are unchanged.
 * If a game looks worse, call KD.disable() from devtools.
 */
(function () {
  'use strict';
  if (window.KD) return;

  const DEFAULTS = {
    perspective: true,       // CSS perspective on canvas container
    tilt: 4,                  // degrees rotateX (subtle camera tilt)
    vignette: true,           // corner darkening overlay
    floorGlow: true,          // soft gradient "shadow plate" beneath canvas
    dropShadow: true,         // CSS drop-shadow on <canvas>
    innerGlow: true,          // inner rim-light on canvas (via wrapper overlay)
    canvasPolish: true,       // CSS filter on canvas (saturate + contrast bump)
    scanline: true,           // faint scanline overlay over canvas
    ambient: true,            // subtle top-to-bottom gradient on body
    shine: true,              // specular sweep overlay
    hudLift: true,            // elevation shadow on HUD chips
    auto: true                // apply on DOM ready automatically
  };

  let cfg = Object.assign({}, DEFAULTS);
  let _applied = false;

  // -----------------------------------------------------------------------
  // Color helpers (support #rgb, #rrggbb, rgb(...))
  // -----------------------------------------------------------------------
  function parseColor(c) {
    if (!c) return [128, 128, 128];
    if (c[0] === '#') {
      let hex = c.slice(1);
      if (hex.length === 3) hex = hex[0] + hex[0] + hex[1] + hex[1] + hex[2] + hex[2];
      return [parseInt(hex.slice(0, 2), 16), parseInt(hex.slice(2, 4), 16), parseInt(hex.slice(4, 6), 16)];
    }
    const m = c.match(/rgba?\s*\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/);
    if (m) return [+m[1], +m[2], +m[3]];
    return [128, 128, 128];
  }
  function clip(n) { return Math.max(0, Math.min(255, Math.round(n))); }
  function lighten(c, a) {
    const [r, g, b] = parseColor(c);
    return 'rgb(' + clip(r + (255 - r) * a) + ',' + clip(g + (255 - g) * a) + ',' + clip(b + (255 - b) * a) + ')';
  }
  function darken(c, a) {
    const [r, g, b] = parseColor(c);
    return 'rgb(' + clip(r * (1 - a)) + ',' + clip(g * (1 - a)) + ',' + clip(b * (1 - a)) + ')';
  }

  // -----------------------------------------------------------------------
  // CSS layer
  // -----------------------------------------------------------------------
  function buildStyles() {
    const existing = document.getElementById('km-depth-styles');
    if (existing) existing.remove();
    const s = document.createElement('style');
    s.id = 'km-depth-styles';
    const tilt = cfg.tilt ? `transform: perspective(1600px) rotateX(${cfg.tilt}deg); transform-origin: center center;` : '';
    const canvasFilters = [];
    if (cfg.dropShadow) {
      canvasFilters.push('drop-shadow(0 22px 32px rgba(0,0,0,0.62))');
      canvasFilters.push('drop-shadow(0 4px 6px rgba(0,0,0,0.45))');
      canvasFilters.push('drop-shadow(0 0 18px rgba(0,229,255,0.18))');
    }
    if (cfg.canvasPolish) {
      canvasFilters.push('saturate(1.12)');
      canvasFilters.push('contrast(1.06)');
      canvasFilters.push('brightness(1.02)');
    }
    const canvasFilter = canvasFilters.length ? `filter: ${canvasFilters.join(' ')};` : '';

    s.textContent = `
      /* KD depth layer: canvas elevation + perspective */
      canvas {
        ${canvasFilter}
        ${tilt}
        border-radius: 4px;
        transition: filter 0.3s ease, transform 0.3s ease;
      }

      ${cfg.innerGlow ? `
      /* Inner rim-light — uses a positioned overlay anchored to each canvas */
      .km-depth-rim {
        position: absolute;
        pointer-events: none;
        z-index: 9;
        border-radius: 4px;
        box-shadow:
          inset 0 1px 0 rgba(255,255,255,0.18),
          inset 0 -2px 4px rgba(0,0,0,0.5),
          inset 0 0 24px rgba(0, 180, 255, 0.08);
        transition: transform 0.3s ease;
      }` : ''}

      ${cfg.scanline ? `
      /* Very faint CRT scanline pattern over canvas */
      .km-depth-scanline {
        position: absolute;
        pointer-events: none;
        z-index: 10;
        mix-blend-mode: overlay;
        opacity: 0.35;
        background: repeating-linear-gradient(
          to bottom,
          rgba(255,255,255,0.04) 0px,
          rgba(255,255,255,0.04) 1px,
          transparent 1px,
          transparent 3px);
        border-radius: 4px;
        transition: transform 0.3s ease;
      }` : ''}

      ${cfg.floorGlow ? `
      /* Floor glow plate behind canvas */
      body::before {
        content: '';
        position: fixed;
        left: 50%;
        bottom: 2vh;
        width: 90vw;
        max-width: 1400px;
        height: 8vh;
        transform: translateX(-50%);
        background: radial-gradient(ellipse at center, rgba(0,229,255,0.10) 0%, rgba(0,229,255,0.04) 40%, transparent 75%);
        filter: blur(20px);
        pointer-events: none;
        z-index: 0;
      }` : ''}

      ${cfg.vignette ? `
      /* Soft corner vignette */
      html::after {
        content: '';
        position: fixed;
        inset: 0;
        pointer-events: none;
        z-index: 9988;
        background: radial-gradient(ellipse at center, transparent 55%, rgba(0,0,0,0.35) 100%);
        mix-blend-mode: multiply;
      }` : ''}

      ${cfg.ambient ? `
      /* Ambient top-to-bottom gradient on body */
      body::after {
        content: '';
        position: fixed;
        inset: 0;
        pointer-events: none;
        z-index: 9987;
        background:
          linear-gradient(to bottom,
            rgba(120, 180, 255, 0.04) 0%,
            rgba(0, 0, 0, 0.00) 35%,
            rgba(0, 0, 0, 0.00) 65%,
            rgba(20, 10, 30, 0.10) 100%);
      }` : ''}

      ${cfg.shine ? `
      /* Soft specular sweep on the window — very subtle */
      body > .km-depth-shine {
        position: fixed;
        top: -30%;
        left: -20%;
        width: 60vw;
        height: 40vh;
        pointer-events: none;
        background: radial-gradient(ellipse, rgba(255,255,255,0.045), transparent 60%);
        transform: rotate(-12deg);
        z-index: 9986;
      }` : ''}

      ${cfg.hudLift ? `
      /* Elevate any HUD chip / button / overlay card */
      .chip, .km-chip, #km-hud .km-chip, .btn-diff, .btn-perk, .btn-upg, .diff-btn, .go-btn,
      .card, .upgrade-card, .toast, .ach-toast, #toast, .overlay .km-panel,
      #start-overlay, #chooseUpgrade, #difficulty-select, #perk-tree, #upgrade-modal,
      #km-gameover-overlay .km-panel, #km-pause-overlay .km-panel {
        box-shadow:
          0 6px 14px rgba(0, 0, 0, 0.45),
          0 2px 4px rgba(0, 0, 0, 0.35),
          inset 0 1px 0 rgba(255, 255, 255, 0.08);
      }
      /* Button press depth */
      .chip:active, .km-chip:active, button:active, .diff-btn:active {
        transform: translateY(1px);
        box-shadow:
          0 2px 6px rgba(0, 0, 0, 0.4),
          inset 0 1px 0 rgba(255, 255, 255, 0.05);
      }` : ''}
    `;
    document.head.appendChild(s);

    // Specular shine element
    if (cfg.shine && !document.querySelector('.km-depth-shine')) {
      const shine = document.createElement('div');
      shine.className = 'km-depth-shine';
      document.body.appendChild(shine);
    } else if (!cfg.shine) {
      const shine = document.querySelector('.km-depth-shine');
      if (shine) shine.remove();
    }
  }

  // -----------------------------------------------------------------------
  // Per-canvas rim + scanline overlays (positioned to match canvas bounds)
  // -----------------------------------------------------------------------
  function syncCanvasOverlays() {
    const canvases = document.querySelectorAll('canvas');
    canvases.forEach((c, i) => {
      const rect = c.getBoundingClientRect();
      if (rect.width < 40 || rect.height < 40) return;
      const mkOverlay = (className) => {
        let el = c._kdOverlays && c._kdOverlays[className];
        if (!el) {
          el = document.createElement('div');
          el.className = className;
          document.body.appendChild(el);
          c._kdOverlays = c._kdOverlays || {};
          c._kdOverlays[className] = el;
        }
        // Read live transform from canvas; the rim should lift with it
        const cs = getComputedStyle(c);
        el.style.left = (rect.left + window.scrollX) + 'px';
        el.style.top = (rect.top + window.scrollY) + 'px';
        el.style.width = rect.width + 'px';
        el.style.height = rect.height + 'px';
        el.style.transform = cs.transform === 'none' ? '' : cs.transform;
        el.style.transformOrigin = cs.transformOrigin;
      };
      if (cfg.innerGlow) mkOverlay('km-depth-rim');
      if (cfg.scanline) mkOverlay('km-depth-scanline');
    });
  }

  function removeOverlays() {
    document.querySelectorAll('.km-depth-rim, .km-depth-scanline').forEach(el => el.remove());
    document.querySelectorAll('canvas').forEach(c => { delete c._kdOverlays; });
  }

  let _resizeObserver = null;
  let _rafScheduled = false;
  function scheduleSync() {
    if (_rafScheduled) return;
    _rafScheduled = true;
    requestAnimationFrame(() => { _rafScheduled = false; syncCanvasOverlays(); });
  }

  function installWatchers() {
    window.addEventListener('resize', scheduleSync);
    window.addEventListener('scroll', scheduleSync, { passive: true });
    if (typeof ResizeObserver !== 'undefined') {
      _resizeObserver = new ResizeObserver(scheduleSync);
      document.querySelectorAll('canvas').forEach(c => _resizeObserver.observe(c));
    }
    // Re-sync every 1s as safety net for games that hot-swap canvases
    setInterval(scheduleSync, 1000);
  }

  function apply() {
    try {
      buildStyles();
      removeOverlays();
      // Defer overlay positioning so layout is settled
      setTimeout(() => { syncCanvasOverlays(); installWatchers(); }, 100);
      setTimeout(syncCanvasOverlays, 400);
      setTimeout(syncCanvasOverlays, 1000);
      _applied = true;
    } catch (_) {}
  }

  function disable() {
    cfg = Object.assign({}, DEFAULTS, { perspective: false, tilt: 0, vignette: false, floorGlow: false, dropShadow: false, ambient: false, shine: false, hudLift: false });
    apply();
    _applied = false;
  }

  function enable(opts) {
    cfg = Object.assign({}, DEFAULTS, opts || {});
    apply();
  }

  // -----------------------------------------------------------------------
  // Canvas helpers — optional, called from game code to get 3D-shaded primitives
  // -----------------------------------------------------------------------

  /** Draw a shaded sphere with shadow + radial gradient + specular highlight. */
  function sphere(ctx, x, y, r, color) {
    if (!ctx) return;
    ctx.save();
    // Ground shadow (offset down-right, softened)
    ctx.fillStyle = 'rgba(0,0,0,0.35)';
    ctx.beginPath();
    ctx.ellipse(x + r * 0.2, y + r * 0.9, r * 0.9, r * 0.3, 0, 0, Math.PI * 2);
    ctx.fill();
    // Sphere body with radial gradient (light from top-left)
    const grad = ctx.createRadialGradient(x - r * 0.3, y - r * 0.3, 0, x, y, r);
    grad.addColorStop(0, lighten(color, 0.55));
    grad.addColorStop(0.35, color);
    grad.addColorStop(1, darken(color, 0.45));
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
    // Specular highlight
    ctx.fillStyle = 'rgba(255,255,255,0.65)';
    ctx.beginPath();
    ctx.arc(x - r * 0.35, y - r * 0.35, r * 0.18, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  /** Draw a beveled rectangle (top lit, bottom shadowed). */
  function bevel(ctx, x, y, w, h, color) {
    if (!ctx) return;
    ctx.save();
    // Drop shadow
    ctx.fillStyle = 'rgba(0,0,0,0.35)';
    ctx.fillRect(x + 2, y + 3, w, h);
    // Main gradient
    const grad = ctx.createLinearGradient(x, y, x, y + h);
    grad.addColorStop(0, lighten(color, 0.25));
    grad.addColorStop(0.5, color);
    grad.addColorStop(1, darken(color, 0.3));
    ctx.fillStyle = grad;
    ctx.fillRect(x, y, w, h);
    // Top highlight line
    ctx.fillStyle = 'rgba(255,255,255,0.25)';
    ctx.fillRect(x, y, w, Math.max(1, Math.floor(h * 0.08)));
    // Bottom shadow line
    ctx.fillStyle = 'rgba(0,0,0,0.3)';
    ctx.fillRect(x, y + h - Math.max(1, Math.floor(h * 0.08)), w, Math.max(1, Math.floor(h * 0.08)));
    ctx.restore();
  }

  /** Draw a tile (isometric-friendly diamond) with faux-3D shading. */
  function tile(ctx, x, y, w, h, color) {
    if (!ctx) return;
    ctx.save();
    // Base shadow
    ctx.fillStyle = 'rgba(0,0,0,0.3)';
    ctx.beginPath();
    ctx.moveTo(x, y + h / 2 + 2);
    ctx.lineTo(x + w / 2, y + h + 2);
    ctx.lineTo(x + w, y + h / 2 + 2);
    ctx.lineTo(x + w / 2, y + 2);
    ctx.closePath();
    ctx.fill();
    // Top face
    const grad = ctx.createLinearGradient(x, y, x, y + h);
    grad.addColorStop(0, lighten(color, 0.2));
    grad.addColorStop(1, darken(color, 0.2));
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.moveTo(x, y + h / 2);
    ctx.lineTo(x + w / 2, y + h);
    ctx.lineTo(x + w, y + h / 2);
    ctx.lineTo(x + w / 2, y);
    ctx.closePath();
    ctx.fill();
    // Edge highlight
    ctx.strokeStyle = 'rgba(255,255,255,0.2)';
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.restore();
  }

  /** Draw a soft ground shadow beneath a point. */
  function shadow(ctx, x, y, r, alpha) {
    if (!ctx) return;
    ctx.save();
    ctx.fillStyle = 'rgba(0,0,0,' + (alpha || 0.35) + ')';
    ctx.beginPath();
    ctx.ellipse(x, y, r, r * 0.35, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  // -----------------------------------------------------------------------
  // Public API
  // -----------------------------------------------------------------------
  window.KD = {
    version: '1.0.0',
    enable, disable, apply,
    sphere, bevel, tile, shadow,
    lighten, darken,
    get config() { return Object.assign({}, cfg); }
  };

  // Auto-apply on DOM ready if configured to
  function autoInit() {
    if (cfg.auto) apply();
  }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', autoInit);
  } else {
    // Defer one tick so inline game styles load first
    setTimeout(autoInit, 0);
  }
})();
