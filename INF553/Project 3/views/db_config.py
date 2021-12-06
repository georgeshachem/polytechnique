import re
from flask import render_template, request, redirect, url_for
from app import app
import psycopg2


@app.route("/db_config", methods=['GET', 'POST'])
def db_config():
    if request.method == 'POST':
        form_data = request.form

        app.config['POSTGRES_CONFIG']['host'] = form_data["postgres_host"]
        app.config['POSTGRES_CONFIG']['database'] = form_data["postgres_database"]
        app.config['POSTGRES_CONFIG']['user'] = form_data["postgres_user"]
        app.config['POSTGRES_CONFIG']['password'] = form_data["postgres_password"]
        app.config['POSTGRES_CONFIG']['port'] = form_data["postgres_port"]

        try:
            con = psycopg2.connect(host=form_data["postgres_host"], database=form_data["postgres_database"],
                                user=form_data["postgres_user"], password=form_data["postgres_password"], port=form_data["postgres_port"])
        except psycopg2.OperationalError:
            return redirect(url_for('db_config'))
        try:
            cur = con.cursor()
            cur.execute("SELECT 1")
        except:
            return redirect(url_for('db_config'))
        finally:
            con.close()
            return redirect(url_for('index'))
    else:
        return render_template('db_config/db_config.html', postgres_config=app.config["POSTGRES_CONFIG"])
