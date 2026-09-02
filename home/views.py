from django.shortcuts import render, redirect
from .forms import SignUpForm
from django.contrib.auth import login

def show_home(request):
    return render(request, "home/home.html")

def signup(request):
    if request.method == "POST":
        form = SignUpForm(request.POST)

        if form.is_valid():
            user = form.save()

            login(request, user)

            return redirect("show_home")
    else:
        form = SignUpForm()

    return render(request, "home/signup.html", {"form": form})


# Create your views here.
