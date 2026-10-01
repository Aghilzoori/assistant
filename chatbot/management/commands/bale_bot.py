import time
from .bale_api import get_user_messages
from django.core.management.base import BaseCommand

class Command(BaseCommand):
    help = "Run Bale bot"

    def handle(self, *args, **options):
        self.stdout.write(
            self.style.SUCCESS("Bale bot is running...")
        )

        while True:
            try:
                get_user_messages()
            except Exception as error:
                self.stderr.write(
                    self.style.ERROR(f"Error: {error}")
                )

            time.sleep(2)
