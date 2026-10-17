from django.contrib.auth import REDIRECT_FIELD_NAME
from django.shortcuts import render

from allauth.account.models import EmailAddress
from allauth.account.utils import send_email_confirmation


def verified_email_required(
    function=None, login_url=None, redirect_field_name=REDIRECT_FIELD_NAME
):

    def decorator(view_func):
        def _wrapped_view(request, *args, **kwargs):
            if request.user.is_authenticated:
                if not EmailAddress.objects.filter(
                    user=request.user, verified=True
                ).exists():
                    send_email_confirmation(request, request.user)
                    return render(request, "account/verified_email_required.html")
            return view_func(request, *args, **kwargs)

        return _wrapped_view

    if function:
        return decorator(function)
    return decorator
