from django.contrib import admin
from .models import Messages, Chat, Tokenizer

admin.site.register(Messages)
admin.site.register(Chat)
admin.site.register(Tokenizer)

# Register your models here.
