/*
 * Course Player shell. Behavior follows docs/style-guide.html.
 *
 *   const player = new CoursePlayer(document.getElementById('app'), window.COURSE_DATA, {
 *     viewport: 'auto',   // 'auto' | 'desktop' | 'tablet' | 'phone'
 *     menuOpen: false,
 *     captionsOn: false,  // default comes from the session setting
 *     showToast: false,   // preview the "Section Completed" toast
 *     initialPage: 1,     // 1-based; overrides saved progress
 *     initialTime: 0,     // seconds into the initial page
 *     height: null,       // CSS height for the player; defaults to filling its container
 *     persist: true       // save progress to localStorage
 *   });
 */
(function () {
  'use strict';

  var TABLET_MIN = 640;
  var DESKTOP_MIN = 1024;
  var SHORT_MAX = 700;
  var TOAST_MS = 3200;
  var CAPTIONS_KEY = 'course-player-captions';

  var ICON = {
    menu: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 7h16M4 12h16M4 17h16"/></svg>',
    close: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"/></svg>',
    back: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M15 18l-6-6 6-6"/></svg>',
    next: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9 6l6 6-6 6"/></svg>',
    arrow: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6"/></svg>',
    chevronDown: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M6 9l6 6 6-6"/></svg>',
    play: '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M8 5.5v13a1 1 0 0 0 1.5.86l10.6-6.5a1 1 0 0 0 0-1.72L9.5 4.64A1 1 0 0 0 8 5.5z"/></svg>',
    pause: '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><rect x="6" y="5" width="4" height="14" rx="1"/><rect x="14" y="5" width="4" height="14" rx="1"/></svg>',
    replay: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 12a9 9 0 1 0 3-6.7"/><path d="M3 4v5h5"/></svg>',
    volume: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M11 5L6 9H3v6h3l5 4V5z"/><path d="M15.5 8.5a5 5 0 0 1 0 7M18.5 5.5a9 9 0 0 1 0 13"/></svg>',
    muted: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M11 5L6 9H3v6h3l5 4V5z"/><path d="M22 9l-6 6M16 9l6 6"/></svg>',
    check: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>'
  };

  var STATUS_ICON = {
    complete: '<svg class="cp-status" viewBox="0 0 20 20" aria-hidden="true"><circle cx="10" cy="10" r="10" fill="#CC5500"/><path d="M5.8 10.4l2.8 2.8 5.6-6" fill="none" stroke="#fff" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    progress: '<svg class="cp-status" viewBox="0 0 20 20" aria-hidden="true"><circle cx="10" cy="10" r="8.5" fill="none" stroke="#CC5500" stroke-width="2"/><path d="M10 3.5a6.5 6.5 0 0 1 0 13z" fill="#CC5500"/></svg>',
    notStarted: '<svg class="cp-status" viewBox="0 0 20 20" aria-hidden="true"><circle cx="10" cy="10" r="8.5" fill="none" stroke="#C9C3BC" stroke-width="2"/></svg>',
    current: '<svg class="cp-status" viewBox="0 0 20 20" aria-hidden="true"><circle cx="10" cy="10" r="8.5" fill="none" stroke="#CC5500" stroke-width="2"/><circle cx="10" cy="10" r="4" fill="#CC5500"/></svg>'
  };

  function esc(value) {
    return String(value == null ? '' : value)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }

  function fmt(sec) {
    sec = Math.max(0, Math.floor(sec));
    var s = sec % 60;
    return Math.floor(sec / 60) + ':' + (s < 10 ? '0' : '') + s;
  }

  function readStorage(store, key) {
    try { return store.getItem(key); } catch (e) { return null; }
  }

  function writeStorage(store, key, value) {
    try { store.setItem(key, value); } catch (e) { /* storage unavailable */ }
  }

  function imageSlot(src, label) {
    return '<div class="cp-img">' +
      (src ? '<img src="' + esc(src) + '" alt="' + esc(label) + '">' : '<span class="cp-img__label">' + esc(label) + '</span>') +
      '</div>';
  }

  function CoursePlayer(root, course, options) {
    var opts = options || {};
    this.root = root;
    this.course = course;
    this.opts = {
      viewport: opts.viewport || 'auto',
      persist: opts.persist !== false,
      height: opts.height || null
    };

    // Flatten modules into a page list.
    this.pages = [];
    var self = this;
    course.modules.forEach(function (mod, m) {
      mod.pages.forEach(function (page) {
        self.pages.push({ data: page, module: m, index: self.pages.length });
      });
    });

    var saved = this.opts.persist ? this.load() : null;
    var savedCaptions = readStorage(window.sessionStorage, CAPTIONS_KEY);
    var startIdx = opts.initialPage ? opts.initialPage - 1 : (saved ? saved.idx : 0);
    startIdx = Math.min(Math.max(startIdx || 0, 0), this.pages.length - 1);

    this.state = {
      idx: startIdx,
      t: Math.min(opts.initialTime || 0, this.pages[startIdx].data.duration),
      playing: false,
      volume: 80,
      muted: false,
      captionsOn: opts.captionsOn != null ? !!opts.captionsOn : savedCaptions === '1',
      menuOpen: !!opts.menuOpen,
      visited: new Set(saved ? saved.visited : []),
      completed: new Set(saved ? saved.completed : []),
      openItem: 0,
      mode: 'desktop',
      short: false,
      exited: false
    };
    this.state.visited.add(startIdx);
    this.interacted = false;

    this.build();
    this.observe();
    this.renderAll();
    if (opts.showToast) this.showToast();
  }

  CoursePlayer.prototype.load = function () {
    var raw = readStorage(window.localStorage, this.course.storageKey);
    if (!raw) return null;
    try {
      var data = JSON.parse(raw);
      return {
        idx: typeof data.idx === 'number' ? data.idx : 0,
        visited: Array.isArray(data.visited) ? data.visited : [],
        completed: Array.isArray(data.completed) ? data.completed : []
      };
    } catch (e) {
      return null;
    }
  };

  CoursePlayer.prototype.save = function () {
    if (!this.opts.persist) return;
    var s = this.state;
    writeStorage(window.localStorage, this.course.storageKey, JSON.stringify({
      idx: s.idx,
      visited: Array.from(s.visited),
      completed: Array.from(s.completed)
    }));
  };

  /* ---------- Build the static shell once ---------- */

  CoursePlayer.prototype.build = function () {
    var c = this.course;
    var total = this.pages.length;
    this.root.innerHTML =
      '<div class="cp">' +
        '<header class="cp-header">' +
          '<button type="button" class="cp-btn cp-btn--outline cp-btn--toggle cp-menu-toggle" data-act="menu" aria-controls="course-menu" aria-expanded="false" title="Course contents">' +
            '<span data-slot="menu-icon"></span><span class="cp-menu-label">Menu</span>' +
          '</button>' +
          '<div class="cp-titles"><h1 class="cp-course-title">' + esc(c.title) + '</h1><div class="cp-subtitle" data-slot="subtitle"></div></div>' +
          '<div class="cp-completion">' +
            '<div class="cp-completion__label" aria-hidden="true"><span class="cp-completion__word">Course Completion </span><b data-slot="pct"></b></div>' +
            '<div class="cp-bar" role="progressbar" aria-label="Course Completion" aria-valuemin="0" aria-valuemax="100" data-slot="course-bar"><span></span></div>' +
          '</div>' +
          '<button type="button" class="cp-btn cp-btn--outline cp-exit" data-act="exit"><span data-slot="exit-label">Save &amp; exit</span></button>' +
        '</header>' +
        '<div class="cp-body">' +
          '<div class="cp-menu-slot">' +
            '<aside class="cp-menu" id="course-menu" aria-label="Course contents">' +
              '<div class="cp-menu__head">' +
                '<div class="cp-menu__top"><h2 class="cp-menu__title">Course contents</h2>' +
                  '<button type="button" class="cp-btn cp-btn--ghost" data-act="menu-close" aria-label="Close course contents" title="Close">' + ICON.close + '</button></div>' +
                '<div class="cp-menu__count" data-slot="menu-count"></div>' +
                '<div class="cp-bar" role="progressbar" aria-label="Pages complete" aria-valuemin="0" aria-valuemax="' + total + '" data-slot="menu-bar"><span></span></div>' +
              '</div>' +
              '<nav class="cp-menu__list" aria-label="Pages" data-slot="menu-list"></nav>' +
            '</aside>' +
          '</div>' +
          '<div class="cp-scrim" data-act="menu-close"></div>' +
          '<div class="cp-main">' +
            '<div class="cp-stage"><div class="cp-frame">' +
              '<div class="cp-region" role="region" tabindex="-1" data-slot="region"></div>' +
              '<div class="cp-toast" role="status" aria-live="polite" data-slot="toast"></div>' +
            '</div></div>' +
            '<div class="cp-progress-wrap"><div class="cp-progress" role="progressbar" aria-valuemin="0" data-slot="page-bar"><span></span></div></div>' +
            '<div class="cp-captions-wrap" data-slot="captions-wrap" hidden>' +
              '<section class="cp-captions" aria-label="Transcript">' +
                '<div class="cp-captions__head"><span class="cp-captions__label">CC · TRANSCRIPT</span>' +
                  '<button type="button" class="cp-btn cp-btn--ghost" data-act="captions" aria-label="Close captions" title="Close captions">' + ICON.close + '</button></div>' +
                '<div class="cp-captions__text" aria-live="polite" data-slot="captions"></div>' +
              '</section>' +
            '</div>' +
          '</div>' +
        '</div>' +
        '<footer class="cp-controls">' + this.controlsWide() + this.controlsPhone() + '</footer>' +
        '<div data-slot="overlay"></div>' +
      '</div>';

    this.el = this.root.firstChild;
    if (this.opts.height) this.el.style.height = typeof this.opts.height === 'number' ? this.opts.height + 'px' : this.opts.height;

    this.slots = {};
    var nodes = this.el.querySelectorAll('[data-slot]');
    for (var i = 0; i < nodes.length; i++) this.slots[nodes[i].getAttribute('data-slot')] = nodes[i];

    this.bind();
  };

  CoursePlayer.prototype.controlsWide = function () {
    return '<div class="cp-controls__wide">' +
      '<div class="cp-controls__left"><button type="button" class="cp-btn cp-btn--outline" data-act="back">' + ICON.back + 'Back</button></div>' +
      '<div class="cp-audio" role="group" aria-label="Audio">' +
        '<button type="button" class="cp-btn cp-btn--ghost" data-act="replay" aria-label="Replay page" title="Replay">' + ICON.replay + '</button>' +
        '<button type="button" class="cp-btn cp-btn--play" data-act="play" data-role="play"></button>' +
        '<button type="button" class="cp-btn cp-btn--ghost" data-act="mute" data-role="mute" aria-label="Mute" title="Mute"></button>' +
        '<input type="range" class="cp-volume" min="0" max="100" step="1" aria-label="Volume" data-act="volume" data-role="volume">' +
        '<span class="cp-time" data-role="time"></span>' +
      '</div>' +
      '<div class="cp-controls__right">' +
        '<button type="button" class="cp-btn cp-btn--outline cp-btn--toggle" data-act="captions" data-role="captions" aria-label="Captions" title="Captions"><span class="cp-cc" aria-hidden="true">CC</span><span class="cp-cc-label">Captions</span></button>' +
        '<span class="cp-counter" aria-live="polite" data-role="counter"></span>' +
        '<button type="button" class="cp-btn cp-btn--primary" data-act="next">Next' + ICON.next + '</button>' +
      '</div>' +
    '</div>';
  };

  CoursePlayer.prototype.controlsPhone = function () {
    return '<div class="cp-controls__phone">' +
      '<div class="cp-phone-row1" role="group" aria-label="Audio">' +
        '<button type="button" class="cp-btn cp-btn--ghost" data-act="replay" aria-label="Replay page" title="Replay">' + ICON.replay + '</button>' +
        '<button type="button" class="cp-btn cp-btn--ghost" data-act="mute" data-role="mute" aria-label="Mute" title="Mute"></button>' +
        '<button type="button" class="cp-btn cp-btn--outline cp-btn--toggle" data-act="captions" data-role="captions" aria-label="Captions" title="Captions"><span class="cp-cc" aria-hidden="true">CC</span>Captions</button>' +
        '<span class="cp-spacer"></span>' +
        '<span class="cp-time" data-role="time"></span>' +
        '<span class="cp-counter" aria-live="polite" data-role="counter"></span>' +
      '</div>' +
      '<div class="cp-phone-row2">' +
        '<button type="button" class="cp-btn cp-btn--outline" data-act="back">' + ICON.back + 'Back</button>' +
        '<button type="button" class="cp-btn cp-btn--play" data-act="play" data-role="play"></button>' +
        '<button type="button" class="cp-btn cp-btn--primary" data-act="next">Next' + ICON.next + '</button>' +
      '</div>' +
    '</div>';
  };

  /* ---------- Events ---------- */

  CoursePlayer.prototype.bind = function () {
    var self = this;

    this.el.addEventListener('click', function (e) {
      var target = e.target.closest('[data-act]');
      if (!target || !self.el.contains(target) || target.disabled) return;
      self.interacted = true;
      var act = target.getAttribute('data-act');
      switch (act) {
        case 'menu': self.setMenu(!self.state.menuOpen); break;
        case 'menu-close': self.setMenu(false, true); break;
        case 'back': self.go(self.state.idx - 1); break;
        case 'next': self.go(self.state.idx + 1); break;
        case 'goto': self.go(Number(target.getAttribute('data-idx')), { fromMenu: true }); break;
        case 'start': self.go(1, { autoplay: true }); break;
        case 'play': self.togglePlay(); break;
        case 'replay': self.state.t = 0; self.play(true); break;
        case 'mute': self.toggleMute(); break;
        case 'captions': self.setCaptions(!self.state.captionsOn); break;
        case 'acc': self.toggleItem(Number(target.getAttribute('data-item'))); break;
        case 'tab': self.toggleTab(Number(target.getAttribute('data-item'))); break;
        case 'exit': self.openExitDialog(); break;
        case 'keep': self.closeExitDialog(); break;
        case 'confirm-exit': self.confirmExit(); break;
        case 'resume': self.resume(); break;
      }
    });

    this.el.addEventListener('input', function (e) {
      if (e.target.getAttribute('data-act') !== 'volume') return;
      self.interacted = true;
      self.state.volume = Number(e.target.value);
      self.state.muted = self.state.volume === 0;
      self.renderAudio();
    });

    this.el.addEventListener('keydown', function (e) {
      var tab = e.target.closest && e.target.closest('[role=tab]');
      if (tab && ['ArrowLeft', 'ArrowRight', 'Home', 'End'].indexOf(e.key) !== -1) {
        var tabs = Array.prototype.slice.call(tab.parentNode.querySelectorAll('[role=tab]'));
        var at = tabs.indexOf(tab);
        var to = e.key === 'Home' ? 0 : e.key === 'End' ? tabs.length - 1
          : (at + (e.key === 'ArrowRight' ? 1 : -1) + tabs.length) % tabs.length;
        e.preventDefault();
        tabs[to].focus();
        return;
      }
      if (e.key !== 'Escape') return;
      if (self.dialogOpen) { e.preventDefault(); self.closeExitDialog(); }
      else if (self.state.menuOpen) { e.preventDefault(); self.setMenu(false, true); }
      else return;
      e.stopPropagation();
    });
  };

  CoursePlayer.prototype.observe = function () {
    var self = this;
    var apply = function (width, height) {
      var mode = self.opts.viewport !== 'auto' ? self.opts.viewport
        : width >= DESKTOP_MIN ? 'desktop' : width >= TABLET_MIN ? 'tablet' : 'phone';
      var short = height > 0 && height < SHORT_MAX;
      if (mode === self.state.mode && short === self.state.short) return;
      self.state.mode = mode;
      self.state.short = short;
      self.renderLayout();
    };
    if (typeof ResizeObserver !== 'undefined') {
      this.ro = new ResizeObserver(function (entries) {
        var r = entries[0].contentRect;
        apply(r.width, r.height);
      });
      this.ro.observe(this.el);
    }
    var rect = this.el.getBoundingClientRect();
    apply(rect.width, rect.height);
  };

  /* ---------- State changes ---------- */

  CoursePlayer.prototype.go = function (idx, how) {
    how = how || {};
    if (idx < 0 || idx >= this.pages.length) return;
    var s = this.state;
    this.stopTimer();
    s.idx = idx;
    s.t = 0;
    s.playing = false;
    s.openItem = 0;
    s.visited.add(idx);
    this.save();
    if (how.fromMenu && s.mode !== 'desktop') this.setMenu(false);
    var autoplay = how.autoplay || (this.interacted && !s.completed.has(idx));
    this.renderPage();
    this.renderMenu();
    if (autoplay) this.play();
    else this.renderAudio();
    // The control that was used is gone (menu closed, title page replaced), so move focus to the new page.
    if (how.autoplay || (how.fromMenu && s.mode !== 'desktop')) this.slots.region.focus({ preventScroll: true });
  };

  CoursePlayer.prototype.togglePlay = function () {
    if (this.state.playing) this.pause();
    else this.play();
  };

  CoursePlayer.prototype.play = function (fromStart) {
    var s = this.state;
    var dur = this.page().data.duration;
    if (fromStart || s.t >= dur) s.t = 0;
    s.playing = true;
    this.stopTimer();
    var self = this;
    this.timer = setInterval(function () { self.tick(); }, 1000);
    this.renderAudio(true);
  };

  CoursePlayer.prototype.pause = function () {
    this.state.playing = false;
    this.stopTimer();
    this.renderAudio();
  };

  CoursePlayer.prototype.stopTimer = function () {
    if (this.timer) clearInterval(this.timer);
    this.timer = null;
  };

  CoursePlayer.prototype.tick = function () {
    var s = this.state;
    var dur = this.page().data.duration;
    s.t = Math.min(s.t + 1, dur);
    if (s.t >= dur) {
      s.playing = false;
      this.stopTimer();
      this.completePage(s.idx);
    }
    this.renderAudio();
  };

  CoursePlayer.prototype.completePage = function (idx) {
    var s = this.state;
    if (s.completed.has(idx)) return;
    s.completed.add(idx);
    this.save();
    this.renderProgress();
    this.renderMenu();
    this.showToast();
  };

  CoursePlayer.prototype.toggleMute = function () {
    var s = this.state;
    if (s.muted || s.volume === 0) {
      s.muted = false;
      if (s.volume === 0) s.volume = 50;
    } else {
      s.muted = true;
    }
    this.renderAudio();
  };

  CoursePlayer.prototype.setCaptions = function (on) {
    this.state.captionsOn = on;
    writeStorage(window.sessionStorage, CAPTIONS_KEY, on ? '1' : '0');
    this.renderCaptions();
  };

  CoursePlayer.prototype.setMenu = function (open, returnFocus) {
    var wasOpen = this.state.menuOpen;
    this.state.menuOpen = open;
    this.renderMenuState();
    if (open && !wasOpen) {
      var current = this.el.querySelector('.cp-row[aria-current=page]');
      if (current) {
        current.scrollIntoView({ block: 'nearest' });
        if (this.state.mode !== 'desktop') current.focus({ preventScroll: true });
      }
    } else if (!open && wasOpen && returnFocus) {
      this.el.querySelector('[data-act=menu]').focus();
    }
  };

  CoursePlayer.prototype.toggleItem = function (i) {
    this.state.openItem = this.state.openItem === i ? -1 : i;
    var items = this.slots.region.querySelectorAll('.cp-acc-item');
    for (var k = 0; k < items.length; k++) {
      var open = k === this.state.openItem;
      items[k].classList.toggle('is-open', open);
      items[k].querySelector('.cp-acc-btn').setAttribute('aria-expanded', String(open));
    }
  };

  // Tabs: selecting the open tab again closes it, so every panel can be collapsed.
  CoursePlayer.prototype.toggleTab = function (i) {
    this.state.openItem = this.state.openItem === i ? -1 : i;
    var open = this.state.openItem;
    var tabs = this.slots.region.querySelectorAll('.cp-tab');
    var panels = this.slots.region.querySelectorAll('.cp-tabpanel');
    for (var k = 0; k < tabs.length; k++) {
      var on = k === open;
      tabs[k].setAttribute('aria-selected', String(on));
      tabs[k].classList.toggle('is-open', on);
      panels[k].classList.toggle('is-open', on);
    }
  };

  CoursePlayer.prototype.showToast = function () {
    var toast = this.slots.toast;
    toast.innerHTML = '<span class="cp-check">' + ICON.check + '</span>Section Completed';
    toast.classList.add('is-visible');
    clearTimeout(this.toastTimer);
    this.toastTimer = setTimeout(function () {
      toast.classList.remove('is-visible');
    }, TOAST_MS);
  };

  /* ---------- Exit ---------- */

  CoursePlayer.prototype.openExitDialog = function () {
    this.pause();
    this.dialogOpen = true;
    this.lastFocus = document.activeElement;
    this.slots.overlay.innerHTML =
      '<div class="cp-dialog-layer">' +
        '<div class="cp-dialog" role="dialog" aria-modal="true" aria-labelledby="cp-exit-title" aria-describedby="cp-exit-desc">' +
          '<h2 id="cp-exit-title">Save and exit?</h2>' +
          '<p id="cp-exit-desc">Your progress is saved. You can pick up right where you left off.</p>' +
          '<div class="cp-dialog__actions">' +
            '<button type="button" class="cp-btn cp-btn--outline" data-act="keep">Keep learning</button>' +
            '<button type="button" class="cp-btn cp-btn--primary" data-act="confirm-exit">Save &amp; exit</button>' +
          '</div>' +
        '</div>' +
      '</div>';
    this.setInert(true);
    var self = this;
    this.trap = function (e) {
      if (e.key !== 'Tab') return;
      var btns = self.slots.overlay.querySelectorAll('button');
      var first = btns[0], last = btns[btns.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    };
    this.slots.overlay.addEventListener('keydown', this.trap);
    this.slots.overlay.querySelector('[data-act=keep]').focus();
  };

  CoursePlayer.prototype.closeExitDialog = function () {
    this.dialogOpen = false;
    this.slots.overlay.removeEventListener('keydown', this.trap);
    this.slots.overlay.innerHTML = '';
    this.setInert(false);
    if (this.lastFocus && this.lastFocus.focus) this.lastFocus.focus();
  };

  CoursePlayer.prototype.confirmExit = function () {
    this.save();
    this.dialogOpen = false;
    this.slots.overlay.removeEventListener('keydown', this.trap);
    this.state.exited = true;
    this.slots.overlay.innerHTML =
      '<div class="cp-saved" role="region" aria-labelledby="cp-saved-title">' +
        '<div class="cp-saved__card">' +
          '<div class="cp-check">' + ICON.check + '</div>' +
          '<h2 id="cp-saved-title">Your place is saved</h2>' +
          '<p>Come back any time to pick up on page ' + (this.state.idx + 1) + ' of ' + this.pages.length + '.</p>' +
          '<button type="button" class="cp-btn cp-btn--primary" data-act="resume">Resume course</button>' +
        '</div>' +
      '</div>';
    this.slots.overlay.querySelector('[data-act=resume]').focus();
  };

  CoursePlayer.prototype.resume = function () {
    this.state.exited = false;
    this.slots.overlay.innerHTML = '';
    this.setInert(false);
    this.slots.region.focus({ preventScroll: true });
  };

  CoursePlayer.prototype.setInert = function (on) {
    var kids = this.el.children;
    for (var i = 0; i < kids.length; i++) {
      if (kids[i] === this.slots.overlay) continue;
      if (on) kids[i].setAttribute('inert', '');
      else kids[i].removeAttribute('inert');
    }
  };

  /* ---------- Rendering ---------- */

  CoursePlayer.prototype.page = function () {
    return this.pages[this.state.idx];
  };

  CoursePlayer.prototype.renderAll = function () {
    this.renderLayout();
    this.renderPage();
    this.renderMenu();
    this.renderMenuState();
    this.renderCaptions();
    this.renderAudio();
  };

  CoursePlayer.prototype.renderLayout = function () {
    var s = this.state;
    var cl = this.el.classList;
    ['desktop', 'tablet', 'phone'].forEach(function (m) { cl.toggle('cp--' + m, s.mode === m); });
    cl.toggle('cp--short', s.short);
    this.slots['exit-label'].textContent = s.mode === 'phone' ? 'Exit' : 'Save & exit';
    this.slots['exit-label'].parentNode.setAttribute('aria-label', 'Save & exit');
    this.renderMenuState();
  };

  CoursePlayer.prototype.renderMenuState = function () {
    var s = this.state;
    var open = s.menuOpen;
    this.el.classList.toggle('cp--menu-open', open);
    var toggle = this.el.querySelector('[data-act=menu]');
    toggle.setAttribute('aria-expanded', String(open));
    this.slots['menu-icon'].innerHTML = open ? ICON.close : ICON.menu;
    // Overlay modes take the rest of the player out of the tab order while open.
    var overlay = open && s.mode !== 'desktop';
    var main = this.el.querySelector('.cp-main');
    var controls = this.el.querySelector('.cp-controls');
    [main, controls].forEach(function (node) {
      if (overlay) node.setAttribute('inert', ''); else node.removeAttribute('inert');
    });
  };

  CoursePlayer.prototype.renderProgress = function () {
    var done = this.state.completed.size;
    var total = this.pages.length;
    var pct = Math.round(done / total * 100);
    this.slots.pct.textContent = pct + '%';
    var bar = this.slots['course-bar'];
    bar.setAttribute('aria-valuenow', pct);
    bar.setAttribute('aria-valuetext', pct + '% complete');
    bar.firstChild.style.width = pct + '%';
    this.slots['menu-count'].textContent = done + ' of ' + total + ' pages complete';
    var mbar = this.slots['menu-bar'];
    mbar.setAttribute('aria-valuenow', done);
    mbar.setAttribute('aria-valuetext', done + ' of ' + total + ' pages complete');
    mbar.firstChild.style.width = pct + '%';
  };

  CoursePlayer.prototype.renderMenu = function () {
    var s = this.state;
    var self = this;
    var focusedIdx = document.activeElement && document.activeElement.getAttribute &&
      this.slots['menu-list'].contains(document.activeElement) ? document.activeElement.getAttribute('data-idx') : null;

    var html = '';
    this.course.modules.forEach(function (mod, m) {
      var pages = self.pages.filter(function (p) { return p.module === m; });
      var done = pages.filter(function (p) { return s.completed.has(p.index); }).length;
      html += '<div class="cp-module">' +
        '<div class="cp-module__head"><div>' +
          '<div class="cp-module__eyebrow">Module ' + (m + 1) + '</div>' +
          '<h3 class="cp-module__title">' + esc(mod.title) + '</h3></div>' +
          '<div class="cp-module__meta">' + (done === pages.length ? '<span class="cp-pill">Complete</span>' : '') +
          '<span aria-label="' + done + ' of ' + pages.length + ' pages complete">' + done + '/' + pages.length + '</span></div>' +
        '</div><ul class="cp-pages">';
      pages.forEach(function (p) {
        var i = p.index;
        var complete = s.completed.has(i);
        var current = i === s.idx;
        var status = complete ? 'Complete' : s.visited.has(i) ? 'In progress' : 'Not started';
        var icon = current ? STATUS_ICON.current : complete ? STATUS_ICON.complete : s.visited.has(i) ? STATUS_ICON.progress : STATUS_ICON.notStarted;
        var sub = current ? (complete ? 'You are here · Complete' : 'You are here') : status === 'In progress' ? 'In progress' : '';
        html += '<li><button type="button" class="cp-row" data-act="goto" data-idx="' + i + '"' +
          (current ? ' aria-current="page"' : '') +
          ' aria-label="Page ' + (i + 1) + ': ' + esc(p.data.title) + ', ' + status + (current ? ', current page' : '') + ', ' + fmt(p.data.duration) + '">' +
          icon +
          '<span class="cp-row__text"><span class="cp-row__title">' + esc(p.data.title) + '</span>' +
          (sub ? '<span class="cp-row__sub">' + sub + '</span>' : '') + '</span>' +
          '<span class="cp-row__dur">' + fmt(p.data.duration) + '</span>' +
          '</button></li>';
      });
      html += '</ul></div>';
    });
    this.slots['menu-list'].innerHTML = html;
    if (focusedIdx != null) {
      var again = this.slots['menu-list'].querySelector('[data-idx="' + focusedIdx + '"]');
      if (again) again.focus({ preventScroll: true });
    }
    this.renderProgress();
  };

  CoursePlayer.prototype.renderPage = function () {
    var p = this.page();
    var d = p.data;
    var mod = this.course.modules[p.module];
    var n = p.index + 1;
    var total = this.pages.length;
    this.el.classList.toggle('cp--title-page', d.template === 'title');
    this.slots.subtitle.textContent = 'Module ' + (p.module + 1) + ' · ' + mod.title;

    var region = this.slots.region;
    region.setAttribute('aria-label', 'Page ' + n + ': ' + d.title);
    region.scrollTop = 0;
    if (d.template === 'title') region.innerHTML = this.tplTitle(d);
    else if (d.template === 'accordion') region.innerHTML = this.tplAccordion(d, n);
    else if (d.template === 'tabs') region.innerHTML = this.tplTabs(d, n);
    else region.innerHTML = this.tplContent(d, n);

    var counters = this.el.querySelectorAll('[data-role=counter]');
    for (var i = 0; i < counters.length; i++) counters[i].textContent = n + ' of ' + total;
    this.el.querySelectorAll('[data-act=back]').forEach(function (b) { b.disabled = p.index === 0; });
    this.el.querySelectorAll('[data-act=next]').forEach(function (b) { b.disabled = p.index === total - 1; });

    // Reset the page bar without animating it back to zero.
    var bar = this.slots['page-bar'];
    bar.classList.add('cp-no-anim');
    bar.firstChild.style.width = (this.state.t / d.duration * 100) + '%';
    void bar.offsetWidth;
    bar.classList.remove('cp-no-anim');

    this.renderCaptionText();
  };

  CoursePlayer.prototype.tplTitle = function (d) {
    return '<div class="cp-hero">' +
      imageSlot(d.image, d.imageLabel) +
      '<div class="cp-hero__scrim"></div>' +
      '<div class="cp-hero__text">' +
        '<p class="cp-hero__eyebrow">' + esc(d.eyebrow) + '</p>' +
        '<h2 class="cp-hero__title">' + esc(this.course.title) + '</h2>' +
        '<p class="cp-hero__lede">' + esc(d.lede) + '</p>' +
        (d.meta ? '<p class="cp-hero__meta">' + esc(d.meta) + '</p>' : '') +
        '<button type="button" class="cp-btn cp-btn--primary" data-act="start">Start the course' + ICON.arrow + '</button>' +
      '</div>' +
    '</div>';
  };

  CoursePlayer.prototype.tplContent = function (d, n) {
    return '<div class="cp-slide">' +
      imageSlot(d.image, d.imageLabel) +
      '<div class="cp-slide__text">' +
        '<p class="cp-eyebrow">Page ' + n + ' · ' + esc(d.title) + '</p>' +
        '<h2 class="cp-h2">' + esc(d.heading) + '</h2>' +
        '<p class="cp-body-text">' + esc(d.body) + '</p>' +
        '<ul class="cp-points">' + (d.points || []).map(function (pt) { return '<li>' + esc(pt) + '</li>'; }).join('') + '</ul>' +
      '</div>' +
    '</div>';
  };

  CoursePlayer.prototype.tplAccordion = function (d, n) {
    var open = this.state.openItem;
    var items = (d.items || []).map(function (it, i) {
      var isOpen = i === open;
      var id = 'cp-acc-' + n + '-' + i;
      return '<div class="cp-acc-item' + (isOpen ? ' is-open' : '') + '">' +
        '<h3><button type="button" class="cp-acc-btn" id="' + id + '-btn" data-act="acc" data-item="' + i + '" aria-expanded="' + isOpen + '" aria-controls="' + id + '">' +
          '<span class="cp-acc-num" aria-hidden="true">' + (i + 1) + '</span>' +
          '<span class="cp-acc-name">' + esc(it.name) + '</span>' +
          '<span class="cp-acc-chev">' + ICON.chevronDown + '</span>' +
        '</button></h3>' +
        '<div class="cp-acc-panel" id="' + id + '" role="region" aria-labelledby="' + id + '-btn"><div>' +
          '<p>' + esc(it.description) + '</p>' +
          '<p><strong>Typical amount:</strong> ' + esc(it.amount) + '</p>' +
        '</div></div>' +
      '</div>';
    }).join('');
    return '<div class="cp-acc-slide">' +
      '<div class="cp-acc-intro">' +
        '<p class="cp-eyebrow">Page ' + n + ' · ' + esc(d.title) + '</p>' +
        '<h2 class="cp-h2">' + esc(d.heading) + '</h2>' +
        '<p class="cp-body-text">' + esc(d.lede) + '</p>' +
        imageSlot(d.image, d.imageLabel) +
      '</div>' +
      '<div class="cp-acc-list">' + items + '</div>' +
    '</div>';
  };

  CoursePlayer.prototype.tplTabs = function (d, n) {
    var open = this.state.openItem;
    var items = d.items || [];
    var tabs = items.map(function (it, i) {
      var isOpen = i === open;
      var id = 'cp-tab-' + n + '-' + i;
      return '<button type="button" class="cp-tab' + (isOpen ? ' is-open' : '') + '" role="tab" id="' + id + '" data-act="tab" data-item="' + i + '"' +
        ' aria-selected="' + isOpen + '" aria-controls="' + id + '-panel">' + esc(it.name) + '</button>';
    }).join('');
    var panels = items.map(function (it, i) {
      var isOpen = i === open;
      var id = 'cp-tab-' + n + '-' + i;
      return '<div class="cp-tabpanel' + (isOpen ? ' is-open' : '') + '" id="' + id + '-panel" role="tabpanel" aria-labelledby="' + id + '"><div><div class="cp-tabpanel__inner">' +
        imageSlot(it.image, it.imageLabel) +
        '<div class="cp-tabpanel__text">' +
          '<h3>' + esc(it.name) + '</h3>' +
          '<p>' + esc(it.description) + '</p>' +
          (it.tip ? '<p class="cp-tabpanel__tip"><strong>Tip:</strong> ' + esc(it.tip) + '</p>' : '') +
        '</div>' +
      '</div></div></div>';
    }).join('');
    return '<div class="cp-tabs-slide">' +
      '<div class="cp-tabs-intro">' +
        '<p class="cp-eyebrow">Page ' + n + ' · ' + esc(d.title) + '</p>' +
        '<h2 class="cp-h2">' + esc(d.heading) + '</h2>' +
        '<p class="cp-body-text">' + esc(d.lede) + '</p>' +
      '</div>' +
      '<div class="cp-tablist" role="tablist" aria-label="' + esc(d.title) + '">' + tabs + '</div>' +
      '<div class="cp-tabpanels">' + panels + '</div>' +
    '</div>';
  };

  CoursePlayer.prototype.renderCaptions = function () {
    var on = this.state.captionsOn;
    this.slots['captions-wrap'].hidden = !on;
    this.el.querySelectorAll('[data-role=captions]').forEach(function (b) {
      b.setAttribute('aria-pressed', String(on));
    });
  };

  CoursePlayer.prototype.renderCaptionText = function () {
    var lines = this.page().data.narration || [];
    this.slots.captions.innerHTML = lines.map(function (line, i) {
      return '<span data-line="' + i + '">' + esc(line) + '</span>';
    }).join(' ');
    this.activeLine = -1;
    this.renderActiveLine();
  };

  CoursePlayer.prototype.renderActiveLine = function () {
    var d = this.page().data;
    var count = (d.narration || []).length;
    if (!count) return;
    var i = Math.min(Math.floor(this.state.t / d.duration * count), count - 1);
    if (i === this.activeLine) return;
    this.activeLine = i;
    var spans = this.slots.captions.children;
    for (var k = 0; k < spans.length; k++) spans[k].classList.toggle('is-active', k === i);
    var active = spans[i];
    if (active) {
      var box = this.slots.captions;
      var top = active.offsetTop - box.offsetTop;
      if (top < box.scrollTop || top + active.offsetHeight > box.scrollTop + box.clientHeight) box.scrollTop = top;
    }
  };

  CoursePlayer.prototype.renderAudio = function () {
    var s = this.state;
    var d = this.page().data;
    var mutedView = s.muted || s.volume === 0;
    var time = fmt(s.t) + ' / ' + fmt(d.duration);

    this.el.querySelectorAll('[data-role=play]').forEach(function (b) {
      b.innerHTML = s.playing ? ICON.pause : ICON.play;
      b.setAttribute('aria-label', s.playing ? 'Pause narration' : 'Play narration');
      b.title = s.playing ? 'Pause' : 'Play';
    });
    this.el.querySelectorAll('[data-role=mute]').forEach(function (b) {
      b.innerHTML = mutedView ? ICON.muted : ICON.volume;
      b.setAttribute('aria-pressed', String(mutedView));
    });
    this.el.querySelectorAll('[data-role=volume]').forEach(function (r) {
      r.value = s.muted ? 0 : s.volume;
      r.setAttribute('aria-valuetext', (s.muted ? 0 : s.volume) + '%');
    });
    this.el.querySelectorAll('[data-role=time]').forEach(function (t) {
      t.textContent = time;
    });

    var bar = this.slots['page-bar'];
    bar.setAttribute('aria-label', d.title + ' narration');
    bar.setAttribute('aria-valuemax', d.duration);
    bar.setAttribute('aria-valuenow', s.t);
    bar.setAttribute('aria-valuetext', fmt(s.t) + ' of ' + fmt(d.duration));
    bar.title = d.title + ': ' + fmt(s.t) + ' of ' + fmt(d.duration);
    bar.firstChild.style.width = (s.t / d.duration * 100) + '%';

    this.renderActiveLine();
  };

  CoursePlayer.prototype.destroy = function () {
    this.stopTimer();
    clearTimeout(this.toastTimer);
    if (this.ro) this.ro.disconnect();
    this.root.innerHTML = '';
  };

  window.CoursePlayer = CoursePlayer;
})();
