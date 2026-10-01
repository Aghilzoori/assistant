from django.db.models import F
from home.models import Profile
from django.utils import timezone
from chatbot.models import Tokenizer
from django.core.management.base import BaseCommand

class Command(BaseCommand):
    help = "Add tokens to users"

    def handle(self, *args, **options):

        free_updated = Tokenizer.objects.filter(
            user__plan=Profile.Plan.FREE
        ).update(
            tokenizer=F("tokenizer") + 321
        )

        pro_updated = Tokenizer.objects.filter(
            user__plan=Profile.Plan.PRO,
            user__pro_expires_at__gt=timezone.now()
        ).update(
            tokenizer=F("tokenizer") + 876
        )

        self.stdout.write(
            self.style.SUCCESS(
                f"321 tokens were added to {free_updated} Free users."
            )
        )

        self.stdout.write(
            self.style.SUCCESS(
                f"876 tokens were added to {pro_updated} Pro users."
            )
        )