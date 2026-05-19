from django.urls import path

from . import views

urlpatterns = [
    path('', views.PostListCreateView.as_view(), name='post_list_create'),
    path('/search', views.PostSearchView.as_view(), name='post_search'),
    path('/feed', views.FollowingFeedView.as_view(), name='following_feed'),
    path('/<int:pk>', views.PostDetailView.as_view(), name='post_detail'),
    path('/<int:pk>/like', views.LikeView.as_view(), name='post_like'),
    path('/<int:pk>/comments', views.CommentListCreateView.as_view(), name='comment_list_create'),
    path('/<int:pk>/comments/<int:comment_pk>', views.CommentDetailView.as_view(), name='comment_detail'),
]
