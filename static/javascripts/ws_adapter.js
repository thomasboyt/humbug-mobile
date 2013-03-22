define(['ws_wrapper', 'models/message', 'models/stream'], function(WSWrapper, Message, Stream) {
  var HumbugWS = function(messageCollection, streamCollection) {
    var wsWrapper = new WSWrapper();

    // state
    this.hasConnected = false;
    this.triedReopen = false;
    this.didError = false;

    wsWrapper.onopen = function(e) {
      this.didError = false;
      this.triedReopen = false;

      this.trigger("connected");
      if (this.hasConnected) {
        wsWrapper.send("load_since", {id: localStorage.getItem("last_id")});
      }
      else {
        wsWrapper.send("load_initial");
      }
    }.bind(this);

    wsWrapper.onerror = function(e) {
      wsWrapper.ws.close();
      console.log(e);
    }.bind(this);

    wsWrapper.onclose = function(e) {
      if (!this.didError && !this.triedReopen) {
        this.triedReopen = true;
        this.trigger("connecting");
        wsWrapper.open();
      }
      else {
        this.trigger("connection_lost");
      }
    }.bind(this);

    wsWrapper.onmessage = function(evt) {
      var data = JSON.parse(evt.data);
      if (data.error) {
        this.didError = true;
        wsWrapper.ws.close();
        return;
      }
      if (data['subscriptions']) {
        streamCollection.reset(data['subscriptions']);
        this.trigger("loaded:streams");
      }
      else if (data['messages']) {
        data['messages'].forEach(function (message) {
          if (message.type === "stream") {
            var messageObject = new Message({
              content: message.content,
              sender: message.sender_full_name,
              subject: message.subject,
              stream: streamCollection.where({
                "name": message.display_recipient
              })[0],
            });
            localStorage.setItem('last_id', message.id);
            messageCollection.add(messageObject);
          }
        });

        this.trigger("loaded:messages");
      }
    }.bind(this);

    wsWrapper.open();
  };

  _.extend(HumbugWS.prototype, Backbone.Events);
  
  return HumbugWS;
});
