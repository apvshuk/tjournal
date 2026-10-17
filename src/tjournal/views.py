from django.shortcuts import render, redirect
from django.http import JsonResponse, Http404
from django.core.serializers import serialize
from django.template.loader import render_to_string
from allauth.account.signals import user_signed_up
from .decorators import verified_email_required
from django.db.models.signals import post_save
from django.contrib.auth.models import User
from django.contrib.sessions.models import Session
from django.dispatch import receiver
from user.models import Profile, Post, Comment, Activity, Blacklist
from .forms import EditorForm, CommentForm
import hashlib, json
import requests
from bs4 import BeautifulSoup
from tjournal.utils import get_absolute_url_func
from user.utils import update_by_one, update_by_half
from tjournal.ui import KARMA_TO_DOWNVOTE, ribbons
from tjournal.settings import ACCOUNT_USERNAME_BLACKLIST
from django.contrib.auth.decorators import login_required
import datetime
from allauth.socialaccount.models import SocialAccount


@receiver(post_save, sender=User)
def create_profile(sender, instance, created, **kwargs):
    if created:
        Profile.objects.create(user=instance)


@receiver(user_signed_up)
def set_initial_user_names(request, user, sociallogin=None, **kwargs):
    """
    When a social account is created successfully and this signal is received,
    django-allauth passes in the sociallogin param, giving access to metadata on the remote account, e.g.:

    sociallogin.account.provider  # e.g. 'twitter' 
    sociallogin.account.get_avatar_url()
    sociallogin.account.get_profile_url()
    sociallogin.account.extra_data['screen_name']

    See the socialaccount_socialaccount table for more in the 'extra_data' field.

    From http://birdhouse.org/blog/2013/12/03/django-allauth-retrieve-firstlast-names-from-fb-twitter-google/comment-page-1/
    """

    preferred_avatar_size_pixels = 256

    picture_url = "http://www.gravatar.com/avatar/{0}?s={1}".format(
        hashlib.md5(user.email.encode('UTF-8')).hexdigest(),
        preferred_avatar_size_pixels
    )

    if sociallogin:
        # Extract first / last names from social nets and store on User record
        if sociallogin.account.provider == 'twitter':
            name = sociallogin.account.extra_data['name']
            user.first_name = name.split()[0]
            user.last_name = name.split()[1]

        elif sociallogin.account.provider == 'facebook':
            user.first_name = sociallogin.account.extra_data['first_name']
            user.last_name = sociallogin.account.extra_data['last_name']
            picture_url = "http://graph.facebook.com/{0}/picture?width={1}&height={1}".format(
                sociallogin.account.uid, preferred_avatar_size_pixels)

        elif sociallogin.account.provider == 'google':
            user.first_name = sociallogin.account.extra_data['given_name']
            user.last_name = sociallogin.account.extra_data['family_name']
            picture_url = sociallogin.account.extra_data['picture']

        elif sociallogin.account.provider == 'vk':
            user.first_name = sociallogin.account.extra_data['first_name']
            user.last_name = sociallogin.account.extra_data['last_name']
            picture_url = sociallogin.account.extra_data['photo_big']

    profile = Profile.objects.filter(user=user).first()
    profile.avatar = picture_url
    profile.save()


@verified_email_required
def home(request):
    if request.method == 'POST':
        editor_form = EditorForm(request.POST or None)
        if editor_form.is_valid():
            edit_post = Post.objects.filter(pk=int(request.POST.get('edit', 0))).first()
            if edit_post != None:
                obj = edit_post
                obj.content = json.loads(request.POST.get('content', ''))
            else:
                obj = editor_form.save(commit=False)
                obj.user = request.user
                if (str(request.POST.get('published', False)) == 'true'):
                    obj.published = True
            obj.save()
            return JsonResponse(data={
                'url': f'/u/{obj.user.pk}/{obj.pk}/',
            })
    # tj_posts because I don't know whereall I have used the post variable
    context = {'tj_posts': Post.objects.all()}
    return render(request, 'index.html', context)


