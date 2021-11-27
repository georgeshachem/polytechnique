class Config(object):
    DEBUG = True
    TESTING = True
    SECRET_KEY = 'my_super_secret_key'
    POSTGRES_HOST = "localhost"
    POSTGRES_DATABASE = ""
    POSTGRES_USER = "postgres"
    POSTGRES_PASSWORD = "password"
    POSTGRES_PORT = 5432
    SQLALCHEMY_DATABASE_URI = "postgresql://{}:{}@{}:{}/{}".format(POSTGRES_USER, POSTGRES_PASSWORD, POSTGRES_HOST,POSTGRES_PORT, POSTGRES_DATABASE)
    SQLALCHEMY_TRACK_MODIFICATIONS = False