from flask import Blueprint, request, jsonify, session
from models import Announcement, User
from extensions import db

admin_bp = Blueprint('admin', __name__)

def is_admin():
    user_id = session.get('user_id')
    if user_id:
        user = User.query.get(user_id)
        return user.is_admin
    return False

@admin_bp.route('/announcements/<int:announcement_id>', methods=['PUT'])
def edit_announcement(announcement_id):
    if not is_admin():
        return jsonify({'error': 'Brak uprawnień'}), 403

    data = request.get_json()
    announcement = Announcement.query.get(announcement_id)
    if not announcement:
        return jsonify({'error': 'Ogłoszenie nie istnieje'}), 404

    announcement.title = data.get('title', announcement.title)
    announcement.description = data.get('description', announcement.description)
    announcement.price = data.get('price', announcement.price)
    db.session.commit()
    return jsonify({'message': 'Ogłoszenie zaktualizowane', 'announcement': announcement.to_dict()})

@admin_bp.route('/announcements/<int:announcement_id>', methods=['DELETE'])
def delete_announcement(announcement_id):
    if not is_admin():
        return jsonify({'error': 'Brak uprawnień'}), 403

    announcement = Announcement.query.get(announcement_id)
    if not announcement:
        return jsonify({'error': 'Ogłoszenie nie istnieje'}), 404

    db.session.delete(announcement)
    db.session.commit()
    return jsonify({'message': 'Ogłoszenie usunięte'})