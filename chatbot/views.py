from django.shortcuts import render, redirect, get_object_or_404
from django.http import StreamingHttpResponse, JsonResponse
from django.contrib.auth.decorators import login_required
from home.models import Profile
from .models import Messages, Chat
from .forms import MessagesForms, ProfileForms
from .utils import ai, is_battery_on_charge, get_messages


@login_required
def now_chat(request):
    profile = request.user.profile

    return render(request, "chatbot/chat.html", {
        "messages": [],
        "chat": None,
        "chats": Chat.objects.filter(user=profile),
        "first_message": None,
    })



@login_required
def chat_page(request, pk=None):
    profile = request.user.profile

    chats = Chat.objects.filter(
        user=profile
    )

    chat = get_object_or_404(
        Chat,
        id=pk,
        user=profile
    )

    messages = Messages.objects.filter(
        chat=chat
    )

    return render(request, "chatbot/chat.html", {
        "messages": messages,
        "chat": chat,
        "chats": chats,
        "first_message": messages.first(),
        "account": profile,
    })



@login_required
def delete_chat(request, pk):
    profile = request.user.profile

    chat = get_object_or_404(
        Chat,
        pk=pk,
        user=profile
    )

    chat.delete()

    return redirect("now_chat")



@login_required
def pin_chat(request, pk):
    profile = request.user.profile

    chat = get_object_or_404(
        Chat,
        pk=pk,
        user=profile
    )

    chat.pin = True
    chat.save(update_fields=["pin"])

    return redirect("now_chat")



@login_required
def unpin_chat(request, pk):
    profile = request.user.profile

    chat = get_object_or_404(
        Chat,
        pk=pk,
        user=profile
    )

    chat.pin = False
    chat.save(update_fields=["pin"])

    return redirect("now_chat")



@login_required
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
    profile = request.user.profile

    if pk is None:
        chat = Chat.objects.create(
            user=profile,
            name=text[:20]
        )
    else:
        chat = get_object_or_404(
            Chat,
            id=pk,
            user=profile
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


@login_required
def show_setting(request):
    return render(request, "chatbot/setting.html")

def edit_username(request):
    profile = request.user.profile

    form = ProfileForms(instance=profile)

    if request.method == 'POST':
        form = ProfileForms(request.POST, request.FILES, instance=profile)
        if form.is_valid():
            form.save()
            return redirect('setting')

    context = {'form': form}
    return render(request, 'chatbot/setting.html', context)