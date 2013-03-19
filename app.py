from tornado.wsgi import WSGIContainer
from tornado.ioloop import IOLoop
from tornado.websocket import WebSocketHandler
from tornado.web import Application, RequestHandler, FallbackHandler
from tornado import httpclient

import json
import os
import urllib
import sys

import markdown
import humbug

import config

http_client = httpclient.AsyncHTTPClient()

class WSHandler(WebSocketHandler):
    
    # WS methods

    def open(self):
        self.api_key = self.get_cookie("api_key")
        self.email = self.get_cookie("email")
        # self.last_timestamp = self.get_cookie("last_timestamp")

        self.humbug_message_init()
            
    def on_message(self, message): 
        if (message == "load_initial"):
            print "Loading initial..."
            http_client.fetch("https://humbughq.com/api/v1/subscriptions/list",
                self.pass_message,
                method="POST",
                body=urllib.urlencode({ 
                    "api-key": self.api_key,
                    "email": self.email,
                })
            )

            http_client.fetch("https://humbughq.com/api/v1/get_profile",
                self.get_prior_cb,
                method="POST",
                body=urllib.urlencode({
                    "api-key": self.api_key,
                    "email": self.email
                })
            )
            return

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

    def on_close(self):
        return

    # Callbacks

    def pass_message(self, response):
        if not self.ws_connection:
            # ws was closed
            return
        if not response.code == 200:
            print "Connection failed:"
            print response

            self.write_message("error")
            return

        data = json.loads(response.body)
        # print data
        if 'messages' in data:
            for message in data['messages']:
                message['content'] = markdown.markdown(message['content'],  ['fenced_code'])
        write_data = json.dumps(data)
        self.write_message(write_data)

    def recursive_cb(self, response):
        self.pass_message(response)
        self.humbug_message_init()

    def get_prior_cb(self, response):
        # for now, just load 20 previous messages
        # in the future: load below cursor, possibly lazy-load backwards?
        max_message_id = json.loads(response.body)['max_message_id']
        http_client.fetch("https://humbughq.com/api/v1/get_old_messages",
            self.pass_message,
            method="POST",
            body=urllib.urlencode({
                "api-key": self.api_key,
                "email": self.email,
                "anchor": max_message_id,
                "num_before": 20,
                "num_after": 0
            })
        )

    def humbug_message_init(self):
        data = {
            'api-key': self.api_key,
            'email': self.email
        }

        http_client.fetch("https://humbughq.com/api/v1/get_messages",
            self.recursive_cb,
            method="POST",
            request_timeout=None,
            body=urllib.urlencode(data)
        )



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
