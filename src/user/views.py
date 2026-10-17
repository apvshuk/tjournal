from django.shortcuts import render, get_object_or_404
from .models import Profile, Favourite
from django.core.serializers import serialize
from django.http import JsonResponse, Http404
from community.models import Community
from user.models import Post, Comment, Activity
from tjournal.decorators import verified_email_required
from django.contrib.auth.models import User
from chat.models import Chat
from tjournal.utils import get_absolute_url_func, merge_sort_q, merge_sort_p
from tjournal.ui import COMMENT_LOAD_LIMIT, owner_tabs, visitor_tabs, end_tabs, POST_LOAD_LIMIT
from user.models import Post
from allauth.socialaccount.models import SocialAccount
from django.template.loader import render_to_string

# Create your views here.
@verified_email_required
def user_page(request, pk, extra_contex={}, page='articles', template_name='user/profile/articles.html'):
    if request.method == 'POST':
        if request.POST.get('_name', '') == 'toggle_pin':
            auth_profile = Profile.objects.filter(user=request.user).first()
            who = request.POST.get('who', '')
            pk = int(request.POST.get('pk', ''))
            if who == 'pinned_community':
                fav = Favourite.objects.filter(profile=auth_profile, pinned_community=Community.objects.filter(pk=pk).first()).first()
                if fav == None:
                    fav = Favourite.objects.create(profile=auth_profile, pinned_community=Community.objects.filter(pk=pk).first())
            else:
                fav = Favourite.objects.filter(profile=auth_profile, pinned_profile=Profile.objects.filter(pk=pk).first()).first()
                if fav == None:
                    fav = Favourite.objects.create(profile=auth_profile, pinned_profile=Profile.objects.filter(pk=pk).first())

            if fav.pinned == True:
                fav.pinned = False
            else:
                fav.pinned = True
            fav.save()

            return JsonResponse(data={
                'state': fav.pinned,
            })

    # page profile (Profile of the user who's page being is visited)
    # (also give 404 error if user does not exists)
    page_user = get_object_or_404(User, pk=pk)

    # page profile
    page_profile = Profile.objects.filter(user=page_user).first()

    if request.user.is_authenticated:
        if Favourite.objects.filter(profile=Profile.objects.filter(user=request.user).first(), pinned_profile=page_profile).first() == None:
            not_in_sidebar_user_list = True
        else:
            not_in_sidebar_user_list = False
    else:
        not_in_sidebar_user_list = False

    cr_cts = None
    if request.user.is_authenticated:
        chats = User.objects.filter(username=request.user.username).first().user_chats.all()
        for i in chats:
            if page_user in i.members.all() and User.objects.filter(username=request.user.username).first() in i.members.all():
                cr_cts = i.pk
                break
        else:
            # create a new chat room and return the pk
            cr_cts = Chat.objects.create()
            cr_cts.members.add(page_user)
            cr_cts.members.add(User.objects.filter(username=request.user.username).first())
            cr_cts.save()
            cr_cts = cr_cts.pk

    profile_tabs = visitor_tabs + end_tabs
    if request.user == page_user:
        profile_tabs = visitor_tabs + owner_tabs + end_tabs

    context = {
        'page_profile': page_profile,
        'chat_pk': cr_cts,
        'not_in_sidebar_user_list': not_in_sidebar_user_list,
        'page': page,
        'extra': extra_contex,
        'tabs': profile_tabs,
        'subscribed': page_profile.activity.filter(user=request.user, activity_type=Activity.FOLLOW).first() != None,
    }
    return render(request, template_name, context)

def articles_page(request, pk, filter_posts='fresh', popular_filter_name='Popular'):
    account_data = []
    for account in SocialAccount.objects.filter(user__pk=pk):
        provider_account = account.get_provider_account()
        account_data.append(
            {
                "href": account.get_profile_url(),
                "provider": account.provider,
                "name": provider_account.to_str(),
            }
        )
    return user_page(request, pk, {
        'filter_posts': filter_posts,
        'popular_filter_name': popular_filter_name,
        'social_accounts': account_data,
        'subscribers': Profile.objects.filter(user__pk=pk).first().activity.filter(activity_type=Activity.FOLLOW)[0:8],
    })

def articles_popular_day(request, pk):
    return articles_page(request, pk, 'popular,day', 'Per day')
