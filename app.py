from tornado.wsgi import WSGIContainer
from tornado.ioloop import IOLoop
from tornado.websocket import WebSocketHandler
from tornado.web import Application, RequestHandler, FallbackHandler
from tornado import httpclient

import json
import os
import urllib

import humbug

import config

hb_client = humbug.Client(
    api_key = config.API_KEY,
    email = config.EMAIL,
    verbose = True)

http_client = httpclient.AsyncHTTPClient()

class WSHandler(WebSocketHandler):
    def open(self):
        # load initial messages
        self.humbug_message_init()

    def on_message(self, message): 
        return

    def callback(self, response):
        # do stuff with message
        messages = json.loads(response.body)['messages']
        for data in messages:
            msg = {
                "stream": data["display_recipient"],
                "subject": data['subject'],
                "sender": data['sender_email'],
                'content': data['content']
            }
            self.write_message(msg)
        self.humbug_message_init()

    def humbug_message_init(self):
        data = {
            'api-key': config.API_KEY,
            'email': config.EMAIL
        }

        http_client.fetch("https://humbughq.com/api/v1/get_messages",
            self.callback,
            method="POST",
            request_timeout=None,
            body=urllib.urlencode(data)
        )

    def on_close(self):
        return

class IndexHandler(RequestHandler):
    def get(self):
        self.render("templates/index.html")

class ChatHandler(RequestHandler):
    def get(self):
        #launch_humbug_thread()
        self.render("templates/chat.html")

static_path = os.path.join(os.path.dirname(__file__), "static")

tornado_app = Application([
    (r'/', IndexHandler),
    (r'/chat', ChatHandler),
    (r'/websocket', WSHandler),
], debug=True, static_path=static_path)

if (__name__ == "__main__"):
    tornado_app.listen(5001)
    IOLoop.instance().start()
