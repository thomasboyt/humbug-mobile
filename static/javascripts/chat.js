define(['message', 'templates'], function(Message, templates) { 
  var MessageCollection = Backbone.Collection.extend({
    model: Message
  });
  var messageCollection = new MessageCollection();

  var ws = new WebSocket("ws://localhost:5001/websocket");
  ws.onmessage = function (evt) {
     var message = new Message(JSON.parse(evt.data));
     messageCollection.add(message);
  };

  var MessageView = Backbone.View.extend({
    template: templates.chatbox,

    render: function() {
      this.$el.html(this.template(this.model.attributes));
      return this;
    }
  });

  messageCollection.on('add', function(newMessage) {
    var view = new MessageView({
      model: newMessage
    });
    $("#chat-container").append(view.render().el);
  });
});
