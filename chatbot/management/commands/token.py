from django.core.management.base import BaseCommand
from chatbot.models import Tokenizer
from django.db.models import F

class Command(BaseCommand):
    help = "Add tokens to all users"

    def handle(self, *args, **options):
        updated = Tokenizer.objects.update(tokenizer=F('tokenizer') + 321)
        self.stdout.write(
            self.style.SUCCESS(f"321 tokens were added to {updated} users.")
        )