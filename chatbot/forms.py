from django.forms import ModelForm
from .models import Messages

class MessagesForms(ModelForm):
    class Meta:
        model = Messages
        fields = ["text"]