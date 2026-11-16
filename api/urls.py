from django.urls import path
from . import views

urlpatterns = [
    path('', views.api_test, name='api'),
    path('get-users/', views.get_users, name="get-users")
]