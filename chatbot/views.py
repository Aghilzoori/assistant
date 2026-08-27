import json
import logging
import ollama

from django.conf import settings
from django.http import StreamingHttpResponse, JsonResponse
from django.shortcuts import render
from django.views.decorators.http import require_http_methods

from .forms import MessagesForms
from .models import Messages
from .utils import ai_stream, get_model_options

logger = logging.getLogger(__name__)


@require_http_methods(["GET"])
def chat(request):
    form = MessagesForms()
    messages = Messages.objects.all()
    return render(request, "chatbot/chat.html", {"form": form, "messages": messages})


@require_http_methods(["POST"])
def chat_stream(request):
    try:
        data = json.loads(request.body.decode("utf-8"))
        text = data.get("text", "").strip()
    except Exception:
        return JsonResponse({"error": "Invalid JSON"}, status=400)

    if not text:
        return JsonResponse({"error": "Empty text"}, status=400)

    Messages.objects.create(role="user", text=text)

    def generate():
        full_text = ""
        try:
            for chunk in ai_stream(
                model=settings.OLLAMA_MODEL,
                message={"role": "user", "content": text},
                options=get_model_options(),
            ):
                full_text += chunk
                yield chunk

            Messages.objects.create(role="assistant", text=full_text)

        except ollama.ResponseError as e:
            logger.error(f"Ollama error: {e}")
            yield "\n[خطا در سرویس هوش مصنوعی]"
        except Exception as e:
            logger.error(f"Unexpected server error: {e}")
            yield "\n[خطای سرور]"

    response = StreamingHttpResponse(generate(), content_type="text/plain; charset=utf-8")
    response["Cache-Control"] = "no-cache"
    response["X-Accel-Buffering"] = "no"
    return response