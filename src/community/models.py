from django.db import models
from django.contrib.auth.models import User
from . import utils
from tjournal.settings import DEFAULT_COMMUNITY_PP

# Create your models here.
class Community(models.Model):
    admin = models.ForeignKey(User, on_delete=models.CASCADE, related_name='admin')
    members = models.ManyToManyField(User, related_name='members')

    name = models.CharField(max_length=25, unique=True)
    avatar = models.ImageField(upload_to=utils.avatar_upload, default=DEFAULT_COMMUNITY_PP)
    cover_art = models.ImageField(upload_to=utils.cover_art_upload, blank=True)

    date = models.DateField(auto_now_add=True)
    time = models.TimeField(auto_now_add=True)

    def __str__(self) -> str:
        return str(self.name)
