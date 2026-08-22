from django.shortcuts import render, redirect
from .models import Messages
from .forms import MessagesForms
from .utils import ai, is_battery_on_charge
from .markdown_extras import convert_markdown

def chat(request):
    context = {
        'messages': Messages.objects.all()
    }

    form = MessagesForms(request.POST)
    
    if request.method == "POST" and form.is_valid():
        text = request.POST.get("text", "پیام خالی کاربر فرستاده است").strip()

        message = Messages.objects.create(
                role="user",
                text=text
            )
        message.save()

        result = ai(
            "qwen3:8b",
            {
                "role": "user",
                "content": convert_markdown(text)
            },
            [],
            is_battery_on_charge(),
        )

        message = Messages.objects.create(
                role="you",
                text=convert_markdown(result)
            )
        message.save()

        return redirect('chat')
                    
    return render(request, "chatbot/chat.html", context)



# Create your views here.
