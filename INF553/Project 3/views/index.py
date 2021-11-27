from flask import render_template
from app import app
from database import db


@app.route("/")
def index():
    all_db_names = [x[0] for x in db.engine.execute(
        'SELECT datname FROM pg_database;').fetchall()]
    return render_template('index/index.html', all_db_names=all_db_names)
