"""tjournal URL Configuration

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/3.1/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""
from django.contrib import admin
from django.urls import path, include
from . import views
from user import views as user_views
from django.conf import settings
from django.conf.urls.static import static
from django.contrib.auth.views import LogoutView
from django_editorjs_fields.views import ImageUploadView

# custom error handlers
handler404 = 'tjournal.views.FourZeroFour'

urlpatterns = [
    path('admin/', admin.site.urls),

    path('', views.home, name='home_url'),
    path('update-avatar/', user_views.update_avatar, name="update_avatar"),
    path('update-cover/', user_views.update_cover_art, name="update_cover_art"),
    path('update-favourite/<int:pk>/', user_views.update_favourite_model),
    path('login-as-string/', views.login_signup_template, name="login_as_string"),
    path('editor-as-string/', views.editor_template, name="editor_as_string"),
    path('404/', views.FourZeroFour),
    path('vote/', views.vote, name="vote"),
    path('comment-vote/', views.commentvote, name="commentvote"),
    path('bookmark/', views.bookmark, name="bookmark"),
    path('bookmark-comment/', views.bookmark_comment, name="bookmark_comment"),
    path('make_post_public/', views.make_post_public, name="make_post_public"),
    path('make_post_private/', views.make_post_private, name="make_post_private"),
    path('delete-post/', views.delete_post, name="delete_post"),
    path('get-post-data/', views.get_post_data, name="get_post_data"),
    path('anchor-post/', views.anchor_post, name="anchor_post"),
    path('unanchor-post/', views.unanchor_post, name="unanchor_post"),
    path('add-comment/', views.add_comment, name="remove_comment"),
    path('remove-comment/', views.remove_comment, name="remove_comment"),
    path('crawl/', views.crawl, name="crawl"),
    path('fetch-comment/<int:pk>/', user_views.fetch_comment_of_post),
    path('fetch-comment-user/<int:pk>/', user_views.fetch_comment_of_user),
    path('accounts/settings/', views.settings_page, name='settings'),
    path('accounts/logout_all/', views.logout_all, name='logout_all'),
    path('username-suggestion/', views.username_suggestion, name='username_suggestion'),
    path('add-blacklist-user/', views.add_blacklist_user, name='add_blacklist_user'),
    path('remove-blacklist-user/', views.remove_blacklist_user, name='remove_blacklist_user'),
    path('hide_posts_with_words/', views.hide_posts_with_words, name='hide_posts_with_words'),
    path('remove_blacklist_words/', views.remove_blacklist_words, name='remove_blacklist_words'),
    path('fetch-post/<int:userpk>/', user_views.fetch_post),
    path('subscribe/<int:userpk>/', user_views.subscribe_user),
    # all-auth urls
    path('accounts/', include('allauth.urls')),
    # custom app urls
    path('', include('community.urls')),
    path('u/', include('user.urls')),
    path('chat/', include('chat.urls')),
    path(
        'editorjs/image_upload/',
        ImageUploadView.as_view(),
        name='editorjs_image_upload',
    ),

] + static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
