# ✅ MUST BE FIRST - before any other imports
import os
os.environ["OBJC_DISABLE_INITIALIZE_FORK_SAFETY"] = "YES"

from redis import Redis
from rq import Queue

# ✅ Fixed: port must be integer, not string
queue = Queue(connection=Redis(host="localhost", port=6379))
