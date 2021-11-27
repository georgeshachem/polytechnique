class Config(object):
    DEBUG = True
    TESTING = True
    SECRET_KEY = 'my_super_secret_key'


class ProductionConfig(Config):
    DEBUG = False


class DevelopmentConfig(Config):
    DEBUG = True


class TestingConfig(Config):
    TESTING = True
