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


SEARCH_MODEL = "qwen3:8b"
CODE_MODEL = "qwen2.5-coder:7b"
DEFAULT_MODEL = "qwen3:8b"

SEARCH_PROMPT = (
    "متن من را برای جستجو داخل یک موتور جستجو آماده کن. "
    "فقط عبارت مناسب جستجو را برگردان.\nمتن: {text}"
)

SEARCH_CONTEXT_HEADER = (
    "نتایج جستجوی وب (فقط برای استفاده در پاسخ؛ مستقیم کپی نکن و منبع رو ذکر کن):\n\n"
)

@login_required(login_url='login')
def chat_page(request, pk=None):
    profile = request.user.profile
    if pk is None:
        return render(request, "chatbot/chat.html", {
            "messages": [],
            "chat": None,
            "chats": Chat.objects.filter(user=profile),
            "first_message": None,
            })
    
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
def pin(request, pk):
    profile = request.user.profile

    chat = get_object_or_404(
        Chat,
        pk=pk,
        user=profile
    )

    if chat.pin:
        chat.pin = False
    else:
        chat.pin = True

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
        if not text:
            return HttpResponseServerError("پیام نمی‌تواند خالی باشد.")

        use_web_search = request.POST.get("use_web_search") == "1"
        use_code_model = request.POST.get("use_code_model") == "1"
        profile = request.user.profile

        chat = self._get_or_create_chat(profile, pk, text)
        Messages.objects.create(chat=chat, role="user", text=text)

        response = StreamingHttpResponse(
            self._generate_response(chat, text, use_web_search, use_code_model),
            content_type="text/plain; charset=utf-8",
        )
        response["X-Chat-Id"] = str(chat.id)
        response["Access-Control-Expose-Headers"] = "X-Chat-Id"
        return response
    
    @staticmethod
    def _get_or_create_chat(profile, pk, text):
        if pk is None:
            return Chat.objects.create(user=profile, name=text[:20])
        return get_object_or_404(Chat, id=pk, user=profile)

    @staticmethod
    def render_model(use_code_model):
        return CODE_MODEL if use_code_model else DEFAULT_MODEL

    @staticmethod
    def extract_search_text(text):
        """از مدل می‌خواهد متن کاربر را به کوئری جستجو تبدیل کند."""
        search_messages = [
            {"role": "user", "content": SEARCH_PROMPT.format(text=text)}
        ]

        full_text = ""
        for chunk in stream_chat_completion(
            SEARCH_MODEL,
            search_messages,
            [],
            get_optimal_compute_config(),
        ):
            full_text += chunk
        return full_text

    @staticmethod
    def search(query):
        """اجرای جستجوی وب با کوئری آماده‌شده."""
        return asyncio.run(web_search.handle_user_query(query))

    @staticmethod
    def build_search_context(results):
        """ساخت یک پیام system شامل نتایج جستجو."""
        if not results:
            return None

        search_context = SEARCH_CONTEXT_HEADER
        for r in results:
            search_context += (
                f"- {r['title']}\n  {r['body']}\n  منبع: {r['href']}\n\n"
            )
        return {"role": "system", "content": search_context}

    def _generate_response(self, chat, text, use_web_search, use_code_model):
        full_text = ""  
        model_name = self.render_model(use_code_model)

        messages_for_model = HistoryCompressor.compress(chat.id)

        if use_web_search:
            search_query = self.extract_search_text(text)

            results = self.search(search_query)

            search_message = self.build_search_context(results)
            if search_message:
                messages_for_model.insert(
                    len(messages_for_model) - 1,
                    search_message,
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



@login_required(login_url='')
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