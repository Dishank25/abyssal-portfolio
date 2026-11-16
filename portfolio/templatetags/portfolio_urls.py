import posixpath

from django import template
from django.templatetags.static import static
from django.urls import reverse

register = template.Library()


def relative_to_page(context, target):
    """Use directory-relative URLs so exported HTML can move to any Pages subpath."""
    page = context.request.path
    relative = posixpath.relpath(target, start=page)
    return relative + "/" if target.endswith("/") else relative


@register.simple_tag(takes_context=True)
def page_url(context, name, *args):
    return relative_to_page(context, reverse("portfolio:" + name, args=args))


@register.simple_tag(takes_context=True)
def asset_url(context, name):
    return relative_to_page(context, static("portfolio/" + name))
