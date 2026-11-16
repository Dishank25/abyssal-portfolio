import shutil
from pathlib import Path
from tempfile import TemporaryDirectory

from django.contrib.staticfiles.finders import find
from django.core.management.base import BaseCommand, CommandError
from django.test import RequestFactory
from django.urls import resolve, reverse

from portfolio.content import get_portfolio


class Command(BaseCommand):
    help = "Render every public portfolio route as a portable static website."

    def add_arguments(self, parser):
        parser.add_argument("--output", type=Path, default=Path("build"))

    def handle(self, *args, **options):
        output = options["output"].resolve()
        marker = ".portfolio-export"
        if output.exists() and not output.is_dir():
            raise CommandError("The export destination must be a directory.")
        if output.is_dir() and any(output.iterdir()) and not (output / marker).is_file():
            raise CommandError("Choose an empty directory or a previous portfolio export.")

        routes = [reverse("portfolio:home")]
        routes.extend(
            reverse("portfolio:study", args=[project["id"]])
            for project in get_portfolio()["projects"]
        )

        output.parent.mkdir(parents=True, exist_ok=True)
        requests = RequestFactory()
        with TemporaryDirectory(dir=output.parent) as temporary:
            new_site = Path(temporary) / "site"
            new_site.mkdir()
            for route in routes:
                match = resolve(route)
                response = match.func(requests.get(route), **match.kwargs)
                if response.status_code != 200:
                    raise CommandError(f"Unable to render {route}: HTTP {response.status_code}")
                page = new_site / route.strip("/") / "index.html"
                page.parent.mkdir(parents=True, exist_ok=True)
                page.write_bytes(response.content)

            assets = find("portfolio")
            if not assets:
                raise CommandError("Could not find the portfolio static directory.")
            shutil.copytree(assets, new_site / "static" / "portfolio")
            (new_site / ".nojekyll").touch()
            (new_site / marker).touch()

            # Render first. Keep the previous complete build if a view or copy fails.
            backup = Path(temporary) / "previous"
            if output.exists():
                output.rename(backup)
            try:
                new_site.rename(output)
            except OSError:
                if backup.exists():
                    backup.rename(output)
                raise

        self.stdout.write(self.style.SUCCESS(f"Exported {len(routes)} pages to {output}"))
