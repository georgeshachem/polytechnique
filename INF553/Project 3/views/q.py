from flask import render_template, request
from app import app
import psycopg2


@app.route("/q1")
def q1():
    db_name = request.args.get("d")
    if db_name:
        config = app.config['POSTGRES_CONFIG']
        con = psycopg2.connect(host=config["host"], database=db_name,
                                user=config["user"], password=config["password"], port=config["port"])
        try:
            query = "SELECT relname FROM pg_stat_user_tables;"
            cur = con.cursor()
            cur.execute(query)
            query_result = [x[0] for x in cur.fetchall()]
        finally:
            con.close()
        return render_template('results/q1.html', db_name=db_name, query_result=query_result)
    else:
        return "No database provided"


@app.route("/q4")
def q4():
    db_name = request.args.get("d")
    table_name = request.args.get("t")
    if db_name and table_name:
        config = app.config['POSTGRES_CONFIG']
        con = psycopg2.connect(host=config["host"], database=db_name,
                                user=config["user"], password=config["password"], port=config["port"])
        try:
            query = """select
                            c.oid,
                            c.relname,
                            a.amname
                        from
                            pg_class c,
                            pg_namespace n,
                            pg_am a
                        where
                            (
                                c.relkind = 'r'
                                or c.relkind = 'i'
                            )
                            and n.oid = c.relnamespace
                            and not(
                                nspname like 'pg_%%'
                                or nspname = 'information schema'
                            )
                            and c.relam = a.oid
                            AND c.relname = %s;"""
            cur = con.cursor()
            cur.execute(query, (table_name, ))
            query_result = cur.fetchall()
        finally:
            con.close()
        return render_template('results/q4.html', db_name=db_name, table_name=table_name, query_result=query_result)
    else:
        return "No database or table name provided"


@app.route("/q5")
def q5():
    db_name = request.args.get("d")
    table_name = request.args.get("t")
    if db_name and table_name:
        config = app.config['POSTGRES_CONFIG']
        con = psycopg2.connect(host=config["host"], database=db_name,
                                user=config["user"], password=config["password"], port=config["port"])
        try:
            query = """with mytables as (
                        select
                            c.oid,
                            c.relname
                        from
                            pg_class c,
                            pg_namespace n
                        where
                            c.relkind = 'r'
                            and n.oid = c.relnamespace
                            and not(
                                nspname like 'pg_%%'
                                or nspname = 'information_schema'
                            )
                    )
                    select
                        t.relname,
                        a.attname,
                        y.typname
                    from
                        mytables t,
                        pg_attribute a,
                        pg_type y
                    where
                        t.oid = a.attrelid
                        and a.atttypid = y.oid
                        and y.typname = 'varchar'
                        and t.relname = %s;"""
            cur = con.cursor()
            cur.execute(query, (table_name, ))
            query_result = cur.fetchall()
        finally:
            con.close()
        return render_template('results/q5.html', db_name=db_name, table_name=table_name, query_result=query_result)
    else:
        return "No database or table name provided"
