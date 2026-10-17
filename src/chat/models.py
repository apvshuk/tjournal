from django.db import models
from django.contrib.auth.models import User
from django.core.exceptions import ValidationError
from django.db.models.signals import m2m_changed

# Create your models here.
class Chat(models.Model):
    # generally two
    members = models.ManyToManyField(User, related_name='user_chats')


class ChatMessage(models.Model):
    chat = models.ForeignKey(Chat, on_delete=models.CASCADE)
    message = models.TextField(max_length=2000)
    author = models.ForeignKey(User, on_delete=models.CASCADE)
    deleted_for = models.ManyToManyField(User, related_name='deleted_for', blank=True)
    read = models.BooleanField(default=False)
    date = models.DateField(auto_now_add=True)
    time = models.TimeField(auto_now_add=True)
    # will add file field later

    class Meta:
        ordering = ['date', 'time']

    def __str__(self):
        return str(self.message)


def members_validate(sender, **kwargs):
    if kwargs['instance'].members.count() > 2:
        raise ValidationError("You can't assign more than three regions")

m2m_changed.connect(members_validate, sender=Chat.members.through)