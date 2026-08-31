from django.shortcuts import render, redirect, get_object_or_404
from .models import Messages, Chat
from .forms import MessagesForms
from .utils import ai, is_battery_on_charge, get_messages
from django.http import StreamingHttpResponse, JsonResponse

def now_chat(request):
    return render(request, "chatbot/chat.html", {
        "messages": [],
        "chat": None,
        "chats": Chat.objects.all(),
        "first_message": None,
    })

def chat_page(request, pk=None):
    chats = Chat.objects.all()
    chat = get_object_or_404(Chat, id=pk)
    messages = Messages.objects.filter(chat=chat)
    first_message = messages.first()
    return render(request, "chatbot/chat.html", {"messages": messages, "chat": chat, "chats": chats, "first_message": first_message,})

def delete_chat(request, pk):
    chat = Chat.objects.get(id=pk)
    chat.delete()
    return redirect("now_chat")

def pin_chat(request, pk):
    chat = get_object_or_404(Chat, pk=pk)
    
    chat.pin = True

    chat.save()

    next_url = request.GET.get("next")

    if next_url:
        return redirect(next_url)

    return redirect("now_chat")

def unpin_chat(request, pk):
    chat = get_object_or_404(Chat, pk=pk)
    
    chat.pin = False

    chat.save()

    next_url = request.GET.get("next")

    if next_url:
        return redirect(next_url)

    return redirect("now_chat")

def chat(request, pk=None):
    if request.method != "POST":
        return JsonResponse(
            {"error": "Only POST allowed"},
            status=405
        )

    form = MessagesForms(request.POST)

    if not form.is_valid():
        return JsonResponse(
            {"error": "Invalid form"},
            status=400
        )

    text = form.cleaned_data["text"].strip()

    if pk is None:
        chat = Chat.objects.create(
            name=text[:20]
        )
    else:
        chat = get_object_or_404(
            Chat,
            id=pk
        )

    Messages.objects.create(
        chat=chat,
        role="user",
        text=text
    )

    def generate():
        full_text = ""

        for chunk in ai(
            "qwen3:8b",
            get_messages(chat.id),
            [],
            is_battery_on_charge(),
        ):
            full_text += chunk
            yield chunk

        Messages.objects.create(
            chat=chat,
            role="assistant",
            text=full_text
        )

    response = StreamingHttpResponse(
        generate(),
        content_type="text/plain; charset=utf-8"
    )
    response["X-Chat-Id"] = str(chat.id)
    response["Access-Control-Expose-Headers"] = "X-Chat-Id"
    return response
# Create your views here.