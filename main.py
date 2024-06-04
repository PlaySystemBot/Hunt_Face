from flask import Flask
from flask_sqlalchemy import SQLAlchemy
import os

app = Flask(__name__, static_folder='static', template_folder='templates')
app.config.from_object('config.Config')

# Убедиться, что база данных существует
if not os.path.exists(os.path.join(app.config['BASE_DIR'], 'instance')):
    os.makedirs(os.path.join(app.config['BASE_DIR'], 'instance'))
if not os.path.exists(app.config['SQLALCHEMY_DATABASE_URI'].replace('sqlite:///', '')):
    open(app.config['SQLALCHEMY_DATABASE_URI'].replace('sqlite:///', ''), 'a').close()

db = SQLAlchemy(app)


from routes import *

# Создание таблиц, если они не существуют
with app.app_context():
    db.create_all()

if __name__ == '__main__':
    app.run(debug=True, port=80)
