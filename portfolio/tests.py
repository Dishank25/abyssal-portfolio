import json

from html import unescape
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
        self.home_sources = []
        self.has_index = False
        self._reading_index = False
        self.index_text = []

    def handle_starttag(self, tag, attrs):
        attributes = dict(attrs)
        if "data-guide" in attributes:
            self.home_sources.append(attributes.get("data-home"))
        if tag == "script" and attributes.get("id") == "guide-data":
            self._reading_index = self.has_index = True
        for name, value in attrs:
            if name in {"href", "src", "data-fallback"} and value:
                self.targets.append(value)

    def handle_data(self, data):
        if self._reading_index:
            self.index_text.append(data)

    def handle_endtag(self, tag):
        if tag == "script":
            self._reading_index = False


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

    def test_guide_reads_the_public_homepage_from_every_route(self):
        site = get_portfolio()
        projects = [reverse("portfolio:study", args=[item["id"]]) for item in site["projects"]]
        for route in ["/", *projects]:
            with self.subTest(route=route):
                response = self.client.get(route)
                parser = PageLinks()
                parser.feed(response.content.decode())
                self.assertEqual(len(parser.home_sources), 1)
                for base in ("/", "/Dishank25/"):
                    home = "https://example.test" + base
                    self.assertEqual(urljoin(home + route.lstrip("/"), parser.home_sources[0]), home)
                self.assertEqual(parser.has_index, route == "/")
                if parser.has_index:
                    self.assertEqual(json.loads("".join(parser.index_text)), site)

    def test_navigation_and_guide_keep_plain_text_labels_on_every_page(self):
        projects = [reverse("portfolio:study", args=[item["id"]]) for item in get_portfolio()["projects"]]
        for route in ["/", *projects]:
            with self.subTest(route=route):
                html = unescape(self.client.get(route).content.decode())
                self.assertNotRegex(html, r"[\u2190-\u21ff]")
                self.assertIn("Chat with Abby", html)
                self.assertIn("Close chat with Abby", html)
                self.assertIn("Send</button>", html)

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