def articles_popular_week(request, pk):
    return articles_page(request, pk, 'popular,week', 'During the week')
def articles_popular_month(request, pk):
    return articles_page(request, pk, 'popular,month', 'Per month')
def articles_popular_year(request, pk):
    return articles_page(request, pk, 'popular,year', 'In a year')
def articles_popular_all(request, pk):
    return articles_page(request, pk, 'popular,all', 'For all the time')


def comments_page(request, pk, filter_comments='fresh', popular_filter_name='Popular'):
    account_data = []
    for account in SocialAccount.objects.filter(user__pk=pk):
        provider_account = account.get_provider_account()
        account_data.append(
            {
                "href": account.get_profile_url(),
                "provider": account.provider,
                "name": provider_account.to_str(),
            }
        )
    return user_page(request, pk, {
        'filter_comments': filter_comments,
        'popular_filter_name': popular_filter_name,
        'social_accounts': account_data,
        'subscribers': Profile.objects.filter(user__pk=pk).first().activity.filter(activity_type=Activity.FOLLOW)[0:8],
    }, page='comments', template_name='user/profile/comments.html')

def comments_popular_day(request, pk):
    return comments_page(request, pk, 'popular,day', 'Per day')
def comments_popular_week(request, pk):
    return comments_page(request, pk, 'popular,week', 'During the week')
def comments_popular_month(request, pk):
    return comments_page(request, pk, 'popular,month', 'Per month')
def comments_popular_year(request, pk):
    return comments_page(request, pk, 'popular,year', 'In a year')
def comments_popular_all(request, pk):
    return comments_page(request, pk, 'popular,all', 'For all the time')


@verified_email_required
def post_page(request, pk, post_pk):
    post_owner = get_object_or_404(User, pk=pk)
    if (post_owner == request.user):
        post = get_object_or_404(Post, pk=post_pk, user=post_owner)
    else:
        post = get_object_or_404(Post, pk=post_pk, user=post_owner, published=True)

    context = {
        'page_post': post,
        'page_profile': post_owner.profile,
        'comment_count': Comment.objects.filter(post=post).count(),
    }
    return render(request, 'user/post.html', context)

@verified_email_required
def update_avatar(request):
    if request.method == "POST":
        profile = Profile.objects.filter(user=request.user).first()
        profile.avatar = request.FILES.get('file')
        profile.save()
        return JsonResponse(data={
            'url': profile.avatar.url,
        })

    else:
        raise Http404()

@verified_email_required
def update_cover_art(request):
    if request.method == "POST":
        profile = Profile.objects.filter(user=request.user).first()
        profile.cover_art = request.FILES.get('file')
        profile.save()
        return JsonResponse(data={
            'url': profile.cover_art.url,
        })

    else:
        raise Http404()

@verified_email_required
def update_favourite_model(request, pk):
    if request.method == 'POST':
        user = User.objects.filter(pk=pk).first()
        auth_profile = Profile.objects.filter(user=user).first()
        who = request.POST.get('who', '')
        if who == 'pinned_community':
            try:
                fav = Favourite.objects.filter(profile=auth_profile, pinned_community=Community.objects.filter(pk=pk).first()).first()
            except:
                fav = Favourite.objects.create(profile=auth_profile, pinned_community=Community.objects.filter(pk=pk).first())
        else:
            try:
                fav = Favourite.objects.filter(profile=auth_profile, pinned_profile=Profile.objects.filter(pk=pk).first()).first()
            except:
                fav = Favourite.objects.create(profile=auth_profile, pinned_profile=Profile.objects.filter(pk=pk).first())

        fav.save()

        return JsonResponse(data={
            'success': True,
        })

    else:
        raise Http404()


