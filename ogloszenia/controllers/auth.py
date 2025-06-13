from flask import Blueprint, request, jsonify, session
from models import User
from extensions import db

auth_bp = Blueprint('auth', __name__)

@auth_bp.route('/login', methods=['POST'])
def login():
    data = request.get_json()
    if not data:
        return jsonify({'error': 'Brak danych'}), 400

    username = data.get('username')
    password = data.get('password')

    if not username or not password:
        return jsonify({'error': 'Podaj nazwę użytkownika i hasło'}), 400

    user = User.query.filter_by(username=username, password=password).first()
    if user:
        session['user_id'] = user.id
        return jsonify({'message': 'Zalogowano', 'user': user.to_dict()})
    else:
        return jsonify({'error': 'Niepoprawne dane logowania'}), 401

@auth_bp.route('/register', methods=['POST'])
def register():
    data = request.get_json()
    if not data:
        return jsonify({'error': 'Brak danych'}), 400

    username = data.get('username')
    password = data.get('password')

    if not username or not password:
        return jsonify({'error': 'Podaj nazwę użytkownika i hasło'}), 400

    if User.query.filter_by(username=username).first():
        return jsonify({'error': 'Użytkownik o tej nazwie już istnieje'}), 400

    new_user = User(username=username, password=password)
    db.session.add(new_user)
    db.session.commit()
    return jsonify({'message': 'Zarejestrowano pomyślnie'})

@auth_bp.route('/logout', methods=['POST'])
def logout():
    session.pop('user_id', None)
    return jsonify({'message': 'Wylogowano'})

@auth_bp.route('/check', methods=['GET'])
def check_session():
    user_id = session.get('user_id')
    if user_id:
        user = User.query.get(user_id)
        if user:
            return jsonify({'user': user.to_dict()})
    return jsonify({'user': None})
