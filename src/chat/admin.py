from django.contrib import admin

# Register your models here.
from . import models

admin.site.register(models.Chat)
admin.site.register(models.ChatMessage)