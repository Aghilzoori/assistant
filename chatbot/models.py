from django.db import models
import uuid
from ckeditor.fields import RichTextField

class Chat(models.Model):
    name = models.CharField(max_length=100)
    pin = models.BooleanField(default=False)
    created = models.DateTimeField(auto_now_add=True)

    id = models.UUIDField(
        default=uuid.uuid4,
        unique=True,
        primary_key=True,
        editable=False
    )

    class Meta:
        ordering = ["-pin", "-created"]

    def __str__(self):
        return self.name


class Messages(models.Model):
    chat = models.ForeignKey(
        Chat,
        on_delete=models.CASCADE,
        related_name="messages"
    )
    text = RichTextField()
    role = models.CharField(max_length=100)
    created = models.DateTimeField(auto_now_add=True)

    id = models.UUIDField(
        default=uuid.uuid4,
        unique=True,
        primary_key=True,
        editable=False
    )

    class Meta:
        ordering = ["created"]

    def __str__(self):
        return self.role


# Create your models here.
