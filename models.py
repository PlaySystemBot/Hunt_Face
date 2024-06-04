from main import db

class UploadedPhoto(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    filename = db.Column(db.String(150), nullable=False)
    response = db.Column(db.Text, nullable=False)
    search_results = db.Column(db.Text, nullable=True)
    user = db.relationship('User', backref=db.backref('photos', lazy=True))

class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    email = db.Column(db.String(150), unique=True, nullable=False)
    password = db.Column(db.String(150), nullable=False)
    confirmed = db.Column(db.Boolean, default=False)
