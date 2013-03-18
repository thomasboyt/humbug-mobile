from tornado.wsgi import WSGIContainer
from tornado.ioloop import IOLoop
from tornado.websocket import WebSocketHandler
from tornado.web import Application, RequestHandler, FallbackHandler
from tornado import httpclient

import json
import os
import urllib

import humbug

#import config

http_client = httpclient.AsyncHTTPClient()

class WSHandler(WebSocketHandler):
    def open(self):
        self.api_key = self.get_cookie("api_key")
        self.email = self.get_cookie("email")
        self.humbug_message_init()

    def on_message(self, message): 
        message = json.loads(message)
        data = {
            "type": "stream",
            "to": message['stream'],
            "subject": message['subject'],
            "content": message['content'],
            'api-key': self.api_key,
            'email': self.email
        }
        http_client.fetch("https://humbughq.com/api/v1/send_message",
            None,
            method="POST",
            request_timeout=None,
            body=urllib.urlencode(data)
        )

        return

    def callback(self, response):
        if not self.ws_connection:
            # ws was closed
            return
        if not response.code == 200:
            print "Connection failed:"
            print response

            self.write_message("error")
            return

        messages = json.loads(response.body)['messages']
        print messages
        for data in messages:
            msg = {
                "stream": data["display_recipient"],
                "subject": data['subject'],
                "sender": data['sender_full_name'],
                'content': data['content']
            }
            self.write_message(msg)
        self.humbug_message_init()

    def humbug_message_init(self):
        data = {
            'api-key': self.api_key,
            'email': self.email
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
        if self.get_cookie("email") and self.get_cookie("api_key"):
            self.render("templates/chat.html")
        else:
            self.render("templates/login.html")
            
class LoginHandler(RequestHandler):
    def post(self):
        email = self.get_argument("email")
        api_key = self.get_argument("api_key")
        if (email and api_key):
            self.set_cookie("email", email)
            self.set_cookie("api_key", api_key)


static_path = os.path.join(os.path.dirname(__file__), "static")

tornado_app = Application([
    (r'/', IndexHandler),
    (r'/login', LoginHandler),
    (r'/websocket', WSHandler),
], debug=True, static_path=static_path)

if (__name__ == "__main__"):
    tornado_app.listen(config.PORT)
    IOLoop.instance().start()
