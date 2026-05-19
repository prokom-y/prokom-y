from django.urls import path

from .views import LoginView, LogoutView, RefreshView, RegisterView

urlpatterns = [
    path('/login', LoginView.as_view(), name='token_obtain'),
    path('/register', RegisterView.as_view(), name='register'),
    path('/refresh', RefreshView.as_view(), name='token_refresh'),
    path('/logout', LogoutView.as_view(), name='logout'),
]
