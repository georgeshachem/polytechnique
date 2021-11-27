class Config(object):
    DEBUG = True
    TESTING = True
    SECRET_KEY = 'my_super_secret_key'
    SQLALCHEMY_DATABASE_URI = "postgresql://postgres:password@localhost/georges"