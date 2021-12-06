class Config(object):
    DEBUG = True
    TESTING = True
    SECRET_KEY = 'my_super_secret_key'
    POSTGRES_CONFIG = {"host": "localhost",
                       "database": "",
                       "user": "postgres",
                       "password": "password",
                       "port":  5432}
