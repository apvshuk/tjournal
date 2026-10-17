from django.shortcuts import render
from django.http import Http404, JsonResponse
from .models import Chat, ChatMessage
from user.models import Profile
from tjournal.utils import get_absolute_url_func

# Create your views here.
def get_chats(request, pk):
    if request.method == 'POST':
        chat = Chat.objects.filter(pk=int(pk)).first()
        offset = int(request.POST.get('offset', 1))
        limit = 6

        # fetch the data
        results = list(ChatMessage.objects.filter(chat=chat).values('id', 'message', 'author', 'read', 'date', 'time', 'deleted_for'))[-offset:-offset-limit:-1]
        for i in results:
            profile = Profile.objects.filter(pk=i['author']).first()
            i['avatar'] = get_absolute_url_func(profile.pk)
            i['username'] = profile.user.username
        if offset == 1:
            results = results[::-1]
        return JsonResponse(data={
            'messages': results,
            'offset': offset,
        })
    else:
        raise Http404()