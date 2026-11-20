# customerELearningPlayer

A customizable eLearning course player, built from the **Waffles 101 Course Player style guide** ([docs/style-guide.html](docs/style-guide.html)).

It is plain HTML, CSS and JavaScript with no build step, so it can be hosted anywhere static files are served or embedded in an iframe.

## Run it

Serve the folder and open `index.html`:

```sh
python3 -m http.server 8000
# then open http://localhost:8000
```

Preview options can be passed as query parameters, for example `?viewport=phone&page=4&captions=1&menu=1&toast=1&persist=0`.

## Files

| File | What it is |
|---|---|
| `index.html` | Demo page. It only links the files below; it has no inline CSS or JS. |
| `css/player.css` | Design tokens and component styles from the style guide. |
| `css/page.css` | Makes the player fill the window on `index.html`. |
| `resources/` | The PDFs and PowerPoint files offered in the "Course resources" pop-up. |
| `js/player.js` | The player shell: header, course menu, content region, section progress, captions, control bar, toast, exit dialog. |
| `data/menu.json` | The course: title, modules and the page list. |
| `data/pages/*.json` | One file per page: its type and all of its content. See [data/README.md](data/README.md). |
| `js/main.js` | Mounts the player on `index.html` and reads preview options from the URL. |
| `docs/style-guide.html` | The style and behavior guide the player implements. |

## Using the player

```js
CoursePlayer.load(element, 'data/menu.json', {
  viewport: 'auto',   // 'auto' | 'desktop' | 'tablet' | 'phone'
  menuOpen: false,
  captionsOn: false,
  showToast: false,   // preview the "Section Completed" toast
  initialPage: 1,     // 1-11
  initialTime: 0,
  height: null,       // e.g. 720 or '80vh'; defaults to filling the container
  persist: true,      // save progress to localStorage
  onDownload: function (file) {},  // optional: return true to handle a resource download yourself ({ url, filename })
  onClose: function (info) {},  // called when the learner presses Close Course on the completion page (e.g. tell the LMS)
  files: null         // optional: the JSON already parsed, keyed by path, for hosts that cannot fetch files
}).then(function (player) { /* ready */ });
```

`CoursePlayer.load` fetches `menu.json` and every page file it lists (paths are relative to the menu file), then starts the player. If a file is missing or is not valid JSON, the player shows which one. `new CoursePlayer(element, course, options)` still works with a course object you have built yourself.

The layout mode comes from the player's own width (desktop ≥ 1024px, tablet 640–1023px, phone < 640px), and "short" mode applies under 700px tall.

## Course content

All content lives in JSON under `data/`, described in full in [data/README.md](data/README.md):

- `data/menu.json` holds the course title, the modules, and each page's `number`, `title` and `file`. The menu, page order and page numbers are built from it, so reordering or adding entries there reorganizes the course.
- `data/pages/<page>.json` holds one page: its `type` and everything it shows, including text, list items, quiz answers, image paths, narration and the wording of its buttons.

Page types: `title`, `content`, `tabs`, `accordion`, `slider`, `hotspots`, `timer`, `bake`, `quiz` and `completion`. Any type can be used for as many pages as you like.

To add a page type, add a `tpl…` method in `js/player.js`, register it in `TEMPLATES`, document its fields in `data/README.md`, and give it desktop, tablet, phone and short-height styles (see §8.4 of the style guide).

Narration is simulated with a one-second timer, as in the design. A page counts as complete when its narration plays to the end.
