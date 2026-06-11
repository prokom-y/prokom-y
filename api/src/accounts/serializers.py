from django.contrib.auth.models import User
from drf_spectacular.utils import extend_schema_field
from rest_framework import serializers

from .models import Profile


class ProfileSerializer(serializers.ModelSerializer):
    avatar_url = serializers.SerializerMethodField()
    followers_count = serializers.SerializerMethodField()
    following_count = serializers.SerializerMethodField()

    class Meta:
        model = Profile
        fields = ['bio', 'avatar_url', 'followers_count', 'following_count', 'created_at']
        read_only_fields = ['avatar_url', 'followers_count', 'following_count', 'created_at']

    @extend_schema_field(serializers.URLField(allow_null=True))
    def get_avatar_url(self, obj):
        if not obj.avatar:
            return None
        request = self.context.get('request')
        if request:
            return request.build_absolute_uri(obj.avatar.url)
        return obj.avatar.url

    @extend_schema_field(serializers.IntegerField())
    def get_followers_count(self, obj):
        user = obj.user
        count = getattr(user, 'followers_count', None)
        return count if count is not None else user.followers.count()

    @extend_schema_field(serializers.IntegerField())
    def get_following_count(self, obj):
        user = obj.user
        count = getattr(user, 'following_count', None)
        return count if count is not None else user.following.count()


class AvatarUploadSerializer(serializers.ModelSerializer):
    class Meta:
        model = Profile
        fields = ['avatar']


class UserSerializer(serializers.ModelSerializer):
    profile = ProfileSerializer(read_only=True)

    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'profile']


class PublicUserSerializer(serializers.ModelSerializer):
    profile = ProfileSerializer(read_only=True)
    is_following = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = ['id', 'username', 'profile', 'is_following']

    @extend_schema_field(serializers.BooleanField())
    def get_is_following(self, obj):
        request = self.context.get('request')
        if not request or not request.user.is_authenticated:
            return False
        return obj.followers.filter(follower=request.user).exists()
