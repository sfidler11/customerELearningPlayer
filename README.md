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
| `js/player.js` | The player shell: header, course menu, content region, section progress, captions, control bar, toast, exit dialog. |
| `js/course-data.js` | Course content. Swap this file to build a new course. |
| `js/main.js` | Mounts the player on `index.html` and reads preview options from the URL. |
| `docs/style-guide.html` | The style and behavior guide the player implements. |

## Using the player

```js
new CoursePlayer(element, window.COURSE_DATA, {
  viewport: 'auto',   // 'auto' | 'desktop' | 'tablet' | 'phone'
  menuOpen: false,
  captionsOn: false,
  showToast: false,   // preview the "Section Completed" toast
  initialPage: 1,     // 1-12
  initialTime: 0,
  height: null,       // e.g. 720 or '80vh'; defaults to filling the container
  persist: true       // save progress to localStorage
});
```

The layout mode comes from the player's own width (desktop ≥ 1024px, tablet 640–1023px, phone < 640px), and "short" mode applies under 700px tall.

## Course data

`COURSE_DATA` has a `title`, a `storageKey` for saved progress, and `modules`, each with a `title` and `pages`. Every page has a `title`, a narration `duration` in seconds, `narration` sentences for the captions panel, and a `template`:

- `title`: full-bleed title page. Fields: `eyebrow`, `lede`, `meta`, `image`, `imageLabel`.
- `content`: image and text slide. Fields: `heading`, `body`, `points`, `image`, `imageLabel`.
- `tabs`: intro plus a row of tabs. Selecting a tab opens its panel, and selecting it again closes it. Fields: `heading`, `lede`, `items` (`name`, `description`, `tip`, `image`, `imageLabel`).
- `accordion`: intro plus expandable list. Fields: `heading`, `lede`, `image`, `imageLabel`, `items` (`name`, `description`, `amount`).

Leave `image` empty to show the striped placeholder with `imageLabel`, or set it to an image URL.

To add a template, add a `tpl…` method in `js/player.js`, call it from `renderPage`, and give it desktop, tablet, phone and short-height styles (see §8.4 of the style guide).

Narration is simulated with a one-second timer, as in the design. A page counts as complete when its narration plays to the end.
