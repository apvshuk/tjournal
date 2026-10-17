from django.urls import path
from . import views

urlpatterns = [
    path('<int:pk>/get/', views.get_chats),
]