def vote(request):
    if request.method == 'POST':
        pk = int(request.POST.get('pk', 0))
        voteType = request.POST.get('voteType', '')

        post = Post.objects.filter(pk=pk).first()
        if post.user == request.user:
            return JsonResponse(data={
                'status': False,
                'message': 'You cannot vote your own post',
            })
        if post != None:
            if voteType == 'upvote':
                if post.activity.filter(activity_type=Activity.UP_VOTE, user=request.user).first() != None:
                    post.activity.filter(activity_type=Activity.UP_VOTE, user=request.user).first().delete()
                    update_by_one(user_profile=post.user.profile, add=False)
                    voted = False
                    message = 'Upvote removed'
                else:
                    post.activity.create(activity_type=Activity.UP_VOTE, user=request.user)
                    update_by_one(user_profile=post.user.profile)
                    try:
                        post.activity.filter(activity_type=Activity.DOWN_VOTE, user=request.user).first().delete()
                        update_by_one(user_profile=post.user.profile)
                    except:pass
                    voted = True
                    message = 'Upvoted'
            elif voteType == 'downvote':
                if float(Profile.objects.filter(user=request.user).first().karma) < float(KARMA_TO_DOWNVOTE):
                    return JsonResponse(data={
                        'status': False,
                        'message': f'You need {KARMA_TO_DOWNVOTE} karma to downvote a post',
                    })
                if post.activity.filter(activity_type=Activity.DOWN_VOTE, user=request.user).first() != None:
                    post.activity.filter(activity_type=Activity.DOWN_VOTE, user=request.user).first().delete()
                    update_by_one(user_profile=post.user.profile)
                    voted = False
                    message = 'Downvote removed'
                else:
                    post.activity.create(activity_type=Activity.DOWN_VOTE, user=request.user)
                    update_by_one(user_profile=post.user.profile, add=False)
                    try:
                        post.activity.filter(activity_type=Activity.UP_VOTE, user=request.user).first().delete()
                        update_by_one(user_profile=post.user.profile, add=False)
                    except:pass
                    voted = True
                    message = 'Downvoted'

            return JsonResponse(data={
                'status': True,
                'message': message,
                'count': post.activity.filter(activity_type=Activity.UP_VOTE).count() - post.activity.filter(activity_type=Activity.DOWN_VOTE).count(),
                'voted': voted,
            })
        else:
            return JsonResponse(data={
                'status': False,
                'message': 'Post not found',
            })
    else:
        raise Http404()

def commentvote(request):
    if request.method == 'POST':
        pk = int(request.POST.get('pk', 0))
        voteType = request.POST.get('voteType', '')

        comment = Comment.objects.filter(pk=pk).first()
        if comment.user == request.user:
            return JsonResponse(data={
                'status': False,
                'message': 'You cannot vote your own comment',
            })
        if comment != None:
            if voteType == 'upvote':
                if comment.activity.filter(activity_type=Activity.UP_VOTE, user=request.user).first() != None:
                    comment.activity.filter(activity_type=Activity.UP_VOTE, user=request.user).first().delete()
                    update_by_half(user_profile=comment.user.profile, add=False)
                    voted = False
                    message = 'Upvote removed'
                else:
                    comment.activity.create(activity_type=Activity.UP_VOTE, user=request.user)
                    update_by_half(user_profile=comment.user.profile)
                    try:
                        comment.activity.filter(activity_type=Activity.DOWN_VOTE, user=request.user).first().delete()
                        update_by_half(user_profile=comment.user.profile)
                    except:pass
                    voted = True
                    message = 'Upvoted'
            elif voteType == 'downvote':
                if float(Profile.objects.filter(user=request.user).first().karma) < float(KARMA_TO_DOWNVOTE):
                    return JsonResponse(data={
                        'status': False,
                        'message': f'You need {KARMA_TO_DOWNVOTE} karma to downvote a comment',
                    })
                if comment.activity.filter(activity_type=Activity.DOWN_VOTE, user=request.user).first() != None:
                    comment.activity.filter(activity_type=Activity.DOWN_VOTE, user=request.user).first().delete()
                    update_by_half(user_profile=comment.user.profile)
                    voted = False
                    message = 'Downvote removed'
                else:
                    comment.activity.create(activity_type=Activity.DOWN_VOTE, user=request.user)
                    update_by_half(user_profile=comment.user.profile, add=False)
                    try:
                        comment.activity.filter(activity_type=Activity.UP_VOTE, user=request.user).first().delete()
                        update_by_half(user_profile=comment.user.profile, add=False)
                    except:pass
                    voted = True
                    message = 'Downvoted'

            return JsonResponse(data={
                'status': True,
                'message': message,
                'count': comment.activity.filter(activity_type=Activity.UP_VOTE).count() - comment.activity.filter(activity_type=Activity.DOWN_VOTE).count(),
                'voted': voted,
            })
        else:
            return JsonResponse(data={
                'status': False,
                'message': 'Comment not found',
            })
    else:
        raise Http404()

