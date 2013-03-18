define(['message', 'templates'], function(Message, templates) { 
  var chatboxTemplate = templates['templates/underscore/chatbox.html'];

  var MessageCollection = Backbone.Collection.extend({
    model: Message
  });
  var messageCollection = new MessageCollection();

  var ws = new WebSocket("ws://localhost:5001/websocket");
  ws.onmessage = function (evt) {
    if (evt.data == "error") {
      alert("Humbug connection error.");
      return;
    }
    var message = new Message(JSON.parse(evt.data));
    messageCollection.add(message);
  };

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
      var addName = true;
      if (last.get("sender") == newMessage.get("sender"))
        addName = false;
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
      stream: last.get("stream"),
      subject: last.get("subject")
    };
    $(".message-entry").val("");
    ws.send(JSON.stringify(data));
  });

  // throw in fixtures
  messageCollection.add({
    sender: "Test A",
    stream: "Example Stream",
    subject: "Example Subject",
    content: "Blah blah blah."
  })
  
  messageCollection.add({
    sender: "Test A",
    stream: "Example Stream",
    subject: "Example Subject",
    content: "Follow up: blah?"
  });

  messageCollection.add({
    sender: "Test B",
    stream: "Example Stream",
    subject: "Example Subject",
    content: "Response: blergh."
  });

  messageCollection.add({
    sender: "Test A",
    stream: "A wholly unrelated stream",
    subject: "Some other subject",
    content: "belch."
  });
});
