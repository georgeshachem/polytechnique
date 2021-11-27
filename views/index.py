from flask import render_template, request
from app import app
from database import db


@app.route("/")
def index():
    db_name = request.args.get("q")
    if db_name:
        return db_name
    else:
        all_db_names = [x[0] for x in db.engine.execute(
            'SELECT datname FROM pg_database;').fetchall()]
        return render_template('index/index.html', all_db_names=all_db_names)


@app.route("/db")
def db_test():
    all_db_names = [x[0] for x in db.engine.execute(
        'SELECT datname FROM pg_database;').fetchall()]
    print(all_db_names)
    return all_db_names
