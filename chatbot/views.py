from django.shortcuts import render
from django.http import HttpResponse

def chat(request):

    return render(request, "chatbot/chat.html")



# Create your views here.
