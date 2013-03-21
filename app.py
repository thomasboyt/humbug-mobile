from tornado.wsgi import WSGIContainer
from tornado.ioloop import IOLoop
from tornado.websocket import WebSocketHandler
from tornado.web import Application, RequestHandler, FallbackHandler, asynchronous
from tornado import httpclient

import json
import os
import urllib
import logging
from datetime import datetime, timedelta

import markdown

import config

logging.getLogger().setLevel(config.LOG_LEVEL)
log = logging

http_client = httpclient.AsyncHTTPClient(max_clients=config.MAX_REQUESTS)

class WSHandler(WebSocketHandler):
    
    # WS methods

    def open(self):
        log.info("WS: Client %s opened connection" % (self.request.remote_ip))
        self.api_key = self.get_cookie("api_key")
        self.email = self.get_cookie("email")
        self.humbug_message_init()
                    
    def on_message(self, message): 
        try:
            message = json.loads(message)
        except:
            log.warn("Malformed JSON ignored.")
            return

        if message["method"] == "load_initial":
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

        elif message["method"] == "load_since":
            last_id = message['data']['id']

            data = {
                "api-key": self.api_key,
                "email": self.email,
                "anchor": int(last_id) + 1,
                "num_before": 0,
                "num_after": 1000 #this could admittingly use some finessing
            }
            
            http_client.fetch("https://humbughq.com/api/v1/get_old_messages",
                self.pass_message,
                method="POST",
                body=urllib.urlencode(data)
            )
        
        elif message["method"] == "new_message":
            new_message = message["data"]
            data = {
                "type": "stream",
                "to": unicode(new_message['stream']).encode('utf-8'),
                "subject": unicode(new_message['subject']).encode('utf-8'),
                "content": unicode(new_message['content']).encode('utf-8'),
                'api-key': self.api_key,
                'email': self.email
            }
            http_client.fetch("https://humbughq.com/api/v1/send_message",
                None,
                method="POST",
                request_timeout=None,
                body=urllib.urlencode(data)
            )

        else:
            log.warn("Ignored nonexistant method call (%s)" % (message["method"]))

    def on_close(self):
        log.info("WS: Client %s closed connection" % self.request.remote_ip)
        return

    # Callbacks

    def pass_message(self, response):
        log.debug("Passing message...")
        if not self.ws_connection:
            # ws was closed
            return False
        if not response.code == 200:
            log.error("Humbug request failed: %s", response.error)

            self.write_message(json.dumps({
                "code": response.code,
                "error": response.code
            }))
            return False

        data = json.loads(response.body)
        if 'messages' in data:
            for message in data['messages']:
                message['content'] = markdown.markdown(message['content'],  ['fenced_code', 'linkify'], safe_mode="escape")
        write_data = json.dumps(data)
        self.write_message(write_data)

        return True

    def recursive_cb(self, response):
        should_recurse = self.pass_message(response)
        if should_recurse:
            self.humbug_message_init()

    def get_prior_cb(self, response):
        log.debug("Passing message...") 
        # for now, just load 20 previous messages
        # in the future: load below cursor, possibly lazy-load backwards?

        if not self.ws_connection:
            # ws was closed
            return
        if not response.code == 200:
            log.error("Humbug request failed: %s", response.error)

            self.write_message(json.dumps({
                "code": response.code,
                "error": response.code
            }))
            return
 
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
    def check_cb(self, response):
        if response.error:
            self.send_error(400)
        else:
            exprires = datetime.now() + timedelta(days=30)
            self.set_cookie("email", self.email, expires=expires)
            self.set_cookie("api_key", self.api_key, expires=expires)
        self.finish()

    @asynchronous
    def post(self):
        self.email = self.get_argument("email")
        self.api_key = self.get_argument("api_key")

        if (self.email and self.api_key):
            http_client.fetch("https://humbughq.com/api/v1/get_profile",
                self.check_cb,
                method="POST",
                body=urllib.urlencode({
                    "email": self.email,
                    "api-key": self.api_key
                })
            )
            

static_path = os.path.join(os.path.dirname(__file__), "static")

tornado_app = Application([
    (r'/', IndexHandler),
    (r'/login', LoginHandler),
    (r'/websocket', WSHandler),
], debug=True, static_path=static_path)

if (__name__ == "__main__"):
    tornado_app.listen(config.PORT)
    IOLoop.instance().start()
