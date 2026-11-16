from html.parser import HTMLParser
from pathlib import Path
from tempfile import TemporaryDirectory
from urllib.parse import urljoin, urlsplit

from django.core.management import call_command
from django.core.management.base import CommandError
from django.test import SimpleTestCase
from django.urls import reverse
from django.utils.html import escape

from .content import get_portfolio


class PageLinks(HTMLParser):
    def __init__(self):
        super().__init__()
        self.targets = []

    def handle_starttag(self, tag, attrs):
        for name, value in attrs:
            if name in {"href", "src", "data-fallback"} and value:
                self.targets.append(value)


class PortfolioTests(SimpleTestCase):
    def test_home_and_individual_projects(self):
        home = self.client.get(reverse("portfolio:home"))
        for project in get_portfolio()["projects"]:
            with self.subTest(project=project["id"]):
                url = reverse("portfolio:study", args=[project["id"]])
                self.assertContains(home, f'id="{project["id"]}"')
                self.assertContains(home, f'class="project-link" href="{url.lstrip("/")}"')
                response = self.client.get(url)
                self.assertContains(response, escape(project["title"]))
                self.assertContains(response, 'href="../../#work"')
        self.assertEqual(self.client.get("/projects/unknown/").status_code, 404)

    def test_home_opens_projects_without_script_or_intermediate_disclosure(self):
        home = self.client.get("/")
        self.assertNotContains(home, "<details")
        self.assertNotContains(home, "Section link")
        self.assertNotContains(home, "Pause motion")
        self.assertContains(home, 'src="static/portfolio/assets/observatory-breathing.svg"')
        self.assertContains(home, "View project", count=len(get_portfolio()["projects"]))
        study = self.client.get("/projects/supportpilot/")
        self.assertContains(study, 'id="gate-distance"')
        self.assertContains(study, "confidence.js")

    def test_export_links_work_at_root_and_project_subpaths(self):
        with TemporaryDirectory() as temporary:
            output = Path(temporary) / "site"
            call_command("export_site", output=output, verbosity=0)
            self.assertEqual(
                (output / "index.html").read_bytes(),
                self.client.get(reverse("portfolio:home")).content,
            )
            for document in output.rglob("index.html"):
                parser = PageLinks()
                parser.feed(document.read_text())
                for base in ("/", "/Dishank25/"):
                    directory = document.parent.relative_to(output).as_posix().strip(".")
                    page = urljoin("https://example.test" + base, directory + "/") if directory else "https://example.test" + base
                    for target in parser.targets:
                        resolved = urlsplit(urljoin(page, target))
                        if resolved.netloc != "example.test":
                            continue
                        with self.subTest(document=document.name, base=base, target=target):
                            self.assertTrue(resolved.path.startswith(base))
                            local = output / resolved.path.removeprefix(base)
                            if local.is_dir():
                                local = local / "index.html"
                            self.assertTrue(local.is_file(), str(local))

    def test_successive_export_and_unrelated_files(self):
        with TemporaryDirectory() as temporary:
            output = Path(temporary) / "site"
            output.mkdir()
            valuable = output / "notes.txt"
            valuable.write_text("Keep this document")
            with self.assertRaises(CommandError):
                call_command("export_site", output=output)
            self.assertTrue(valuable.is_file())
            valuable.unlink()
            call_command("export_site", output=output, verbosity=0)
            stale = output / "stale-page.html"
            stale.touch()
            call_command("export_site", output=output, verbosity=0)
            self.assertFalse(stale.exists())
