import os

class Config:
    BASE_DIR = os.path.abspath(os.path.dirname(__file__))
    SECRET_KEY = 'secret_key'
    SQLALCHEMY_DATABASE_URI = 'sqlite:///' + os.path.join(BASE_DIR, 'instance/users.db')
    UPLOAD_FOLDER = 'uploads'
    MAX_CONTENT_LENGTH = 25 * 1024 * 1024  # 25MB limit

    LOG_NAME = 'app.log'
    # API settings
    API = "aHR0cHM6Ly9zZWFyY2g0ZmFjZXMuY29tL2FwaS9qc29uLXJwYy92MQ=="
    API_KEY = "3a315e-abacb0-954503-d4d170-5cac51"
    # Admin users
    ADMIN_EMAIL = 'gekacavvateev2@gmail.com'
    ADMIN_PASSWORD = 'Gekacavvateev_2'
