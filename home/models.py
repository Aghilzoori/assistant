from django.db import models
from django.contrib.auth.models import User
import uuid
from django.utils import timezone

class Profile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name="profile")
    first_name = models.CharField(max_length=100, blank=True)
    last_name = models.CharField(max_length=100, blank=True)
    phone = models.CharField(max_length=20, blank=True)
    created = models.DateTimeField(auto_now_add=True)
    id = models.UUIDField(default=uuid.uuid4, unique=True, primary_key=True, editable=False)

    class Plan(models.TextChoices):
        FREE = "free", "Free"
        PRO = "pro", "Pro"

    plan = models.CharField(
        max_length=10,
        choices=Plan,
        default=Plan.FREE
    )

    pro_expires_at = models.DateTimeField(
        null=True,
        blank=True
    )

    @property
    def is_pro(self):
        return (
            self.plan == self.Plan.PRO
            and self.pro_expires_at
            and self.pro_expires_at > timezone.now()
        )

    def __str__(self):
        return self.user.username


# Create your models here.
