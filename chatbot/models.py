import uuid
from django.db import models
from home.models import Profile
from ckeditor.fields import RichTextField
from django.core.validators import MinValueValidator

class Chat(models.Model):
    user = models.ForeignKey(Profile, on_delete=models.CASCADE)
    name = models.CharField(max_length=100)
    pin = models.BooleanField(default=False)
    created = models.DateTimeField(auto_now_add=True)
    id = models.UUIDField(default=uuid.uuid4, unique=True, primary_key=True, editable=False)

    class Meta:
        ordering = ["-pin", "-created"]

    def __str__(self):
        return self.name


class Messages(models.Model):
    chat = models.ForeignKey(Chat, on_delete=models.CASCADE, related_name="messages")
    text = RichTextField()
    role = models.CharField(max_length=100)
    created = models.DateTimeField(auto_now_add=True)
    id = models.UUIDField(default=uuid.uuid4, unique=True, primary_key=True, editable=False)

    class Meta:
        ordering = ["created"]

    def __str__(self):
        return self.role


class Tokenizer(models.Model):
    user = models.ForeignKey(Profile, on_delete=models.CASCADE)
    tokenizer = models.IntegerField(default=32768, validators=[MinValueValidator(0)])
    created = models.DateTimeField(auto_now_add=True)
    id = models.UUIDField(default=uuid.uuid4, unique=True, primary_key=True, editable=False)

    def __str__(self):
        return self.user.first_name



# Create your models here.
