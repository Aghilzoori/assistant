from django.db import models
import uuid

class Messages(models.Model):
    text = models.TextField()
    role = models.CharField(max_length=100)
    created = models.DateTimeField(auto_now_add=True)
    id = models.UUIDField(default=uuid.uuid4, unique=True,
                          primary_key=True, editable=False)
    def __str__(self):
        return self.role

# Create your models here.
