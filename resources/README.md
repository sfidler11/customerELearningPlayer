# Course resources

Put the PDFs and PowerPoint files for the "Course resources" pop-up in this folder.

Then add each one to `COURSE_DATA.resources` in `js/course-data.js`, for example:

```js
{ title: 'Waffle recipe card', type: 'pdf', url: 'resources/waffle-recipe-card.pdf', description: 'Printable recipe and ingredient list' }
```

Use `type: 'pptx'` for PowerPoint files. An entry with an empty `url` shows as "Coming soon".
