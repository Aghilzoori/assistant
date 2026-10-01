from . import views
from django.urls import path


urlpatterns = [
    path("", views.chat_page, name="now_chat"),
    path("chat/<uuid:pk>/", views.chat_page, name="chat_page"),
    path("chat/<uuid:pk>/send/", views.ChatView.as_view(), name="chat"),
    path("chat/send/", views.ChatView.as_view(), name="send_message"),
    path("delete-chat/<uuid:pk>/", views.delete_chat, name="delete-chat"),
    path('chat/-<uuid:pk>-/pin', views.pin, name='pin'),
    path("setting/", views.show_setting, name="setting"),
    path('edit-username', views.edit_username, name="edit-username"),
    path('rander-page-plan', views.rander_page_plan, name="rander-page-plan"),
    path('get-plan-pro', views.make_user_pro, name="get-plan-pro")
]