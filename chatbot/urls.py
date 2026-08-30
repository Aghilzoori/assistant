from django.urls import path
from . import views

urlpatterns = [
    path("", views.now_chat, name="now_chat"),
    path("chat/<uuid:pk>/", views.chat_page, name="chat_page"),
    path("chat/<uuid:pk>/send/", views.chat, name="chat"),
    path("chat/send/", views.chat, name="send_message"),
]