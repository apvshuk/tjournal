from django.db import models
from django.contrib.auth.models import User
from community.models import Community
from tjournal.settings import DEFAULT_PP
from . import utils
from community.models import Community
from django_editorjs_fields import EditorJsJSONField

from django.contrib.contenttypes.fields import GenericForeignKey
from django.contrib.contenttypes.models import ContentType
from django.contrib.contenttypes.fields import GenericRelation
import json
from tjournal.ui import my_feed_popular

# default settings
BASIC_SETTINGS = [{
    'show_when_online': True,
    'personal_blog_to_subscribers_only': False,
    'default_ribbon': my_feed_popular,
}]
NOTIFICATIONS = [{
    # m denotes mail, n denotes notification
    "replies_to_my_comments": {"m": False,"n": True, "label": "Replies to my comments"},
    "comment_ratings": {"m": False,"n": True, "label": "Comment ratings"},
    "new_comment_on_posts": {"m": False,"n": True, "label": "New comment on posts"},
    "mentions_in_posts": {"m": False,"n": True, "label": "Mentions in posts"},
    "new_subscribers": {"m": True,"n": True, "label": "New subscribers"},
    "new_message": {"m": False,"n": True, "label": "New message"},
}]

class Activity(models.Model):
    BOOKMARK = 'B'
    UP_VOTE = 'U'
    DOWN_VOTE = 'D'
    COMPLAIN = 'C'
    FOLLOW = 'F'
    ACTIVITY_TYPES = (
        (BOOKMARK, 'Bookmark'),
        (UP_VOTE, 'Up Vote'),
        (DOWN_VOTE, 'Down Vote'),
        (COMPLAIN, 'Complain'),
        (FOLLOW, 'Follow'),
    )

    user = models.ForeignKey(User, on_delete=models.CASCADE, null=True)
    activity_type = models.CharField(max_length=1, choices=ACTIVITY_TYPES)
    date = models.DateField(auto_now_add=True)
    time = models.TimeField(auto_now_add=True)

    # Below the mandatory fields for generic relation
    content_type = models.ForeignKey(ContentType, on_delete=models.CASCADE)
    object_id = models.PositiveIntegerField()
    content_object = GenericForeignKey()


# Create your models here.
class Profile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE)

    avatar = models.ImageField(upload_to=utils.avatar_upload, default=DEFAULT_PP)
    cover_art = models.ImageField(upload_to=utils.cover_art_upload, blank=True)

    bio = models.CharField(max_length=255, blank=True)

    karma = models.DecimalField(max_digits=20, decimal_places=1, default=float(0))

    usersettings = models.TextField(default=json.dumps({
        "basic": BASIC_SETTINGS, "notifications": NOTIFICATIONS
    }))

    date = models.DateField(auto_now_add=True)
    time = models.TimeField(auto_now_add=True)

    activity = GenericRelation(Activity)

    class Meta:
        ordering = ['karma', 'date', 'time']

    def __str__(self):
        return str(self.user.username)

    def get_absolute_url(self):
        return f'/u/{self.user.pk}-{self.user.username}'


NUMBER_OF_MAX_FAVS = 16
class Favourite(models.Model):
    profile = models.ForeignKey(Profile, on_delete=models.CASCADE, related_name="profile")
    pinned_community = models.ForeignKey(Community, on_delete=models.CASCADE, related_name="community", blank=True, null=True)
    pinned_profile = models.ForeignKey(Profile, on_delete=models.CASCADE, related_name="pinned_profile", blank=True, null=True)
    pinned = models.BooleanField(default=False)
    time = models.TimeField(auto_now=True)
    date = models.DateField(auto_now=True)

    class Meta:
        ordering = ['date', 'time']

    def __str__(self):
        return str(self.profile.user.username)

    def save(self, *args, **kwargs):
        obj = Favourite.objects.filter(profile=self.profile, pinned=False)
        if obj.count() > NUMBER_OF_MAX_FAVS:
            obj.first().delete()
        super(Favourite, self).save(*args, **kwargs)

    def get_type(self):
        if self.pinned_profile:
            return self.pinned_profile
        return self.pinned_community

    def get_type_string(self):
        if self.pinned_profile:
            return 'pinned_profile'
        return 'pinned_community'


class Post(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    community = models.ForeignKey(Community, on_delete=models.CASCADE, blank=True, null=True)
    content = EditorJsJSONField(
        plugins=[
            "@editorjs/header",
            "@editorjs/list",
            "@editorjs/delimiter",
            "@editorjs/paragraph",
            "@editorjs/embed",
            "@editorjs/simple-image",
            "@editorjs/image",
            "@editorjs/quote",
            "@editorjs/code",
            "@editorjs/raw",
            "@editorjs/inline-code",
            "@editorjs/marker",
            "@editorjs/warning",
        ],
    )

    published = models.BooleanField(default=False) # False - Draft, True - Publishd
    anchored = models.BooleanField(default=False)

    time = models.TimeField(auto_now_add=True)
    date = models.DateField(auto_now_add=True)

    activity = GenericRelation(Activity)

    class Meta:
        ordering = ['date', 'time']

    def __str__(self):
        return str(self.get_head())

    def get_head(self):
        '''Returns the text which to show on the top of the post'''
        for i in self.content['blocks']:
            if i['type'] == 'Header':
                return f"{i['data']['text']}"
        return None

    def get_visual(self):
        '''
        Returns the image or video (if any) to show on the top of the post
        Returns the url
        '''
        for i in self.content['blocks']:
            if i['type'] == 'Image':
                return i['data']['file']['url']
        return None

    def get_vote_count(self):
        return self.activity.filter(activity_type=Activity.UP_VOTE).count() - self.activity.filter(activity_type=Activity.DOWN_VOTE).count()


class Comment(models.Model):
    post = models.ForeignKey(Post, on_delete=models.CASCADE)
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    content = models.TextField(max_length=1000)

    # primary key of that comment object which is being replied
    reply = models.IntegerField(blank=True, null=True)

    image = models.ImageField(upload_to=utils.comment_image_upload, blank=True)
    links = models.TextField(blank=True)

    time = models.TimeField(auto_now_add=True)
    date = models.DateField(auto_now_add=True)

    activity = GenericRelation(Activity)

    class Meta:
        ordering = ['date', 'time']

    def __str__(self):
        return str(self.user.username)


class Blacklist(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE)
    usernames = models.TextField()
    posts_with_words = models.TextField()