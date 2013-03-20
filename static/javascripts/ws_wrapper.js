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
