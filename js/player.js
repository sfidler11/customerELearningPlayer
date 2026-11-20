/*
 * Course Player shell. Behavior follows docs/style-guide.html.
 *
 * Content lives in JSON under data/ (see data/README.md):
 *   data/menu.json          course title, modules and the page list (title, number, file)
 *   data/pages/<page>.json  one file per page: its type and everything it shows
 *
 *   CoursePlayer.load(document.getElementById('app'), 'data/menu.json', {
 *     viewport: 'auto',   // 'auto' | 'desktop' | 'tablet' | 'phone'
 *     menuOpen: false,
 *     captionsOn: false,  // default comes from the session setting
 *     showToast: false,   // preview the "Section Completed" toast
 *     initialPage: 1,     // 1-based; overrides saved progress
 *     initialTime: 0,     // seconds into the initial page
 *     height: null,       // CSS height for the player; defaults to filling its container
 *     persist: true,      // save progress to localStorage
 *     files: null         // optional { 'data/menu.json': {...}, ... } to skip fetching
 *   }).then(function (player) { ... });
 *
 * new CoursePlayer(root, course, options) still works with an already-built course object.
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
    // An image can also be given as one object: { src, alt, position }.
    if (src && typeof src === 'object') { label = src.alt != null ? src.alt : label; pos = src.position || pos; src = src.src; }
    return '<div class="cp-img">' +
      (src ? '<img src="' + esc(src) + '" alt="' + esc(label) + '"' + (pos ? ' style="object-position:' + esc(pos) + '"' : '') + '>' : '<span class="cp-img__label">' + esc(label) + '</span>') +
      '</div>';
  }

  // Fills {name} placeholders from vars. Unknown names are left as they are.
  function tx(str, vars) {
    return String(str == null ? '' : str).replace(/\{(\w+)\}/g, function (m, k) {
      return vars && vars[k] != null ? vars[k] : m;
    });
  }

  // A page's own wording for a built-in label (page.labels[key]), or the fallback.
  function lbl(d, key, fallback, vars) {
    var v = d.labels && d.labels[key] != null ? d.labels[key] : fallback;
    return tx(v, vars);
  }

  function points(list) {
    return '<ul class="cp-points">' + (list || []).map(function (pt) { return '<li>' + esc(pt) + '</li>'; }).join('') + '</ul>';
  }

  // Page types and the method that draws each. Older names still work.
  var TEMPLATES = {
    title: 'tplTitle', content: 'tplContent', accordion: 'tplAccordion', tabs: 'tplTabs',
    slider: 'tplSlider', hotspots: 'tplIron', timer: 'tplRest', bake: 'tplBake',
    quiz: 'tplQuiz', completion: 'tplCompletion'
  };
  var TYPE_ALIAS = { iron: 'hotspots', rest: 'timer' };

  function pageType(d) {
    var t = d.type || d.template || 'content';
    t = TYPE_ALIAS[t] || t;
    if (!TEMPLATES[t]) {
      if (window.console) console.warn('Course player: unknown page type "' + t + '" on "' + d.title + '", showing it as a content page.');
      t = 'content';
    }
    return t;
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
        page.template = pageType(page);
        page.duration = Number(page.duration) || 1;
        var i = self.pages.length;
        self.pages.push({ data: page, module: m, index: i, id: page.id != null ? String(page.id) : String(i) });
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
      pageData: {},
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

  // Progress is saved by page id, so reordering pages in menu.json keeps each page's
  // status. Plain numbers (saved before ids existed) are read as page positions.
  CoursePlayer.prototype.load = function () {
    var raw = readStorage(window.localStorage, this.course.storageKey);
    if (!raw) return null;
    var pages = this.pages;
    var toIdx = function (v) {
      if (typeof v === 'number') return v >= 0 && v < pages.length ? v : -1;
      for (var i = 0; i < pages.length; i++) if (pages[i].id === v) return i;
      return -1;
    };
    var list = function (arr) {
      return (Array.isArray(arr) ? arr : []).map(toIdx).filter(function (i) { return i >= 0; });
    };
    try {
      var data = JSON.parse(raw);
      var idx = toIdx(data.page != null ? data.page : data.idx);
      return {
        idx: idx >= 0 ? idx : 0,
        visited: list(data.visited),
        completed: list(data.completed)
      };
    } catch (e) {
      return null;
    }
  };

  CoursePlayer.prototype.save = function () {
    if (!this.opts.persist) return;
    var s = this.state, pages = this.pages;
    var ids = function (set) { return Array.from(set).map(function (i) { return pages[i].id; }); };
    writeStorage(window.localStorage, this.course.storageKey, JSON.stringify({
      page: pages[s.idx].id,
      visited: ids(s.visited),
      completed: ids(s.completed)
    }));
  };

  // State an interactive page keeps while the learner moves around the course,
  // one object per page so two pages of the same type never share it.
  CoursePlayer.prototype.pageState = function (init) {
    var bag = this.state.pageData;
    var idx = this.state.idx;
    if (!bag[idx]) bag[idx] = init();
    return bag[idx];
  };

  // The small line above each page heading, e.g. "Page 4 · Core ingredients".
  CoursePlayer.prototype.eyebrow = function (d, n) {
    return '<p class="cp-eyebrow">' + esc(lbl(d, 'eyebrow', this.course.pageLabel || 'Page {number} · {title}', { number: n, title: d.title })) + '</p>';
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
        case 'bake-waffle': if (!self.bakeDragged) self.bakeMove(); break;
        case 'bake-tray': if (!self.bakeDragged) self.bakeInsert(); break;
        case 'bake-reset': self.bakeReset(); break;
        case 'rest-start': self.restStart(); break;
        case 'rest-reset': self.restReset(); break;
        case 'iron-part': self.ironPart(target.getAttribute('data-part')); break;
        case 'iron-switch': self.ironSwitch(); break;
        case 'quiz-submit': self.quizSubmit(); break;
        case 'quiz-retry': self.quizRetry(); break;
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
    if (this.page().data.template === 'hotspots') this.updateIronCard();
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
    region.innerHTML = this[TEMPLATES[d.template] || 'tplContent'](d, n);

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

    if (d.template === 'hotspots') this.updateIronCard();
    if (d.template === 'timer') this.restPaint();
    if (d.template === 'bake') this.bakeRender();
    this.fitCompletion();
    this.fitPage();
    this.renderCaptionText();
    this.stopConfetti();
    if (d.template === 'completion' && this.courseDone()) this.startConfetti();
  };

  CoursePlayer.prototype.tplTitle = function (d) {
    return '<div class="cp-hero">' +
      imageSlot(d.image, d.imageLabel, d.imagePosition) +
      '<div class="cp-hero__scrim"></div>' +
      '<div class="cp-hero__text">' +
        (d.eyebrow ? '<p class="cp-hero__eyebrow">' + esc(d.eyebrow) + '</p>' : '') +
        '<h2 class="cp-hero__title">' + esc(d.heading || this.course.title) + '</h2>' +
        (d.lede ? '<p class="cp-hero__lede">' + esc(d.lede) + '</p>' : '') +
        (d.meta ? '<p class="cp-hero__meta">' + esc(d.meta) + '</p>' : '') +
        '<button type="button" class="cp-btn cp-btn--primary" data-act="start">' + esc(lbl(d, 'start', 'Start the course')) + ICON.arrow + '</button>' +
      '</div>' +
    '</div>';
  };

  CoursePlayer.prototype.tplContent = function (d, n) {
    return '<div class="cp-slide">' +
      imageSlot(d.image, d.imageLabel, d.imagePosition) +
      '<div class="cp-slide__text">' +
        this.eyebrow(d, n) +
        '<h2 class="cp-h2">' + esc(d.heading) + '</h2>' +
        (d.body ? '<p class="cp-body-text">' + esc(d.body) + '</p>' : '') +
        points(d.points) +
      '</div>' +
    '</div>';
  };

  CoursePlayer.prototype.tplAccordion = function (d, n) {
    var open = this.state.openItem;
    var detailLabel = lbl(d, 'detail', 'Typical amount:');
    var items = (d.items || []).map(function (it, i) {
      var isOpen = i === open;
      var id = 'cp-acc-' + n + '-' + i;
      var detail = it.detail != null ? it.detail : it.amount;
      var dl = it.detailLabel != null ? it.detailLabel : detailLabel;
      return '<div class="cp-acc-item' + (isOpen ? ' is-open' : '') + '">' +
        '<h3><button type="button" class="cp-acc-btn" id="' + id + '-btn" data-act="acc" data-item="' + i + '" aria-expanded="' + isOpen + '" aria-controls="' + id + '">' +
          '<span class="cp-acc-num" aria-hidden="true">' + (i + 1) + '</span>' +
          '<span class="cp-acc-name">' + esc(it.name) + '</span>' +
          '<span class="cp-acc-chev">' + ICON.chevronDown + '</span>' +
        '</button></h3>' +
        '<div class="cp-acc-panel" id="' + id + '" role="region" aria-labelledby="' + id + '-btn"><div>' +
          '<p>' + esc(it.description) + '</p>' +
          (detail != null && detail !== '' ? '<p>' + (dl ? '<strong>' + esc(dl) + '</strong> ' : '') + esc(detail) + '</p>' : '') +
        '</div></div>' +
      '</div>';
    }).join('');
    return '<div class="cp-acc-slide">' +
      '<div class="cp-acc-intro">' +
        this.eyebrow(d, n) +
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
      var art = d.image ? '<img class="cp-waffle-art" src="' + esc(d.image.src || d.image) + '" alt="' + esc(d.image.alt || '') + '">' : WAFFLE_ART;
      return '<div class="cp-done">' +
        art +
        '<h2 class="cp-done__title">' + esc(d.heading) + '</h2>' +
        '<p class="cp-done__text">' + esc(d.thanks) + '</p>' +
        '<button type="button" class="cp-btn cp-btn--primary cp-done__close" data-act="close-course">' + esc(lbl(d, 'close', 'Close Course')) + '</button>' +
      '</div>';
    }
    var groups = '';
    for (var m = 0; m < this.course.modules.length; m++) {
      var links = '';
      for (var i = 0; i < this.pages.length; i++) {
        var pg = this.pages[i];
        if (pg.module !== m || s.completed.has(i) || i === s.idx) continue;
        links += '<li><button type="button" class="cp-link" data-act="goto" data-idx="' + i + '">' + esc(lbl(d, 'pageLink', 'Page {number}: {title}', { number: i + 1, title: pg.data.title })) + '</button></li>';
      }
      if (links) groups += '<div class="cp-todo__group"><h3 class="cp-todo__module">' + esc(lbl(d, 'module', 'Module {number} · {title}', { number: m + 1, title: this.course.modules[m].title })) + '</h3><ul class="cp-todo">' + links + '</ul></div>';
    }
    if (groups) groups = '<div class="cp-todo__cols">' + groups + '</div>';
    var progress = lbl(d, 'progress', 'You have finished {done} of {total} pages. Still to finish:', { done: s.completed.size, total: this.pages.length });
    return '<div class="cp-done cp-done--pending">' +
      '<h2 class="cp-done__title">' + esc(d.pendingHeading) + '</h2>' +
      '<p class="cp-done__text">' + esc([d.pendingBody, progress].filter(Boolean).join(' ')) + '</p>' +
      groups +
    '</div>';
  };

  CoursePlayer.prototype.tplSlider = function (d, n) {
    var open = this.state.openItem;
    var tipLabel = lbl(d, 'tip', 'Try it with:');
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
          (it.tip ? '<p>' + (tipLabel ? '<strong>' + esc(tipLabel) + '</strong> ' : '') + esc(it.tip) + '</p>' : '') +
        '</div></div>' +
      '</section>';
    }).join('');
    return '<div class="cp-hs-slide">' +
      '<div class="cp-hs-intro">' +
        this.eyebrow(d, n) +
        '<h2 class="cp-h2">' + esc(d.heading) + '</h2>' +
        (d.lede ? '<p class="cp-body-text">' + esc(d.lede) + '</p>' : '') +
      '</div>' +
      '<div class="cp-hs-row">' + secs + '</div>' +
    '</div>';
  };


  // ---------- Hotspot explorer (modal with clickable numbered parts) ----------
  // Built for the waffle iron drawing, but any picture works: give the page an image
  // and place each part's pin with { x, y } as a percentage of the picture.
  function ironSvg(label) {
    return '<svg class="cp-iron__svg" viewBox="0 0 400 300" role="img" aria-label="' + esc(label) + '" focusable="false">' +
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

  // The picture for the hotspot page: the page's own image, or the built-in waffle iron drawing.
  function hotspotArt(d) {
    var label = lbl(d, 'art', 'Drawing of an open waffle iron');
    if (d.image) return '<img class="cp-iron__svg cp-iron__img" src="' + esc(d.image.src || d.image) + '" alt="' + esc(d.image.alt != null ? d.image.alt : label) + '">';
    return ironSvg(label);
  }

  // Every part as { id, name, text, pin }, plus the switch (when the page has one) last.
  CoursePlayer.prototype.ironParts = function (d) {
    var list = (d.parts || []).map(function (p, i) {
      return { id: String(p.id || 'part-' + (i + 1)), name: p.name || '', text: p.text || '', pin: p.pin || null, tip: p.tip || '' };
    });
    if (d['switch']) {
      var sw = d['switch'];
      list.push({ id: 'switch', name: sw.name || '', text: sw.text || '', tip: sw.tip || '', heating: sw.heatingText || '', pin: sw.pin || null, isSwitch: true });
    }
    return list;
  };

  CoursePlayer.prototype.ironSeen = function () {
    return this.pageState(function () { return { seen: new Set() }; }).seen;
  };

  CoursePlayer.prototype.tplIron = function (d, n) {
    return '<div class="cp-slide cp-slide--iron">' +
      '<div class="cp-iron-card">' +
        '<div class="cp-iron-card__art">' + hotspotArt(d) + '</div>' +
        '<button type="button" class="cp-btn cp-btn--primary cp-iron-card__btn" data-act="iron-open">' + esc(d.exploreLabel || lbl(d, 'explore', 'Explore')) + '</button>' +
        '<p class="cp-iron-card__count" data-role="iron-count"></p>' +
      '</div>' +
      '<div class="cp-slide__text">' +
        this.eyebrow(d, n) +
        '<h2 class="cp-h2">' + esc(d.heading) + '</h2>' +
        (d.body ? '<p class="cp-body-text">' + esc(d.body) + '</p>' : '') +
        points(d.points) +
      '</div>' +
    '</div>';
  };

  CoursePlayer.prototype.ironData = function () { return this.page().data; };

  // Keeps the "x of 5 explored" line on the page in step with the modal.
  CoursePlayer.prototype.updateIronCard = function () {
    var el = this.slots.region && this.slots.region.querySelector('[data-role=iron-count]');
    if (!el) return;
    var d = this.ironData();
    var seen = this.ironSeen().size, total = this.ironParts(d).length;
    el.textContent = seen >= total ? lbl(d, 'allDone', '✓ You explored every part') : lbl(d, 'progress', '{seen} of {total} parts explored', { seen: seen, total: total });
    el.classList.toggle('is-done', seen >= total);
  };

  CoursePlayer.prototype.openIron = function () {
    this.pause();
    this.dialogOpen = true;
    this.lastFocus = document.activeElement;
    var d = this.ironData();
    var parts = this.ironParts(d);
    var self = this;
    var check = '<span class="cp-iron__check" aria-hidden="true">' + ICON.check + '</span>';
    var pins = parts.map(function (p, i) {
      if (p.isSwitch || !p.pin) return '';
      return '<button type="button" class="cp-pin" data-act="iron-part" data-part="' + esc(p.id) + '" style="left:' + Number(p.pin.x) + '%;top:' + Number(p.pin.y) + '%" aria-label="' + esc(p.name) + '">' +
        '<span class="cp-pin__num" aria-hidden="true">' + (i + 1) + '</span>' + check + '</button>';
    }).join('');
    var list = parts.map(function (p, i) {
      return '<li><button type="button" class="cp-iron-row" data-act="iron-part" data-part="' + esc(p.id) + '">' +
        '<span class="cp-iron-row__mark" aria-hidden="true"><span class="cp-iron-row__num">' + (i + 1) + '</span>' + ICON.check + '</span>' +
        '<span class="cp-iron-row__name">' + esc(p.name) + '</span>' +
        '<span class="cp-sr cp-iron-row__state"></span></button></li>';
    }).join('');
    // Every explanation sits in the same grid cell so the panel keeps the height of the longest one.
    var infoSlides = '<div class="cp-iron__slide is-current" data-slide="hint"><p class="cp-iron__hint">' +
        esc(lbl(d, 'hint', 'Select a numbered point on the picture, or a part in the list, to learn why it matters.')) + '</p></div>' +
      parts.map(function (p) {
        return '<div class="cp-iron__slide" data-slide="' + esc(p.id) + '"><h3>' + esc(p.name) + '</h3><p>' + esc(p.text) + '</p>' +
          (p.tip ? '<p class="cp-iron__tip">' + esc(p.tip) + '</p>' : '') +
          (p.heating ? '<p class="cp-iron__tip cp-iron__heat">' + esc(p.heating) + '</p>' : '') +
          '</div>';
      }).join('');
    var sw = d['switch'];
    var swPos = sw && sw.pin ? ' style="left:' + Number(sw.pin.x) + '%;top:' + Number(sw.pin.y) + '%"' : '';
    var switchBtn = sw
      ? '<button type="button" class="cp-switch" role="switch" aria-checked="false" data-act="iron-switch" aria-label="' + esc(sw.name) + '"' + swPos + '>' +
          '<span class="cp-switch__track"><span class="cp-switch__knob"></span></span>' +
          '<span class="cp-switch__text" data-role="switch-text">' + esc(sw.offLabel || 'OFF') + '</span>' + check +
        '</button>'
      : '';
    this.slots.overlay.innerHTML =
      '<div class="cp-dialog-layer">' +
        '<div class="cp-dialog cp-dialog--iron" role="dialog" aria-modal="true" aria-labelledby="cp-iron-title">' +
          '<div class="cp-dialog__head"><h2 id="cp-iron-title">' + esc(d.modalTitle || d.exploreLabel || d.heading) + '</h2>' +
            '<button type="button" class="cp-btn cp-btn--ghost" data-act="resources-close" aria-label="Close" title="Close">' + ICON.close + '</button></div>' +
          '<div class="cp-iron">' +
            '<div class="cp-iron__stage" data-role="iron-stage">' +
              hotspotArt(d) + pins + switchBtn +
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

  // Redraws the check marks, list and progress from the parts this page has seen.
  CoursePlayer.prototype.ironRefresh = function () {
    var ov = this.slots.overlay, seen = this.ironSeen(), d = this.ironData();
    var explored = lbl(d, 'explored', ' (explored)');
    ov.querySelectorAll('[data-part]').forEach(function (b) {
      var done = seen.has(b.getAttribute('data-part'));
      b.classList.toggle('is-seen', done);
      var st = b.querySelector('.cp-iron-row__state');
      if (st) st.textContent = done ? explored : '';
    });
    var sw = ov.querySelector('.cp-switch');
    if (sw) sw.classList.toggle('is-seen', seen.has('switch'));
    var total = this.ironParts(d).length;
    var pr = ov.querySelector('[data-role=iron-progress]');
    if (pr) {
      pr.textContent = seen.size >= total ? lbl(d, 'allDoneModal', '✓ You explored every part. Close this window to continue.') : lbl(d, 'progress', '{seen} of {total} parts explored', { seen: seen.size, total: total });
      pr.classList.toggle('is-done', seen.size >= total);
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
    this.ironSeen().add(id);
    this.ironShow(id);
    this.ironRefresh();
  };

  // The on/off switch: slides, lights the plates, turns the light from red to green and lets steam rise.
  CoursePlayer.prototype.ironSwitch = function () {
    var stage = this.slots.overlay.querySelector('[data-role=iron-stage]');
    var sw = stage.querySelector('.cp-switch');
    var cfg = this.ironData()['switch'] || {};
    var on = !stage.classList.contains('is-on');
    clearTimeout(this.ironTimer);
    stage.classList.toggle('is-on', on);
    stage.classList.remove('is-ready');
    sw.setAttribute('aria-checked', String(on));
    stage.querySelector('[data-role=switch-text]').textContent = on ? (cfg.onLabel || 'ON') : (cfg.offLabel || 'OFF');
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


  // Cartoon alarm clock for the rest timer page. The minute hand follows the timer (see restPaint).
  var CLOCK_ART = '<svg class="cp-rest__clock" viewBox="0 0 200 210" role="img" aria-label="{label}" focusable="false">' +
    '<ellipse cx="100" cy="202" rx="62" ry="6" fill="#000" opacity=".1"/>' +
    '<path d="M54 178 L40 200 M146 178 L160 200" stroke="#7A3A0C" stroke-width="10" stroke-linecap="round"/>' +
    '<g class="cp-clock-bells"><circle cx="52" cy="40" r="26" fill="#F2B84B" stroke="#7A3A0C" stroke-width="5"/><circle cx="148" cy="40" r="26" fill="#F2B84B" stroke="#7A3A0C" stroke-width="5"/>' +
    '<rect x="94" y="14" width="12" height="14" rx="4" fill="#7A3A0C"/></g>' +
    '<circle cx="100" cy="112" r="76" fill="#CC5500" stroke="#7A3A0C" stroke-width="6"/>' +
    '<circle cx="100" cy="112" r="60" fill="#FFF8EC" stroke="#7A3A0C" stroke-width="4"/>' +
    '<g stroke="#7A3A0C" stroke-width="4" stroke-linecap="round"><path d="M100 60v8M100 156v8M48 112h8M144 112h8"/></g>' +
    '<g fill="#3B2412"><ellipse cx="82" cy="100" rx="6" ry="8"/><ellipse cx="118" cy="100" rx="6" ry="8"/></g>' +
    '<g fill="#fff"><circle cx="84" cy="97" r="2.2"/><circle cx="120" cy="97" r="2.2"/></g>' +
    '<path d="M84 124 Q100 140 116 124" fill="none" stroke="#3B2412" stroke-width="4.5" stroke-linecap="round"/>' +
    '<circle cx="70" cy="120" r="7" fill="#F4A58A" opacity=".7"/><circle cx="130" cy="120" r="7" fill="#F4A58A" opacity=".7"/>' +
    '<path d="M100 112 L100 80" stroke="#3B2412" stroke-width="5" stroke-linecap="round" class="cp-clock-min"/>' +
    '<path d="M100 112 L120 118" stroke="#3B2412" stroke-width="6" stroke-linecap="round"/>' +
    '<circle cx="100" cy="112" r="6" fill="#7A3A0C"/>' +
  '</svg>';

  CoursePlayer.prototype.restState = function () {
    var d = this.page().data;
    var secs = Math.max(1, Math.round((Number(d.timerMinutes) || 5) * 60));
    var r = this.pageState(function () { return { total: secs, left: secs, running: false, end: 0 }; });
    if (r.total !== secs) { r.total = secs; r.left = secs; r.running = false; }
    return r;
  };

  CoursePlayer.prototype.tplRest = function (d, n) {
    var r = this.restState();
    var label = esc(d.timerLabel || lbl(d, 'timer', 'Timer'));
    return '<div class="cp-rest">' +
      '<div class="cp-rest__text">' + CLOCK_ART.replace('{label}', esc(lbl(d, 'clockLabel', 'A cartoon alarm clock'))) +
        this.eyebrow(d, n) +
        '<h2 class="cp-h2">' + esc(d.heading) + '</h2>' +
        (d.body ? '<p class="cp-body-text">' + esc(d.body) + '</p>' : '') +
        points(d.points) +
      '</div>' +
      '<section class="cp-tray" data-role="tray" aria-label="' + label + '">' +
        '<button type="button" class="cp-tray__handle" data-act="tray" aria-expanded="false" aria-controls="cp-tray-body">' +
          '<span class="cp-tray__grip" aria-hidden="true"></span>' +
          '<span class="cp-tray__title"><span class="cp-tray__clock">' + ICON.clock + '</span>' + label + '</span>' +
          '<span class="cp-tray__peek" data-role="rest-peek"></span>' +
          '<span class="cp-tray__chev">' + ICON.chevronDown + '</span>' +
        '</button>' +
        '<div class="cp-tray__body" id="cp-tray-body">' +
          '<svg class="cp-rest__waffle" viewBox="0 0 240 240" role="img" aria-label="' + esc(lbl(d, 'waffleLabel', 'A waffle that browns as the timer runs')) + '" data-role="rest-waffle">' +
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
            '<p class="cp-rest__time" data-role="rest-time" role="timer" aria-live="off">' + fmt(Math.ceil(r.left)) + '</p>' +
            '<div class="cp-rest__bar" aria-hidden="true"><span data-role="rest-bar"></span></div>' +
            '<p class="cp-rest__status" data-role="rest-status" aria-live="polite"></p>' +
            '<div class="cp-rest__btns">' +
              '<button type="button" class="cp-btn cp-btn--primary" data-act="rest-start" data-role="rest-start">' + esc(lbl(d, 'start', 'Start timer')) + '</button>' +
              '<button type="button" class="cp-btn cp-btn--outline" data-act="rest-reset">' + esc(lbl(d, 'reset', 'Reset')) + '</button>' +
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
    var el = this.slots.region;
    if (!el || !el.querySelector('[data-role=rest-time]')) return;
    var d = this.page().data, r = this.restState();
    var left = Math.max(0, r.left), total = r.total;
    var p = total ? 1 - left / total : 0;
    var txt = fmt(Math.ceil(left));
    el.querySelector('[data-role=rest-time]').textContent = txt;
    el.querySelector('[data-role=rest-peek]').textContent = left === 0 ? lbl(d, 'done', 'Done') : (r.running ? lbl(d, 'left', '{time} left', { time: txt }) : txt);
    el.querySelector('[data-role=rest-bar]').style.width = (p * 100) + '%';
    var hand = el.querySelector('.cp-clock-min');
    if (hand) hand.setAttribute('transform', 'rotate(' + (p * 360).toFixed(1) + ' 100 112)');
    var clock = el.querySelector('.cp-rest__clock');
    if (clock) clock.classList.toggle('is-ringing', left === 0);
    // Pale batter to golden brown.
    var face = mix('#F6E9C4', '#D98A1F', Math.min(1, p / 0.85));
    var rim = mix('#E8D9B0', '#B86A14', Math.min(1, p / 0.85));
    var line = mix('#D9C79A', '#9A540E', Math.min(1, p / 0.85));
    el.querySelector('[data-role=w-face]').setAttribute('fill', face);
    el.querySelector('[data-role=w-rim]').setAttribute('fill', rim);
    el.querySelector('[data-role=w-grid]').setAttribute('stroke', line);
    el.querySelector('[data-role=rest-waffle]').classList.toggle('is-cooking', r.running);
    var btn = el.querySelector('[data-role=rest-start]');
    btn.textContent = r.running ? lbl(d, 'pause', 'Pause') : (left === 0 ? lbl(d, 'restart', 'Start again') : (left < total ? lbl(d, 'resume', 'Resume') : lbl(d, 'start', 'Start timer')));
    el.querySelector('[data-role=rest-status]').textContent = left === 0 ? lbl(d, 'statusDone', 'Time is up.') :
      r.running ? lbl(d, 'statusRunning', 'Timer running.') : (left < total ? lbl(d, 'statusPaused', 'Paused.') : lbl(d, 'statusIdle', 'Press start when you are ready.'));
  };

  CoursePlayer.prototype.restStart = function () {
    var r = this.restState(), self = this;
    if (r.running) { this.restStop(); this.restPaint(); return; }
    if (r.left <= 0) r.left = r.total;
    r.running = true;
    r.end = Date.now() + r.left * 1000;
    this.restRef = r;
    clearInterval(this.restTimer);
    this.restTimer = setInterval(function () {
      r.left = Math.max(0, (r.end - Date.now()) / 1000);
      if (r.left <= 0) { self.restStop(); r.left = 0; }
      self.restPaint();
    }, 200);
    this.restPaint();
  };

  // Pauses whichever timer is running, even after the learner has moved to another page.
  CoursePlayer.prototype.restStop = function () {
    clearInterval(this.restTimer);
    var r = this.restRef;
    if (r && r.running) r.left = Math.max(0, (r.end - Date.now()) / 1000);
    if (r) r.running = false;
    this.restRef = null;
  };

  CoursePlayer.prototype.restReset = function () {
    this.restStop();
    var r = this.restState();
    r.left = r.total;
    this.restPaint();
  };


  // ---------- Keep-warm activity: set the oven, move waffles to a tray, slide the tray in ----------
  CoursePlayer.prototype.bakeCfg = function () {
    var d = this.page().data, dial = d.dial || {};
    return {
      temp: Number(d.targetTemp) || 200,
      count: Number(d.waffleCount) || 5,
      min: Number(dial.min) || 0,
      max: Number(dial.max) || 450,
      step: Number(dial.step) || 25
    };
  };

  CoursePlayer.prototype.bakeState = function () {
    return this.pageState(function () { return { temp: 0, moved: 0, inOven: false, fresh: false }; });
  };

  CoursePlayer.prototype.bakeTemp = function (temp) {
    var d = this.page().data;
    return temp === 0 ? lbl(d, 'off', 'Off') : lbl(d, 'tempFormat', '{temp}°F', { temp: temp });
  };

  CoursePlayer.prototype.tplBake = function (d, n) {
    var steps = (d.steps || []).map(function (t, i) {
      return '<li class="cp-bk-step" data-step="' + i + '"><span class="cp-bk-step__mark" aria-hidden="true"><span>' + (i + 1) + '</span>' + ICON.check + '</span>' +
        '<span class="cp-bk-step__text">' + esc(t) + '</span></li>';
    }).join('');
    return '<div class="cp-bake">' +
      '<div class="cp-bake__intro">' +
        this.eyebrow(d, n) +
        '<h2 class="cp-h2">' + esc(d.heading) + '</h2>' +
        (d.body ? '<p class="cp-body-text">' + esc(d.body) + '</p>' : '') +
        '<ol class="cp-bk-steps">' + steps + '</ol>' +
        '<p class="cp-bk-msg" data-role="bake-msg" aria-live="polite"></p>' +
      '</div>' +
      '<div class="cp-bake__scene" data-role="bake-scene"></div>' +
    '</div>';
  };

  CoursePlayer.prototype.bakeRender = function () {
    var b = this.bakeState(), cfg = this.bakeCfg(), d = this.page().data;
    var scene = this.slots.region.querySelector('[data-role=bake-scene]');
    if (!scene) return;
    var oldDial = scene.querySelector('.cp-bk-dial');
    var ready = b.moved >= cfg.count;
    var vars = { moved: b.moved, count: cfg.count, left: cfg.count - b.moved, target: cfg.temp };
    var i, html = '';
    // Waffle iron
    var ironSlots = '';
    for (i = 0; i < cfg.count; i++) {
      var onIron = i >= b.moved;
      ironSlots += onIron
        ? '<button type="button" class="cp-bk-waffle" data-act="bake-waffle" aria-label="' + esc(lbl(d, 'moveWaffle', 'Move a waffle to the tray ({left} left on the iron)', vars)) + '"></button>'
        : '<span class="cp-bk-slot" aria-hidden="true"></span>';
    }
    // The first waffle still on the iron is the one that moves, so only that one is draggable.
    var traySlots = '';
    for (i = 0; i < cfg.count; i++) {
      traySlots += i < b.moved ? '<span class="cp-bk-waffle cp-bk-waffle--placed' + (b.fresh && i === b.moved - 1 ? ' is-new' : '') + '" aria-hidden="true"></span>' : '<span class="cp-bk-slot" aria-hidden="true"></span>';
    }
    html += '<div class="cp-bk-zone cp-bk-zone--iron"><h3>' + esc(lbl(d, 'ironTitle', 'Waffle iron')) + '</h3><div class="cp-bk-iron">' + ironSlots + '</div></div>';
    html += '<div class="cp-bk-zone cp-bk-zone--tray" data-drop="tray"><h3>' + esc(lbl(d, 'trayTitle', 'Tray')) + '</h3>' +
      (b.inOven ? '<div class="cp-bk-tray cp-bk-tray--gone" aria-hidden="true"></div><p class="cp-bk-note">' + esc(lbl(d, 'trayInOven', 'The tray is in the oven.')) + '</p>' :
      '<div class="cp-bk-tray' + (ready ? ' is-ready' : '') + '"' + (ready ? ' data-drag="tray"' : '') + '><div class="cp-bk-tray__slots">' + traySlots + '</div></div>' +
      '<p class="cp-bk-note">' + esc(lbl(d, 'trayCount', '{moved} of {count} on the tray', vars)) + '</p>' +
      (ready ? '<button type="button" class="cp-btn cp-btn--primary cp-bk-go" data-act="bake-tray">' + esc(lbl(d, 'slideTray', 'Slide tray into oven')) + '</button>' : '')) +
      '</div>';
    var temp = this.bakeTemp(b.temp);
    html += '<div class="cp-bk-zone cp-bk-zone--oven" data-drop="oven"><h3>' + esc(lbl(d, 'ovenTitle', 'Oven')) + '</h3>' +
      '<div class="cp-bk-oven' + (b.temp ? ' is-on' : '') + (b.inOven ? ' has-tray' : '') + '" style="--heat:' + (b.temp / cfg.max).toFixed(2) + '">' +
        '<div class="cp-bk-oven__door"><div class="cp-bk-oven__window">' +
          (b.inOven ? '<div class="cp-bk-oven__tray"><span></span><span></span><span></span><span></span><span></span></div>' : '') +
        '</div><div class="cp-bk-oven__handle"></div></div>' +
        '<div class="cp-bk-oven__panel"><span class="cp-bk-oven__light"></span><output class="cp-bk-oven__temp" for="cp-bk-range">' + esc(temp) + '</output></div>' +
      '</div>' +
      '<label class="cp-bk-dial" for="cp-bk-range"><span>' + esc(lbl(d, 'dial', 'Oven temperature')) + '</span>' +
        '<input id="cp-bk-range" type="range" min="' + cfg.min + '" max="' + cfg.max + '" step="' + cfg.step + '" value="' + b.temp + '"' + (b.inOven ? ' disabled' : '') + ' aria-valuetext="' + esc(temp) + '"></label>' +
    '</div>';
    html += '<button type="button" class="cp-btn cp-btn--outline cp-bk-reset" data-act="bake-reset">' + esc(lbl(d, 'reset', 'Start over')) + '</button>';
    scene.innerHTML = html;
    // Keep the same slider element so it can be dragged smoothly while the rest of the scene redraws.
    var newDial = scene.querySelector('.cp-bk-dial');
    if (oldDial && newDial) {
      var inp = oldDial.querySelector('input');
      inp.disabled = b.inOven; inp.value = b.temp; inp.setAttribute('aria-valuetext', temp);
      newDial.parentNode.replaceChild(oldDial, newDial);
    }
    this.bakeStatus();
    this.bakeBind();
  };


  // Step check marks and the feedback line, from this page's state.
  CoursePlayer.prototype.bakeStatus = function () {
    var b = this.bakeState(), cfg = this.bakeCfg(), d = this.page().data;
    var atTemp = b.temp === cfg.temp;
    var ready = b.moved >= cfg.count;
    var done = [atTemp || b.inOven, ready, b.inOven];
    this.slots.region.querySelectorAll('.cp-bk-step').forEach(function (el, k) {
      el.classList.toggle('is-done', !!done[k]);
    });
    var msg = this.slots.region.querySelector('[data-role=bake-msg]');
    msg.className = 'cp-bk-msg' + (b.inOven ? ' is-done' : '');
    msg.textContent = b.inOven ? (d.doneText || lbl(d, 'done', 'Nicely done!'))
      : b.temp !== 0 && !atTemp ? lbl(d, 'wrongTemp', 'The target temperature is {target}°F. Adjust the dial.', { target: cfg.temp })
      : '';
  };

  // Dragging the slider only updates the oven in place, so the slider itself is never replaced mid-drag.
  CoursePlayer.prototype.bakeOvenUpdate = function () {
    var b = this.bakeState(), cfg = this.bakeCfg(), region = this.slots.region;
    var temp = this.bakeTemp(b.temp);
    var oven = region.querySelector('.cp-bk-oven');
    if (oven) {
      oven.classList.toggle('is-on', b.temp > 0);
      oven.style.setProperty('--heat', (b.temp / cfg.max).toFixed(2));
      oven.querySelector('.cp-bk-oven__temp').textContent = temp;
    }
    var inp = region.querySelector('#cp-bk-range');
    if (inp) inp.setAttribute('aria-valuetext', temp);
    this.bakeStatus();
  };

  CoursePlayer.prototype.bakeSay = function (text) {
    var msg = this.slots.region.querySelector('[data-role=bake-msg]');
    if (msg) { msg.className = 'cp-bk-msg'; msg.textContent = text; }
  };

  CoursePlayer.prototype.bakeMove = function () {
    var b = this.bakeState(), cfg = this.bakeCfg();
    if (b.inOven || b.moved >= cfg.count) return;
    b.moved++; b.fresh = true;
    this.bakeRender();
    var again = this.slots.region.querySelector('.cp-bk-waffle:not(.cp-bk-waffle--placed)') || this.slots.region.querySelector('[data-act=bake-tray]');
    if (again) again.focus();
  };

  CoursePlayer.prototype.bakeInsert = function () {
    var b = this.bakeState(), cfg = this.bakeCfg(), d = this.page().data;
    if (b.inOven || b.moved < cfg.count) return;
    if (b.temp !== cfg.temp) {
      this.bakeSay(b.temp === 0 ? lbl(d, 'needOn', 'Turn the oven on to {target}°F first.', { target: cfg.temp })
        : lbl(d, 'needTemp', 'The oven needs to be at {target}°F first.', { target: cfg.temp }));
      return;
    }
    b.inOven = true; b.fresh = false;
    this.bakeRender();
  };

  CoursePlayer.prototype.bakeReset = function () {
    var b = this.bakeState();
    b.temp = 0; b.moved = 0; b.inOven = false; b.fresh = false;
    this.bakeRender();
  };

  // Wires up the dial and the drag gestures after every redraw. Taps and the keyboard use the buttons.
  CoursePlayer.prototype.bakeBind = function () {
    var self = this, region = this.slots.region;
    var range = region.querySelector('#cp-bk-range');
    if (range && !range._bound) {
      range._bound = true;
      range.addEventListener('input', function () {
        self.bakeState().temp = Number(range.value);
        self.bakeOvenUpdate();
      });
    }
    var firstWaffle = region.querySelector('.cp-bk-waffle[data-act=bake-waffle]');
    if (firstWaffle) this.bakeDrag(firstWaffle, '[data-drop=tray]', function () { self.bakeMove(); });
    var tray = region.querySelector('[data-drag=tray]');
    if (tray) this.bakeDrag(tray, '[data-drop=oven]', function () { self.bakeInsert(); });
  };

  // Pointer dragging: the element follows the pointer and, if released over the target, runs onDrop.
  CoursePlayer.prototype.bakeDrag = function (el, targetSel, onDrop) {
    var self = this, start = null;
    el.style.touchAction = 'none';
    el.addEventListener('pointerdown', function (e) {
      if (e.button !== 0) return;
      var r = el.getBoundingClientRect();
      start = { x: e.clientX, y: e.clientY, scale: el.offsetWidth ? r.width / el.offsetWidth : 1, moved: false };
      el.setPointerCapture(e.pointerId);
    });
    el.addEventListener('pointermove', function (e) {
      if (!start) return;
      var dx = e.clientX - start.x, dy = e.clientY - start.y;
      if (!start.moved && Math.abs(dx) + Math.abs(dy) < 6) return;
      start.moved = true;
      el.classList.add('is-dragging');
      el.style.transform = 'translate(' + (dx / start.scale) + 'px,' + (dy / start.scale) + 'px)';
      var t = self.slots.region.querySelector(targetSel);
      if (t) { var tr = t.getBoundingClientRect(); t.classList.toggle('is-over', e.clientX >= tr.left && e.clientX <= tr.right && e.clientY >= tr.top && e.clientY <= tr.bottom); }
    });
    var end = function (e) {
      if (!start) return;
      var moved = start.moved; start = null;
      var t = self.slots.region.querySelector(targetSel);
      var over = false;
      if (t) { var tr = t.getBoundingClientRect(); over = e.clientX >= tr.left && e.clientX <= tr.right && e.clientY >= tr.top && e.clientY <= tr.bottom; t.classList.remove('is-over'); }
      el.classList.remove('is-dragging');
      el.style.transform = '';
      if (moved) {
        // A drag must not also count as a click.
        self.bakeDragged = true;
        setTimeout(function () { self.bakeDragged = false; }, 0);
        if (over) onDrop();
      }
    };
    el.addEventListener('pointerup', end);
    el.addEventListener('pointercancel', function () { start = null; el.classList.remove('is-dragging'); el.style.transform = ''; });
  };

  // ---------- Quiz: one question, single or multiple answers, with feedback ----------
  CoursePlayer.prototype.quizState = function () {
    return this.pageState(function () { return { selected: [], submitted: false, correct: false }; });
  };

  CoursePlayer.prototype.tplQuiz = function (d, n) {
    var q = this.quizState();
    var multi = !!d.multiple;
    var name = 'cp-quiz-' + n;
    var opts = (d.options || []).map(function (o, i) {
      var chosen = q.selected.indexOf(i) !== -1;
      var state = '';
      if (q.submitted && chosen) state = o.correct ? ' is-right' : ' is-wrong';
      else if (q.submitted && q.correct && o.correct) state = ' is-right';
      return '<li class="cp-quiz__opt' + state + '">' +
        '<label class="cp-quiz__label">' +
          '<input type="' + (multi ? 'checkbox' : 'radio') + '" name="' + name + '" value="' + i + '"' + (chosen ? ' checked' : '') + (q.submitted ? ' disabled' : '') + '>' +
          '<span class="cp-quiz__mark" aria-hidden="true">' + (q.submitted && chosen ? (o.correct ? ICON.check : ICON.close) : '') + '</span>' +
          '<span class="cp-quiz__text">' + esc(o.text) + '</span>' +
        '</label>' +
        (q.submitted && chosen && o.feedback ? '<p class="cp-quiz__fb">' + esc(o.feedback) + '</p>' : '') +
      '</li>';
    }).join('');
    var result = '';
    if (q.submitted) {
      result = q.correct ? (d.correctText || lbl(d, 'correct', 'Correct!')) : (d.incorrectText || lbl(d, 'incorrect', 'Not quite. Try again.'));
    }
    var hint = lbl(d, multi ? 'chooseMany' : 'choose', multi ? 'Select all that apply.' : 'Select one answer.');
    return '<div class="cp-quiz' + (d.image ? '' : ' cp-quiz--solo') + '">' +
      (d.image ? imageSlot(d.image, d.imageLabel, d.imagePosition) : '') +
      '<div class="cp-quiz__main">' +
        this.eyebrow(d, n) +
        (d.heading ? '<h2 class="cp-h2">' + esc(d.heading) + '</h2>' : '') +
        '<fieldset class="cp-quiz__set">' +
          '<legend class="cp-quiz__q">' + esc(d.question) + '</legend>' +
          '<p class="cp-quiz__hint">' + esc(hint) + '</p>' +
          '<ul class="cp-quiz__opts">' + opts + '</ul>' +
        '</fieldset>' +
        '<div class="cp-quiz__foot">' +
          (q.submitted
            ? '<button type="button" class="cp-btn cp-btn--outline" data-act="quiz-retry">' + esc(lbl(d, 'retry', 'Try again')) + '</button>'
            : '<button type="button" class="cp-btn cp-btn--primary" data-act="quiz-submit">' + esc(lbl(d, 'submit', 'Check answer')) + '</button>') +
          '<p class="cp-quiz__result' + (q.submitted ? (q.correct ? ' is-right' : ' is-wrong') : '') + '" data-role="quiz-result" aria-live="polite">' + esc(result) + '</p>' +
        '</div>' +
      '</div>' +
    '</div>';
  };

  CoursePlayer.prototype.quizSubmit = function () {
    var d = this.page().data, q = this.quizState();
    var picked = [];
    this.slots.region.querySelectorAll('.cp-quiz__opts input').forEach(function (inp) {
      if (inp.checked) picked.push(Number(inp.value));
    });
    if (!picked.length) {
      var res = this.slots.region.querySelector('[data-role=quiz-result]');
      res.className = 'cp-quiz__result';
      res.textContent = lbl(d, 'pickFirst', 'Choose an answer first.');
      return;
    }
    var opts = d.options || [];
    var right = opts.every(function (o, i) { return !!o.correct === (picked.indexOf(i) !== -1); });
    q.selected = picked;
    q.submitted = true;
    q.correct = right;
    this.renderPage();
    var focusTo = this.slots.region.querySelector('[data-act=quiz-retry]');
    if (focusTo) focusTo.focus();
    // Answering correctly completes the page, just like finishing its narration.
    if (right && d.completeOnCorrect !== false) this.completePage(this.state.idx);
  };

  CoursePlayer.prototype.quizRetry = function () {
    var q = this.quizState();
    q.selected = [];
    q.submitted = false;
    q.correct = false;
    this.renderPage();
    var first = this.slots.region.querySelector('.cp-quiz__opts input');
    if (first) first.focus();
  };

  CoursePlayer.prototype.tplTabs = function (d, n) {
    var open = this.state.openItem;
    var items = d.items || [];
    var tipLabel = lbl(d, 'tip', 'Tip:');
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
          (it.tip ? '<p class="cp-tabpanel__tip">' + (tipLabel ? '<strong>' + esc(tipLabel) + '</strong> ' : '') + esc(it.tip) + '</p>' : '') +
        '</div>' +
      '</div></div></div>';
    }).join('');
    return '<div class="cp-tabs-slide">' +
      '<div class="cp-tabs-intro">' +
        this.eyebrow(d, n) +
        '<h2 class="cp-h2">' + esc(d.heading) + '</h2>' +
        (d.lede ? '<p class="cp-body-text">' + esc(d.lede) + '</p>' : '') +
      '</div>' +
      '<div class="cp-tablist" role="tablist" aria-label="' + esc(d.title) + '">' + tabs + '</div>' +
      '<div class="cp-tabpanels">' + panels +
        '<div class="cp-tabs-empty" data-role="tabs-empty"' + (open === -1 ? '' : ' hidden') + '>' +
          (d.emptyImage ? '<img class="cp-waffle-art" src="' + esc(d.emptyImage.src || d.emptyImage) + '" alt="' + esc(d.emptyImage.alt || '') + '">' : WAFFLE_ART) + '</div>' +
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

  /* ---------- Loading the course from JSON ---------- */

  // Course-wide placeholders any page can use in its text, e.g. "{pageCount} pages".
  function fillTokens(value, vars) {
    if (typeof value === 'string') {
      return value.replace(/\{(pageCount|moduleCount|courseTitle)\}/g, function (m, k) { return vars[k]; });
    }
    if (Array.isArray(value)) return value.map(function (v) { return fillTokens(v, vars); });
    if (value && typeof value === 'object') {
      var out = {};
      Object.keys(value).forEach(function (k) { out[k] = fillTokens(value[k], vars); });
      return out;
    }
    return value;
  }

  // Turns menu.json plus its page files into the course object the player draws.
  // Pages run in order of their "number" (ties keep the order they are listed in);
  // modules run in order of their first page. The menu's title for a page wins over the page file's.
  function buildCourse(menu, pageFiles) {
    var seq = 0;
    var modules = (menu.modules || []).map(function (mod) {
      var pages = (mod.pages || []).map(function (entry) {
        var data = pageFiles[entry.file] || {};
        var page = {};
        Object.keys(data).forEach(function (k) { page[k] = data[k]; });
        page.title = entry.title != null ? entry.title : (data.title || '');
        page.id = entry.id != null ? String(entry.id) : String(entry.file);
        var order = Number(entry.number);
        return { page: page, order: isFinite(order) && entry.number !== '' && entry.number != null ? order : Infinity, seq: seq++ };
      });
      pages.sort(function (a, b) { return a.order - b.order || a.seq - b.seq; });
      return { title: mod.title, pages: pages, first: pages.length ? pages[0] : { order: Infinity, seq: Infinity } };
    }).filter(function (mod) { return mod.pages.length; });
    modules.sort(function (a, b) { return a.first.order - b.first.order || a.first.seq - b.first.seq; });

    var pageCount = 0;
    modules.forEach(function (m) { pageCount += m.pages.length; });
    var vars = { pageCount: pageCount, moduleCount: modules.length, courseTitle: menu.title || '' };
    return fillTokens({
      title: menu.title || '',
      storageKey: menu.storageKey || 'course-player',
      pageLabel: menu.pageLabel,
      resources: menu.resources || [],
      modules: modules.map(function (m) {
        return { title: m.title, pages: m.pages.map(function (p) { return p.page; }) };
      })
    }, vars);
  }

  // Loads data/menu.json (or another menu file) and every page file it lists, then starts the player.
  // Page files are found relative to the menu file. options.files (or window.COURSE_FILES) can hold
  // the JSON already parsed, keyed by path, for hosts that cannot fetch files.
  CoursePlayer.load = function (root, menuUrl, options) {
    options = options || {};
    menuUrl = menuUrl || 'data/menu.json';
    var files = options.files || window.COURSE_FILES || null;
    var base = menuUrl.replace(/[^\/]*$/, '');
    root.innerHTML = '<div class="cp-loading" role="status">Loading course…</div>';

    function get(path) {
      if (files && Object.prototype.hasOwnProperty.call(files, path)) {
        return Promise.resolve(JSON.parse(JSON.stringify(files[path])));
      }
      return fetch(path, { cache: 'no-cache' }).then(function (res) {
        if (!res.ok) throw new Error(path + ' could not be loaded (' + res.status + ').');
        return res.text();
      }, function () {
        throw new Error(path + ' could not be loaded.');
      }).then(function (text) {
        try { return JSON.parse(text); } catch (e) { throw new Error(path + ' is not valid JSON: ' + e.message); }
      });
    }

    return get(menuUrl).then(function (menu) {
      var entries = [];
      (menu.modules || []).forEach(function (mod) {
        (mod.pages || []).forEach(function (entry) {
          if (!entry.file) throw new Error('The page "' + (entry.title || '?') + '" in ' + menuUrl + ' has no "file".');
          entries.push(entry.file);
        });
      });
      return Promise.all(entries.map(function (file) { return get(base + file); })).then(function (list) {
        var pageFiles = {};
        entries.forEach(function (file, i) { pageFiles[file] = list[i]; });
        return buildCourse(menu, pageFiles);
      });
    }).then(function (course) {
      if (!course.modules.length) throw new Error(menuUrl + ' lists no pages.');
      return new CoursePlayer(root, course, options);
    }).catch(function (err) {
      var local = location.protocol === 'file:';
      root.innerHTML = '<div class="cp-loading cp-loading--error" role="alert">' +
        '<h1>This course could not load</h1>' +
        '<p>' + esc(err && err.message ? err.message : String(err)) + '</p>' +
        (local ? '<p>Browsers do not let a page opened straight from your computer read its JSON files. ' +
          'Run the course from a web server or your LMS, for example with <code>python3 -m http.server</code> in the course folder.</p>' : '') +
      '</div>';
      throw err;
    });
  };

  CoursePlayer.buildCourse = buildCourse;

  window.CoursePlayer = CoursePlayer;
})();
