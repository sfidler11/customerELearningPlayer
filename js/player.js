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
    clock: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="13" r="8"/><path d="M12 9v4l2.5 2M9.5 2.5h5M12 2.5V5"/></svg>',
    check: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>'
  };

  var STATUS_ICON = {
    complete: '<svg class="cp-status" viewBox="0 0 20 20" aria-hidden="true"><circle cx="10" cy="10" r="10" fill="#CC5500"/><path d="M5.8 10.4l2.8 2.8 5.6-6" fill="none" stroke="#fff" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    progress: '<svg class="cp-status" viewBox="0 0 20 20" aria-hidden="true"><circle cx="10" cy="10" r="8.5" fill="none" stroke="#CC5500" stroke-width="2"/><path d="M10 3.5a6.5 6.5 0 0 1 0 13z" fill="#CC5500"/></svg>',
    notStarted: '<svg class="cp-status" viewBox="0 0 20 20" aria-hidden="true"><circle cx="10" cy="10" r="8.5" fill="none" stroke="#C9C3BC" stroke-width="2"/></svg>',
    current: '<svg class="cp-status" viewBox="0 0 20 20" aria-hidden="true"><circle cx="10" cy="10" r="8.5" fill="none" stroke="#CC5500" stroke-width="2"/><circle cx="10" cy="10" r="4" fill="#CC5500"/></svg>'
  };

  // Generic waffle picture shown on the tabs page when no tool is selected.
  var WAFFLE_ART = (function () {
    var lines = '';
    for (var i = 0; i < 5; i++) {
      var v = 48 + i * 36;
      lines += '<path d="M' + v + ' 20V220M20 ' + v + 'H220"/>';
    }
    return '<svg class="cp-waffle-art" viewBox="0 0 240 240" role="img" aria-label="A golden waffle with butter">' +
      '<defs><clipPath id="cp-waffle-clip"><circle cx="120" cy="120" r="98"/></clipPath></defs>' +
      '<circle cx="120" cy="124" r="108" fill="#000" opacity=".08"/>' +
      '<circle cx="120" cy="120" r="108" fill="#C77A1E"/>' +
      '<circle cx="120" cy="120" r="98" fill="#E9A23B"/>' +
      '<g clip-path="url(#cp-waffle-clip)" fill="none" stroke="#B86A14" stroke-width="9" stroke-linecap="round">' + lines + '</g>' +
      '<rect x="98" y="98" width="44" height="44" rx="8" fill="#FFE8A3" transform="rotate(-8 120 120)"/>' +
      '<rect x="98" y="98" width="44" height="14" rx="7" fill="#FFF4CC" transform="rotate(-8 120 120)"/>' +
    '</svg>';
  })();

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

  // A grid of emoji icons with labels, used in place of a photo. icons: [{ icon, label }].
  function iconGrid(icons) {
    return '<ul class="cp-icons">' + icons.map(function (it) {
      return '<li class="cp-icons__tile"><span class="cp-icons__icon" aria-hidden="true">' + (it.src ? '<img src="' + esc(it.src) + '" alt="">' : esc(it.icon)) + '</span>' +
        '<span class="cp-icons__label">' + esc(it.label) + '</span></li>';
    }).join('') + '</ul>';
  }

  // pos (optional) is a CSS object-position such as 'center 70%' for choosing which part of a photo stays in view.
  function imageSlot(src, label, pos) {
    return '<div class="cp-img">' +
      (src ? '<img src="' + esc(src) + '" alt="' + esc(label) + '"' + (pos ? ' style="object-position:' + esc(pos) + '"' : '') + '>' : '<span class="cp-img__label">' + esc(label) + '</span>') +
      '</div>';
  }

  function CoursePlayer(root, course, options) {
    var opts = options || {};
    this.root = root;
    this.course = course;
    this.opts = {
      viewport: opts.viewport || 'auto',
      persist: opts.persist !== false,
      onClose: opts.onClose || null,
      onDownload: opts.onDownload || null,
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
      ironSeen: new Set(),
      rest: { left: null, running: false, end: 0 },
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
          '<button type="button" class="cp-btn cp-btn--outline cp-resources-btn" data-act="resources" aria-haspopup="dialog" aria-label="Course resources" title="Course resources"><span aria-hidden="true">\uD83D\uDCC4</span></button>' +
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
      // A host (an LMS wrapper, a sandboxed preview) can take over resource downloads
      // by returning true from onDownload; otherwise the link's own download runs.
      var link = e.target.closest('a.cp-res');
      if (link && typeof self.opts.onDownload === 'function') {
        var file = { url: link.getAttribute('href'), filename: (link.getAttribute('href') || '').split('/').pop() };
        if (self.opts.onDownload(file)) e.preventDefault();
        return;
      }
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
        case 'slide': self.toggleSlide(Number(target.getAttribute('data-item'))); break;
        case 'exit': self.openExitDialog(); break;
        case 'keep': self.closeExitDialog(); break;
        case 'confirm-exit': self.confirmExit(); break;
        case 'close-course': self.closeCourse(); break;
        case 'resources': self.openResources(); break;
        case 'resources-close': self.closeExitDialog(); break;
        case 'iron-open': self.openIron(); break;
        case 'tray': self.toggleTray(); break;
        case 'rest-start': self.restStart(); break;
        case 'rest-reset': self.restReset(); break;
        case 'iron-part': self.ironPart(target.getAttribute('data-part')); break;
        case 'iron-switch': self.ironSwitch(); break;
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
      self.scheduleFit();
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
    if (idx === s.idx && this.page().data.template === 'completion') this.renderPage();
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
    this.fitAfterMotion();
  };

  // Horizontal accordion: the chosen section widens to show its text, the rest shrink to title strips.
  CoursePlayer.prototype.toggleSlide = function (i) {
    this.state.openItem = this.state.openItem === i ? -1 : i;
    var open = this.state.openItem;
    var secs = this.slots.region.querySelectorAll('.cp-hs');
    for (var k = 0; k < secs.length; k++) {
      var on = k === open;
      secs[k].classList.toggle('is-open', on);
      secs[k].querySelector('.cp-hs__btn').setAttribute('aria-expanded', String(on));
    }
    this.fitAfterMotion();
  };

  // Panels animate open and closed, so measure again once they settle.
  CoursePlayer.prototype.fitAfterMotion = function () {
    var self = this;
    clearTimeout(this.fitTimer);
    this.fitTimer = setTimeout(function () { self.fitPage(); }, 520);
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
    this.slots.region.querySelector('[data-role=tabs-empty]').hidden = open !== -1;
    this.fitAfterMotion();
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

  // Pop-up listing the course's shared documents (PDFs, slide decks).
  // Entries come from course.resources: { title, type: 'pdf' | 'pptx', url, description }.
  CoursePlayer.prototype.openResources = function () {
    this.pause();
    this.dialogOpen = true;
    this.lastFocus = document.activeElement;
    var list = this.course.resources || [];
    var rows = list.map(function (r) {
      var kind = r.type === 'pptx' ? 'PowerPoint' : 'PDF';
      var icon = r.type === 'pptx' ? '\uD83D\uDCCA' : '\uD83D\uDCD5';
      var inner = '<span class="cp-res__icon" aria-hidden="true">' + icon + '</span>' +
        '<span class="cp-res__text"><span class="cp-res__title">' + esc(r.title) + '</span>' +
        (r.description ? '<span class="cp-res__sub">' + esc(r.description) + '</span>' : '') + '</span>' +
        '<span class="cp-res__kind">' + (r.url ? 'Download ' + kind : 'Coming soon') + '</span>';
      return r.url
        ? '<li><a class="cp-res" href="' + esc(r.url) + '" download aria-label="Download ' + esc(r.title) + ' (' + kind + ')">' + inner + '</a></li>'
        : '<li><div class="cp-res cp-res--soon">' + inner + '</div></li>';
    }).join('');
    this.slots.overlay.innerHTML =
      '<div class="cp-dialog-layer">' +
        '<div class="cp-dialog cp-dialog--resources" role="dialog" aria-modal="true" aria-labelledby="cp-res-title">' +
          '<div class="cp-dialog__head"><h2 id="cp-res-title">Course resources</h2>' +
            '<button type="button" class="cp-btn cp-btn--ghost" data-act="resources-close" aria-label="Close resources" title="Close">' + ICON.close + '</button></div>' +
          (rows ? '<ul class="cp-res-list">' + rows + '</ul>' : '<p>No resources have been shared yet.</p>') +
        '</div>' +
      '</div>';
    this.setInert(true);
    var self = this;
    this.trap = function (e) {
      if (e.key !== 'Tab') return;
      var els = self.slots.overlay.querySelectorAll('button, a[href]');
      var first = els[0], last = els[els.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    };
    this.slots.overlay.addEventListener('keydown', this.trap);
    this.slots.overlay.querySelector('[data-act=resources-close]').focus();
  };

  CoursePlayer.prototype.closeExitDialog = function () {
    clearTimeout(this.ironTimer);
    this.dialogOpen = false;
    this.slots.overlay.removeEventListener('keydown', this.trap);
    this.slots.overlay.innerHTML = '';
    this.setInert(false);
    this.updateIronCard();
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

  // Leaves the course for good. In an LMS the host hears about it through
  // the onClose option or a 'courseplayer:close' event on the player root;
  // otherwise the player tries to close its own window and shows a goodbye.
  CoursePlayer.prototype.closeCourse = function () {
    this.save();
    this.stopConfetti();
    if (typeof this.opts.onClose === 'function') this.opts.onClose({ completed: this.courseDone(), pages: this.pages.length });
    this.el.dispatchEvent(new CustomEvent('courseplayer:close', { bubbles: true, detail: { completed: this.courseDone() } }));
    this.state.exited = true;
    this.setInert(true);
    this.slots.overlay.innerHTML =
      '<div class="cp-saved" role="region" aria-labelledby="cp-saved-title">' +
        '<div class="cp-saved__card">' +
          '<div class="cp-check">' + ICON.check + '</div>' +
          '<h2 id="cp-saved-title">Course closed</h2>' +
          '<p>Your completion is saved. You can close this window now.</p>' +
          '<button type="button" class="cp-btn cp-btn--primary" data-act="resume">Review course</button>' +
        '</div>' +
      '</div>';
    this.slots.overlay.querySelector('[data-act=resume]').focus();
    try { window.close(); } catch (e) { /* not a window we opened; the message above stands */ }
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
    this.fitCompletion();
    this.fitPage();
  };

  // The completion screen should never need scrolling: drop the picture first,
  // then shrink the whole screen if the player is still too short for it.
  CoursePlayer.prototype.fitCompletion = function () {
    var region = this.slots.region;
    var done = region && region.querySelector('.cp-done:not(.cp-done--pending)');
    if (!done) return;
    done.classList.remove('cp-done--compact');
    done.style.zoom = '';
    done.style.removeProperty('--art');
    var avail = region.clientHeight;
    if (region.scrollHeight <= avail + 1) return;
    // Desktop keeps the picture and shrinks it; smaller layouts drop it.
    if (this.state.mode === 'desktop') {
      done.classList.add('cp-done--tight');
      var art = Math.max(56, 160 - (region.scrollHeight - avail));
      if (region.scrollHeight > avail + 1) done.style.setProperty('--art', art + 'px');
      if (region.scrollHeight <= avail + 1) return;
    } else {
      done.classList.add('cp-done--compact');
      if (region.scrollHeight <= avail + 1) return;
    }
    done.classList.add('cp-done--tight');
    var need = region.scrollHeight;
    if (need > avail + 1) done.style.zoom = String(Math.max(0.5, avail / need));
  };

  // Every page except the title should fit the window without scrolling: when the
  // content is taller than the region, scale it down (never below 55%) and re-check.
  CoursePlayer.prototype.fitPage = function () {
    var region = this.slots.region;
    var el = region && region.firstElementChild;
    if (!el || this.el.classList.contains('cp--title-page')) return;
    if (el.classList.contains('cp-done') && !el.classList.contains('cp-done--pending')) return;
    el.style.zoom = '';
    var avail = region.clientHeight;
    if (!avail) return;
    // Horizontal accordion: grow the row until the open section's text fits without its own scrollbar.
    var row = el.querySelector('.cp-hs-row');
    if (row) {
      row.style.minHeight = '';
      var inner = row.querySelector('.cp-hs.is-open .cp-hs__inner');
      if (inner && inner.scrollHeight > inner.clientHeight + 1) {
        row.style.minHeight = (row.clientHeight + inner.scrollHeight - inner.clientHeight) + 'px';
      }
    }
    var z = 1;
    for (var i = 0; i < 4; i++) {
      var need = region.scrollHeight;
      if (need <= avail + 1) break;
      z = Math.max(0.55, z * avail / need);
      el.style.zoom = String(z);
      if (z <= 0.55) break;
    }
  };

  CoursePlayer.prototype.scheduleFit = function () {
    var self = this;
    if (this.fitRaf) return;
    this.fitRaf = requestAnimationFrame(function () {
      self.fitRaf = 0;
      self.fitCompletion();
      self.fitPage();
    });
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

    var html = (this.course.resources && this.course.resources.length)
      ? '<button type="button" class="cp-btn cp-btn--outline cp-menu-resources" data-act="resources" aria-haspopup="dialog">' +
          '<span aria-hidden="true">\uD83D\uDCC4</span> Resources</button>'
      : '';
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

    this.restStop();
    var region = this.slots.region;
    region.setAttribute('aria-label', 'Page ' + n + ': ' + d.title);
    region.scrollTop = 0;
    if (d.template === 'title') region.innerHTML = this.tplTitle(d);
    else if (d.template === 'accordion') region.innerHTML = this.tplAccordion(d, n);
    else if (d.template === 'tabs') region.innerHTML = this.tplTabs(d, n);
    else if (d.template === 'rest') region.innerHTML = this.tplRest(d, n);
    else if (d.template === 'iron') region.innerHTML = this.tplIron(d, n);
    else if (d.template === 'slider') region.innerHTML = this.tplSlider(d, n);
    else if (d.template === 'completion') region.innerHTML = this.tplCompletion(d);
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

    this.updateIronCard();
    this.restPaint();
    this.fitCompletion();
    this.fitPage();
    this.renderCaptionText();
    this.stopConfetti();
    if (d.template === 'completion' && this.courseDone()) this.startConfetti();
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
      imageSlot(d.image, d.imageLabel, d.imagePosition) +
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
        (d.icons && d.icons.length ? iconGrid(d.icons) : imageSlot(d.image, d.imageLabel)) +
      '</div>' +
      '<div class="cp-acc-list">' + items + '</div>' +
    '</div>';
  };

  // The last page: the finished screen once every page is complete, a progress note until then.
  CoursePlayer.prototype.courseDone = function () {
    return this.state.completed.size === this.pages.length;
  };

  CoursePlayer.prototype.tplCompletion = function (d) {
    var s = this.state;
    if (this.courseDone()) {
      return '<div class="cp-done">' +
        WAFFLE_ART +
        '<h2 class="cp-done__title">' + esc(d.heading) + '</h2>' +
        '<p class="cp-done__text">' + esc(d.thanks) + '</p>' +
        '<button type="button" class="cp-btn cp-btn--primary cp-done__close" data-act="close-course">Close Course</button>' +
      '</div>';
    }
    var groups = '';
    for (var m = 0; m < this.course.modules.length; m++) {
      var links = '';
      for (var i = 0; i < this.pages.length; i++) {
        var pg = this.pages[i];
        if (pg.module !== m || s.completed.has(i) || i === s.idx) continue;
        links += '<li><button type="button" class="cp-link" data-act="goto" data-idx="' + i + '">Page ' + (i + 1) + ': ' + esc(pg.data.title) + '</button></li>';
      }
      if (links) groups += '<div class="cp-todo__group"><h3 class="cp-todo__module">Module ' + (m + 1) + ' · ' + esc(this.course.modules[m].title) + '</h3><ul class="cp-todo">' + links + '</ul></div>';
    }
    if (groups) groups = '<div class="cp-todo__cols">' + groups + '</div>';
    return '<div class="cp-done cp-done--pending">' +
      '<h2 class="cp-done__title">' + esc(d.pendingHeading) + '</h2>' +
      '<p class="cp-done__text">' + esc(d.pendingBody) + ' You have finished ' + s.completed.size + ' of ' + this.pages.length + ' pages. Still to finish:</p>' +
      groups +
    '</div>';
  };

  CoursePlayer.prototype.tplSlider = function (d, n) {
    var open = this.state.openItem;
    var secs = (d.items || []).map(function (it, i) {
      var isOpen = i === open;
      var id = 'cp-hs-' + n + '-' + i;
      return '<section class="cp-hs cp-hs--' + esc(it.color || 'amber') + (isOpen ? ' is-open' : '') + '">' +
        '<button type="button" class="cp-hs__btn" id="' + id + '-btn" data-act="slide" data-item="' + i + '" aria-expanded="' + isOpen + '" aria-controls="' + id + '">' +
          '<span class="cp-hs__icon" aria-hidden="true">' + esc(it.icon || '') + '</span>' +
          '<span class="cp-hs__title">' + esc(it.name) + '</span>' +
        '</button>' +
        '<div class="cp-hs__panel" id="' + id + '" role="region" aria-labelledby="' + id + '-btn"><div class="cp-hs__inner">' +
          '<span class="cp-hs__kind">' + esc(it.kind || '') + '</span>' +
          '<h3 class="cp-hs__heading">' + esc(it.name) + '</h3>' +
          '<p>' + esc(it.description) + '</p>' +
          (it.tip ? '<p><strong>Try it with:</strong> ' + esc(it.tip) + '</p>' : '') +
        '</div></div>' +
      '</section>';
    }).join('');
    return '<div class="cp-hs-slide">' +
      '<div class="cp-hs-intro">' +
        '<p class="cp-eyebrow">Page ' + n + ' · ' + esc(d.title) + '</p>' +
        '<h2 class="cp-h2">' + esc(d.heading) + '</h2>' +
        '<p class="cp-body-text">' + esc(d.lede) + '</p>' +
      '</div>' +
      '<div class="cp-hs-row">' + secs + '</div>' +
    '</div>';
  };


  // ---------- Waffle iron explorer (modal with clickable parts) ----------
  var IRON_PARTS = ['handle', 'top', 'bottom', 'light', 'switch'];
  // Pin positions as a percentage of the 400 x 300 drawing.
  var IRON_PINS = { handle: [50, 6], top: [50, 27], bottom: [50, 60], light: [27.5, 68.5] };

  function ironSvg() {
    return '<svg class="cp-iron__svg" viewBox="0 0 400 300" role="img" aria-label="Drawing of an open waffle iron" focusable="false">' +
      '<defs>' +
        '<pattern id="cp-grid" width="14" height="14" patternUnits="userSpaceOnUse"><rect width="14" height="14" fill="#9aa0a8"/><rect x="2" y="2" width="10" height="10" rx="2" fill="#5d636b"/></pattern>' +
        '<linearGradient id="cp-body" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#3b3f45"/><stop offset="1" stop-color="#23262a"/></linearGradient>' +
      '</defs>' +
      '<ellipse cx="200" cy="278" rx="170" ry="9" fill="#000" opacity=".12"/>' +
      // lid, open and tilted back
      '<path d="M96 30 H304 Q312 30 314 38 L332 118 H68 L86 38 Q88 30 96 30Z" fill="url(#cp-body)"/>' +
      '<path d="M108 42 H292 L310 110 H90Z" fill="url(#cp-grid)"/>' +
      '<path class="cp-iron__glow cp-iron__glow--top" d="M108 42 H292 L310 110 H90Z" fill="#ff7a1a"/>' +
      // handle
      '<rect x="146" y="12" width="108" height="14" rx="7" fill="#c9702a"/><rect x="156" y="24" width="8" height="8" fill="#7d4318"/><rect x="236" y="24" width="8" height="8" fill="#7d4318"/>' +
      // base
      '<rect x="28" y="122" width="344" height="132" rx="22" fill="url(#cp-body)"/>' +
      '<path d="M58 140 H342 L356 214 H44Z" fill="url(#cp-grid)"/>' +
      '<path class="cp-iron__glow cp-iron__glow--bottom" d="M58 140 H342 L356 214 H44Z" fill="#ff7a1a"/>' +
      '<rect x="44" y="222" width="312" height="2" fill="#000" opacity=".25"/>' +
      // steam
      '<g class="cp-iron__steam" fill="none" stroke="#fff" stroke-width="5" stroke-linecap="round" opacity="0">' +
        '<path class="cp-steam cp-steam--1" d="M150 120 q-10 -16 0 -30 q10 -14 0 -28"/>' +
        '<path class="cp-steam cp-steam--2" d="M200 120 q-10 -16 0 -30 q10 -14 0 -28"/>' +
        '<path class="cp-steam cp-steam--3" d="M250 120 q-10 -16 0 -30 q10 -14 0 -28"/>' +
      '</g>' +
      // ready light
      '<circle class="cp-iron__bulb" cx="110" cy="238" r="9" fill="#e03b2e"/>' +
    '</svg>';
  }

  CoursePlayer.prototype.tplIron = function (d, n) {
    var total = IRON_PARTS.length;
    return '<div class="cp-slide cp-slide--iron">' +
      '<div class="cp-iron-card">' +
        '<div class="cp-iron-card__art">' + ironSvg() + '</div>' +
        '<button type="button" class="cp-btn cp-btn--primary cp-iron-card__btn" data-act="iron-open">' + esc(d.exploreLabel || 'Explore the waffle iron') + '</button>' +
        '<p class="cp-iron-card__count" data-role="iron-count"></p>' +
      '</div>' +
      '<div class="cp-slide__text">' +
        '<p class="cp-eyebrow">Page ' + n + ' · ' + esc(d.title) + '</p>' +
        '<h2 class="cp-h2">' + esc(d.heading) + '</h2>' +
        '<p class="cp-body-text">' + esc(d.body) + '</p>' +
        '<ul class="cp-points">' + (d.points || []).map(function (pt) { return '<li>' + esc(pt) + '</li>'; }).join('') + '</ul>' +
      '</div>' +
    '</div>';
  };

  CoursePlayer.prototype.ironData = function () { return this.page().data; };

  // Keeps the "x of 5 explored" line on the page in step with the modal.
  CoursePlayer.prototype.updateIronCard = function () {
    var el = this.slots.region && this.slots.region.querySelector('[data-role=iron-count]');
    if (!el) return;
    var seen = this.state.ironSeen.size, total = IRON_PARTS.length;
    el.textContent = seen === total ? '✓ You explored every part' : seen + ' of ' + total + ' parts explored';
    el.classList.toggle('is-done', seen === total);
  };

  CoursePlayer.prototype.openIron = function () {
    this.pause();
    this.dialogOpen = true;
    this.lastFocus = document.activeElement;
    var d = this.ironData();
    var parts = d.parts || {};
    var self = this;
    var check = '<span class="cp-iron__check" aria-hidden="true">' + ICON.check + '</span>';
    var pins = Object.keys(IRON_PINS).map(function (id) {
      var pos = IRON_PINS[id];
      var idx = IRON_PARTS.indexOf(id) + 1;
      return '<button type="button" class="cp-pin" data-act="iron-part" data-part="' + id + '" style="left:' + pos[0] + '%;top:' + pos[1] + '%" aria-label="' + esc((parts[id] || {}).name || id) + '">' +
        '<span class="cp-pin__num" aria-hidden="true">' + idx + '</span>' + check + '</button>';
    }).join('');
    var list = IRON_PARTS.map(function (id, i) {
      return '<li><button type="button" class="cp-iron-row" data-act="iron-part" data-part="' + id + '">' +
        '<span class="cp-iron-row__mark" aria-hidden="true"><span class="cp-iron-row__num">' + (i + 1) + '</span>' + ICON.check + '</span>' +
        '<span class="cp-iron-row__name">' + esc((parts[id] || {}).name || id) + '</span>' +
        '<span class="cp-sr cp-iron-row__state"></span></button></li>';
    }).join('');
    // Every explanation sits in the same grid cell so the panel keeps the height of the longest one.
    var infoSlides = '<div class="cp-iron__slide is-current" data-slide="hint"><p class="cp-iron__hint">Select a numbered point on the waffle iron, or a part in the list, to learn why it matters.</p></div>' +
      IRON_PARTS.map(function (id) {
        var part = parts[id] || { name: id, text: '' };
        return '<div class="cp-iron__slide" data-slide="' + id + '"><h3>' + esc(part.name) + '</h3><p>' + esc(part.text) + '</p>' +
          (id === 'switch' ? '<p class="cp-iron__tip">' + esc(part.tip || '') + '</p>' +
            '<p class="cp-iron__tip cp-iron__heat">' + esc((parts.light && parts.light.heating) || 'The red light means the iron is heating up.') + '</p>' : '') +
          '</div>';
      }).join('');
    this.slots.overlay.innerHTML =
      '<div class="cp-dialog-layer">' +
        '<div class="cp-dialog cp-dialog--iron" role="dialog" aria-modal="true" aria-labelledby="cp-iron-title">' +
          '<div class="cp-dialog__head"><h2 id="cp-iron-title">' + esc(d.modalTitle || 'Explore the waffle iron') + '</h2>' +
            '<button type="button" class="cp-btn cp-btn--ghost" data-act="resources-close" aria-label="Close" title="Close">' + ICON.close + '</button></div>' +
          '<div class="cp-iron">' +
            '<div class="cp-iron__stage" data-role="iron-stage">' +
              ironSvg() + pins +
              '<button type="button" class="cp-switch" role="switch" aria-checked="false" data-act="iron-switch" aria-label="Power switch">' +
                '<span class="cp-switch__track"><span class="cp-switch__knob"></span></span>' +
                '<span class="cp-switch__text" data-role="switch-text">OFF</span>' + check +
              '</button>' +
            '</div>' +
            '<div class="cp-iron__side">' +
              '<div class="cp-iron__info" data-role="iron-info" aria-live="polite">' + infoSlides + '</div>' +
              '<ul class="cp-iron__list">' + list + '</ul>' +
              '<p class="cp-iron__progress" data-role="iron-progress"></p>' +
            '</div>' +
          '</div>' +
        '</div>' +
      '</div>';
    this.setInert(true);
    this.trap = function (e) {
      if (e.key !== 'Tab') return;
      var els = self.slots.overlay.querySelectorAll('button');
      var first = els[0], last = els[els.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    };
    this.slots.overlay.addEventListener('keydown', this.trap);
    this.ironRefresh();
    this.slots.overlay.querySelector('[data-act=resources-close]').focus();
  };

  // Redraws the check marks, list and progress from state.ironSeen.
  CoursePlayer.prototype.ironRefresh = function () {
    var ov = this.slots.overlay, seen = this.state.ironSeen;
    ov.querySelectorAll('[data-part]').forEach(function (b) {
      var done = seen.has(b.getAttribute('data-part'));
      b.classList.toggle('is-seen', done);
      var st = b.querySelector('.cp-iron-row__state');
      if (st) st.textContent = done ? ' (explored)' : '';
    });
    var sw = ov.querySelector('.cp-switch');
    if (sw) sw.classList.toggle('is-seen', seen.has('switch'));
    var total = IRON_PARTS.length;
    var pr = ov.querySelector('[data-role=iron-progress]');
    if (pr) {
      pr.textContent = seen.size === total ? '✓ You explored every part. Close this window to continue.' : seen.size + ' of ' + total + ' parts explored';
      pr.classList.toggle('is-done', seen.size === total);
    }
  };

  CoursePlayer.prototype.ironShow = function (id) {
    this.slots.overlay.querySelectorAll('.cp-iron__slide').forEach(function (el) {
      el.classList.toggle('is-current', el.getAttribute('data-slide') === id);
    });
    this.slots.overlay.querySelectorAll('.cp-pin, .cp-iron-row, .cp-switch').forEach(function (b) {
      var bid = b.getAttribute('data-part') || (b.classList.contains('cp-switch') ? 'switch' : '');
      b.classList.toggle('is-active', bid === id);
    });
  };

  CoursePlayer.prototype.ironPart = function (id) {
    if (id === 'switch') {
      this.ironShow('switch');
      this.state.ironSeen.add('switch');
      this.ironRefresh();
      return;
    }
    this.state.ironSeen.add(id);
    this.ironShow(id);
    this.ironRefresh();
  };

  // The on/off switch: slides, lights the plates, turns the light from red to green and lets steam rise.
  CoursePlayer.prototype.ironSwitch = function () {
    var stage = this.slots.overlay.querySelector('[data-role=iron-stage]');
    var sw = stage.querySelector('.cp-switch');
    var on = !stage.classList.contains('is-on');
    var self = this;
    clearTimeout(this.ironTimer);
    stage.classList.toggle('is-on', on);
    stage.classList.remove('is-ready');
    sw.setAttribute('aria-checked', String(on));
    stage.querySelector('[data-role=switch-text]').textContent = on ? 'ON' : 'OFF';
    if (on) this.ironTimer = setTimeout(function () { stage.classList.add('is-ready'); }, 1600);
    this.ironPart('switch');
  };


  // ---------- Rest timer tray (slides up from the bottom of the page) ----------
  var REST_GRID = (function () {
    var lines = '';
    for (var i = 0; i < 5; i++) { var v = 48 + i * 36; lines += '<path d="M' + v + ' 20V220M20 ' + v + 'H220"/>'; }
    return lines;
  })();

  function mix(a, b, t) {
    var out = '#';
    for (var i = 0; i < 3; i++) {
      var x = parseInt(a.substr(1 + i * 2, 2), 16), y = parseInt(b.substr(1 + i * 2, 2), 16);
      var v = Math.round(x + (y - x) * t).toString(16);
      out += (v.length < 2 ? '0' : '') + v;
    }
    return out;
  }

  CoursePlayer.prototype.tplRest = function (d, n) {
    var secs = Math.round((d.timerMinutes || 5) * 60);
    if (this.state.rest.left == null || this.state.rest.total !== secs) this.state.rest = { total: secs, left: secs, running: false, end: 0 };
    var label = esc(d.timerLabel || 'Rest timer');
    return '<div class="cp-rest">' +
      '<div class="cp-rest__text">' +
        '<p class="cp-eyebrow">Page ' + n + ' · ' + esc(d.title) + '</p>' +
        '<h2 class="cp-h2">' + esc(d.heading) + '</h2>' +
        '<p class="cp-body-text">' + esc(d.body) + '</p>' +
        '<ul class="cp-points">' + (d.points || []).map(function (pt) { return '<li>' + esc(pt) + '</li>'; }).join('') + '</ul>' +
      '</div>' +
      '<section class="cp-tray" data-role="tray" aria-label="' + label + '">' +
        '<button type="button" class="cp-tray__handle" data-act="tray" aria-expanded="false" aria-controls="cp-tray-body">' +
          '<span class="cp-tray__grip" aria-hidden="true"></span>' +
          '<span class="cp-tray__title"><span class="cp-tray__clock">' + ICON.clock + '</span>' + label + '</span>' +
          '<span class="cp-tray__peek" data-role="rest-peek"></span>' +
          '<span class="cp-tray__chev">' + ICON.chevronDown + '</span>' +
        '</button>' +
        '<div class="cp-tray__body" id="cp-tray-body">' +
          '<svg class="cp-rest__waffle" viewBox="0 0 240 240" role="img" aria-label="A waffle that browns as the timer runs" data-role="rest-waffle">' +
            '<defs><clipPath id="cp-rest-clip"><circle cx="120" cy="120" r="98"/></clipPath></defs>' +
            '<circle cx="120" cy="124" r="108" fill="#000" opacity=".08"/>' +
            '<circle data-role="w-rim" cx="120" cy="120" r="108" fill="#E8D9B0"/>' +
            '<circle data-role="w-face" cx="120" cy="120" r="98" fill="#F6E9C4"/>' +
            '<g data-role="w-grid" clip-path="url(#cp-rest-clip)" fill="none" stroke="#D9C79A" stroke-width="9" stroke-linecap="round">' + REST_GRID + '</g>' +
            '<g class="cp-rest__steam" fill="none" stroke="#fff" stroke-width="7" stroke-linecap="round" opacity=".0">' +
              '<path class="cp-rsteam cp-rsteam--1" d="M90 70 q-12 -16 0 -32 q12 -16 0 -32"/>' +
              '<path class="cp-rsteam cp-rsteam--2" d="M120 64 q-12 -16 0 -32 q12 -16 0 -32"/>' +
              '<path class="cp-rsteam cp-rsteam--3" d="M150 70 q-12 -16 0 -32 q12 -16 0 -32"/>' +
            '</g>' +
          '</svg>' +
          '<div class="cp-rest__panel">' +
            '<p class="cp-rest__time" data-role="rest-time" role="timer" aria-live="off">5:00</p>' +
            '<div class="cp-rest__bar" aria-hidden="true"><span data-role="rest-bar"></span></div>' +
            '<p class="cp-rest__status" data-role="rest-status" aria-live="polite"></p>' +
            '<div class="cp-rest__btns">' +
              '<button type="button" class="cp-btn cp-btn--primary" data-act="rest-start" data-role="rest-start">Start timer</button>' +
              '<button type="button" class="cp-btn cp-btn--outline" data-act="rest-reset">Reset</button>' +
            '</div>' +
          '</div>' +
        '</div>' +
      '</section>' +
    '</div>';
  };

  CoursePlayer.prototype.toggleTray = function () {
    var tray = this.slots.region.querySelector('[data-role=tray]');
    if (!tray) return;
    var open = !tray.classList.contains('is-open');
    tray.classList.toggle('is-open', open);
    tray.querySelector('.cp-tray__handle').setAttribute('aria-expanded', String(open));
  };

  // Paints the countdown, progress bar and the waffle's colour from the time left.
  CoursePlayer.prototype.restPaint = function () {
    var r = this.state.rest, el = this.slots.region;
    if (!el || !el.querySelector('[data-role=rest-time]')) return;
    var left = Math.max(0, r.left), total = r.total;
    var p = total ? 1 - left / total : 0;
    var txt = fmt(Math.ceil(left));
    el.querySelector('[data-role=rest-time]').textContent = txt;
    el.querySelector('[data-role=rest-peek]').textContent = left === 0 ? 'Done' : (r.running ? txt + ' left' : txt);
    el.querySelector('[data-role=rest-bar]').style.width = (p * 100) + '%';
    // Pale batter to golden brown.
    var face = mix('#F6E9C4', '#D98A1F', Math.min(1, p / 0.85));
    var rim = mix('#E8D9B0', '#B86A14', Math.min(1, p / 0.85));
    var line = mix('#D9C79A', '#9A540E', Math.min(1, p / 0.85));
    el.querySelector('[data-role=w-face]').setAttribute('fill', face);
    el.querySelector('[data-role=w-rim]').setAttribute('fill', rim);
    el.querySelector('[data-role=w-grid]').setAttribute('stroke', line);
    el.querySelector('[data-role=rest-waffle]').classList.toggle('is-cooking', r.running);
    var btn = el.querySelector('[data-role=rest-start]');
    btn.textContent = r.running ? 'Pause' : (left === 0 ? 'Start again' : (left < total ? 'Resume' : 'Start timer'));
    el.querySelector('[data-role=rest-status]').textContent = left === 0 ? 'Time is up. Your batter is rested and ready to cook.' :
      r.running ? 'Resting. The batter is thickening and the bubbles are forming.' : (left < total ? 'Paused.' : 'Press start when your batter is covered and resting.');
  };

  CoursePlayer.prototype.restStart = function () {
    var r = this.state.rest, self = this;
    if (r.running) { this.restStop(); this.restPaint(); return; }
    if (r.left <= 0) r.left = r.total;
    r.running = true;
    r.end = Date.now() + r.left * 1000;
    clearInterval(this.restTimer);
    this.restTimer = setInterval(function () {
      r.left = Math.max(0, (r.end - Date.now()) / 1000);
      if (r.left <= 0) { self.restStop(); r.left = 0; }
      self.restPaint();
    }, 200);
    this.restPaint();
  };

  CoursePlayer.prototype.restStop = function () {
    clearInterval(this.restTimer);
    var r = this.state.rest;
    if (r && r.running) r.left = Math.max(0, (r.end - Date.now()) / 1000);
    if (r) r.running = false;
  };

  CoursePlayer.prototype.restReset = function () {
    this.restStop();
    this.state.rest.left = this.state.rest.total;
    this.restPaint();
  };

  CoursePlayer.prototype.tplTabs = function (d, n) {
    var open = this.state.openItem;
    var items = d.items || [];
    var tabs = items.map(function (it, i) {
      var isOpen = i === open;
      var id = 'cp-tab-' + n + '-' + i;
      return '<button type="button" class="cp-tab' + (isOpen ? ' is-open' : '') + '" role="tab" id="' + id + '" data-act="tab" data-item="' + i + '"' +
        ' aria-selected="' + isOpen + '" aria-controls="' + id + '-panel">' +
        (it.icon ? '<span class="cp-tab__icon" aria-hidden="true">' + esc(it.icon) + '</span>' : '') +
        '<span>' + esc(it.name) + '</span></button>';
    }).join('');
    var panels = items.map(function (it, i) {
      var isOpen = i === open;
      var id = 'cp-tab-' + n + '-' + i;
      return '<div class="cp-tabpanel' + (isOpen ? ' is-open' : '') + '" id="' + id + '-panel" role="tabpanel" aria-labelledby="' + id + '"><div><div class="cp-tabpanel__inner">' +
        imageSlot(it.image, it.imageLabel, it.imagePosition) +
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
      '<div class="cp-tabpanels">' + panels +
        '<div class="cp-tabs-empty" data-role="tabs-empty"' + (open === -1 ? '' : ' hidden') + '>' + WAFFLE_ART + '</div>' +
      '</div>' +
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

  /* ---------- Confetti ---------- */

  var CONFETTI_COLORS = ['#CC5500', '#A84600', '#F2A541', '#FFD166', '#F7E3C6', '#E8C9B3', '#4A4540'];
  var CONFETTI_BURSTS = 3;
  var CONFETTI_GAP = 1500;
  var CONFETTI_MS = 4200 + (CONFETTI_BURSTS - 1) * CONFETTI_GAP;

  // Fires once from the bottom corners of the content area. Skipped for people who ask for less motion.
  CoursePlayer.prototype.startConfetti = function () {
    if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    var frame = this.el.querySelector('.cp-frame');
    if (!frame) return;
    var canvas = document.createElement('canvas');
    canvas.className = 'cp-confetti';
    canvas.setAttribute('aria-hidden', 'true');
    frame.appendChild(canvas);
    var dpr = window.devicePixelRatio || 1;
    var w = frame.clientWidth, h = frame.clientHeight;
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    var ctx = canvas.getContext('2d');
    if (!ctx) { canvas.remove(); return; }
    ctx.scale(dpr, dpr);

    var pieces = [];
    for (var i = 0; i < 160 * CONFETTI_BURSTS; i++) {
      var fromLeft = i % 2 === 0;
      var angle = (fromLeft ? -60 : -120) + (Math.random() - 0.5) * 40;
      var speed = (0.7 + Math.random() * 0.6) * Math.min(h, 700) * 1.25;
      pieces.push({
        x: fromLeft ? w * 0.08 : w * 0.92,
        y: h,
        vx: Math.cos(angle * Math.PI / 180) * speed,
        vy: Math.sin(angle * Math.PI / 180) * speed,
        size: 6 + Math.random() * 6,
        rot: Math.random() * Math.PI * 2,
        spin: (Math.random() - 0.5) * 12,
        color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
        round: Math.random() < 0.25,
        delay: Math.floor(i / 160) * CONFETTI_GAP
      });
    }

    var start = null, last = null, self = this;
    this.confetti = { canvas: canvas, raf: 0 };
    function frameFn(now) {
      if (start == null) { start = now; last = now; }
      var dt = Math.min((now - last) / 1000, 0.05);
      last = now;
      var elapsed = now - start;
      ctx.clearRect(0, 0, w, h);
      var fade = elapsed > CONFETTI_MS - 800 ? Math.max(0, (CONFETTI_MS - elapsed) / 800) : 1;
      ctx.globalAlpha = fade;
      for (var k = 0; k < pieces.length; k++) {
        var q = pieces[k];
        if (elapsed < q.delay) continue;
        q.vy += 900 * dt;
        q.vx *= 1 - 0.9 * dt;
        q.vy *= 1 - 0.35 * dt;
        q.x += q.vx * dt;
        q.y += q.vy * dt;
        q.rot += q.spin * dt;
        ctx.save();
        ctx.translate(q.x, q.y);
        ctx.rotate(q.rot);
        ctx.fillStyle = q.color;
        if (q.round) { ctx.beginPath(); ctx.arc(0, 0, q.size / 2, 0, Math.PI * 2); ctx.fill(); }
        else ctx.fillRect(-q.size / 2, -q.size / 4, q.size, q.size / 2);
        ctx.restore();
      }
      if (elapsed >= CONFETTI_MS) { self.stopConfetti(); return; }
      self.confetti.raf = requestAnimationFrame(frameFn);
    }
    this.confetti.raf = requestAnimationFrame(frameFn);
  };

  CoursePlayer.prototype.stopConfetti = function () {
    if (!this.confetti) return;
    cancelAnimationFrame(this.confetti.raf);
    if (this.confetti.canvas.parentNode) this.confetti.canvas.parentNode.removeChild(this.confetti.canvas);
    this.confetti = null;
  };

  CoursePlayer.prototype.destroy = function () {
    this.stopTimer();
    clearTimeout(this.toastTimer);
    this.stopConfetti();
    if (this.ro) this.ro.disconnect();
    this.root.innerHTML = '';
  };

  window.CoursePlayer = CoursePlayer;
})();
