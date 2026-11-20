# Course content (JSON)

Everything the learner sees comes from the JSON files in this folder. The player code in `js/player.js` only knows how to draw each **page type**; the words, pictures, quiz answers, numbers and order all live here.

```
data/
  menu.json            the course: title, modules, and the list of pages
  pages/
    welcome.json       one file per page: its type and everything it shows
    waffle-toolkit.json
    ...
    quiz-example.json  a sample quiz page (not in the menu yet)
```

Edit a file, reload the course, and the change shows up. Browsers will not read JSON from a page opened straight from disk (`file://`), so run the course from a web server (`python3 -m http.server`) or your LMS.

## menu.json

```json
{
  "title": "Waffles 101",
  "storageKey": "waffles101-player",
  "pageLabel": "Page {number} · {title}",
  "resources": [
    { "title": "Waffles job aid", "type": "pdf", "url": "resources/Waffles_Job_Aid.pdf", "description": "..." }
  ],
  "modules": [
    {
      "title": "Getting started",
      "pages": [
        { "number": 1, "title": "Welcome", "file": "pages/welcome.json" },
        { "number": 2, "title": "Your waffle toolkit", "file": "pages/waffle-toolkit.json" }
      ]
    }
  ]
}
```

| Field | What it does |
|---|---|
| `title` | Course title in the header, on the title page and in `{courseTitle}`. |
| `storageKey` | Name used to save the learner's progress in the browser. Change it to start everyone fresh. |
| `pageLabel` | The small line above each page heading. `{number}` and `{title}` are filled in. |
| `resources` | Documents behind the document icon: `title`, `type` (`pdf` or `pptx`), `url`, optional `description`. An empty `url` shows "Coming soon". |
| `modules[].title` | Module name in the menu and the header. |
| `modules[].pages[]` | One entry per page: `number`, `title` (the menu and eyebrow name), `file` (path from this folder), and optional `id`. |

**Ordering.** Pages run in order of `number`; pages with the same number (or none) keep the order they are listed in. Modules run in the order of their first page. The numbers the learner sees are always 1, 2, 3… in that order, so gaps are fine (`10, 20, 30` leaves room to insert pages later).

**Moving, adding and removing pages.** Move an entry to another module or change its `number` to reorder; add an entry pointing at a new page file to add a page; delete the entry to remove it. The menu, page counter, Back/Next, completion screen and `{pageCount}` all follow.

**Reusing a page file or type.** Any number of entries can use the same page type. The same file can even appear twice; give the second entry its own `id` so its progress is saved separately.

**Saved progress** is stored by each page's `id` (or its `file` when there is no `id`), so reordering keeps a learner's ticks on the right pages.

## Page files

Every page file has:

| Field | What it does |
|---|---|
| `type` | Which page layout to use (see below). |
| `duration` | Narration length in seconds. The page counts as complete when narration reaches the end. |
| `narration` | Sentences shown in the captions panel, in order. |
| `labels` | Optional wording for the built-in bits of that page type (button text, hints, status lines). Anything left out uses the player's default. `labels.eyebrow` overrides the menu's `pageLabel` for that page. |

**Images** are given as `{ "src": "images/photo.jpg", "alt": "what it shows", "position": "center 70%" }`. `position` is optional and chooses which part of the photo stays in view. Leave `src` empty to show a placeholder with the `alt` text.

**Placeholders** usable in any text: `{courseTitle}`, `{pageCount}`, `{moduleCount}`. Labels have their own placeholders, listed with each type.

### `title`
Full-bleed opening page. `eyebrow`, `heading` (defaults to the course title), `lede`, `meta`, `image`. Labels: `start`.

### `content`
Picture beside text. `heading`, `body`, `points` (list), `image`.

### `tabs`
Intro and a row of tabs; selecting a tab opens its panel and selecting it again closes it. `heading`, `lede`, `items` (`name`, `icon` emoji, `description`, `tip`, `image`), optional `emptyImage` shown while every tab is closed. Labels: `tip`.

### `accordion`
Intro and an expandable list. `heading`, `lede`, `items` (`name`, `description`, `detail`, optional `detailLabel`), and either `icons` (`{ "icon": "🌾", "label": "Flour" }` or `{ "src": "images/x.svg", "label": "..." }`) or an `image`. Labels: `detail` (the bold lead-in before each item's detail, e.g. "Typical amount:").

### `slider`
Horizontal accordion of colored strips. `heading`, `lede`, `items` (`name`, `kind`, `icon`, `description`, `tip`, `color`: `amber`, `berry`, `green` or `blue`). Labels: `tip`.

### `hotspots`
Text slide with a card that opens an explorer: numbered pins on a picture, a list, and an optional on/off switch, with a check mark on each part explored. `heading`, `body`, `points`, `exploreLabel`, `modalTitle`, optional `image` (without one, the built-in waffle iron drawing is used), and:

- `parts`: `{ "id", "name", "text", "pin": { "x": 50, "y": 27 }, "tip" }`. `x` and `y` are percentages across and down the picture.
- `switch` (optional): `{ "name", "text", "tip", "heatingText", "onLabel", "offLabel", "pin" }`. It counts as one more part.

Labels: `art` (picture description), `hint`, `progress` (`{seen}`, `{total}`), `allDone`, `allDoneModal`, `explored`.

### `timer`
Text slide with a tray that slides up to show a countdown and a waffle that browns as time runs. `heading`, `body`, `points`, `timerMinutes`, `timerLabel`. Labels: `start`, `pause`, `resume`, `restart`, `reset`, `done`, `left` (`{time}`), `statusIdle`, `statusRunning`, `statusPaused`, `statusDone`, `waffleLabel`, `clockLabel`.

### `bake`
Hands-on keep-warm activity: set the oven dial, move waffles to a tray, slide the tray in. `heading`, `body`, `steps` (three step lines), `targetTemp`, `waffleCount`, `dial` (`min`, `max`, `step`), `doneText`. Labels: `ironTitle`, `trayTitle`, `ovenTitle`, `trayCount` (`{moved}`, `{count}`), `trayInOven`, `slideTray`, `dial`, `off`, `tempFormat` (`{temp}`), `reset`, `moveWaffle` (`{left}`), `wrongTemp`, `needOn`, `needTemp` (`{target}`).

### `quiz`
One question with feedback. `heading`, `question`, `multiple` (true for "select all that apply"), optional `image`, `options` (`{ "text", "correct": true/false, "feedback" }`), optional `correctText` and `incorrectText`, and `completeOnCorrect` (default true: a right answer completes the page). The learner's chosen options show their feedback; a wrong answer can be retried. Labels: `submit`, `retry`, `correct`, `incorrect`, `choose`, `chooseMany`, `pickFirst`.

To try the sample, add it to a module in `menu.json`:

```json
{ "number": 6.5, "title": "Check your knowledge", "file": "pages/quiz-example.json" }
```

### `completion`
The last page. `heading` and `thanks` with confetti once every page is complete; `pendingHeading`, `pendingBody` and a list of unfinished pages until then. Optional `image` replaces the waffle drawing. Labels: `close`, `progress` (`{done}`, `{total}`), `module` and `pageLink` (`{number}`, `{title}`).

The older type names `iron` and `rest` still work and mean `hotspots` and `timer`. An unknown type is shown as a `content` page.
