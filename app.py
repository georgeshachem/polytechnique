from flask import Flask
from database import db

app = Flask(__name__)
app.config.from_object('config.Config')

db.init_app(app)
