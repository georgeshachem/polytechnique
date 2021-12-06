from flask import render_template, redirect, url_for
from app import app
import psycopg2


@app.route("/")
def index():
    config = app.config['POSTGRES_CONFIG']
    try:
        con = psycopg2.connect(host=config["host"], database=config["database"],
                               user=config["user"], password=config["password"], port=config["port"])
    except psycopg2.OperationalError:
        return redirect(url_for('db_config'))
    try:
        query = "SELECT datname FROM pg_database;"
        cur = con.cursor()
        cur.execute(query)
        all_db_names = [x[0] for x in cur.fetchall()]
    finally:
        con.close()
    return render_template('index/index.html', all_db_names=all_db_names)
