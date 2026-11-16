from django.http import Http404
from django.shortcuts import render

from .content import get_portfolio


def home(request):
    return render(request, "portfolio/index.html", {"site": get_portfolio()})


def study(request, slug):
    site = get_portfolio()
    for project in site["projects"]:
        if project["id"] == slug:
            return render(request, "portfolio/study.html", {"site": site, "project": project})
    raise Http404("This project was not found.")