def bookmark(request):
    if request.method == 'POST':
        pk = int(request.POST.get('pk', 0))
        post = Post.objects.filter(pk=pk).first()

        if post != None:
            if post.activity.filter(activity_type=Activity.BOOKMARK, user=request.user).first() != None:
                post.activity.filter(activity_type=Activity.BOOKMARK, user=request.user).first().delete()
                bookmarked = False
            else:
                post.activity.create(activity_type=Activity.BOOKMARK, user=request.user)
                bookmarked = True

            if bookmarked:message = "Added to bookmarked posts"
            else:message = "Removed from bookmarked posts"
            return JsonResponse(data={
                'status': True,
                'message': message,
                'count': post.activity.filter(activity_type=Activity.BOOKMARK).count(),
                'bookmarked': bookmarked,
            })
        else:
            return JsonResponse(data={
                'status': False,
                'message': 'Post not found',
            })
    else:
        raise Http404()

def bookmark_comment(request):
    if request.method == 'POST':
        pk = int(request.POST.get('pk', 0))
        comment = Comment.objects.filter(pk=pk).first()

        if comment != None:
            if comment.activity.filter(activity_type=Activity.BOOKMARK, user=request.user).first() != None:
                comment.activity.filter(activity_type=Activity.BOOKMARK, user=request.user).first().delete()
                bookmarked = False
            else:
                comment.activity.create(activity_type=Activity.BOOKMARK, user=request.user)
                bookmarked = True

            if bookmarked:message = "Added to bookmarked comments"
            else:message = "Removed from bookmarked comments"
            return JsonResponse(data={
                'status': True,
                'message': message,
                'count': comment.activity.filter(activity_type=Activity.BOOKMARK).count(),
                'bookmarked': bookmarked,
            })
        else:
            return JsonResponse(data={
                'status': False,
                'message': 'Comment not found',
            })
    else:
        raise Http404()

@verified_email_required
def make_post_public(request):
    if (request.method == 'POST'):
        status = False
        pk = request.POST.get('pk', 0)
        post = Post.objects.filter(pk=pk, user=request.user).first()
        if post != None:
            post.published = True
            post.save()
            status = True
        return JsonResponse(data={
            'status': status,
        })
    else:
        raise Http404()


@verified_email_required
def make_post_private(request):
    if (request.method == 'POST'):
        status = False
        pk = request.POST.get('pk', 0)
        post = Post.objects.filter(pk=pk, user=request.user).first()
        if post != None:
            post.published = False
            post.save()
            status = True
        return JsonResponse(data={
            'status': status,
        })
    else:
        raise Http404()

@verified_email_required
def delete_post(request):
    if (request.method == 'POST'):
        status = False
        pk = request.POST.get('pk', 0)
        post = Post.objects.filter(pk=pk, user=request.user).first()
        if post != None:
            post.delete()
            status = True
        return JsonResponse(data={
            'status': status,
        })
    else:
        raise Http404()

@verified_email_required
def get_post_data(request):
    if (request.method == 'POST'):
        pk = request.POST.get('pk', 0)
        post = Post.objects.filter(pk=pk, user=request.user).first()
        if post != None:
            return JsonResponse(data={
                'status': True,
                'content': post.content,
            })
        return JsonResponse(data={
            'status': False,
        })
    else:
        raise Http404()

def unanchor_all(request):
    for i in list(Post.objects.filter(user=request.user)):
        i.anchored = False
        i.save()

@verified_email_required
def anchor_post(request):
    if (request.method == 'POST'):
        pk = request.POST.get('pk', 0)
        post = Post.objects.filter(pk=pk, user=request.user).first()
        if post != None:
            unanchor_all(request)
            post.anchored = True
            post.save()
            return JsonResponse(data={
                'status': True,
            })
        return JsonResponse(data={
            'status': False,
        })
    else:
        raise Http404()

