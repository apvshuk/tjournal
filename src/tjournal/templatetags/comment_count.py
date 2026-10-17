from django import template
from user.models import Comment

register = template.Library()

@register.simple_tag
def comment_count(post):
    return Comment.objects.filter(post=post).count()