from app import app

from views.index import *
from views.errors import *
from views.q import *
from views.db_config import *

if __name__ == '__main__':
    app.run()
