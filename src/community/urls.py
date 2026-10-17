from . import views
from django.urls import path

urlpatterns = [
    path('<str:community_name>/', views.community),
]
