from django.db.models.signals import post_delete
from django.dispatch import receiver
from .models import Profile


@receiver(post_delete, sender=Profile)
def delete_user_when_profile_deleted(sender, instance, **kwargs):
    if instance.user_id:
        instance.user.delete()
