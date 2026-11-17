from django.db.models.signals import post_delete, post_save
from django.dispatch import receiver
from .models import Profile
from chatbot.models import Tokenizer


@receiver(post_delete, sender=Profile)
def delete_user_when_profile_deleted(sender, instance, **kwargs):
    if instance.user_id:
        instance.user.delete()

@receiver(post_save, sender=Profile)
def creat_user_tokenizer(sender, instance, created,**kwargs):
    if created:
        Tokenizer.objects.create(user=instance)