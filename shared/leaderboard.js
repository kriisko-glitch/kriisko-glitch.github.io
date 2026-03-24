(function () {
  'use strict';

  var MAX_ENTRIES = 10;
  var CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789 ';
  var STORAGE_PREFIX = 'kriisko_lb_';
  var Z_INDEX = 10000;

  // ── Supabase global leaderboard ──────────────────────────────────
  var SB_URL = 'https://vycyeyspgababxvuphjd.supabase.co';
  var SB_KEY = 'sb_publishable_bO0yY-dxoMPs1N3IIPUOog_P5XdxoyW';

  function sbHeaders() {
    return {
      'apikey': SB_KEY,
      'Authorization': 'Bearer ' + SB_KEY,
      'Content-Type': 'application/json',
      'Prefer': 'return=minimal'
    };
  }

  function sbSubmit(gameName, score, initials, dateStr) {
    try {
      fetch(SB_URL + '/rest/v1/scores', {
        method: 'POST',
        headers: sbHeaders(),
        body: JSON.stringify({ game: gameName, initials: initials, score: score, date: dateStr })
      }).catch(function () {});
    } catch (_) {}
  }

  function sbGetTop10(gameName, cb) {
    try {
      fetch(SB_URL + '/rest/v1/scores?game=eq.' + encodeURIComponent(gameName) +
        '&order=score.desc&limit=10&select=initials,score,date', {
        headers: {
          'apikey': SB_KEY,
          'Authorization': 'Bearer ' + SB_KEY
        }
      }).then(function (r) {
        if (!r.ok) { cb(null); return; }
        return r.json();
      }).then(function (data) {
        if (Array.isArray(data)) cb(data);
        else cb(null);
      }).catch(function () { cb(null); });
    } catch (_) { cb(null); }
  }
  // ─────────────────────────────────────────────────────────────────

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
    var today = new Date();
    var dateStr = today.getFullYear() + '-' +
      String(today.getMonth() + 1).padStart(2, '0') + '-' +
      String(today.getDate()).padStart(2, '0');
    // Save to localStorage
    var board = getTop10(gameName);
    board.push({ initials: clean, score: score, date: dateStr });
    board.sort(function (a, b) { return b.score - a.score; });
    board = board.slice(0, MAX_ENTRIES);
    saveBoard(gameName, board);
    // Submit to Supabase (background, fire-and-forget)
    sbSubmit(gameName, score, clean, dateStr);
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
    var slots = [0, 0, 0];
    var cursor = 0;
    var confirmed = false;

    var overlay = document.createElement('div');
    overlay.id = 'klb-initials-overlay';
    overlay.style.cssText =
      'position:fixed;inset:0;z-index:' + Z_INDEX + ';display:flex;align-items:center;justify-content:center;' +
      'background:rgba(0,0,0,0.92);font-family:"Courier New",monospace;' + createScanlineStyle();

    var box = document.createElement('div');
    box.style.cssText =
      'text-align:center;padding:32px 20px;max-width:420px;width:95%;';

    var title = document.createElement('div');
    title.textContent = 'NEW HIGH SCORE!';
    title.style.cssText =
      'font-size:24px;color:#ff0;font-weight:bold;margin-bottom:12px;' +
      'animation:klb-blink 0.8s step-end infinite;text-shadow:0 0 10px #ff0,0 0 20px #ff0;';

    var scoreEl = document.createElement('div');
    scoreEl.textContent = String(score);
    scoreEl.style.cssText = 'font-size:32px;color:#fff;margin-bottom:20px;text-shadow:0 0 8px #0ff;';

    var slotsRow = document.createElement('div');
    slotsRow.style.cssText = 'display:flex;justify-content:center;gap:16px;margin-bottom:20px;';

    var slotEls = [];
    var hiddenInputs = [];
    for (var i = 0; i < 3; i++) {
      var wrapper = document.createElement('div');
      wrapper.style.cssText = 'display:flex;flex-direction:column;align-items:center;gap:4px;';

      var upBtn = document.createElement('button');
      upBtn.textContent = '\u25B2';
      upBtn.style.cssText =
        'display:flex;align-items:center;justify-content:center;width:56px;height:50px;' +
        'background:rgba(0,255,255,0.1);border:2px solid #0ff;color:#0ff;font-size:24px;' +
        'cursor:pointer;border-radius:6px;text-shadow:0 0 6px #0ff;-webkit-tap-highlight-color:transparent;' +
        'touch-action:manipulation;user-select:none;';
      upBtn.dataset.slot = String(i);
      upBtn.dataset.dir = 'up';

      var cell = document.createElement('div');
      cell.style.cssText =
        'position:relative;width:56px;height:64px;border:3px solid #0ff;display:flex;align-items:center;justify-content:center;' +
        'font-size:36px;color:#0ff;background:rgba(0,255,255,0.05);text-shadow:0 0 8px #0ff;cursor:pointer;' +
        'border-radius:4px;-webkit-tap-highlight-color:transparent;';

      var hiddenInput = document.createElement('input');
      hiddenInput.type = 'text';
      hiddenInput.maxLength = 1;
      hiddenInput.autocomplete = 'off';
      hiddenInput.autocapitalize = 'characters';
      hiddenInput.style.cssText =
        'position:absolute;top:0;left:0;width:100%;height:100%;opacity:0;font-size:16px;' +
        'border:none;background:transparent;text-align:center;';
      hiddenInput.dataset.slot = String(i);
      cell.appendChild(hiddenInput);
      hiddenInputs.push(hiddenInput);

      var downBtn = document.createElement('button');
      downBtn.textContent = '\u25BC';
      downBtn.style.cssText =
        'display:flex;align-items:center;justify-content:center;width:56px;height:50px;' +
        'background:rgba(0,255,255,0.1);border:2px solid #0ff;color:#0ff;font-size:24px;' +
        'cursor:pointer;border-radius:6px;text-shadow:0 0 6px #0ff;-webkit-tap-highlight-color:transparent;' +
        'touch-action:manipulation;user-select:none;';
      downBtn.dataset.slot = String(i);
      downBtn.dataset.dir = 'down';

      wrapper.appendChild(upBtn);
      wrapper.appendChild(cell);
      wrapper.appendChild(downBtn);
      slotsRow.appendChild(wrapper);

      slotEls.push({ cell: cell, up: upBtn, down: downBtn, wrapper: wrapper, input: hiddenInput });
    }

    var confirmBtn = document.createElement('button');
    confirmBtn.textContent = '\u2713 CONFIRM';
    confirmBtn.style.cssText =
      'display:block;width:100%;height:60px;margin:16px 0 12px;font-family:"Courier New",monospace;' +
      'font-size:22px;font-weight:bold;border:2px solid #ff0;background:#ff0;color:#000;cursor:pointer;' +
      'border-radius:6px;text-shadow:none;box-shadow:0 0 12px #ff0;-webkit-tap-highlight-color:transparent;' +
      'touch-action:manipulation;';

    var skipBtn = document.createElement('button');
    skipBtn.textContent = 'SKIP';
    skipBtn.style.cssText =
      'background:none;border:none;color:#666;font-family:"Courier New",monospace;font-size:14px;' +
      'cursor:pointer;text-decoration:underline;display:block;margin:0 auto;padding:8px 16px;' +
      '-webkit-tap-highlight-color:transparent;touch-action:manipulation;';

    var hint = document.createElement('div');
    hint.textContent = '\u2191\u2193 cycle  \u2190\u2192 move  ENTER confirm';
    hint.style.cssText = 'color:#555;font-size:11px;margin-top:10px;';

    box.appendChild(title);
    box.appendChild(scoreEl);
    box.appendChild(slotsRow);
    box.appendChild(confirmBtn);
    box.appendChild(skipBtn);
    box.appendChild(hint);
    overlay.appendChild(box);

    addBlinkKeyframes();
    document.body.appendChild(overlay);

    renderSlots();

    function renderSlots() {
      for (var s = 0; s < 3; s++) {
        slotEls[s].cell.childNodes[0].nodeValue = null;
        var letterNode = slotEls[s].cell.firstChild;
        while (letterNode && letterNode.nodeType !== 3) letterNode = letterNode.nextSibling;
        if (!letterNode) {
          letterNode = document.createTextNode('');
          slotEls[s].cell.insertBefore(letterNode, slotEls[s].cell.firstChild);
        }
        letterNode.nodeValue = CHARS[slots[s]];
        slotEls[s].cell.style.borderColor = s === cursor ? '#ff0' : '#0ff';
        slotEls[s].cell.style.color = s === cursor ? '#ff0' : '#0ff';
        slotEls[s].cell.style.textShadow = s === cursor ? '0 0 12px #ff0' : '0 0 8px #0ff';
        slotEls[s].up.style.borderColor = s === cursor ? '#ff0' : '#0ff';
        slotEls[s].up.style.color = s === cursor ? '#ff0' : '#0ff';
        slotEls[s].down.style.borderColor = s === cursor ? '#ff0' : '#0ff';
        slotEls[s].down.style.color = s === cursor ? '#ff0' : '#0ff';
      }
    }

    function cycleSlot(slot, dir) {
      slots[slot] = (slots[slot] + dir + CHARS.length) % CHARS.length;
      renderSlots();
    }

    function charToSlotIndex(ch) {
      var idx = CHARS.indexOf(ch.toUpperCase());
      return idx >= 0 ? idx : 0;
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
      else if (key.length === 1 && /[A-Za-z0-9 ]/.test(key)) {
        slots[cursor] = charToSlotIndex(key);
        renderSlots();
        if (cursor < 2) { cursor++; renderSlots(); }
        e.preventDefault();
      }
    }
    document.addEventListener('keydown', onKey);

    slotEls.forEach(function (el, idx) {
      el.up.addEventListener('click', function (e) { e.stopPropagation(); e.preventDefault(); cursor = idx; cycleSlot(idx, -1); });
      el.up.addEventListener('touchend', function (e) { e.stopPropagation(); e.preventDefault(); cursor = idx; cycleSlot(idx, -1); });
      el.down.addEventListener('click', function (e) { e.stopPropagation(); e.preventDefault(); cursor = idx; cycleSlot(idx, 1); });
      el.down.addEventListener('touchend', function (e) { e.stopPropagation(); e.preventDefault(); cursor = idx; cycleSlot(idx, 1); });

      el.cell.addEventListener('click', function (e) {
        e.stopPropagation();
        cursor = idx;
        renderSlots();
        el.input.value = '';
        el.input.focus();
      });

      el.input.addEventListener('input', function () {
        var val = el.input.value;
        if (val.length > 0) {
          var ch = val.charAt(val.length - 1);
          if (/[A-Za-z0-9 ]/.test(ch)) {
            slots[idx] = charToSlotIndex(ch);
            renderSlots();
            if (cursor < 2) { cursor++; renderSlots(); }
          }
          el.input.value = '';
          el.input.blur();
        }
      });

      el.input.addEventListener('focus', function () {
        cursor = idx;
        renderSlots();
      });
    });

    confirmBtn.addEventListener('click', function (e) { e.preventDefault(); finish(false); });
    confirmBtn.addEventListener('touchend', function (e) { e.preventDefault(); finish(false); });
    skipBtn.addEventListener('click', function (e) { e.preventDefault(); finish(true); });
    skipBtn.addEventListener('touchend', function (e) { e.preventDefault(); finish(true); });
  }

  // ── Leaderboard Display UI ────────────────────────────────────────

  function show(gameName) {
    var overlay = document.createElement('div');
    overlay.id = 'klb-show-overlay';
    overlay.style.cssText =
      'position:fixed;inset:0;z-index:' + Z_INDEX + ';display:flex;align-items:center;justify-content:center;' +
      'background:rgba(0,0,0,0.92);font-family:"Courier New",monospace;cursor:pointer;' + createScanlineStyle();

    var box = document.createElement('div');
    box.style.cssText = 'text-align:center;padding:32px;max-width:520px;width:95%;';
    overlay.appendChild(box);

    var RANK_COLORS = ['#ffd700', '#c0c0c0', '#cd7f32'];

    function renderBoard(board, isLoading) {
      box.innerHTML = '';

      var sourceLabel = document.createElement('div');
      sourceLabel.textContent = isLoading ? '[ LOCAL ]' : '[ GLOBAL ]';
      sourceLabel.style.cssText = 'font-size:10px;color:#' + (isLoading ? '555' : '0a0') + ';margin-bottom:4px;letter-spacing:2px;';
      box.appendChild(sourceLabel);

      var title = document.createElement('div');
      title.textContent = prettifyGameName(gameName) + ' HIGH SCORES';
      title.style.cssText =
        'font-size:24px;color:#0ff;margin-bottom:24px;font-weight:bold;text-shadow:0 0 12px #0ff,0 0 24px rgba(0,255,255,0.3);' +
        'letter-spacing:2px;';
      box.appendChild(title);

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

      if (board.length === 0) {
        var emptyRow = document.createElement('tr');
        var emptyCell = document.createElement('td');
        emptyCell.colSpan = 4;
        emptyCell.textContent = isLoading ? 'LOADING...' : 'NO SCORES YET';
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
      box.appendChild(table);

      var prompt = document.createElement('div');
      prompt.textContent = 'PRESS ANY KEY / TAP TO CONTINUE';
      prompt.style.cssText = 'color:#0ff;font-size:14px;animation:klb-blink 1s step-end infinite;';
      box.appendChild(prompt);
    }

    // Render local board immediately
    var localBoard = getTop10(gameName);
    renderBoard(localBoard, true);

    addBlinkKeyframes();
    document.body.appendChild(overlay);

    function dismiss() {
      document.removeEventListener('keydown', dismiss);
      removeOverlay(overlay);
    }
    overlay.addEventListener('click', dismiss);
    document.addEventListener('keydown', dismiss);

    // Fetch global board from Supabase and re-render
    sbGetTop10(gameName, function (globalBoard) {
      if (globalBoard && globalBoard.length > 0) {
        // Merge local + global, dedupe by score+initials, keep top 10
        var merged = globalBoard.slice();
        localBoard.forEach(function (le) {
          var exists = merged.some(function (ge) {
            return ge.score === le.score && ge.initials === le.initials;
          });
          if (!exists) merged.push(le);
        });
        merged.sort(function (a, b) { return b.score - a.score; });
        renderBoard(merged.slice(0, MAX_ENTRIES), false);
      }
    });
  }

  // ── Utility styles ────────────────────────────────────────────────

  function btnStyle(bg, fg) {
    return 'display:inline-block;padding:8px 16px;font-family:"Courier New",monospace;font-size:16px;font-weight:bold;' +
      'border:2px solid ' + bg + ';background:' + bg + ';color:' + fg + ';cursor:pointer;' +
      'text-shadow:none;box-shadow:0 0 8px ' + bg + ';';
  }

  function btnArrowStyle() {
    return '';
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
