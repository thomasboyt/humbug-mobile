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
    this.ws.onopen = this.onopen.bind(this);
    this.ws.onmessage = this.onmessage.bind(this);
    this.ws.onerror = this.onerror.bind(this);
    this.ws.onclose = this.onclose.bind(this);
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
