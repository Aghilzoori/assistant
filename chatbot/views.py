from django.shortcuts import render, redirect
from .models import Messages
from .forms import MessagesForms
from .utils import ai, get_model_options
from django.conf import settings
from django.http import HttpResponseServerError

def chat(request):
    form = MessagesForms(request.POST)
    
    if request.method == "POST" and form.is_valid():

        text = form.cleaned_data["text"].strip()

        Messages.objects.create(
            role="user",
            text=text
        )

        
        try:
            result = ai(
                model=settings.OLLAMA_MODEL,
                message={
                    "role": "user",
                    "content": text
                },
                options=get_model_options(),
            )
        except Exception:
            return HttpResponseServerError("""
The server encountered an error.
Please try again.
If the error persists, contact support.
                                        """)

        Messages.objects.create(
            role="you",
            text=result
        )

        return redirect("chat")

    context = {
        "messages": Messages.objects.all(),
    }

    return render(request, "chatbot/chat.html", context)




# Create your views here.
