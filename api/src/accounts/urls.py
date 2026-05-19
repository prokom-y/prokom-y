from django.urls import path

from . import views

urlpatterns = [
    path('/users/search', views.UserSearchView.as_view(), name='user_search'),
    path('/profile', views.OwnProfileView.as_view(), name='own_profile'),
    path('/users/<str:username>', views.UserProfileView.as_view(), name='user_profile'),
    path('/users/<str:username>/followers', views.FollowersListView.as_view(), name='followers'),
    path('/users/<str:username>/following', views.FollowingListView.as_view(), name='following'),
    path('/users/<str:username>/follow', views.FollowView.as_view(), name='follow'),
]
