from django.conf import settings
from django.contrib.auth.models import User
from drf_spectacular.utils import extend_schema
from rest_framework import generics, status
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.throttling import ScopedRateThrottle
from rest_framework.views import APIView
from rest_framework_simplejwt.exceptions import InvalidToken, TokenError
from rest_framework_simplejwt.serializers import TokenRefreshSerializer
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.views import TokenObtainPairView

from .serializers import RegisterSerializer

REFRESH_COOKIE = 'refresh_token'
_REFRESH_MAX_AGE = int(settings.SIMPLE_JWT['REFRESH_TOKEN_LIFETIME'].total_seconds())


def _set_refresh_cookie(response, token: str) -> None:
    response.set_cookie(
        REFRESH_COOKIE,
        token,
        max_age=_REFRESH_MAX_AGE,
        httponly=True,
        secure=not settings.DEBUG,
        samesite='Lax',
        path='/',
    )


@extend_schema(
    tags=['Auth'],
    summary='Login',
    description='Obtain a JWT access token. The refresh token is set as an httpOnly cookie.',
)
class LoginView(TokenObtainPairView):
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = 'auth_login'

    def post(self, request, *args, **kwargs):
        response = super().post(request, *args, **kwargs)
        if response.status_code == status.HTTP_200_OK:
            _set_refresh_cookie(response, response.data.pop('refresh'))
        return response


@extend_schema(
    tags=['Auth'],
    summary='Refresh token',
    description='Exchange the refresh token cookie for a new access token.',
    request=None,
)
class RefreshView(APIView):
    permission_classes = [AllowAny]
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = 'auth_refresh'

    def post(self, request):
        refresh_token = request.COOKIES.get(REFRESH_COOKIE)
        if not refresh_token:
            return Response({'detail': 'Refresh token not found.'}, status=status.HTTP_401_UNAUTHORIZED)

        serializer = TokenRefreshSerializer(data={'refresh': refresh_token})
        try:
            serializer.is_valid(raise_exception=True)
        except TokenError as e:
            raise InvalidToken(e.args[0])

        response = Response({'access': str(serializer.validated_data['access'])})
        if 'refresh' in serializer.validated_data:
            _set_refresh_cookie(response, str(serializer.validated_data['refresh']))
        return response


@extend_schema(
    tags=['Auth'],
    summary='Register a new user',
    description="Create a new user account. Returns the created user's username and email.",
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
    description='Blacklist the refresh token cookie and clear it.',
    request=None,
    responses={204: None},
)
class LogoutView(APIView):
    permission_classes = [IsAuthenticated]
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = 'auth_logout'

    def post(self, request):
        refresh_token = request.COOKIES.get(REFRESH_COOKIE)
        if refresh_token:
            try:
                RefreshToken(refresh_token).blacklist()
            except TokenError:
                pass  # Already invalid; still clear the cookie below

        response = Response(status=status.HTTP_204_NO_CONTENT)
        response.delete_cookie(REFRESH_COOKIE, path='/')
        return response
