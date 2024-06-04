import base64
import hashlib
import zipfile
import requests
import re
from config import Config
from flask import (render_template, redirect, url_for, request, session, jsonify,
                   send_from_directory, abort, send_file)
from main import app, db
from models import User, UploadedPhoto
from client import detect_faces, headers
import json
import os
import logging

# Настройка логирования
logging.basicConfig(filename=Config.LOG_NAME, level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s', encoding='utf-8')

def is_admin():
    user_id = session.get('user_id')
    if not user_id:
        return False
    user = User.query.get(user_id)
    return user and user.email == Config.ADMIN_EMAIL and user.password == Config.ADMIN_PASSWORD

def get_current_user():
    user_id = session.get('user_id')
    if user_id:
        user = User.query.get(user_id)
        if user:
            return user
    return None

def validate_email(email):
    return '@' in email

def validate_password(password):
    if len(password) < 8:
        return False
    if not re.search(r'[A-Z]', password):
        return False
    if not re.search(r'[a-z]', password):
        return False
    if not re.search(r'[0-9]', password):
        return False
    if not re.search(r'[!@#$%^&*()_,.?":{}|<>]', password):
        return False
    return True

def allowed_file(filename):
    return '.' in filename and \
        filename.rsplit('.', 1)[1].lower() in {'png', 'jpg', 'jpeg', 'svg'}

@app.route('/')
def index():
    logging.info('Загрузка главной страницы пользователем %s', get_current_user())
    return render_template('index.html', current_page='index')

@app.route('/about')
def about():
    logging.info('Загрузка страницы "О нас" пользователем %s', get_current_user())
    return render_template('about.html', current_page='about')

@app.route('/contact')
def contact():
    logging.info('Загрузка страницы "Контакты" пользователем %s', get_current_user())
    return render_template('contact.html', current_page='contact')

@app.route('/faq')
def faq():
    logging.info('Загрузка страницы "FAQ" пользователем %s', get_current_user())
    return render_template('faq.html', current_page='faq')

@app.route('/search')
def search():
    logging.info('Загрузка страницы поиска пользователем %s', get_current_user())
    return render_template('search.html', current_page='search')

@app.route('/search/public')
def search_public():
    logging.info('Загрузка страницы поиска (public) пользователем %s', get_current_user())
    return render_template('search_public.html', current_page='search')

@app.route('/search/tiktok')
def search_tiktok():
    logging.info('Загрузка страницы поиска (TikTok) пользователем %s', get_current_user())
    return render_template('search_tiktok.html', current_page='search')

@app.route('/search/clubhouse')
def search_clubhouse():
    logging.info('Загрузка страницы поиска (Clubhouse) пользователем %s', get_current_user())
    return render_template('search_clubhouse.html', current_page='search')

@app.route('/search/vkwall')
def search_vkwall():
    logging.info('Загрузка страницы поиска (VK Wall) пользователем %s', get_current_user())
    return render_template('search_vkwall.html', current_page='search')

@app.route('/search/vkok')
def search_vkok():
    logging.info('Загрузка страницы поиска (VK OK) пользователем %s', get_current_user())
    return render_template('search_vkok.html', current_page='search')

@app.route('/search/vkok2022')
def search_vkok2022():
    logging.info('Загрузка страницы поиска (VK OK 2022) пользователем %s', get_current_user())
    return render_template('search_vkok2022.html', current_page='search')

@app.route('/login', methods=['POST'])
def login():
    if request.method == 'POST':
        email = request.form['email']
        password = request.form['password']

        logging.info('Попытка входа пользователя: %s', email)
        user = User.query.filter_by(email=email).first()

        if user and user.password == password:
            session['user_id'] = user.id
            logging.info('Успешный вход пользователя: %s', email)
            next_page = request.args.get('next', url_for('index'))
            if is_admin():
                return jsonify({'status': 'success', 'message': 'Вы успешно вошли.', 'redirect_url': url_for('admin')})
            return jsonify({'status': 'success', 'message': 'Вы успешно вошли.', 'redirect_url': next_page})
        else:
            logging.warning('Неудачная попытка входа: %s', email)
            return jsonify({'status': 'error', 'message': 'Неверный email или пароль.'})
    return render_template('index.html')

@app.route('/logout')
def logout():
    try:
        user = get_current_user()
        session.pop('user_id', None)
        logging.info('Выход пользователя: %s', user.email if user else 'Неизвестный пользователь')
        return jsonify({'status': 'success', 'message': 'Вы успешно вышли.', 'redirect_url': request.args.get('next', url_for('index'))})
    except Exception as e:
        return jsonify({'status': 'success', 'message': 'Вы успешно вышли.',
                        'redirect_url': request.args.get('next', url_for('index'))})


@app.route('/register', methods=['POST'])
def register():
    if request.method == 'POST':
        email = request.form['email']
        password = request.form['password']

        logging.info('Попытка регистрации нового пользователя: %s', email)

        # Валидация email
        if not validate_email(email):
            logging.warning('Неверный email формат: %s', email)
            return jsonify({'status': 'error', 'message': 'Неверный формат email.'})

        # Валидация пароля
        if not validate_password(password):
            logging.warning('Неверный формат пароля для пользователя: %s', email)
            return jsonify({'status': 'error', 'message': 'Пароль должен содержать минимум 8 символов, включать заглавные и прописные буквы, цифру и специальный знак.'})

        existing_user = User.query.filter_by(email=email).first()
        if existing_user:
            logging.warning('Попытка регистрации с уже зарегистрированным email: %s', email)
            return jsonify({'status': 'error', 'message': 'Email уже зарегистрирован.'})

        user = User(email=email, password=password, confirmed=True)
        db.session.add(user)
        db.session.commit()

        logging.info('Успешная регистрация пользователя: %s', email)
        return jsonify({'status': 'success', 'message': 'Регистрация прошла успешно. Теперь вы можете войти.', 'redirect_url': request.args.get('next', url_for('index'))})
    return render_template('index.html')

@app.context_processor
def inject_user():
    user_id = session.get('user_id')
    if user_id:
        user = User.query.get(user_id)
        if user:
            logging.info('Пользователь вошел: %s', user.email)
            return dict(logged_in_user=user.email)
    return dict(logged_in_user=None)

@app.route('/upload', methods=['POST'])
def upload():
    user = get_current_user()
    if 'file' not in request.files:
        logging.error('Файл не найден в запросе пользователем %s', user.email if user else 'Неизвестный пользователь')
        return jsonify({'status': 'error', 'message': 'No file part'})
    file = request.files['file']
    if file.filename == '':
        logging.error('Файл не выбран пользователем %s', user.email if user else 'Неизвестный пользователь')
        return jsonify({'status': 'error', 'message': 'No selected file'})
    if file and allowed_file(file.filename):
        if not os.path.exists(app.config['UPLOAD_FOLDER']):
            os.makedirs(app.config['UPLOAD_FOLDER'])
        file_path = os.path.join(app.config['UPLOAD_FOLDER'], file.filename)

        existing_photo = UploadedPhoto.query.filter_by(user_id=session['user_id'], filename=file.filename).first()
        if existing_photo:
            response_data = json.loads(existing_photo.response)
            logging.info('Файл уже существует: %s для пользователя %s', file.filename, user.email if user else 'Неизвестный пользователь')
            return jsonify({
                'url': file_path,
                'image': response_data['image'],
                'boundings': response_data['faces'],
                'scale': response_data.get('scale', 1)
            })

        file.save(file_path)
        try:
            detect_faces_result = detect_faces(file_path)
            if not detect_faces_result['faces']:
                logging.warning('Лица не обнаружены в файле: %s пользователем %s', file.filename, user.email if user else 'Неизвестный пользователь')
                return jsonify({'status': 'error', 'message': 'No faces detected'})

            new_photo = UploadedPhoto(
                user_id=session['user_id'],
                filename=file.filename,
                response=json.dumps(detect_faces_result)  # Сериализация JSON
            )
            db.session.add(new_photo)
            db.session.commit()

            logging.info('Файл успешно загружен и обработан: %s для пользователя %s', file.filename, user.email if user else 'Неизвестный пользователь')
            return jsonify({
                'status': 'success',
                'url': file_path,
                'image': detect_faces_result['image'],
                'boundings': detect_faces_result['faces'],
                'scale': detect_faces_result.get('scale', 1)
            })
        except Exception as e:
            logging.error('Ошибка при обработке файла %s пользователем %s: %s', file.filename, user.email if user else 'Неизвестный пользователь', str(e))
            return jsonify({'status': 'error', 'message': str(e)})

    logging.error('Неподдерживаемый тип файла %s пользователем %s', file.filename, user.email if user else 'Неизвестный пользователь')
    return jsonify({'status': 'error', 'message': 'Неверный формат фотографии, нужен png, jpg, svg'})

@app.route('/detect', methods=['POST'])
def detect():
    user = get_current_user()
    data = request.get_json()
    if not data:
        logging.error('Нет данных в запросе на /detect пользователем %s', user.email if user else 'Неизвестный пользователь')
        return jsonify({'status': 'error', 'message': 'No data provided'})

    missing_params = []
    if 'face' not in data:
        missing_params.append('face')
    if 'source' not in data:
        missing_params.append('source')
    if 'results' not in data:
        missing_params.append('results')

    if missing_params:
        logging.error('Неверные параметры запроса на /detect пользователем %s: %s', user.email if user else 'Неизвестный пользователь', missing_params)
        return jsonify({'status': 'error', 'message': 'Invalid request parameters', 'missing': missing_params})

    try:
        image_id = data['image']
        face = data['face']
        results = data['results']
        lang = data.get('lang', 'ru')
        db_value = data.get('db', 'vk_wall')

        existing_photo = UploadedPhoto.query.filter_by(user_id=session['user_id'], filename=image_id).first()
        if existing_photo and existing_photo.search_results:
            search_results = json.loads(existing_photo.search_results)
            logging.info('Найдены результаты поиска в базе данных для %s пользователем %s', image_id, user.email if user else 'Неизвестный пользователь')
            return jsonify({
                'profiles': search_results['profiles'],
                'faces_format': search_results.get('faces_format', ""),
                'faces_found': search_results.get('faces_found', ""),
                'db': db_value
            })

        payload = {
            "jsonrpc": "2.0",
            "method": "searchFace",
            "id": "some-id",
            "params": {
                "image": image_id,
                "face": face,
                "source": db_value,
                "hidden": True,
                "results": results,
                "lang": lang
            }
        }

        response = requests.post(base64.b64decode(Config.API).decode('utf-8'), json=payload, headers=headers)
        response_data = response.json()
        if "result" in response_data:
            profiles = response_data['result'].get('profiles', [])
            faces_format = response_data['result'].get('faces_format', "")
            faces_found = response_data['result'].get('faces_found', "")

            if existing_photo:
                existing_photo.search_results = json.dumps(response_data['result'])
                db.session.commit()

            logging.info('Успешный поиск лиц для изображения %s пользователем %s', image_id, user.email if user else 'Неизвестный пользователь')
            return jsonify({
                'profiles': profiles,
                'faces_format': faces_format,
                'faces_found': faces_found,
                'db': db_value
            })
        else:
            error_message = response_data.get("error", {}).get("message", "Unknown error")
            logging.error('Ошибка при поиске лиц: %s для пользователя %s', error_message, user.email if user else 'Неизвестный пользователь')
            raise Exception("Error searching faces: " + error_message)

    except Exception as e:
        logging.error('Исключение при поиске лиц для пользователя %s: %s', user.email if user else 'Неизвестный пользователь', str(e))
        return jsonify({'status': 'error', 'message': str(e)})

@app.route('/search/uploads/<filename>')
def uploaded_file(filename):
    user = get_current_user()
    logging.info('Запрос на скачивание файла %s пользователем %s', filename, user.email if user else 'Неизвестный пользователь')
    return send_from_directory(app.config['UPLOAD_FOLDER'], filename)

# New admin routes
@app.route('/admin/users')
def admin_users():
    if not is_admin():
        logging.warning('Попытка доступа к /admin/users неадминистратором %s', get_current_user().email if get_current_user() else 'Неизвестный пользователь')
        abort(403)  # доступ запрещен
    users = User.query.all()
    logging.info('Доступ к /admin/users администратором %s', get_current_user().email if get_current_user() else 'Неизвестный пользователь')
    return render_template('admin_users.html', users=users)

@app.route('/admin')
def admin():
    if not is_admin():
        logging.warning('Попытка доступа к админской панели неадминистратором %s', get_current_user().email if get_current_user() else 'Неизвестный пользователь')
        abort(403)  # доступ запрещен
    logging.info('Доступ к админской панели администратором %s', get_current_user().email if get_current_user() else 'Неизвестный пользователь')
    users = User.query.all()
    return render_template('admin_users.html', current_page='admin', users=users)

@app.route('/admin/download/<int:user_id>')
def download_photos(user_id):
    if not is_admin():
        logging.warning('Попытка доступа к скачиванию фотографий неадминистратором %s', get_current_user().email if get_current_user() else 'Неизвестный пользователь')
        abort(403)  # доступ запрещен

    user = User.query.get_or_404(user_id)
    photos = UploadedPhoto.query.filter_by(user_id=user.id).all()

    if not photos:
        logging.info('Фотографии не найдены для пользователя %s', user.email)
        return jsonify({'status': 'error', 'message': 'Фотографии не найдены'})

    unique_photos = {}
    for photo in photos:
        photo_path = os.path.join(app.config['UPLOAD_FOLDER'], photo.filename)
        if os.path.isfile(photo_path):
            file_hash = hashlib.md5(open(photo_path, 'rb').read()).hexdigest()
            unique_photos[file_hash] = photo_path

    zip_filename = f'{user.email}_photos.zip'
    zip_filepath = os.path.join('uploads', zip_filename)

    with zipfile.ZipFile(zip_filepath, 'w') as zipf:
        for photo_path in unique_photos.values():
            zipf.write(photo_path, os.path.basename(photo_path))

    return send_file(zip_filepath, as_attachment=True, download_name=zip_filename)


@app.route('/admin/delete/<int:user_id>', methods=['DELETE'])
def delete_user(user_id):
    if not is_admin():
        logging.warning('Попытка удаления пользователя неадминистратором %s', get_current_user().email if get_current_user() else 'Неизвестный пользователь')
        abort(403)  # доступ запрещен

    user = User.query.get_or_404(user_id)
    db.session.delete(user)
    db.session.commit()
    logging.info('Пользователь %s удален администратором %s', user.email, get_current_user().email if get_current_user() else 'Неизвестный пользователь')
    return jsonify({'status': 'success', 'message': 'Пользователь удален'})
