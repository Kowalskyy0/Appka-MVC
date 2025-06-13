from flask import Blueprint, request, jsonify, session, current_app
from models import Announcement, User
from extensions import db
import os
from werkzeug.utils import secure_filename

announcements_bp = Blueprint('announcements', __name__)

def get_current_user():
    user_id = session.get('user_id')
    if user_id:
        return User.query.get(user_id)
    return None

@announcements_bp.route('/', methods=['GET'])
def list_announcements():
    announcements = Announcement.query.order_by(Announcement.created_at.desc()).all()
    return jsonify([a.to_dict() for a in announcements])

@announcements_bp.route('/', methods=['POST'])
def add_announcement():
    user = get_current_user()
    if not user:
        return jsonify({'error': 'Musisz być zalogowany, aby dodać ogłoszenie'}), 401

    if request.content_type.startswith('multipart/form-data'):
        title = request.form.get('title')
        description = request.form.get('description')
        price = request.form.get('price')
        category = request.form.get('category', 1)
        image_file = request.files.get('image')
    else:
        data = request.get_json()
        if not data:
            return jsonify({'error': 'Brak danych'}), 400
        title = data.get('title')
        description = data.get('description')
        price = data.get('price')
        category = data.get('category', 1)
        image_file = None

    if not title or not description or price is None:
        return jsonify({'error': 'Wypełnij wszystkie pola'}), 400

    try:
        price = float(price)
    except ValueError:
        return jsonify({'error': 'Cena musi być liczbą'}), 400

    image_path = None
    if image_file:
        filename = secure_filename(image_file.filename)
        upload_folder = os.path.join(current_app.root_path, current_app.config.get('UPLOAD_FOLDER', 'static/uploads'))
        os.makedirs(upload_folder, exist_ok=True)
        file_path = os.path.join(upload_folder, filename)
        image_file.save(file_path)
        image_path = '/static/uploads/' + filename

    new_announcement = Announcement(
        title=title,
        description=description,
        price=price,
        category=int(category),
        image=image_path,
        user_id=user.id
    )
    db.session.add(new_announcement)
    db.session.commit()
    return jsonify({'message': 'Ogłoszenie dodane', 'announcement': new_announcement.to_dict()})

@announcements_bp.route('/<int:announcement_id>', methods=['PUT'])
def update_announcement(announcement_id):
    user = get_current_user()
    if not user:
        return jsonify({'error': 'Musisz być zalogowany'}), 401

    announcement = Announcement.query.get(announcement_id)
    if not announcement:
        return jsonify({'error': 'Ogłoszenie nie istnieje'}), 404

    if not (user.is_admin or announcement.user_id == user.id):
        return jsonify({'error': 'Brak uprawnień'}), 403

    data = request.get_json()
    announcement.title = data.get('title', announcement.title)
    announcement.description = data.get('description', announcement.description)
    announcement.price = data.get('price', announcement.price)
    db.session.commit()
    return jsonify({'message': 'Ogłoszenie zaktualizowane', 'announcement': announcement.to_dict()})

@announcements_bp.route('/<int:announcement_id>', methods=['DELETE'])
def delete_announcement(announcement_id):
    user = get_current_user()
    if not user:
        return jsonify({'error': 'Musisz być zalogowany'}), 401

    announcement = Announcement.query.get(announcement_id)
    if not announcement:
        return jsonify({'error': 'Ogłoszenie nie istnieje'}), 404

    if not (user.is_admin or announcement.user_id == user.id):
        return jsonify({'error': 'Brak uprawnień'}), 403

    db.session.delete(announcement)
    db.session.commit()
    return jsonify({'message': 'Ogłoszenie usunięte'})
