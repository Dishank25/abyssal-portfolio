# Abyssal Observatory

Dishank Jain’s AI engineering portfolio, built with Python and Django. Open a project study, ask Abby about Dishank’s work, or try the interactive confidence threshold in SupportPilot. The menu includes all site navigation and a choice of Abyss and Daylight themes.

[Visit the portfolio](https://dishank25.github.io/Dishank25/) · [Open the portfolio case study](https://dishank25.github.io/Dishank25/projects/abyssal-portfolio/) · [GitHub profile](https://github.com/Dishank25)

![Underwater signal room looking out into the abyss](portfolio/static/portfolio/assets/signal-room.webp)

## Run locally

Use Python 3.10 or newer. From the repository directory, create a virtual environment and start the Django development server.

```sh
python -m venv .venv
source .venv/bin/activate
python -m pip install -r requirements.txt
python manage.py runserver
```

On Windows PowerShell, activate the environment with `.\.venv\Scripts\Activate.ps1`. Open [localhost:8000](http://127.0.0.1:8000/). The app requires no database setup, API keys or external services.

## How it works

- [Career and project content](portfolio/content.json) supplies the home page and each project page. The [education list](portfolio/static/portfolio/education.json) supplies the degree and exchange entry for both the site and Abby. To add a project, give its entry a unique URL slug in the `id` field, then edit its title, description, paragraphs, tags and source links.
- [Django views](portfolio/views.py) serve the homepage at `/` and case studies at `/projects/<slug>/`. Each project row opens its own study in one tap, and old project bookmarks continue to work.
- [Static assets](portfolio/static/portfolio/) handle the character animation, scroll depth, mobile composition, and the keyboard-operated confidence slider. The illustrated character breathes automatically. The interface reduces background effects for visitors who request reduced motion.
- Abby flies in on arrival and repeats her 10.2-second flight on refresh. She crosses to the centre, banks out to the edge, circles once, and returns to greet the visitor. Visitors who use reduced motion see her greeting immediately. Selecting her opens the chat. Dismissing the greeting docks her in the corner, where visitors can reopen it. She uses the published [profile and project descriptions](portfolio/content.json) to answer in the browser and link to supporting pages. On a case study she loads the index from the homepage when the visitor first asks a question. Visitor questions stay on the device.
- [The export command](portfolio/management/commands/export_site.py) renders the same Django views into HTML and copies their assets. GitHub Pages serves this static edition. Relative links work under both a domain root and a repository path.

## Verify and export

```sh
python manage.py check
python manage.py test
python manage.py export_site --output build
python -m http.server 8001 --directory build
```

Visit [localhost:8001](http://127.0.0.1:8001/) to inspect the static edition. Deploy the contents of `build/` to a static host. For a subsequent export, use the same output directory. The command recognizes its own previous build and replaces it after every route and asset has been written successfully.
