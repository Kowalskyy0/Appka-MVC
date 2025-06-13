from flask import Flask, render_template
from extensions import db
from controllers.announcements import announcements_bp
from controllers.admin import admin_bp

app = Flask(__name__)
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///database.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.config['SECRET_KEY'] = 'tajny_klucz'
app.config['UPLOAD_FOLDER'] = 'static/uploads'

db.init_app(app)

import models

from controllers.auth import auth_bp

app.register_blueprint(auth_bp, url_prefix='/api/auth')
app.register_blueprint(announcements_bp, url_prefix='/api/announcements')
app.register_blueprint(admin_bp, url_prefix='/api/admin')

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/admin')
def admin_panel():
    return render_template('admin.html')

if __name__ == '__main__':
    with app.app_context():
        db.create_all()
        from models import User
        if not User.query.first():
            admin = User(username='admin', password='admin', is_admin=True)
            db.session.add(admin)
            db.session.commit()
    app.run(debug=True)
