# Welcome to the Geometry Dash Shitty List template!

# FAQ

---

### Website FAQ

Can I use the Shitty List template?

- Sure. Credits to the shitty list are embedded onto this template so keep that in.

The website isn't loading! What can I do?

- Since no webhost is perfect, downtime is expected. You can either wait till the
  website is back online or you can do some behind the scene stuff and run it
  locally.

---

### Mobile List

The **Mobile List** and **Mobile Leaderboard** tabs work exactly like List and
Leaderboard, but use their own levels and records, stored in `data/mobile/`:

- `data/mobile/_list.json` - ordered list of the mobile levels (top to bottom).
- `data/mobile/<Level>.json` - one file per level, same format as the main list
  (see `data/mobile/mau_level.json` for a template).
- The Mobile Leaderboard is calculated only from the files in `data/mobile/`.
- The staff list (`data/_editors.json`) is shared with the main list.

---

### Usage FAQ

How do I add levels to the list?

- Use one of the provided template json files and modify the details to fill in the details
  accordingly. If there are any errors, the site will not load, or you will get a pop up
  saying which level isn't loading.

How do I add records to the list?

- Again, use one of the given templates, and modify the details accordingly. For mobile
  records, you can add the code `mobile: true` within the braces. Make sure there are no
  excess or missing commas, or the website might not load properly.

What are some common reasons for the website not loading?

- The most common cause is missing commas and inverted commas, or extra commas at the end of
  the last lines within list entries. A good way to find the error-causing lines can be found
  by using `Inspect Element` and going to the `Console` tab.

---

## More Coming Soon!

## Repo Maintainers:

- Prometheus
- Emonadeo
