// Mounts the player on index.html with the course in data/menu.json.
// Query parameters mirror the player options for previews, e.g. ?viewport=phone&page=4&captions=1
// ?menu-file=data/other-menu.json loads a different menu file.
(function () {
  var q = new URLSearchParams(location.search);
  var flag = function (name) { return q.has(name) ? q.get(name) !== '0' : undefined; };
  CoursePlayer.load(document.getElementById('app'), q.get('menu-file') || 'data/menu.json', {
    viewport: q.get('viewport') || 'auto',
    initialPage: q.has('page') ? Number(q.get('page')) : undefined,
    initialTime: q.has('t') ? Number(q.get('t')) : undefined,
    menuOpen: flag('menu'),
    captionsOn: flag('captions'),
    showToast: flag('toast'),
    persist: flag('persist')
  }).catch(function () { /* the player shows what went wrong */ });
})();
