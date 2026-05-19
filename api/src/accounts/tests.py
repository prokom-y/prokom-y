from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

from test_utils import make_user
from .models import Follow


class UserSearchViewTests(APITestCase):
    url = reverse('user_search')

    def setUp(self):
        self.user = make_user('alice')
        self.client.force_authenticate(self.user)
        make_user('bob')
        make_user('bobby')

    def test_search_returns_matching_users(self):
        response = self.client.get(self.url, {'q': 'bob'})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        usernames = [u['username'] for u in response.data['results']]
        self.assertIn('bob', usernames)
        self.assertIn('bobby', usernames)
        self.assertNotIn('alice', usernames)

    def test_search_case_insensitive(self):
        response = self.client.get(self.url, {'q': 'BOB'})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['results']), 2)

    def test_empty_query_returns_empty_list(self):
        response = self.client.get(self.url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['results'], [])

    def test_unauthenticated_returns_401(self):
        self.client.force_authenticate(user=None)
        response = self.client.get(self.url, {'q': 'bob'})
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)


class OwnProfileViewTests(APITestCase):
    url = reverse('own_profile')

    def setUp(self):
        self.user = make_user('alice')
        self.client.force_authenticate(self.user)

    def test_get_own_profile(self):
        response = self.client.get(self.url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['username'], 'alice')
        self.assertIn('profile', response.data)

    def test_patch_updates_bio(self):
        response = self.client.patch(self.url, {'bio': 'Hello world'})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.user.profile.refresh_from_db()
        self.assertEqual(self.user.profile.bio, 'Hello world')

    def test_patch_updates_avatar_url(self):
        response = self.client.patch(self.url, {'avatar_url': 'https://example.com/avatar.png'})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.user.profile.refresh_from_db()
        self.assertEqual(self.user.profile.avatar_url, 'https://example.com/avatar.png')

    def test_patch_partial_does_not_wipe_other_fields(self):
        self.user.profile.bio = 'Old bio'
        self.user.profile.save()
        self.client.patch(self.url, {'avatar_url': 'https://example.com/a.png'})
        self.user.profile.refresh_from_db()
        self.assertEqual(self.user.profile.bio, 'Old bio')

    def test_unauthenticated_returns_401(self):
        self.client.force_authenticate(user=None)
        response = self.client.get(self.url)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)


class UserProfileViewTests(APITestCase):
    def setUp(self):
        self.target = make_user('alice')

    def _url(self, username):
        return reverse('user_profile', kwargs={'username': username})

    def test_get_public_profile(self):
        response = self.client.get(self._url('alice'))
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['username'], 'alice')

    def test_no_auth_required(self):
        response = self.client.get(self._url('alice'))
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_nonexistent_user_returns_404(self):
        response = self.client.get(self._url('nobody'))
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)


class FollowersListViewTests(APITestCase):
    def setUp(self):
        self.alice = make_user('alice')
        self.bob = make_user('bob')
        self.charlie = make_user('charlie')
        self.client.force_authenticate(self.alice)
        Follow.objects.create(follower=self.bob, following=self.alice)
        Follow.objects.create(follower=self.charlie, following=self.alice)

    def _url(self, username):
        return reverse('followers', kwargs={'username': username})

    def test_returns_followers(self):
        response = self.client.get(self._url('alice'))
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        usernames = [u['username'] for u in response.data['results']]
        self.assertIn('bob', usernames)
        self.assertIn('charlie', usernames)

    def test_does_not_include_non_followers(self):
        response = self.client.get(self._url('alice'))
        usernames = [u['username'] for u in response.data['results']]
        self.assertNotIn('alice', usernames)

    def test_unauthenticated_returns_401(self):
        self.client.force_authenticate(user=None)
        response = self.client.get(self._url('alice'))
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_nonexistent_user_returns_404(self):
        response = self.client.get(self._url('nobody'))
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)


class FollowingListViewTests(APITestCase):
    def setUp(self):
        self.alice = make_user('alice')
        self.bob = make_user('bob')
        self.charlie = make_user('charlie')
        self.client.force_authenticate(self.alice)
        Follow.objects.create(follower=self.alice, following=self.bob)
        Follow.objects.create(follower=self.alice, following=self.charlie)

    def _url(self, username):
        return reverse('following', kwargs={'username': username})

    def test_returns_following(self):
        response = self.client.get(self._url('alice'))
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        usernames = [u['username'] for u in response.data['results']]
        self.assertIn('bob', usernames)
        self.assertIn('charlie', usernames)

    def test_does_not_include_non_following(self):
        response = self.client.get(self._url('bob'))
        usernames = [u['username'] for u in response.data['results']]
        self.assertNotIn('alice', usernames)

    def test_unauthenticated_returns_401(self):
        self.client.force_authenticate(user=None)
        response = self.client.get(self._url('alice'))
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)


class FollowViewTests(APITestCase):
    def setUp(self):
        self.alice = make_user('alice')
        self.bob = make_user('bob')
        self.client.force_authenticate(self.alice)

    def _url(self, username):
        return reverse('follow', kwargs={'username': username})

    def test_follow_user(self):
        response = self.client.post(self._url('bob'))
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertTrue(Follow.objects.filter(follower=self.alice, following=self.bob).exists())

    def test_follow_idempotent(self):
        self.client.post(self._url('bob'))
        response = self.client.post(self._url('bob'))
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertEqual(Follow.objects.filter(follower=self.alice, following=self.bob).count(), 1)

    def test_cannot_follow_yourself(self):
        response = self.client.post(self._url('alice'))
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_follow_nonexistent_user_returns_404(self):
        response = self.client.post(self._url('nobody'))
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_unfollow_user(self):
        Follow.objects.create(follower=self.alice, following=self.bob)
        response = self.client.delete(self._url('bob'))
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertFalse(Follow.objects.filter(follower=self.alice, following=self.bob).exists())

    def test_unfollow_idempotent(self):
        response = self.client.delete(self._url('bob'))
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)

    def test_unfollow_nonexistent_user_returns_404(self):
        response = self.client.delete(self._url('nobody'))
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_unauthenticated_returns_401(self):
        self.client.force_authenticate(user=None)
        response = self.client.post(self._url('bob'))
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
