# Course resources

Currently: `Waffles_Job_Aid.pdf`.

Put the PDFs and PowerPoint files for the "Course resources" pop-up in this folder.

Then add each one to `resources` in `data/menu.json`, for example:

```json
{ "title": "Waffle recipe card", "type": "pdf", "url": "resources/waffle-recipe-card.pdf", "description": "Printable recipe and ingredient list" }
```

Use `"type": "pptx"` for PowerPoint files. An entry with an empty `url` shows as "Coming soon".