@verified_email_required
def unanchor_post(request):
    if (request.method == 'POST'):
        pk = request.POST.get('pk', 0)
        post = Post.objects.filter(pk=pk, user=request.user).first()
        if post != None:
            unanchor_all(request)
            return JsonResponse(data={
                'status': True,
            })
        return JsonResponse(data={
            'status': False,
        })
    else:
        raise Http404()

@verified_email_required
def add_comment(request):
    if (request.method == 'POST'):
        comment_form = CommentForm(request.POST or None, request.FILES or None)
        pk = int(request.POST.get('pk', 0))
        reply = int(request.POST.get('reply', 0))
        post = Post.objects.filter(pk=pk).first()
        if post != None:
            if comment_form.is_valid():
                obj = comment_form.save(commit=False)
                obj.user = request.user
                obj.post = post
                if reply != 0:
                    obj.reply = reply
                obj.save()

                profile_ = obj.user.profile
                profile_.avatar = get_absolute_url_func(profile_.pk)
                return JsonResponse(data={
                    'status': True,
                    'comment': serialize('json', [obj]),
                    'user': serialize('json', [obj.user]),
                    'profile': serialize('json', [profile_]),
                    'comment_count': Comment.objects.filter(post=post).count(),
                })
        return JsonResponse(data={
            'status': False,
        })
    else:
        raise Http404()

@verified_email_required
def remove_comment(request):
    # not ready (just to make a function, to add a url in urls.py, later this will be done)
    if (request.method == 'POST'):
        pk = request.POST.get('pk', 0)
        post = Post.objects.filter(pk=pk, user=request.user).first()
        if post != None:
            unanchor_all(request)
            return JsonResponse(data={
                'status': True,
            })
        return JsonResponse(data={
            'status': False,
        })
    else:
        raise Http404()


def FourZeroFour(request, exception=None):
    return render(request, 'error/404.html')


def login_signup_template(request):
    if request.method == 'POST':
        is_ajax = request.META.get('HTTP_X_REQUESTED_WITH') == 'XMLHttpRequest'
        if is_ajax:
            if request.POST.get('login_type', '') == 'mail':
                return JsonResponse(data={
                    'template_as_string': render_to_string('components/login/mail.component.html')
                })
            elif request.POST.get('login_type', '') == 'oauth':
                return JsonResponse(data={
                    'template_as_string': render_to_string('components/login/login_options.component.html')
                })
    else:
        raise Http404()

def editor_template(request):
    if request.method == 'POST':
        is_ajax = request.META.get('HTTP_X_REQUESTED_WITH') == 'XMLHttpRequest'
        if is_ajax:
            return JsonResponse(data={
                'template_as_string': render_to_string('components/editor.component.html')
            })
    else:
        raise Http404()


# crawling
def crawl(request):
    if (request.method == 'POST'):
        url = request.POST.get('link', '')
        if ('http://' not in url):
            url = 'http://' + url
        response = requests.get(url)
        soup = BeautifulSoup(response.text, features='lxml')
        metas = soup.find_all('meta')
        desc = ''
        for m in metas:
            if (m.get('name') == 'description'):
                desc = m.get('content')
                break

        try:
            logo = soup.find("link", rel="icon")['href']
        except:
            try:
                logo = soup.find('img')['src']
            except:
                logo = ''
        return JsonResponse(data={
            'status': True,
            'image': logo,
            'description': desc,
            'link': url,
        })
    else:
        raise Http404()


