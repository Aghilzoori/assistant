from django.shortcuts import render, redirect
from .models import Messages
from .forms import MessagesForms
from .utils import ai, is_battery_on_charge

def chat(request):
    if request.method == "POST":
        form = MessagesForms(request.POST)

        if form.is_valid():
            text = form.cleaned_data["text"].strip()

            Messages.objects.create(
                role="user",
                text=text
            )

            result = ai(
                "qwen3:8b",
                {
                    "role": "user",
                    "content": text
                },
                [],
                is_battery_on_charge(),
            )

            Messages.objects.create(
                role="you",
                text=result
            )

            return redirect("chat")

    else:
        form = MessagesForms()

    context = {
        "messages": Messages.objects.all(),
        "form": form,
    }

    return render(request, "chatbot/chat.html", context)




# Create your views here.
