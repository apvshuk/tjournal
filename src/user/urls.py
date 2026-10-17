from django.urls import path
from . import views

urlpatterns = [
    # keep these below others
    # profile

    # articles
    path('<int:pk>/', views.articles_page),
    path('<int:pk>/popular/', views.articles_popular_all),
    path('<int:pk>/popular/day/', views.articles_popular_day),
    path('<int:pk>/popular/week/', views.articles_popular_week),
    path('<int:pk>/popular/month/', views.articles_popular_month),
    path('<int:pk>/popular/year/', views.articles_popular_year),
    # comments
    path('<int:pk>/comments/', views.comments_page),
    path('<int:pk>/comments/popular/', views.comments_popular_all),
    path('<int:pk>/comments/popular/day/', views.comments_popular_day),
    path('<int:pk>/comments/popular/week/', views.comments_popular_week),
    path('<int:pk>/comments/popular/month/', views.comments_popular_month),
    path('<int:pk>/comments/popular/year/', views.comments_popular_year),
    # posts page
    path('<int:pk>/<int:post_pk>/', views.post_page),
]
