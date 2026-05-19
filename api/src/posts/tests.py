from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

from accounts.models import Follow
from test_utils import make_post, make_user
from .models import Comment, Like, Post


class PostListCreateViewTests(APITestCase):
    url = reverse('post_list_create')

    def setUp(self):
        self.user = make_user('alice')
        self.client.force_authenticate(self.user)

    def test_list_posts(self):
        make_post(self.user, 'First post')
        make_post(self.user, 'Second post')
        response = self.client.get(self.url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['count'], 2)

    def test_list_posts_ordered_newest_first(self):
        make_post(self.user, 'First')
        make_post(self.user, 'Second')
        response = self.client.get(self.url)
        timestamps = [p['created_at'] for p in response.data['results']]
        self.assertGreaterEqual(timestamps[0], timestamps[1])

    def test_create_post(self):
        response = self.client.post(self.url, {'content': 'Hello world'})
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertTrue(Post.objects.filter(content='Hello world', author=self.user).exists())

    def test_create_post_sets_author(self):
        response = self.client.post(self.url, {'content': 'Hello'})
        self.assertEqual(response.data['author']['username'], 'alice')

    def test_create_post_missing_content(self):
        response = self.client.post(self.url, {})
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_response_includes_counts(self):
        make_post(self.user, 'Post')
        response = self.client.get(self.url)
        post = response.data['results'][0]
        self.assertIn('likes_count', post)
        self.assertIn('comments_count', post)
        self.assertIn('is_liked', post)

    def test_unauthenticated_returns_401(self):
        self.client.force_authenticate(user=None)
        response = self.client.get(self.url)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)


class PostSearchViewTests(APITestCase):
    url = reverse('post_search')

    def setUp(self):
        self.user = make_user('alice')
        self.client.force_authenticate(self.user)
        make_post(self.user, 'Django is awesome')
        make_post(self.user, 'I love Python')

    def test_search_returns_matching_posts(self):
        response = self.client.get(self.url, {'q': 'django'})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['count'], 1)
        self.assertIn('Django', response.data['results'][0]['content'])

    def test_search_case_insensitive(self):
        response = self.client.get(self.url, {'q': 'DJANGO'})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['count'], 1)

    def test_empty_query_returns_empty_list(self):
        response = self.client.get(self.url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['results'], [])

    def test_unauthenticated_returns_401(self):
        self.client.force_authenticate(user=None)
        response = self.client.get(self.url, {'q': 'django'})
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)


class FollowingFeedViewTests(APITestCase):
    url = reverse('following_feed')

    def setUp(self):
        self.alice = make_user('alice')
        self.bob = make_user('bob')
        self.charlie = make_user('charlie')
        self.client.force_authenticate(self.alice)
        Follow.objects.create(follower=self.alice, following=self.bob)
        self.bob_post = make_post(self.bob, "Bob's post")
        self.charlie_post = make_post(self.charlie, "Charlie's post")

    def test_feed_shows_followed_users_posts(self):
        response = self.client.get(self.url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        ids = [p['id'] for p in response.data['results']]
        self.assertIn(self.bob_post.id, ids)

    def test_feed_excludes_non_followed_users_posts(self):
        response = self.client.get(self.url)
        ids = [p['id'] for p in response.data['results']]
        self.assertNotIn(self.charlie_post.id, ids)

    def test_empty_feed_when_not_following_anyone(self):
        self.client.force_authenticate(self.charlie)
        response = self.client.get(self.url)
        self.assertEqual(response.data['count'], 0)

    def test_unauthenticated_returns_401(self):
        self.client.force_authenticate(user=None)
        response = self.client.get(self.url)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)


class PostDetailViewTests(APITestCase):
    def setUp(self):
        self.alice = make_user('alice')
        self.bob = make_user('bob')
        self.client.force_authenticate(self.alice)
        self.post = make_post(self.alice, 'Alice post')

    def _url(self, pk):
        return reverse('post_detail', kwargs={'pk': pk})

    def test_get_post(self):
        response = self.client.get(self._url(self.post.pk))
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['id'], self.post.pk)

    def test_get_nonexistent_post_returns_404(self):
        response = self.client.get(self._url(99999))
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_author_can_update_post(self):
        response = self.client.patch(self._url(self.post.pk), {'content': 'Updated'})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.post.refresh_from_db()
        self.assertEqual(self.post.content, 'Updated')

    def test_non_author_cannot_update_post(self):
        self.client.force_authenticate(self.bob)
        response = self.client.patch(self._url(self.post.pk), {'content': 'Hacked'})
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_author_can_delete_post(self):
        response = self.client.delete(self._url(self.post.pk))
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertFalse(Post.objects.filter(pk=self.post.pk).exists())

    def test_non_author_cannot_delete_post(self):
        self.client.force_authenticate(self.bob)
        response = self.client.delete(self._url(self.post.pk))
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        self.assertTrue(Post.objects.filter(pk=self.post.pk).exists())

    def test_unauthenticated_returns_401(self):
        self.client.force_authenticate(user=None)
        response = self.client.get(self._url(self.post.pk))
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)


