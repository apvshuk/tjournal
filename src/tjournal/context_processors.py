from django.contrib.auth.models import User
from user.models import Favourite
from .ui import SIDEBAR_OPTIONS
from .forms import EditorForm

def profile(request):
    user = User.objects.filter(username=request.user.username).first()
    if user == None:
        profile = None
    else:
        profile = user.profile

    return {
        'profile': profile,
    }

def sidebar(request):
    return {
        'sidebar': SIDEBAR_OPTIONS
    }

def sidebar_users(request):
    if request.user.is_authenticated:
        pinned = Favourite.objects.filter(profile=User.objects.filter(username=request.user).first().profile, pinned=True)
        others = Favourite.objects.filter(profile=User.objects.filter(username=request.user).first().profile, pinned=False)
    else:
        pinned = None
        others = None
    return {
        'sidebar_users': [
            pinned,
            others
        ],
    }

def editor_form(request):
    editor_form_ = EditorForm()
    return {
        'editor_form': editor_form_,
    }