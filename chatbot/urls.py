from django.urls import path
from . import views

urlpatterns = [
    path("", views.chat_page, name="now_chat"),
    path("chat/<uuid:pk>/", views.chat_page, name="chat_page"),
    path("chat/<uuid:pk>/send/", views.ChatView.as_view(), name="chat"),
    path("chat/send/", views.ChatView.as_view(), name="send_message"),
    path("delete-chat/<uuid:pk>/", views.delete_chat, name="delete-chat"),
    path('chat/-<uuid:pk>-/pin', views.pin, name='pin'),
    path("setting/", views.show_setting, name="setting"),
    path('edit-username', views.edit_username, name="edit-username"),
]