import json
import logging
import ollama

from django.conf import settings
from django.http import StreamingHttpResponse, JsonResponse, HttpResponseServerError
from django.shortcuts import render
from django.views.decorators.http import require_http_methods

from .forms import MessagesForms
from .models import Messages
from .utils import ai_stream, get_model_options

logger = logging.getLogger(__name__)


@require_http_methods(["GET"])
def chat(request):
    context = {
        'form' : MessagesForms(),
        'messages' : Messages.objects.all()
    }

    return render(request, "chatbot/chat.html", context)


@require_http_methods(["POST"])
def chat_stream(request):
    data = json.loads(request.body.decode("utf-8"))

    text = data.get("text", "کاربر یک پیام خالی فرستاد").strip()

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
            return HttpResponseServerError("""
        The AI service is currently unavailable or returned an invalid response.
        Please try again later.
        If the problem persists, contact support.
            """)
        
        except Exception as e:
            logger.error(f"Unexpected server error: {e}")
            return HttpResponseServerError("""
        The server encountered an error.
        Please try again.
        If the error persists, contact support.
            """)

    response = StreamingHttpResponse(generate(), content_type="text/plain; charset=utf-8")

    response["Cache-Control"] = "no-cache"

    response["X-Accel-Buffering"] = "no"

    return response