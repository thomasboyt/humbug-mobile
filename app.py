from tornado.wsgi import WSGIContainer
from tornado.ioloop import IOLoop
from tornado.websocket import WebSocketHandler
from tornado.web import Application, RequestHandler, FallbackHandler

import redis
import json
import os

rdb = redis.StrictRedis(host='localhost', port=6379, db=0)

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

class ReceiveHandler(RequestHandler):
    def post(self):
        message = json.loads(self.request.body)
        message['content'] = "<br />".join(message['lines'])
        del message['lines']
        msg_str = json.dumps(message)
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
    (r'/receiver', ReceiveHandler),
], debug=True, static_path=static_path)

if (__name__ == "__main__"):
    tornado_app.listen(5001)
    IOLoop.instance().start()
