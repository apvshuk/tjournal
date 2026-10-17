from django.shortcuts import render, redirect, get_object_or_404
from tjournal.decorators import verified_email_required
from .models import Community
from user.models import Profile, Favourite

# Create your views here.
def community(request, community_name):

    # page profile (Community being is visited)
    # (also give 404 error if community does not exists)
    community = get_object_or_404(Community, name=community_name)

    if request.user.is_authenticated:
        if Favourite.objects.filter(profile=Profile.objects.filter(user=request.user).first(), pinned_community=community).first() == None:
            not_in_sidebar_user_list = True
        else:
            not_in_sidebar_user_list = False
    else:
        not_in_sidebar_user_list = False

    context = {
        'community': community,
        'not_in_sidebar_user_list': not_in_sidebar_user_list,
    }
    return render(request, 'community/community.html', context)
