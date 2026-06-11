from django.contrib.auth.models import User
from django.db.models import Count
from django.shortcuts import get_object_or_404
from drf_spectacular.utils import extend_schema, extend_schema_view, OpenApiResponse, OpenApiParameter
from rest_framework import generics, status
from rest_framework.parsers import MultiPartParser
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import Follow
from .serializers import AvatarUploadSerializer, ProfileSerializer, PublicUserSerializer, UserSerializer

@extend_schema(
    tags=['Accounts'],
    summary='Search users',
    description='Search users by username (case-insensitive substring match). Returns an empty list when `q` is omitted or blank.',
    parameters=[
        OpenApiParameter(name='q', location=OpenApiParameter.QUERY, description='Search query string.', required=False, type=str),
    ],
)
class UserSearchView(generics.ListAPIView):
    serializer_class = PublicUserSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        q = self.request.query_params.get('q', '').strip()
        if not q:
            return User.objects.none()
        return (
            User.objects
            .filter(username__icontains=q)
            .select_related('profile')
            .annotate(
                followers_count=Count('followers', distinct=True),
                following_count=Count('following', distinct=True),
            )
        )


@extend_schema_view(
    get=extend_schema(
        tags=['Accounts'],
        summary='Get own profile',
        description='Returns the authenticated user\'s profile including follower/following counts.',
    ),
)
class OwnProfileView(generics.RetrieveUpdateAPIView):
    serializer_class = UserSerializer
    permission_classes = [IsAuthenticated]
    http_method_names = ['get', 'patch', 'head', 'options']

    def get_object(self):
        return self.request.user

    @extend_schema(
        tags=['Accounts'],
        summary='Update own profile',
        description='Partially update the authenticated user\'s profile (bio).',
        request=ProfileSerializer,
        responses={200: UserSerializer},
    )
    def patch(self, request):
        serializer = ProfileSerializer(request.user.profile, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(UserSerializer(request.user, context={'request': request}).data)


@extend_schema(
    tags=['Accounts'],
    summary='Upload avatar',
    description='Upload a new avatar image for the authenticated user. Replaces any existing avatar.',
    request=AvatarUploadSerializer,
    responses={200: UserSerializer},
)
class AvatarUploadView(APIView):
    permission_classes = [IsAuthenticated]
    parser_classes = [MultiPartParser]

    def post(self, request):
        profile = request.user.profile
        old_avatar = profile.avatar or None
        serializer = AvatarUploadSerializer(profile, data=request.data)
        serializer.is_valid(raise_exception=True)
        if old_avatar:
            old_avatar.delete(save=False)
        serializer.save()
        return Response(UserSerializer(request.user, context={'request': request}).data)


@extend_schema(
    tags=['Accounts'],
    summary='Get user profile by username',
    description='Returns a public user profile. Does not require authentication.',
)
class UserProfileView(generics.RetrieveAPIView):
    serializer_class = PublicUserSerializer
    permission_classes = [AllowAny]
    lookup_field = 'username'
    queryset = User.objects.select_related('profile')


@extend_schema(
    tags=['Accounts'],
    summary='List followers',
    description='Returns a paginated list of users who follow the specified user.',
)
class FollowersListView(generics.ListAPIView):
    serializer_class = PublicUserSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        target = get_object_or_404(User, username=self.kwargs['username'])
        return (
            User.objects
            .filter(following__following=target)
            .select_related('profile')
            .annotate(
                followers_count=Count('followers', distinct=True),
                following_count=Count('following', distinct=True),
            )
        )


@extend_schema(
    tags=['Accounts'],
    summary='List following',
    description='Returns a paginated list of users that the specified user follows.',
)
class FollowingListView(generics.ListAPIView):
    serializer_class = PublicUserSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        target = get_object_or_404(User, username=self.kwargs['username'])
        return (
            User.objects
            .filter(followers__follower=target)
            .select_related('profile')
            .annotate(
                followers_count=Count('followers', distinct=True),
                following_count=Count('following', distinct=True),
            )
        )


class FollowView(APIView):
    permission_classes = [IsAuthenticated]

    @extend_schema(
        tags=['Accounts'],
        summary='Follow a user',
        description='Follow the specified user. Idempotent - following an already-followed user is a no-op.',
        request=None,
        responses={
            204: OpenApiResponse(description='Successfully followed.'),
            400: OpenApiResponse(description='Cannot follow yourself.'),
            404: OpenApiResponse(description='User not found.'),
        },
    )
    def post(self, request, username):
        target = get_object_or_404(User, username=username)
        if target == request.user:
            return Response({'detail': 'You cannot follow yourself.'}, status=status.HTTP_400_BAD_REQUEST)
        Follow.objects.get_or_create(follower=request.user, following=target)
        return Response(status=status.HTTP_204_NO_CONTENT)

    @extend_schema(
        tags=['Accounts'],
        summary='Unfollow a user',
        description='Unfollow the specified user. Idempotent \- unfollowing a non-followed user is a no-op.',
        request=None,
        responses={
            204: OpenApiResponse(description='Successfully unfollowed.'),
            404: OpenApiResponse(description='User not found.'),
        },
    )
    def delete(self, request, username):
        target = get_object_or_404(User, username=username)
        Follow.objects.filter(follower=request.user, following=target).delete()
        return Response(status=status.HTTP_204_NO_CONTENT)
