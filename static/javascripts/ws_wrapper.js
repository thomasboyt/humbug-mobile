// This utility class does three things:
// 1. Creates a WS URI from the current location
// 2. Allows websockets to be "reopened" without destroying their callbacks
// 3. Standardizes sent messages into a {method: "foo", data: {}} schema

define([], function() {
  var WSWrapper = function() {
    var loc = window.location;
    var newUri;
    if (loc.protocol === "https:") {
        newUri = "wss:";
    } else {
        newUri = "ws:";
    }
    newUri += "//" + loc.host;
    newUri += loc.pathname + "websocket";

    this.uri = newUri;
    this.didError = false;

    // no-op defaults so bind doesn't break
    this.onopen = function () {};
    this.onmessage = function () {};
    this.onerror = function () {};
    this.onclose = function() {};
  };
    
  WSWrapper.prototype.open = function() {
    this.ws = new WebSocket(this.uri);
    this.ws.onopen = this.onopen;
    this.ws.onmessage = this.onmessage;
    this.ws.onerror = this.onerror;
    this.ws.onclose = this.onclose;
  };

  WSWrapper.prototype.send = function(method, data) {
    var message = {
      method: method,
      data: data
    };

    this.ws.send(JSON.stringify(message));
  };

  return WSWrapper;

});
