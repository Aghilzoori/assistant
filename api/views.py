from django.http import JsonResponse
from rest_framework.decorators import api_view
from rest_framework.response import Response
from home.models import Profile
from .serializers import ProfileSerializers

@api_view(['GET'])
def api_test(request):
    data = [
        {'GTE': "api/user"},
    ]
    return Response(data)

@api_view(["GET"])
def user(request):
    user = request.user.profile
    user_info = Profile.objects.get(id=user.id)
    data = ProfileSerializers(user_info)
    return Response(data.data)  

# Create your views here.
