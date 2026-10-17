import json
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from user.models import Profile, Post, Comment, Activity
from chat.models import Chat, ChatMessage
from django.contrib.auth.models import User
from django.core.serializers import serialize
from tjournal.utils import get_absolute_url_func
from allauth.socialaccount.models import SocialAccount
from tjournal.settings import STATIC_URL

class ChatConsumer(AsyncWebsocketConsumer):
    @staticmethod
    @database_sync_to_async
    def get_avatar(user_pk):
        s = SocialAccount.objects.filter(user__pk=user_pk).first()
        if s != None:
            return s.get_avatar_url()

        s = Profile.objects.filter(user__pk=user_pk).first().avatar
        if str(s).startswith(STATIC_URL):
            return str(s)
        return s.url

    @database_sync_to_async
    def get_room(self):
        chat = Chat.objects.filter(pk=int(self.scope["url_route"]["kwargs"]["pk"])).first()
        return str(chat.pk)

    @staticmethod
    @database_sync_to_async
    def get_user(pk):
        return User.objects.filter(pk=pk).first().username

    @staticmethod
    @database_sync_to_async
    def save_message(chat_pk, message, user_pk):
        chat_ = Chat.objects.filter(pk=int(chat_pk)).first()
        author_ = User.objects.filter(pk=int(user_pk)).first()
        c = ChatMessage.objects.create(chat=chat_, message=message, author=author_)
        return c

    @staticmethod
    @database_sync_to_async
    def mark_as_read_db(room_pk, to_pk):
        chat = Chat.objects.filter(pk=room_pk).first()
        for i in list(ChatMessage.objects.filter(chat=chat))[::-1]:
            if i.author == Profile.objects.filter(user__pk=int(to_pk)).first().user:
                i.read = True
                i.save()

    @staticmethod
    @database_sync_to_async
    def delete_message_db(message_pks, user_pk):
        for i in message_pks:
            delta = ChatMessage.objects.filter(pk=int(i)).first()
            if delta.deleted_for.all().count() == 0:
                delta.deleted_for.add(User.objects.filter(pk=int(user_pk)).first())
                delta.save()
            elif delta.deleted_for.all().count() >= 1:
                delta.delete()

    async def connect(self):
        self.room_group_name = await self.get_room()

        # Join room group
        await self.channel_layer.group_add(
            self.room_group_name,
            self.channel_name
        )

        await self.accept()

    async def disconnect(self, close_code):
        # Leave room group
        await self.channel_layer.group_discard(
            self.room_group_name,
            self.channel_name
        )

    # Receive message from WebSocket
    async def receive(self, text_data):
        text_data_json = json.loads(text_data)
        type = text_data_json['type']
        if type == 'chat_message':
            message = text_data_json['message']
            pk = text_data_json['pk']

            c = await ChatConsumer.save_message(self.scope['url_route']['kwargs']['pk'], message, pk)

            # Send message to room group
            await self.channel_layer.group_send(
                self.room_group_name,
                {
                    'type': type,
                    'message': message,
                    'pk': pk,
                    'id': c.pk,
                    'date': str(c.date),
                    'time': str(c.time),
                }
            )

        elif type == 'mark_as_read':
            room_pk = text_data_json['chat_pk']
            to_pk = text_data_json['to_pk']
            await ChatConsumer.mark_as_read_db(room_pk, to_pk)
            await self.channel_layer.group_send(
                self.room_group_name,
                {
                    'type': type,
                    'to_pk': to_pk,
                }
            )

        elif type == 'delete_message':
            message_pks = text_data_json['message_pks']
            pk = text_data_json['pk']
            await ChatConsumer.delete_message_db(message_pks, pk)
            await self.channel_layer.group_send(
                self.room_group_name,
                {
                    'type': type,
                    'message_pks': message_pks,
                    'pk': pk,
                }
            )

    # Receive message from room group
    async def chat_message(self, event):
        message = event['message']
        pk = int(event['pk'])
        id = int(event['id'])
        date = event['date']
        time = event['time']
        username = await ChatConsumer.get_user(pk)
        avatar = await ChatConsumer.get_avatar(pk)

        # Send message to WebSocket
        await self.send(text_data=json.dumps({
            "message": message,
            'avatar': avatar,
            'username': username,
            'pk': pk,
            'id': id,
            'date': date,
            'time': time,
            'chat_message': True,
        }))

    async def mark_as_read(self, event):
        to_pk = event['to_pk']
        # Send message to WebSocket
        await self.send(text_data=json.dumps({
            'mark_as_read': True,
            'to_pk': to_pk,
        }))

    async def delete_message(self, event):
        message_pks = event['message_pks']
        pk = event['pk']
        # Send message to WebSocket
        await self.send(text_data=json.dumps({
            'delete_message': True,
            'message_pks': message_pks,
            'pk': pk,
        }))


