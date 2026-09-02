from django import forms
from home.models import Profile

class ProfileForms(forms.ModelForm):
    class Meta:
        model = Profile
        fields = [            
            "first_name",
            "last_name",
            "phone",
]
        
class MessagesForms(forms.Form):
    text = forms.CharField(widget=forms.Textarea)
