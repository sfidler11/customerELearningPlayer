// Mounts the player on index.html.
// Query parameters mirror the player options for previews, e.g. ?viewport=phone&page=4&captions=1
(function () {
  var q = new URLSearchParams(location.search);
  var flag = function (name) { return q.has(name) ? q.get(name) !== '0' : undefined; };
  new CoursePlayer(document.getElementById('app'), window.COURSE_DATA, {
    viewport: q.get('viewport') || 'auto',
    initialPage: q.has('page') ? Number(q.get('page')) : undefined,
    initialTime: q.has('t') ? Number(q.get('t')) : undefined,
    menuOpen: flag('menu'),
    captionsOn: flag('captions'),
    showToast: flag('toast'),
    persist: flag('persist')
  });
})();
