from tornado.wsgi import WSGIContainer
from tornado.ioloop import IOLoop
from tornado.websocket import WebSocketHandler
from tornado.web import Application, RequestHandler, FallbackHandler

import redis
import json
import os
import threading
import humbug

import config

rdb = redis.StrictRedis(host='localhost', port=6379, db=0)

hb_client = humbug.Client(
    api_key = config.API_KEY,
    email = config.EMAIL,
    verbose = True)

connections = []

class WSHandler(WebSocketHandler):
    def open(self):
        connections.append(self)

        # load initial messages
        msgs = rdb.lrange("messages", -21, -1)
        print msgs
        for msg_str in msgs:
            self.write_message(msg_str)

    def on_message(self, message):
        return

    def on_close(self):
        connections.remove(self) 

def receiver(message):
    print message
    msg = {
        "stream": message["display_recipient"],
        "subject": message['subject'],
        "sender": message['sender_email'],
        'content': message['content']
    }
    msg_str = json.dumps(msg)
    rdb.rpush("messages", msg_str)
    push_message(msg_str)

class IndexHandler(RequestHandler):
    def get(self):
        self.render("templates/index.html")

class ChatHandler(RequestHandler):
    def get(self):
        self.render("templates/chat.html")

def push_message(msg_str):
    for socket in connections:
        socket.write_message(msg_str)

static_path = os.path.join(os.path.dirname(__file__), "static")

tornado_app = Application([
    (r'/', IndexHandler),
    (r'/chat', ChatHandler),
    (r'/websocket', WSHandler),
], debug=True, static_path=static_path)

def humbug_thread():
    hb_client.call_on_each_message(receiver)

if (__name__ == "__main__"):
    t = threading.Thread(target=humbug_thread)
    t.setDaemon(True)
    t.start()

    tornado_app.listen(5001)
    IOLoop.instance().start()