# settings page
@login_required
def settings_page(request):
    if request.method == 'POST':
        u = User.objects.filter(username=request.user.username).first()
        p = u.profile
        alerts = []

        dta = request.POST.get('dta', '')
        nickname = request.POST.get('nickname', request.user.username)
        first_name = request.POST.get('first_name', request.user.first_name)
        last_name = request.POST.get('last_name', request.user.last_name)

        # update name
        u.first_name = first_name
        u.last_name = last_name
        # update username
        if u.username != nickname and User.objects.filter(username__exact=nickname).first() != None:
            alerts.append(['.nickname_block', 'This nickname is being used by someone else'])
        elif nickname in ACCOUNT_USERNAME_BLACKLIST:
            alerts.append(['.nickname_block', 'This nickname is not allowed'])
        else:
            u.username = nickname
        u.save() # save it

        if dta != '':
            p.usersettings = dta
            p.save()
            return JsonResponse(data={
                'status': True,
                'message': 'Settings have been updated',
                'alerts': alerts,
            })
        else:
            return JsonResponse(data={
                'status': False,
                'message': 'Could not update your settings',
                'alerts': alerts,
            })

    u = Profile.objects.filter(user=request.user).first()
    settings_ = json.loads(u.usersettings)

    account_data = []
    for account in SocialAccount.objects.filter(user=request.user):
        provider_account = account.get_provider_account()
        account_data.append(
            {
                "id": account.pk,
                "provider": account.provider,
                "name": provider_account.to_str(),
            }
        )

    context = {
        'notifications_settings': settings_['notifications'][0],
        'basic_settings': settings_['basic'][0],
        'ribbons': ribbons,
        'social_accounts': account_data,
    }
    return render(request, 'settings.html', context)


# logout from all devices
def logout_all(request):
    if request.method == 'POST':
        unexpired_sessions = Session.objects.filter(expire_date__gte=datetime.datetime.now())
        [
            session.delete() for session in unexpired_sessions
            if str(request.user.pk) == session.get_decoded().get('_auth_user_id')
        ]
        return redirect('/')
    else:
        return render(request, 'allauth/account/logout_all.html')


def username_suggestion(request):
    if request.method == 'POST':
        q = request.POST.get('query', '')
        s = list(User.objects.filter(username__icontains=q).values('username', 'first_name', 'last_name'))
        return JsonResponse(data={
            's': s,
        })
    else:
        raise Http404()

def add_blacklist_user(request):
    if request.method == 'POST':
        if not request.user.is_authenticated:
            return JsonResponse(data={
                'usernames': [],
            })
        add = request.POST.get('u', None)
        b = Blacklist.objects.filter(user=request.user).first()
        alerts = []
        if b == None:
            b = Blacklist.objects.create(user=request.user)

        if b.usernames != '':
            ju = json.loads(b.usernames)
        else:
            ju = []

        if add == None:
            return JsonResponse(data={
                'usernames': ju,
            })

        if add in ju:
            alerts.append('Already blacklisted')
        elif add == request.user.username:
            alerts.append('You can\'t blacklist yourself')
        else:
            ju.append(add)
            b.usernames = json.dumps(ju)
        b.save()
        return JsonResponse(data={
            'usernames': ju,
            'alerts': alerts,
        })
    else:
        raise Http404()

def hide_posts_with_words(request):
    if request.method == 'POST':
        if not request.user.is_authenticated:
            return JsonResponse(data={
                'usernames': [],
            })
        add = request.POST.get('u', None)
        b = Blacklist.objects.filter(user=request.user).first()
        alerts = []
        if b == None:
            b = Blacklist.objects.create(user=request.user)

        if b.posts_with_words != '':
            ju = json.loads(b.posts_with_words)
        else:
            ju = []

        if add == None:
            return JsonResponse(data={
                'posts_with_words': ju,
            })

        if add.lower() in ju:
            alerts.append('Already hiding posts with this word')
        else:
            ju.append(add.lower())
            b.posts_with_words = json.dumps(ju)
        b.save()
        return JsonResponse(data={
            'posts_with_words': ju,
            'alerts': alerts,
        })
    else:
        raise Http404()

def remove_blacklist_user(request):
    if request.method == 'POST':
        if not request.user.is_authenticated:
            return JsonResponse(data={
                'usernames': [],
            })
        remove = request.POST.get('u', None)
        b = Blacklist.objects.filter(user=request.user).first()

        ju = json.loads(b.usernames)
        ju.pop(ju.index(remove))

        b.usernames = json.dumps(ju)

        b.save()
        return JsonResponse(data={
            'usernames': ju,
        })
    else:
        raise Http404()

def remove_blacklist_words(request):
    if request.method == 'POST':
        if not request.user.is_authenticated:
            return JsonResponse(data={
                'usernames': [],
            })
        remove = request.POST.get('u', None)
        b = Blacklist.objects.filter(user=request.user).first()

        ju = json.loads(b.posts_with_words)
        ju.pop(ju.index(remove))

        b.posts_with_words = json.dumps(ju)

        b.save()
        return JsonResponse(data={
            'posts_with_words': ju,
        })
    else:
        raise Http404()