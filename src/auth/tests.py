from django.contrib.auth.models import User
from django.core.cache import cache
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase


class ThrottleAwareTestCase(APITestCase):
    def setUp(self):
        super().setUp()
        cache.clear()


class RegisterViewTests(ThrottleAwareTestCase):
    url = reverse('register')

    def test_register_success(self):
        data = {'username': 'alice', 'email': 'alice@example.com', 'password': 'strongpass'}
        response = self.client.post(self.url, data)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertTrue(User.objects.filter(username='alice').exists())

    def test_register_creates_profile(self):
        data = {'username': 'alice', 'email': 'alice@example.com', 'password': 'strongpass'}
        self.client.post(self.url, data)
        user = User.objects.get(username='alice')
        self.assertTrue(hasattr(user, 'profile'))

    def test_register_duplicate_username(self):
        User.objects.create_user(username='alice', password='pass1234')
        data = {'username': 'alice', 'email': 'other@example.com', 'password': 'strongpass'}
        response = self.client.post(self.url, data)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_register_password_too_short(self):
        data = {'username': 'bob', 'email': 'bob@example.com', 'password': 'short'}
        response = self.client.post(self.url, data)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_register_missing_username(self):
        data = {'email': 'bob@example.com', 'password': 'strongpass'}
        response = self.client.post(self.url, data)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_register_password_not_returned(self):
        data = {'username': 'alice', 'email': 'alice@example.com', 'password': 'strongpass'}
        response = self.client.post(self.url, data)
        self.assertNotIn('password', response.data)


class LoginViewTests(ThrottleAwareTestCase):
    url = reverse('token_obtain')

    def setUp(self):
        super().setUp()
        self.user = User.objects.create_user(username='alice', password='strongpass')

    def test_login_success_returns_tokens(self):
        response = self.client.post(self.url, {'username': 'alice', 'password': 'strongpass'})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('access', response.data)
        self.assertIn('refresh', response.data)

    def test_login_wrong_password(self):
        response = self.client.post(self.url, {'username': 'alice', 'password': 'wrongpass'})
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_login_nonexistent_user(self):
        response = self.client.post(self.url, {'username': 'nobody', 'password': 'strongpass'})
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)


class RefreshViewTests(ThrottleAwareTestCase):
    login_url = reverse('token_obtain')
    refresh_url = reverse('token_refresh')

    def setUp(self):
        super().setUp()
        User.objects.create_user(username='alice', password='strongpass')

    def test_refresh_returns_new_access_token(self):
        tokens = self.client.post(self.login_url, {'username': 'alice', 'password': 'strongpass'}).data
        response = self.client.post(self.refresh_url, {'refresh': tokens['refresh']})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('access', response.data)

    def test_refresh_invalid_token(self):
        response = self.client.post(self.refresh_url, {'refresh': 'not-a-valid-token'})
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)