class AliveConsumer(AsyncWebsocketConsumer):
    @staticmethod
    @database_sync_to_async
    def get_vote_count(pk, ourPk):
        p = Post.objects.filter(pk=pk).first()
        up = p.activity.filter(activity_type=Activity.UP_VOTE).count()
        down = p.activity.filter(activity_type=Activity.DOWN_VOTE).count()
        u_check = p.activity.filter(activity_type=Activity.UP_VOTE, user=User.objects.filter(pk=int(ourPk)).first()).first()
        d_check = p.activity.filter(activity_type=Activity.DOWN_VOTE, user=User.objects.filter(pk=int(ourPk)).first()).first()
        if d_check != None:
            return up - down, 'upvote'
        elif u_check != None:
            return up - down, 'downvote'
        return up - down, ''

    @staticmethod
    @database_sync_to_async
    def get_bookmark_count(pk, ourPk):
        p = Post.objects.filter(pk=pk).first()
        c = p.activity.filter(activity_type=Activity.BOOKMARK).count()
        b_check = p.activity.filter(activity_type=Activity.BOOKMARK, user=User.objects.filter(pk=int(ourPk)).first()).first()
        if b_check != None:
            return c, 'bookmark'
        return c, ''

    async def connect(self):
        self.room_group_name = 'alive'

        # Join room group
        await self.channel_layer.group_add(
            self.room_group_name,
            self.channel_name
        )

        await self.accept()

    @staticmethod
    @database_sync_to_async
    def get_commentvote_count(pk, ourPk):
        co = Comment.objects.filter(pk=pk).first()
        up = co.activity.filter(activity_type=Activity.UP_VOTE).count()
        down = co.activity.filter(activity_type=Activity.DOWN_VOTE).count()
        u_check = co.activity.filter(activity_type=Activity.UP_VOTE, user=User.objects.filter(pk=int(ourPk)).first()).first()
        d_check = co.activity.filter(activity_type=Activity.DOWN_VOTE, user=User.objects.filter(pk=int(ourPk)).first()).first()
        if d_check != None:
            return up - down, 'downvote'
        elif u_check != None:
            return up - down, 'upvote'
        return up - down, ''

    @staticmethod
    @database_sync_to_async
    def get_bookmark_state(pk, ourPk):
        co = Comment.objects.filter(pk=pk).first()
        b_check = co.activity.filter(activity_type=Activity.BOOKMARK, user=User.objects.filter(pk=int(ourPk)).first()).first()
        if b_check != None:
            return 'bookmark'
        return ''

    @staticmethod
    @database_sync_to_async
    def new_comment_data(pk):
        obj = Comment.objects.filter(pk=int(pk)).first()
        profile_ = obj.user.profile
        profile_.avatar = get_absolute_url_func(profile_.pk)
        return json.dumps({
            'comment': serialize('json', [obj]),
            'user': serialize('json', [obj.user]),
            'profile': serialize('json', [profile_]),
            'postPk': obj.post.pk,
            'all_count': Comment.objects.filter(post__pk=obj.post.pk).count(),
        })

    async def connect(self):
        self.room_group_name = 'alive'

        # Join room group
        await self.channel_layer.group_add(
            self.room_group_name,
            self.channel_name
        )

        await self.accept()

    async def disconnect(self, close_code):
        # Leave room group
        await self.channel_layer.group_discard(
            self.room_group_name,
            self.channel_name
        )

    # Receive message from WebSocket
    async def receive(self, text_data):
        text_data_json = json.loads(text_data)
        type = text_data_json['type']
        ourPk = text_data_json['ourPk']
        # Send message to room group
        if type == 'vote' or type == 'bookmark':
            postPk = text_data_json['postPk']
            await self.channel_layer.group_send(
                self.room_group_name,
                {
                    'type': type,
                    'postPk': postPk,
                    'ourPk': ourPk,
                }
            )
        elif type == 'commentvote' or type == 'commentbookmark':
            commentPk = text_data_json['commentPk']
            await self.channel_layer.group_send(
                self.room_group_name,
                {
                    'type': type,
                    'commentPk': commentPk,
                    'ourPk': ourPk,
                }
            )
        elif type == 'newcomment':
            commentPk = text_data_json['commentPk']
            csrf = text_data_json['csrf']
            await self.channel_layer.group_send(
                self.room_group_name,
                {
                    'type': type,
                    'commentPk': commentPk,
                    'ourPk': ourPk,
                    'csrf': csrf,
                }
            )

    # Receive message from room group
    async def vote(self, event):
        type = event['type']
        postPk = int(event['postPk'])
        ourPk = event['ourPk']
        voteCount, voteType = await AliveConsumer.get_vote_count(postPk, ourPk)

        # Send message to WebSocket
        await self.send(text_data=json.dumps({
            'type': type,
            'postPk': postPk,
            'ourPk': ourPk,
            'voteCount': voteCount,
            'voteType': voteType,
        }))

    async def bookmark(self, event):
        type = event['type']
        postPk = int(event['postPk'])
        ourPk = event['ourPk']
        bookmarkCount, bookmarkType = await AliveConsumer.get_bookmark_count(postPk, ourPk)

        # Send message to WebSocket
        await self.send(text_data=json.dumps({
            'type': type,
            'postPk': postPk,
            'ourPk': ourPk,
            'bookmarkCount': bookmarkCount,
            'bookmarkType': bookmarkType,
        }))

    async def commentvote(self, event):
        type = event['type']
        commentPk = int(event['commentPk'])
        ourPk = event['ourPk']
        voteCount, voteType = await AliveConsumer.get_commentvote_count(commentPk, ourPk)

        # Send message to WebSocket
        await self.send(text_data=json.dumps({
            'type': type,
            'commentPk': commentPk,
            'ourPk': ourPk,
            'voteCount': voteCount,
            'voteType': voteType,
        }))

    async def commentbookmark(self, event):
        type = event['type']
        commentPk = int(event['commentPk'])
        ourPk = event['ourPk']
        bookmarkType = await AliveConsumer.get_bookmark_state(commentPk, ourPk)

        # Send message to WebSocket
        await self.send(text_data=json.dumps({
            'type': type,
            'commentPk': commentPk,
            'ourPk': ourPk,
            'bookmarkType': bookmarkType,
        }))

    async def newcomment(self, event):
        type = event['type']
        commentPk = int(event['commentPk'])
        ourPk = event['ourPk']
        csrf = event['csrf']

        new_comment = await AliveConsumer.new_comment_data(commentPk)
        # Send message to WebSocket
        await self.send(text_data=json.dumps({
            'type': type,
            'commentPk': commentPk,
            'ourPk': ourPk,
            'comment': new_comment,
            'csrf': csrf,
        }))