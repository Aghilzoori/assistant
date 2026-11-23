from rest_framework import serializers
from home.models import Profile
from chatbot.models import Chat, Messages, Tokenizer

class MessagesSerializers(serializers.ModelSerializer):
    class Meta:
        model = Messages
        fields = "__all__"

class ChatSerializers(serializers.ModelSerializer):
    messages = MessagesSerializers(many=True)
    class Meta:
        model = Chat
        fields = "__all__"


class TokenizerSerializers(serializers.ModelSerializer):
    class Meta:
        model = Tokenizer
        fields = "__all__"

class ProfileSerializers(serializers.ModelSerializer):
    chat_set = ChatSerializers(many=True, read_only=True)
    tokenizer_set = TokenizerSerializers(many=True, read_only=True)
    class Meta:
        model = Profile
        fields = "__all__"