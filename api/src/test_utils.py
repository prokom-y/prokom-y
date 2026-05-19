from django.contrib.auth.models import User

from posts.models import Post


def make_user(username, password='pass1234'):
    return User.objects.create_user(username=username, password=password)


def make_post(author, content='Test post content'):
    return Post.objects.create(author=author, content=content)
