from django.shortcuts import render, redirect, get_object_or_404
from django.http import StreamingHttpResponse, HttpResponseServerError
from django.contrib.auth.decorators import login_required
import asyncio
from django.utils.decorators import method_decorator
from django.views import View
from .models import Messages, Chat
from .forms import MessagesForms, ProfileForms
from .utils import WebSearch, HistoryCompressor, get_optimal_compute_config, stream_chat_completion

web_search = WebSearch()

@login_required(login_url='login')
def now_chat(request):
    profile = request.user.profile

    return render(request, "chatbot/chat.html", {
        "messages": [],
        "chat": None,
        "chats": Chat.objects.filter(user=profile),
        "first_message": None,
    })



@login_required(login_url='login')
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



@login_required(login_url='login')
def delete_chat(request, pk):
    profile = request.user.profile

    chat = get_object_or_404(
        Chat,
        pk=pk,
        user=profile
    )

    chat.delete()

    return redirect("now_chat")



@login_required(login_url='login')
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



@login_required(login_url='login')
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

@method_decorator(login_required(login_url='login'), name="dispatch")
class ChatView(View):
    def post(self, request, pk=None):
        form = MessagesForms(request.POST)

        if not form.is_valid():
            return HttpResponseServerError(
                "There is a problem with the message. Try again in a few minutes or contact support."
            )

        text = form.cleaned_data["text"].strip()

        use_web_search = request.POST.get("use_web_search") == "1"
        use_code_model = request.POST.get("use_code_model") == "1"
        profile = request.user.profile

        if pk is None:
            chat = Chat.objects.create(user=profile, name=text[:20])
        else:
            chat = get_object_or_404(Chat, id=pk, user=profile)

        Messages.objects.create(chat=chat, role="user", text=text)

        response = StreamingHttpResponse(
            self._generate_response(chat, text, use_web_search, use_code_model),
            content_type="text/plain; charset=utf-8",
        )

        response["X-Chat-Id"] = str(chat.id)
        response["Access-Control-Expose-Headers"] = "X-Chat-Id"
        return response

    def _generate_response(self, chat, text, use_web_search, use_code_model):
        full_text = ""

        if use_code_model:
            model_name = "qwen2.5-coder:7b"
        else:
            model_name = "qwen3:8b"

        messages_for_model = HistoryCompressor.compress(chat.id)

        if use_web_search:
            search_messages = [
                {
                    "role": "user",
                    "content": (
                        "متن من را برای جستجو داخل یک موتور جستجو آماده کن. "
                        f"فقط عبارت مناسب جستجو را برگردان.\nمتن: {text}"
                    ),
                }
            ]
            full_text = ""
            for chunk in stream_chat_completion(
                "qwen3:8b",
                search_messages,
                [],
                get_optimal_compute_config(),
            ):
                full_text += chunk

            results = asyncio.run(web_search.handle_user_query(full_text))
            if results:
                search_context = (
                    "نتایج جستجوی وب (فقط برای استفاده در پاسخ؛ مستقیم کپی نکن و منبع رو ذکر کن):\n\n"
                )
                for r in results:
                    search_context += (
                        f"- {r['title']}\n  {r['body']}\n  منبع: {r['href']}\n\n"
                    )

                messages_for_model.insert(
                    len(messages_for_model) - 1,
                    {"role": "system", "content": search_context},
                )

        for chunk in stream_chat_completion(
            model_name,
            messages_for_model,
            [],
            get_optimal_compute_config(),
        ):
            full_text += chunk
            yield chunk
        Messages.objects.create(chat=chat, role="assistant", text=full_text)



@login_required(login_url='login')
def show_setting(request):
    return render(request, "chatbot/setting.html")

@login_required(login_url='login')
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