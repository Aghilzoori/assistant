import markdown
import bleach

from django.shortcuts import render, redirect

from .models import Messages
from .forms import MessagesForms
from .utils import ai, is_battery_on_charge


ALLOWED_TAGS = [
    "p", "br",
    "strong", "b", "em", "i",
    "h1", "h2", "h3", "h4",
    "ul", "ol", "li",
    "blockquote",
    "pre", "code",
    "a",
]


ALLOWED_ATTRIBUTES = {
    "a": ["href", "title", "target", "rel"],
}


def convert_markdown(text):
    html = markdown.markdown(
        text or "",
        extensions=[
            "extra",
            "fenced_code",
            "tables",
            "nl2br",
        ],
    )

    return bleach.clean(
        html,
        tags=ALLOWED_TAGS,
        attributes=ALLOWED_ATTRIBUTES,
        protocols=["http", "https", "mailto"],
    )


def chat(request):
    form = MessagesForms(request.POST or None)

    if request.method == "POST" and form.is_valid():
        text = form.cleaned_data.get("text", "").strip()

        if not text:
            text = "پیام خالی کاربر فرستاده است"

        Messages.objects.create(
            role="user",
            text=text,
        )

        result = ai(
            "qwen3:8b",
            {
                "role": "user",
                "content": text,
            },
            [],
            is_battery_on_charge(),
        )

        Messages.objects.create(
            role="you",
            text=result,
        )

        return redirect("chat")

    messages = Messages.objects.all()

    for message in messages:
        message.rendered_text = convert_markdown(message.text)

    context = {
        "messages": messages,
        "form": form,
    }

    return render(request, "chatbot/chat.html", context)
