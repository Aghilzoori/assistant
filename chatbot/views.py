from django.shortcuts import render, redirect
from .models import Messages
from .forms import MessagesForms
from .utils import ai, is_battery_on_charge
from django.http import StreamingHttpResponse, JsonResponse

def chat_page(request):
    messages = Messages.objects.all()
    return render(request, "chatbot/chat.html", {"messages": messages})

def chat(request):
    if request.method != "POST":
        return JsonResponse({"error": "Only POST allowed"}, status=405)

    form = MessagesForms(request.POST)
    if not form.is_valid():
        return JsonResponse({"error": "Invalid form"}, status=400)

    text = form.cleaned_data["text"].strip()

    Messages.objects.create(role="user", text=text)

    def generate():
        full_text = ""
        for chunk in ai(
            "qwen3:8b",
            {"role": "user", "content": text},
            [],
            is_battery_on_charge(),
        ):
            full_text += chunk
            yield chunk

        Messages.objects.create(role="ai", text=full_text)


    return StreamingHttpResponse(generate(), content_type="text/plain; charset=utf-8")
# Create your views here.