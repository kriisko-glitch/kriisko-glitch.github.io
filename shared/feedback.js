(function () {
  'use strict';

  var CONFIG = window.KriiskoFeedbackConfig || {};
  var BUTTON_LABEL = CONFIG.label || 'Feedback';
  var BUTTON_TITLE = CONFIG.title || 'Report bug or share feedback';
  var FEEDBACK_PAGE = CONFIG.pageUrl || null;
  var BUTTON_ID = 'kriisko-feedback-launcher';
  var Z_INDEX = 10001;

  function getPath() {
    return (location.pathname || '').replace(/\\/g, '/').toLowerCase();
  }

  function isFeedbackPage() {
    return /\/feedback\/(?:index\.html)?$/.test(getPath());
  }

  function detectGameSlug() {
    var path = getPath();
    var segments = path.split('/').filter(Boolean);
    var last = segments.length ? segments[segments.length - 1] : '';

    if (last === 'index.html' && segments.length >= 2) {
      var parent = segments[segments.length - 2];
      if (parent && parent !== 'games' && parent !== 'feedback') return parent;
      return 'portal';
    }

    var gamesIndex = segments.indexOf('games');
    if (gamesIndex >= 0 && segments[gamesIndex + 1] && segments[gamesIndex + 1] !== 'feedback') {
      return segments[gamesIndex + 1];
    }

    if (segments.length && segments[0] && segments[0] !== 'games' && segments[0] !== 'feedback' && segments[0] !== 'index.html') {
      return segments[0].replace(/\.html$/, '');
    }

    return 'portal';
  }

  function detectFeedbackUrl() {
    if (typeof FEEDBACK_PAGE === 'string' && FEEDBACK_PAGE) return FEEDBACK_PAGE;

    var path = getPath();
    if (/\/games\/index\.html$/.test(path) || path === '/games/' || path === '/games') {
      return 'feedback/index.html';
    }
    return '../feedback/index.html';
  }

  function buildUrl() {
    var url = new URL(detectFeedbackUrl(), location.href);
    var page = location.pathname + location.search + location.hash;

    url.searchParams.set('game', detectGameSlug());
    url.searchParams.set('source', 'in-game');
    url.searchParams.set('page', page);
    url.searchParams.set('viewport', window.innerWidth + 'x' + window.innerHeight);

    try {
      if (navigator.userAgent) {
        url.searchParams.set('ua', navigator.userAgent);
      }
    } catch (_) {}

    return url.toString();
  }

  function positionButton(el) {
    var scheme = (document.body && document.body.dataset && document.body.dataset.mobileControls) || '';
    var isStackedOverlay = scheme === 'dpad' || scheme === 'joystick';

    el.style.right = '16px';
    el.style.bottom = isStackedOverlay ? 'auto' : '16px';
    el.style.top = isStackedOverlay ? '16px' : 'auto';

    if (scheme === 'joystick') {
      el.style.fontSize = '12px';
      el.style.padding = '9px 12px';
    } else if (scheme === 'dpad') {
      el.style.fontSize = '11px';
      el.style.padding = '8px 10px';
    }
  }

  function syncVisibility(el) {
    var hidden = !!document.getElementById('klb-show-overlay') || !!document.getElementById('klb-initials-overlay');
    el.style.display = hidden ? 'none' : 'inline-flex';
  }

  function injectButton() {
    if (isFeedbackPage() || document.getElementById(BUTTON_ID)) return;

    var link = document.createElement('a');
    link.id = BUTTON_ID;
    link.href = buildUrl();
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    link.textContent = BUTTON_LABEL;
    link.title = BUTTON_TITLE;
    link.setAttribute('aria-label', BUTTON_TITLE);
    link.style.cssText =
      'position:fixed;display:inline-flex;align-items:center;justify-content:center;gap:6px;' +
      'padding:10px 14px;border-radius:999px;text-decoration:none;letter-spacing:0.04em;' +
      'font:700 12px/1 "Segoe UI",system-ui,sans-serif;background:linear-gradient(135deg,#0f3460,#1a1a2e);' +
      'border:1px solid rgba(0,255,255,0.75);color:#0ff;box-shadow:0 0 16px rgba(0,255,255,0.18);' +
      'z-index:' + Z_INDEX + ';backdrop-filter:blur(6px);-webkit-backdrop-filter:blur(6px);' +
      'text-transform:uppercase;white-space:nowrap;' +
      'touch-action:manipulation;-webkit-transform:translateZ(0);transform:translateZ(0);' +
      '-webkit-tap-highlight-color:rgba(0,255,255,0.2);';

    positionButton(link);
    syncVisibility(link);

    link.addEventListener('mouseenter', function () {
      link.style.background = '#0ff';
      link.style.color = '#000';
      link.style.boxShadow = '0 0 24px rgba(0,255,255,0.55)';
    });
    link.addEventListener('mouseleave', function () {
      link.style.background = 'linear-gradient(135deg,#0f3460,#1a1a2e)';
      link.style.color = '#0ff';
      link.style.boxShadow = '0 0 16px rgba(0,255,255,0.18)';
    });

    // Mobile: explicit touchend handler — bypasses 300ms delay and any canvas touch capture.
    // navigates same-tab so mobile browsers don't treat it as a popup.
    link.addEventListener('touchend', function (e) {
      e.preventDefault();
      window.location.href = link.href;
    });

    // Append to <html> not <body> — games often set overflow:hidden on body which
    // clips position:fixed children on iOS Safari and makes them untappable.
    document.documentElement.appendChild(link);

    if ('MutationObserver' in window) {
      var observer = new MutationObserver(function () {
        syncVisibility(link);
      });
      observer.observe(document.documentElement, { childList: true, subtree: true });
      window.addEventListener('beforeunload', function () {
        observer.disconnect();
      }, { once: true });
    } else {
      window.setInterval(function () {
        if (document.getElementById(BUTTON_ID)) syncVisibility(link);
      }, 1000);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', injectButton);
  } else {
    injectButton();
  }
})();
