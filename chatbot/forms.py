from django import forms

class MessagesForms(forms.Form):
    text = forms.CharField(widget=forms.Textarea)
