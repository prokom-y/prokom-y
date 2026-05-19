from django.contrib.auth.models import User
from django.db.models import Count, Prefetch
from django.shortcuts import get_object_or_404
from drf_spectacular.utils import extend_schema, extend_schema_view, OpenApiResponse, OpenApiParameter
from rest_framework import generics, status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import Comment, Like, Post
from .permissions import IsAuthorOrReadOnly
from .serializers import CommentSerializer, PostSerializer


def post_queryset(user):
    """Base queryset for posts: annotated counts + prefetched user likes to avoid N+1 queries."""
    return (
        Post.objects
        .select_related('author')
        .annotate(
            likes_count=Count('likes', distinct=True),
            comments_count=Count('comments', distinct=True),
        )
        .prefetch_related(
            Prefetch('likes', queryset=Like.objects.filter(user=user), to_attr='user_likes')
        )
        .order_by('-created_at')
    )


@extend_schema(
    tags=['Posts'],
    summary='Search posts',
    description='Search posts by content (case-insensitive substring match). Returns an empty list when `q` is omitted or blank.',
    parameters=[
        OpenApiParameter(name='q', location=OpenApiParameter.QUERY, description='Search query string.', required=False, type=str),
    ],
)
class PostSearchView(generics.ListAPIView):
    serializer_class = PostSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        q = self.request.query_params.get('q', '').strip()
        if not q:
            return Post.objects.none()
        return post_queryset(self.request.user).filter(content__icontains=q)


@extend_schema_view(
    get=extend_schema(
        tags=['Posts'],
        summary='List all posts',
        description='Returns a paginated list of all posts, ordered by newest first.',
    ),
    post=extend_schema(
        tags=['Posts'],
        summary='Create a post',
        description='Create a new post. The authenticated user is set as the author automatically.',
    ),
)
class PostListCreateView(generics.ListCreateAPIView):
    serializer_class = PostSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return post_queryset(self.request.user)

    def perform_create(self, serializer):
        serializer.save(author=self.request.user)


@extend_schema(
    tags=['Posts'],
    summary='Following feed',
    description='Returns a paginated list of posts from users the authenticated user follows, ordered by newest first.',
)
class FollowingFeedView(generics.ListAPIView):
    serializer_class = PostSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        following_ids = self.request.user.following.values_list('following_id', flat=True)
        return post_queryset(self.request.user).filter(author_id__in=following_ids)


@extend_schema_view(
    get=extend_schema(
        tags=['Posts'],
        summary='Get a post',
        description='Returns details of a single post including like and comment counts.',
    ),
    patch=extend_schema(
        tags=['Posts'],
        summary='Update a post',
        description='Partially update a post. Only the post author can update it.',
        responses={
            200: PostSerializer,
            403: OpenApiResponse(description='Not the post author.'),
        },
    ),
    delete=extend_schema(
        tags=['Posts'],
        summary='Delete a post',
        description='Delete a post. Only the post author can delete it.',
        responses={
            204: OpenApiResponse(description='Post deleted.'),
            403: OpenApiResponse(description='Not the post author.'),
        },
    ),
)
class PostDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = PostSerializer
    permission_classes = [IsAuthenticated, IsAuthorOrReadOnly]
    http_method_names = ['get', 'patch', 'delete', 'head', 'options']

    def get_queryset(self):
        return post_queryset(self.request.user)


class LikeView(APIView):
    permission_classes = [IsAuthenticated]

    @extend_schema(
        tags=['Posts'],
        summary='Like a post',
        description='Like a post. Idempotent - liking an already-liked post is a no-op.',
        responses={
            204: OpenApiResponse(description='Post liked.'),
            404: OpenApiResponse(description='Post not found.'),
        },
    )
    def post(self, request, pk):
        post = get_object_or_404(Post, pk=pk)
        Like.objects.get_or_create(user=request.user, post=post)
        return Response(status=status.HTTP_204_NO_CONTENT)

    @extend_schema(
        tags=['Posts'],
        summary='Unlike a post',
        description='Remove a like from a post. Idempotent - unliking a non-liked post is a no-op.',
        responses={
            204: OpenApiResponse(description='Post unliked.'),
            404: OpenApiResponse(description='Post not found.'),
        },
    )
    def delete(self, request, pk):
        get_object_or_404(Post, pk=pk)
        Like.objects.filter(user=request.user, post_id=pk).delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


@extend_schema_view(
    get=extend_schema(
        tags=['Comments'],
        summary='List comments',
        description='Returns a paginated list of comments on a post, ordered oldest first.',
    ),
    post=extend_schema(
        tags=['Comments'],
        summary='Create a comment',
        description='Add a comment to a post. The authenticated user is set as the author automatically.',
        responses={
            201: CommentSerializer,
            404: OpenApiResponse(description='Post not found.'),
        },
    ),
)
class CommentListCreateView(generics.ListCreateAPIView):
    serializer_class = CommentSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        get_object_or_404(Post, pk=self.kwargs['pk'])
        return Comment.objects.filter(post_id=self.kwargs['pk']).select_related('author')

    def perform_create(self, serializer):
        post = get_object_or_404(Post, pk=self.kwargs['pk'])
        serializer.save(author=self.request.user, post=post)


@extend_schema_view(
    get=extend_schema(
        tags=['Comments'],
        summary='Get a comment',
        description='Returns details of a single comment.',
    ),
    patch=extend_schema(
        tags=['Comments'],
        summary='Update a comment',
        description='Partially update a comment. Only the comment author can update it.',
        responses={
            200: CommentSerializer,
            403: OpenApiResponse(description='Not the comment author.'),
        },
    ),
    delete=extend_schema(
        tags=['Comments'],
        summary='Delete a comment',
        description='Delete a comment. Only the comment author can delete it.',
        responses={
            204: OpenApiResponse(description='Comment deleted.'),
            403: OpenApiResponse(description='Not the comment author.'),
        },
    ),
)
class CommentDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = CommentSerializer
    permission_classes = [IsAuthenticated, IsAuthorOrReadOnly]
    http_method_names = ['get', 'patch', 'delete', 'head', 'options']

    def get_queryset(self):
        return Comment.objects.filter(post_id=self.kwargs['pk']).select_related('author')

    def get_object(self):
        obj = get_object_or_404(self.get_queryset(), pk=self.kwargs['comment_pk'])
        self.check_object_permissions(self.request, obj)
        return obj
