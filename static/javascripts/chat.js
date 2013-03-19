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
      else if (data['messages']) {
        data['messages'].forEach(function (message) {
          if (message.type === "stream") {
            var messageObject = new Message({
              content: message.content,
              sender: message.sender_full_name,
              subject: message.subject,
              stream: message.display_recipient
            });
            messageCollection.add(messageObject);
          }
        });
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
  ws.onopen = function() {
    ws.send("load_initial");
  };

  var MessageView = Backbone.View.extend({
    template: chatboxTemplate,

    addMessage: function(newMessage, addName) {
      if (addName) {
        this.$(".messages").append("<div class='name'>" + newMessage.get("sender") + ("</div>"));
      }
      this.$(".messages").append("<div class='content'>" + newMessage.get("content") + "</div>");
    },

    render: function() {
      this.$el.html(this.template(this.model.attributes));
      
      // todo: just have a message have a stream association
      var stream = streamCollection.where({name: this.model.get("stream")})[0];
      if (stream)
        this.$(".header").css("background-color", stream.get("color"));

      this.$el.click(function(e) {
        $(".stream-selector").val(this.model.get("stream"));
        $(".subject-entry").val(this.model.get("subject"));
      }.bind(this));
      return this;
    }
  });
  var messageViews = [];

  messageCollection.on("add", function(newMessage) {
    var scrollHeight = $("#chat-container")[0].scrollHeight;
    var viewportHeight = $("#chat-container").height();
    var scrollTop = $("#chat-container").scrollTop();
    var isScrolledBottom = (scrollHeight - viewportHeight == scrollTop);
    console.log(scrollHeight);
    console.log(viewportHeight);
    console.log(scrollHeight - viewportHeight);
    console.log(scrollTop);
    console.log('---');

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

    if (isScrolledBottom) {
      $("#chat-container").scrollTop(scrollHeight);
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
