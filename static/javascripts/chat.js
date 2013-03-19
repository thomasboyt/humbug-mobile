define(['models/stream', 'models/message', 'templates'], function(Stream, Message, templates) { 
  var chatboxTemplate = templates['templates/underscore/chatbox.html'];

  var MessageCollection = Backbone.Collection.extend({
    model: Message
  });
  var messageCollection = new MessageCollection();

  var StreamCollection = Backbone.Collection.extend({
    model: Stream
  });
  var streamCollection = new StreamCollection();

  streamCollection.on("reset", function(streams) {
    streams.forEach(function(stream) {
      console.log(stream.get("name"))
      var option = $("<option value='" + stream.get("name") + "'>");
      option.text(stream.get("name"));
      $(".stream-selector").append(option);
    });
  });

  // So I'd like to split this out to a separate module, at least the part
  // where it's not dependant on messageCollection, but the problem is that
  // when the ws is reopened, it has to be completely reset with a new(),
  // meaning that it has to rebind onmessage and onclose... no more elegant
  // way to do that, unfortunately.

  var ws; //ssssssh. I know what you're saying. There's reasoning here.
  var createWebSocket = function() {
    var loc = window.location, new_uri;
    if (loc.protocol === "https:") {
        new_uri = "wss:";
    } else {
        new_uri = "ws:";
    }
    new_uri += "//" + loc.host;
    new_uri += loc.pathname + "websocket";

    ws = new WebSocket(new_uri);

    ws.onmessage = function (evt) {
      if (evt.data == "error") {
        alert("Humbug connection error.");
        return;
      }
      var data = JSON.parse(evt.data);
      if (data['subscriptions']) {
        streamCollection.reset(data['subscriptions']);
      }
      else {
        var message = new Message(data);
        messageCollection.add(message);
      }
    };

    ws.onerror = function(e) {
      alert("WS error");
      console.log(e);
    };

    ws.onclose = function(e) {
      // attempt to reopen
      createWebSocket(); // see? told you there'd be a reason.
    }
  }

  createWebSocket();
  // MessageView
  // Depends on: a message collection

  var MessageView = Backbone.View.extend({
    template: chatboxTemplate,

    addMessage: function(newMessage, addName) {
      if (addName) {
        this.$(".messages").append("<div class='name'>" + newMessage.get("sender") + ("</div>"));
      }
      this.$(".messages").append("<p class='content'>" + newMessage.get("content") + "</p>");
    },

    render: function() {
      this.$el.html(this.template(this.model.attributes));
      return this;
    }
  });
  var messageViews = [];

  messageCollection.on("add", function(newMessage) {
    var last = messageCollection.at(messageCollection.length-2);
    if (last && last.get("subject") == newMessage.get("subject") &&
        last.get("stream") == newMessage.get("stream")) {
      var addName = !(last.get("sender") == newMessage.get("sender"));
      messageViews[messageViews.length-1].addMessage(newMessage, addName);
    }
    else {
      var view = new MessageView({
        model: newMessage
      });
      $("#chat-container").append(view.render().el);
      messageViews.push(view);
    }
  });

  $("form#send").submit(function(e) {
    e.preventDefault();
    // lazy for now
    var last = messageCollection.at(messageCollection.length-1);
    var data = {
      content: $(".message-entry").val(),
      stream: $(".stream-selector").val(),
      subject: $(".subject-entry").val()
    };
    $(".message-entry").val("");
    ws.send(JSON.stringify(data));
  });

  
});
