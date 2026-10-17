from django import forms
from allauth.account.forms import SignupForm
from user.models import Post, Comment
from django_editorjs_fields import EditorJsWidget


class CustomSignupForm(SignupForm):
    first_name = forms.CharField(max_length=30, label='First name')
    last_name = forms.CharField(max_length=30, label='Last name')

    def __init__(self, *args, **kwargs):
        super(CustomSignupForm, self).__init__(*args, **kwargs)

        self.fields['first_name'].widget.attrs={
            'placeholder': 'First name',
        }
        self.fields['last_name'].widget.attrs={
            'placeholder': 'Last name',
        }

    def signup(self, request, user):
        user.first_name = self.cleaned_data['first_name']
        user.last_name = self.cleaned_data['last_name']
        user.save()


class EditorForm(forms.ModelForm):
    class Meta:
        model = Post
        exclude = ['user', 'published', 'community', 'upvote', 'downvote', 'anchored']
        widgets = {
            'content': EditorJsWidget()
        }


class CommentForm(forms.ModelForm):
    class Meta:
        model = Comment
        exclude = ['user', 'post', 'upvote', 'downvote']