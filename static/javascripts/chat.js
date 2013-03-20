define(['models/stream', 'models/message', 'templates', 'views/message_view', "ws_wrapper"], function(Stream, Message, templates, MessageView, WSWrapper) { 
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

      $("form input, form select").attr("disabled", false);
    });
  });

  var wsWrapper = new WSWrapper()

  wsWrapper.onmessage = function (evt) {
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
            stream: streamCollection.where({
              "name": message.display_recipient
            })[0]
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

  wsWrapper.onerror = function(e) {
    alert("WS error");
    console.log(e);
  };

  wsWrapper.onclose = function(e) {
    // attempt to reopen
    this.open();
  };

  wsWrapper.open();
  wsWrapper.ws.onopen = function() {
    wsWrapper.send("load_initial");
  };

  // which message view should messages be pushed into if stream/subject
  // are the same
  var currentMessageView = undefined;

  messageCollection.on("add", function(newMessage) {
    var scrollHeight = $("#chat-container")[0].scrollHeight - 10;
    var viewportHeight = $("#chat-container").height();
    var scrollTop = $("#chat-container").scrollTop();
    var isScrolledBottom = (scrollHeight - viewportHeight == scrollTop);
    
    var last = messageCollection.at(messageCollection.length-2);
    if (last && last.get("subject") == newMessage.get("subject") &&
        last.get("stream") == newMessage.get("stream")) {
      var addName = !(last.get("sender") == newMessage.get("sender"));
      currentMessageView.addMessage(newMessage, addName);
    }
    else {
      var view = new MessageView({
        model: newMessage
      });
      $("#chat-container").append(view.render().el);
      currentMessageView = view;
    }

    if (isScrolledBottom) {
      $("#chat-container").scrollTop(scrollHeight);
    }

  });

  $("form#send").submit(function(e) {
    e.preventDefault();
    var data = {
      content: $(".message-entry").val(),
      stream: $(".stream-selector").val(),
      subject: $(".subject-entry").val()
    };

    wsWrapper.send("new_message", data);

    $(".message-entry").val("");
  });
 
});
