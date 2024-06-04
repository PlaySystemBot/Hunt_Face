import unittest
from flask import session
from main import app
from models import db, User, UploadedPhoto
from client import detect_faces
from unittest.mock import patch, MagicMock
import json
import os

class BasicTests(unittest.TestCase):
    """
    Тесты для маршрутов (Routes):
    Проверяют, что основные маршруты работают корректно.
    """

    def setUp(self):
        # Создание тестового приложения и базы данных в памяти
        self.app = app
        self.app.config['TESTING'] = True
        self.app.config['WTF_CSRF_ENABLED'] = False
        self.app.config['DEBUG'] = False
        self.app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///:memory:'
        self.client = self.app.test_client()
        with self.app.app_context():
            db.create_all()

    def tearDown(self):
        # Удаление данных и базы данных после каждого теста
        with self.app.app_context():
            db.session.remove()
            db.drop_all()

    def test_main_page(self):
        # Тест главной страницы
        response = self.client.get('/')
        self.assertEqual(response.status_code, 200)
        self.assertIn('Добро пожаловать', response.data)

    def test_about_page(self):
        # Тест страницы "О нас"
        response = self.client.get('/about')
        self.assertEqual(response.status_code, 200)
        self.assertIn('О нас', response.data)

    def test_contact_page(self):
        # Тест страницы "Контакты"
        response = self.client.get('/contact')
        self.assertEqual(response.status_code, 200)
        self.assertIn('О нас', response.data)

class AuthTests(unittest.TestCase):
    """
    Тесты для аутентификации (Authentication):
    Проверяют регистрацию, вход и выход пользователей.
    """

    def setUp(self):
        self.app = app
        self.app.config['TESTING'] = True
        self.app.config['WTF_CSRF_ENABLED'] = False
        self.app.config['DEBUG'] = False
        self.app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///:memory:'
        self.client = self.app.test_client()
        with self.app.app_context():
            db.create_all()

    def tearDown(self):
        with self.app.app_context():
            db.session.remove()
            db.drop_all()

    def test_register(self):
        with self.app.app_context():
            response = self.client.post('/register', data={
                'email': 'test@example.com',
                'password': 'password'
            })
            self.assertEqual(response.status_code, 302)
            user = User.query.filter_by(email='test@example.com').first()
            self.assertIsNotNone(user)

    def test_login_logout(self):
        with self.app.app_context():
            user = User(email='test@example.com', password='password', confirmed=True)
            db.session.add(user)
            db.session.commit()

            response = self.client.post('/login', data={
                'email': 'test@example.com',
                'password': 'password'
            })
            self.assertEqual(response.status_code, 302)
            self.assertIn('user_id', session)

            response = self.client.get('/logout')
            self.assertEqual(response.status_code, 302)
            self.assertNotIn('user_id', session)

class UploadTests(unittest.TestCase):
    """
    Тесты для загрузки файлов (File Upload):
    Проверяют корректность загрузки и обработки изображений.
    """

    def setUp(self):
        self.app = app
        self.app.config['TESTING'] = True
        self.app.config['WTF_CSRF_ENABLED'] = False
        self.app.config['DEBUG'] = False
        self.app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///:memory:'
        self.app.config['UPLOAD_FOLDER'] = '/tmp/uploads'
        self.client = self.app.test_client()
        with self.app.app_context():
            db.create_all()
            user = User(email='test@example.com', password='password', confirmed=True)
            db.session.add(user)
            db.session.commit()
            with self.client.session_transaction() as sess:
                sess['user_id'] = user.id

    def tearDown(self):
        with self.app.app_context():
            db.session.remove()
            db.drop_all()

    @patch('client.detect_faces')
    def test_upload_image(self, mock_detect_faces):
        mock_detect_faces.return_value = {
            'image': 'encoded_image_data',
            'faces': [{'x': 10, 'y': 10, 'w': 100, 'h': 100}]
        }

        with open('test_image.jpg', 'rb') as img:
            data = {'file': img}
            response = self.client.post('/upload', data=data, content_type='multipart/form-data')
            self.assertEqual(response.status_code, 200)
            response_data = json.loads(response.data)
            self.assertIn('url', response_data)
            self.assertIn('image', response_data)
            self.assertIn('boundings', response_data)

class DetectTests(unittest.TestCase):
    """
    Тесты для обработки изображений (Image Processing):
    Проверяют корректность детектирования лиц на изображениях.
    """

    def setUp(self):
        self.app = app
        self.app.config['TESTING'] = True
        self.app.config['WTF_CSRF_ENABLED'] = False
        self.app.config['DEBUG'] = False
        self.app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///:memory:'
        self.client = self.app.test_client()
        with self.app.app_context():
            db.create_all()
            user = User(email='test@example.com', password='password', confirmed=True)
            db.session.add(user)
            db.session.commit()
            with self.client.session_transaction() as sess:
                sess['user_id'] = user.id

    def tearDown(self):
        with self.app.app_context():
            db.session.remove()
            db.drop_all()

    @patch('requests.post')
    def test_detect_faces(self, mock_post):
        mock_post.return_value = MagicMock(status_code=200, json=lambda: {
            "result": {
                "profiles": [],
                "faces_format": "",
                "faces_found": ""
            }
        })

        data = {
            'image': 'test_image.jpg',
            'face': 'test_face',
            'source': 'vk_wall',
            'results': 10
        }
        response = self.client.post('/detect', json=data)
        self.assertEqual(response.status_code, 200)
        response_data = json.loads(response.data)
        self.assertIn('profiles', response_data)
        self.assertIn('faces_format', response_data)
        self.assertIn('faces_found', response_data)

if __name__ == "__main__":
    unittest.main()
