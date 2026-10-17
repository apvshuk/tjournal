from django import template
from user.models import Activity

register = template.Library()

@register.simple_tag
def validate_bookmark(post, user):
    if post.activity.filter(activity_type=Activity.BOOKMARK, user=user).first() == None:
        return [False, post.activity.filter(activity_type=Activity.BOOKMARK).count()]
    return [True, post.activity.filter(activity_type=Activity.BOOKMARK).count()]