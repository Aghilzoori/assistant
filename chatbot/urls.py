from django.urls import path
from . import views

urlpatterns = [
    path("", views.now_chat, name="now_chat"),
    path("chat/<uuid:pk>/", views.chat_page, name="chat_page"),
    path("chat/<uuid:pk>/send/", views.chat, name="chat"),
    path("chat/send/", views.chat, name="send_message"),
    path("delete-chat/<uuid:pk>/", views.delete_chat, name="delete-chat"),
    path('chat/-<uuid:pk>-/pin', views.pin_chat, name='pin_chat'),
    path('chat/-<uuid:pk>-/unpin', views.unpin_chat, name='unpin_chat'),
    path("setting/", views.show_setting, name="setting"),
    path('edit-username', views.edit_username, name="edit-username"),
]