# comment sending
def fetch_comment(request, pk_, type='post'):
    if request.method == 'POST':
        obj = Post.objects.filter(pk=pk_).first()
        if type == 'user':
            obj = User.objects.filter(pk=pk_).first()

        offset = int(request.POST.get('received', 0))
        order = request.POST.get('order', 'fresh')

        # ordering
        if (order == 'last'):
            # oldest first
            if type == 'user':
                comments = list(Comment.objects.filter(user=obj))[offset:offset+COMMENT_LOAD_LIMIT]
            else:
                comments = list(Comment.objects.filter(post=obj))[offset:offset+COMMENT_LOAD_LIMIT]
        elif ('popular' in order):
            # popular
            if type == 'user':
                comments = list(Comment.objects.filter(user=obj))
            else:
                comments = list(Comment.objects.filter(post=obj))

            try:
                t = order.split(',')[-1]
                merge_sort_p(comments, 0, len(comments) - 1, t)
                comments = comments[::-1][offset:offset+COMMENT_LOAD_LIMIT] # reverse to show popular on top
            except:
                merge_sort_q(comments, 0, len(comments) - 1)
                comments = comments[::-1][offset:offset+COMMENT_LOAD_LIMIT] # reverse to show popular on top
        else:
            # newest first
            if type == 'user':
                comments = list(Comment.objects.filter(user=obj))[::-1][offset:offset+COMMENT_LOAD_LIMIT]
            else:
                comments = list(Comment.objects.filter(post=obj))[::-1][offset:offset+COMMENT_LOAD_LIMIT]

        profiles_dets = [i.user.profile for i in comments]
        users_dets = [i.user for i in comments]
        # We don't need all these
        # I don't know if this saves bytes
        for i in profiles_dets:
            i.user = None
            i.time = None
            i.karma = None
            i.date = None
            i.bio = None
            i.cover_art = None
            i.avatar = get_absolute_url_func(i.pk)
        for i in users_dets:
            i.password = None
            i.first_name = None
            i.last_name = None
        # to check if a user has voted or not.
        # i am populating the bio variable
        # with the boolean. The bio variable
        # is not needed. Karma variable is not needed.
        votes = []
        for i in range(len(comments)):
            c = comments[i].activity.filter(activity_type=Activity.UP_VOTE).count() - comments[i].activity.filter(activity_type=Activity.DOWN_VOTE).count()
            votes.append(c)
            if request.user.is_authenticated:
                if comments[i].activity.filter(activity_type=Activity.UP_VOTE, user=request.user).first() != None:
                    profiles_dets[i].bio = True
                elif comments[i].activity.filter(activity_type=Activity.DOWN_VOTE, user=request.user).first() != None:
                    profiles_dets[i].bio = False
                if comments[i].activity.filter(activity_type=Activity.BOOKMARK, user=request.user).first() != None:
                    profiles_dets[i].karma = True

        # serialize
        comments = serialize('json', comments)
        users_dets = serialize('json', users_dets)
        profiles_dets = serialize('json', profiles_dets)

        return JsonResponse(data={
            'comments': comments,
            'user_dets': users_dets,
            'profiles_dets': profiles_dets,
            'votes': votes,
            'authenticated': request.user.is_authenticated,
        })
    else:
        raise Http404()

def fetch_comment_of_post(request, pk):
    return fetch_comment(request, pk)
def fetch_comment_of_user(request, pk):
    return fetch_comment(request, pk, type='user')

# post sending
def fetch_post(request, userpk):
    if request.method == 'POST':
        offset = offset = int(request.POST.get('received', 0))
        order = request.POST.get('order', '') # fresh, popular

        if request.user == User.objects.filter(pk=userpk).first():
            p = Post.objects.filter(user__pk=userpk)
        else:
            p = Post.objects.filter(user__pk=userpk, published=True)

        if 'popular' in order:
            fi = order.split(',')[-1]
            p = list(p)
            merge_sort_p(p, 0, len(p) - 1, fi)
            p = p[::-1][offset:offset+POST_LOAD_LIMIT]
        else: # fresh
            p = p[::-1][offset:offset+POST_LOAD_LIMIT]

        pstring = ''
        for i in p:
            pstring += render_to_string('components/post.component.html', context={
                'post_obj': i,
                'request': request,
            })

        return JsonResponse(data={
            'posts': pstring,
            'sent': len(p),
        })
    else:
        raise Http404()


def subscribe_user(request, userpk):
    if request.method == 'POST':
        p = Profile.objects.filter(user__pk=userpk).first()
        already_exists_check = p.activity.filter(user=request.user, activity_type=Activity.FOLLOW).first()
        subscribed = True
        message = 'Subscribed'
        if already_exists_check == None:
            p.activity.create(user=request.user, activity_type=Activity.FOLLOW)
        else:
            already_exists_check.delete()
            subscribed = False
            message = 'Subscription removed'
        return JsonResponse(data={
            'subscribed': subscribed,
            'message': message,
        })
    else:
        raise Http404()