class LikeViewTests(APITestCase):
    def setUp(self):
        self.user = make_user('alice')
        self.client.force_authenticate(self.user)
        self.post = make_post(self.user)

    def _url(self, pk):
        return reverse('post_like', kwargs={'pk': pk})

    def test_like_post(self):
        response = self.client.post(self._url(self.post.pk))
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertTrue(Like.objects.filter(user=self.user, post=self.post).exists())

    def test_like_idempotent(self):
        self.client.post(self._url(self.post.pk))
        response = self.client.post(self._url(self.post.pk))
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertEqual(Like.objects.filter(user=self.user, post=self.post).count(), 1)

    def test_unlike_post(self):
        Like.objects.create(user=self.user, post=self.post)
        response = self.client.delete(self._url(self.post.pk))
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertFalse(Like.objects.filter(user=self.user, post=self.post).exists())

    def test_unlike_idempotent(self):
        response = self.client.delete(self._url(self.post.pk))
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)

    def test_like_nonexistent_post_returns_404(self):
        response = self.client.post(self._url(99999))
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_is_liked_reflects_like_status(self):
        detail_url = reverse('post_detail', kwargs={'pk': self.post.pk})
        self.assertFalse(self.client.get(detail_url).data['is_liked'])
        self.client.post(self._url(self.post.pk))
        self.assertTrue(self.client.get(detail_url).data['is_liked'])

    def test_unauthenticated_returns_401(self):
        self.client.force_authenticate(user=None)
        response = self.client.post(self._url(self.post.pk))
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)


class CommentListCreateViewTests(APITestCase):
    def setUp(self):
        self.alice = make_user('alice')
        self.client.force_authenticate(self.alice)
        self.post = make_post(self.alice)

    def _url(self, pk):
        return reverse('comment_list_create', kwargs={'pk': pk})

    def test_list_comments(self):
        Comment.objects.create(author=self.alice, post=self.post, content='Nice post')
        response = self.client.get(self._url(self.post.pk))
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['count'], 1)

    def test_create_comment(self):
        response = self.client.post(self._url(self.post.pk), {'content': 'Great!'})
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertTrue(Comment.objects.filter(post=self.post, author=self.alice).exists())

    def test_create_comment_sets_author(self):
        response = self.client.post(self._url(self.post.pk), {'content': 'Great!'})
        self.assertEqual(response.data['author']['username'], 'alice')

    def test_create_comment_on_nonexistent_post_returns_404(self):
        response = self.client.post(self._url(99999), {'content': 'Great!'})
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_comments_ordered_oldest_first(self):
        c1 = Comment.objects.create(author=self.alice, post=self.post, content='First')
        c2 = Comment.objects.create(author=self.alice, post=self.post, content='Second')
        response = self.client.get(self._url(self.post.pk))
        ids = [c['id'] for c in response.data['results']]
        self.assertEqual(ids[0], c1.id)
        self.assertEqual(ids[1], c2.id)

    def test_unauthenticated_returns_401(self):
        self.client.force_authenticate(user=None)
        response = self.client.get(self._url(self.post.pk))
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)


class CommentDetailViewTests(APITestCase):
    def setUp(self):
        self.alice = make_user('alice')
        self.bob = make_user('bob')
        self.client.force_authenticate(self.alice)
        self.post = make_post(self.alice)
        self.comment = Comment.objects.create(author=self.alice, post=self.post, content='Original')

    def _url(self, post_pk, comment_pk):
        return reverse('comment_detail', kwargs={'pk': post_pk, 'comment_pk': comment_pk})

    def test_get_comment(self):
        response = self.client.get(self._url(self.post.pk, self.comment.pk))
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['id'], self.comment.pk)

    def test_get_nonexistent_comment_returns_404(self):
        response = self.client.get(self._url(self.post.pk, 99999))
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_author_can_update_comment(self):
        response = self.client.patch(self._url(self.post.pk, self.comment.pk), {'content': 'Updated'})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.comment.refresh_from_db()
        self.assertEqual(self.comment.content, 'Updated')

    def test_non_author_cannot_update_comment(self):
        self.client.force_authenticate(self.bob)
        response = self.client.patch(self._url(self.post.pk, self.comment.pk), {'content': 'Hacked'})
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_author_can_delete_comment(self):
        response = self.client.delete(self._url(self.post.pk, self.comment.pk))
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertFalse(Comment.objects.filter(pk=self.comment.pk).exists())

    def test_non_author_cannot_delete_comment(self):
        self.client.force_authenticate(self.bob)
        response = self.client.delete(self._url(self.post.pk, self.comment.pk))
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        self.assertTrue(Comment.objects.filter(pk=self.comment.pk).exists())

    def test_unauthenticated_returns_401(self):
        self.client.force_authenticate(user=None)
        response = self.client.get(self._url(self.post.pk, self.comment.pk))
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
