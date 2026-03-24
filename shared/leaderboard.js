(function () {
  'use strict';

  var MAX_ENTRIES = 10;
  var CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789 ';
  var STORAGE_PREFIX = 'kriisko_lb_';
  var Z_INDEX = 10000;

  function storageKey(gameName) {
    return STORAGE_PREFIX + gameName;
  }

  function getTop10(gameName) {
    try {
      var raw = localStorage.getItem(storageKey(gameName));
      if (!raw) return [];
      var parsed = JSON.parse(raw);
      if (!Array.isArray(parsed)) return [];
      return parsed
        .filter(function (e) { return e && typeof e.score === 'number'; })
        .sort(function (a, b) { return b.score - a.score; })
        .slice(0, MAX_ENTRIES);
    } catch (_) {
      return [];
    }
  }

  function saveBoard(gameName, board) {
    try {
      localStorage.setItem(storageKey(gameName), JSON.stringify(board));
    } catch (_) {}
  }

  function qualifies(gameName, score) {
    if (typeof score !== 'number' || score <= 0) return false;
    var board = getTop10(gameName);
    if (board.length < MAX_ENTRIES) return true;
    return score > board[board.length - 1].score;
  }

  function submit(gameName, score, initials) {
    if (typeof score !== 'number' || score <= 0) return;
    var clean = String(initials || 'AAA').toUpperCase().replace(/[^A-Z0-9 ]/g, '').substring(0, 3);
    while (clean.length < 3) clean += ' ';
    var board = getTop10(gameName);
    var today = new Date();
    var dateStr = today.getFullYear() + '-' +
      String(today.getMonth() + 1).padStart(2, '0') + '-' +
      String(today.getDate()).padStart(2, '0');
    board.push({ initials: clean, score: score, date: dateStr });
    board.sort(function (a, b) { return b.score - a.score; });
    board = board.slice(0, MAX_ENTRIES);
    saveBoard(gameName, board);
  }

  function removeOverlay(el) {
    if (el && el.parentNode) el.parentNode.removeChild(el);
  }

  function createScanlineStyle() {
    return 'background: repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.1) 2px, rgba(0,0,0,0.1) 4px);';
  }

  function prettifyGameName(name) {
    return name.replace(/[-_]/g, ' ').replace(/\b\w/g, function (c) { return c.toUpperCase(); });
  }

  // ── Initials Entry UI ─────────────────────────────────────────────

  function promptInitials(gameName, score, onComplete) {
    var slots = [0, 0, 0]; // indices into CHARS
    var cursor = 0;
    var confirmed = false;

    var overlay = document.createElement('div');
    overlay.id = 'klb-initials-overlay';
    overlay.style.cssText =
      'position:fixed;inset:0;z-index:' + Z_INDEX + ';display:flex;align-items:center;justify-content:center;' +
      'background:rgba(0,0,0,0.92);font-family:"Courier New",monospace;' + createScanlineStyle();

    var box = document.createElement('div');
    box.style.cssText =
      'text-align:center;padding:40px;max-width:420px;width:90%;';

    var title = document.createElement('div');
    title.textContent = 'NEW HIGH SCORE!';
    title.style.cssText =
      'font-size:28px;color:#ff0;font-weight:bold;margin-bottom:16px;' +
      'animation:klb-blink 0.8s step-end infinite;text-shadow:0 0 10px #ff0,0 0 20px #ff0;';

    var scoreEl = document.createElement('div');
    scoreEl.textContent = String(score);
    scoreEl.style.cssText = 'font-size:36px;color:#fff;margin-bottom:24px;text-shadow:0 0 8px #0ff;';

    var slotsRow = document.createElement('div');
    slotsRow.style.cssText = 'display:flex;justify-content:center;gap:12px;margin-bottom:20px;';

    var slotEls = [];
    for (var i = 0; i < 3; i++) {
      var wrapper = document.createElement('div');
      wrapper.style.cssText = 'display:flex;flex-direction:column;align-items:center;gap:6px;';

      var upBtn = document.createElement('button');
      upBtn.textContent = '\u25B2';
      upBtn.style.cssText = btnArrowStyle();
      upBtn.dataset.slot = String(i);
      upBtn.dataset.dir = 'up';

      var cell = document.createElement('div');
      cell.style.cssText =
        'width:56px;height:64px;border:3px solid #0ff;display:flex;align-items:center;justify-content:center;' +
        'font-size:36px;color:#0ff;background:rgba(0,255,255,0.05);text-shadow:0 0 8px #0ff;';

      var downBtn = document.createElement('button');
      downBtn.textContent = '\u25BC';
      downBtn.style.cssText = btnArrowStyle();
      downBtn.dataset.slot = String(i);
      downBtn.dataset.dir = 'down';

      wrapper.appendChild(upBtn);
      wrapper.appendChild(cell);
      wrapper.appendChild(downBtn);
      slotsRow.appendChild(wrapper);

      slotEls.push({ cell: cell, up: upBtn, down: downBtn, wrapper: wrapper });
    }

    var mobileNav = document.createElement('div');
    mobileNav.style.cssText = 'display:flex;justify-content:center;gap:16px;margin-bottom:16px;';

    var leftBtn = document.createElement('button');
    leftBtn.textContent = '\u25C0 LEFT';
    leftBtn.style.cssText = btnStyle('#0ff', '#000');

    var rightBtn = document.createElement('button');
    rightBtn.textContent = 'RIGHT \u25B6';
    rightBtn.style.cssText = btnStyle('#0ff', '#000');

    mobileNav.appendChild(leftBtn);
    mobileNav.appendChild(rightBtn);

    var confirmBtn = document.createElement('button');
    confirmBtn.textContent = 'CONFIRM';
    confirmBtn.style.cssText =
      btnStyle('#ff0', '#000') + 'font-size:20px;padding:12px 36px;margin-bottom:12px;display:block;margin-left:auto;margin-right:auto;';

    var skipBtn = document.createElement('button');
    skipBtn.textContent = 'SKIP';
    skipBtn.style.cssText =
      'background:none;border:none;color:#666;font-family:"Courier New",monospace;font-size:14px;' +
      'cursor:pointer;text-decoration:underline;display:block;margin:0 auto;';

    var hint = document.createElement('div');
    hint.textContent = '\u2191\u2193 cycle  \u2190\u2192 move  ENTER confirm';
    hint.style.cssText = 'color:#555;font-size:12px;margin-top:12px;';

    box.appendChild(title);
    box.appendChild(scoreEl);
    box.appendChild(slotsRow);
    box.appendChild(mobileNav);
    box.appendChild(confirmBtn);
    box.appendChild(skipBtn);
    box.appendChild(hint);
    overlay.appendChild(box);

    addBlinkKeyframes();
    document.body.appendChild(overlay);

    renderSlots();

    function renderSlots() {
      for (var s = 0; s < 3; s++) {
        slotEls[s].cell.textContent = CHARS[slots[s]];
        slotEls[s].cell.style.borderColor = s === cursor ? '#ff0' : '#0ff';
        slotEls[s].cell.style.color = s === cursor ? '#ff0' : '#0ff';
        slotEls[s].cell.style.textShadow = s === cursor ? '0 0 12px #ff0' : '0 0 8px #0ff';
      }
    }

    function cycleSlot(slot, dir) {
      slots[slot] = (slots[slot] + dir + CHARS.length) % CHARS.length;
      renderSlots();
    }

    function finish(skipped) {
      if (confirmed) return;
      confirmed = true;
      document.removeEventListener('keydown', onKey);
      removeOverlay(overlay);
      if (skipped) {
        if (typeof onComplete === 'function') onComplete(null);
      } else {
        var initials = CHARS[slots[0]] + CHARS[slots[1]] + CHARS[slots[2]];
        if (typeof onComplete === 'function') onComplete(initials);
      }
    }

    function onKey(e) {
      if (confirmed) return;
      var key = e.key;
      if (key === 'ArrowUp' || key === 'w' || key === 'W') { cycleSlot(cursor, -1); e.preventDefault(); }
      else if (key === 'ArrowDown' || key === 's' || key === 'S') { cycleSlot(cursor, 1); e.preventDefault(); }
      else if (key === 'ArrowLeft' || key === 'a' || key === 'A') { cursor = Math.max(0, cursor - 1); renderSlots(); e.preventDefault(); }
      else if (key === 'ArrowRight' || key === 'd' || key === 'D') { cursor = Math.min(2, cursor + 1); renderSlots(); e.preventDefault(); }
      else if (key === 'Enter') { finish(false); e.preventDefault(); }
      else if (key === 'Escape') { finish(true); e.preventDefault(); }
    }
    document.addEventListener('keydown', onKey);

    slotEls.forEach(function (el, idx) {
      el.up.addEventListener('click', function (e) { e.stopPropagation(); cursor = idx; cycleSlot(idx, -1); });
      el.down.addEventListener('click', function (e) { e.stopPropagation(); cursor = idx; cycleSlot(idx, 1); });

      var touchStartY = 0;
      el.cell.addEventListener('touchstart', function (e) {
        touchStartY = e.touches[0].clientY;
        cursor = idx;
        renderSlots();
      }, { passive: true });
      el.cell.addEventListener('touchend', function (e) {
        var dy = e.changedTouches[0].clientY - touchStartY;
        if (Math.abs(dy) > 20) {
          cycleSlot(idx, dy > 0 ? 1 : -1);
        }
      }, { passive: true });
    });

    leftBtn.addEventListener('click', function () { cursor = Math.max(0, cursor - 1); renderSlots(); });
    rightBtn.addEventListener('click', function () { cursor = Math.min(2, cursor + 1); renderSlots(); });
    confirmBtn.addEventListener('click', function () { finish(false); });
    skipBtn.addEventListener('click', function () { finish(true); });
  }

  // ── Leaderboard Display UI ────────────────────────────────────────

  function show(gameName) {
    var board = getTop10(gameName);
    var overlay = document.createElement('div');
    overlay.id = 'klb-show-overlay';
    overlay.style.cssText =
      'position:fixed;inset:0;z-index:' + Z_INDEX + ';display:flex;align-items:center;justify-content:center;' +
      'background:rgba(0,0,0,0.92);font-family:"Courier New",monospace;cursor:pointer;' + createScanlineStyle();

    var box = document.createElement('div');
    box.style.cssText = 'text-align:center;padding:32px;max-width:520px;width:95%;';

    var title = document.createElement('div');
    title.textContent = prettifyGameName(gameName) + ' HIGH SCORES';
    title.style.cssText =
      'font-size:24px;color:#0ff;margin-bottom:24px;font-weight:bold;text-shadow:0 0 12px #0ff,0 0 24px rgba(0,255,255,0.3);' +
      'letter-spacing:2px;';

    var table = document.createElement('table');
    table.style.cssText = 'width:100%;border-collapse:collapse;margin-bottom:24px;';

    var thead = document.createElement('tr');
    ['RANK', 'NAME', 'SCORE', 'DATE'].forEach(function (h) {
      var th = document.createElement('th');
      th.textContent = h;
      th.style.cssText = 'padding:8px 4px;color:#888;font-size:12px;border-bottom:1px solid #333;text-align:center;';
      thead.appendChild(th);
    });
    table.appendChild(thead);

    var RANK_COLORS = ['#ffd700', '#c0c0c0', '#cd7f32'];

    if (board.length === 0) {
      var emptyRow = document.createElement('tr');
      var emptyCell = document.createElement('td');
      emptyCell.colSpan = 4;
      emptyCell.textContent = 'NO SCORES YET';
      emptyCell.style.cssText = 'padding:24px;color:#555;font-size:16px;text-align:center;';
      emptyRow.appendChild(emptyCell);
      table.appendChild(emptyRow);
    } else {
      for (var r = 0; r < board.length; r++) {
        var row = document.createElement('tr');
        var rankColor = r < 3 ? RANK_COLORS[r] : '#0ff';

        var tdRank = document.createElement('td');
        tdRank.textContent = String(r + 1);
        tdRank.style.cssText = 'padding:6px 4px;color:' + rankColor + ';font-size:18px;font-weight:bold;text-align:center;';

        var tdName = document.createElement('td');
        tdName.textContent = board[r].initials;
        tdName.style.cssText = 'padding:6px 4px;color:' + rankColor + ';font-size:18px;letter-spacing:4px;text-align:center;';

        var tdScore = document.createElement('td');
        tdScore.textContent = String(board[r].score);
        tdScore.style.cssText = 'padding:6px 4px;color:#fff;font-size:18px;text-align:center;';

        var tdDate = document.createElement('td');
        tdDate.textContent = board[r].date || '';
        tdDate.style.cssText = 'padding:6px 4px;color:#666;font-size:12px;text-align:center;';

        row.appendChild(tdRank);
        row.appendChild(tdName);
        row.appendChild(tdScore);
        row.appendChild(tdDate);
        table.appendChild(row);
      }
    }

    var prompt = document.createElement('div');
    prompt.textContent = 'PRESS ANY KEY / TAP TO CONTINUE';
    prompt.style.cssText = 'color:#0ff;font-size:14px;animation:klb-blink 1s step-end infinite;';

    box.appendChild(title);
    box.appendChild(table);
    box.appendChild(prompt);
    overlay.appendChild(box);

    addBlinkKeyframes();
    document.body.appendChild(overlay);

    function dismiss() {
      document.removeEventListener('keydown', dismiss);
      removeOverlay(overlay);
    }
    overlay.addEventListener('click', dismiss);
    document.addEventListener('keydown', dismiss);
  }

  // ── Utility styles ────────────────────────────────────────────────

  function btnStyle(bg, fg) {
    return 'display:inline-block;padding:8px 16px;font-family:"Courier New",monospace;font-size:16px;font-weight:bold;' +
      'border:2px solid ' + bg + ';background:' + bg + ';color:' + fg + ';cursor:pointer;' +
      'text-shadow:none;box-shadow:0 0 8px ' + bg + ';';
  }

  function btnArrowStyle() {
    return 'display:block;background:none;border:none;color:#0ff;font-size:22px;cursor:pointer;' +
      'padding:4px 12px;line-height:1;text-shadow:0 0 6px #0ff;';
  }

  var blinkAdded = false;
  function addBlinkKeyframes() {
    if (blinkAdded) return;
    blinkAdded = true;
    var style = document.createElement('style');
    style.textContent = '@keyframes klb-blink { 50% { opacity: 0; } }';
    document.head.appendChild(style);
  }

  // ── Public API ────────────────────────────────────────────────────

  window.KriiskoLeaderboard = {
    qualifies: qualifies,
    promptInitials: promptInitials,
    submit: submit,
    show: show,
    getTop10: getTop10
  };
})();
