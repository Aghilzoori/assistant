from django.http import JsonResponse
from rest_framework.decorators import api_view
from rest_framework.response import Response

@api_view(['GET'])
def api_test(request):
    data = [
        {'GTE': "http://127.0.0.1:8000/"},
        {'POST', "http://127.0.0.1:8000/ai/"}
    ]
    return Response(data)



# Create your views here.
