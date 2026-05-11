from django.contrib.auth.models import User
from drf_spectacular.utils import extend_schema
from rest_framework import generics, status
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.throttling import ScopedRateThrottle
from rest_framework.views import APIView
from rest_framework_simplejwt.exceptions import TokenError
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView

from .serializers import RegisterSerializer


@extend_schema(
    tags=['Auth'],
    summary='Login',
    description='Obtain a JWT access and refresh token pair using username and password.',
)
class LoginView(TokenObtainPairView):
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = 'auth_login'


@extend_schema(
    tags=['Auth'],
    summary='Refresh token',
    description='Exchange a valid refresh token for a new access token.',
)
class RefreshView(TokenRefreshView):
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = 'auth_refresh'


@extend_schema(
    tags=['Auth'],
    summary='Register a new user',
    description='Create a new user account. Returns the created user\'s username and email.',
)
class RegisterView(generics.CreateAPIView):
    queryset = User.objects.all()
    serializer_class = RegisterSerializer
    permission_classes = [AllowAny]
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = 'auth_register'


@extend_schema(
    tags=['Auth'],
    summary='Logout',
    description='Blacklist the provided refresh token, invalidating the session.',
    request={'application/json': {'type': 'object', 'properties': {'refresh': {'type': 'string'}}, 'required': ['refresh']}},
    responses={204: None, 400: None},
)
class LogoutView(APIView):
    permission_classes = [IsAuthenticated]
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = 'auth_logout'

    def post(self, request):
        try:
            RefreshToken(request.data.get('refresh', '')).blacklist()
        except TokenError:
            return Response({'detail': 'Invalid or expired token.'}, status=status.HTTP_400_BAD_REQUEST)
        return Response(status=status.HTTP_204_NO_CONTENT)
