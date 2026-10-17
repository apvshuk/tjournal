from django import template
from user.models import Activity

register = template.Library()

@register.simple_tag
def validate_vote(post, user):
    down_v = False
    up_v = False
    if post.activity.filter(activity_type=Activity.DOWN_VOTE, user=user).first() != None:
        down_v = True
    elif post.activity.filter(activity_type=Activity.UP_VOTE, user=user).first() != None:
        up_v = True
    return [down_v, up_v]