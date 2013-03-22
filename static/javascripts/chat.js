define(['models/stream', 'models/message', 'templates', 'views/message_view', "views/chat_view", "ws_wrapper", "helpers"], function(Stream, Message, templates, MessageView, ChatView, WSWrapper, helpers) { 

  // Initialize Collections
  var MessageCollection = Backbone.Collection.extend({
    model: Message
  });
  var messageCollection = new MessageCollection();

  var StreamCollection = Backbone.Collection.extend({
    model: Stream
  });
  var streamCollection = new StreamCollection();

  var chatView = new ChatView({
    collection: messageCollection,
    el: $("#chat-container")
  });

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
    var data = JSON.parse(evt.data);
    if (data.error) {
      this.didError = true;
      this.ws.close();

      alert("Mysterious Humbug error. Try refreshing?");

      return;
    }
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
            })[0],
          });
          localStorage.setItem('last_id', message.id);
          messageCollection.add(messageObject);
        }
      });

      if (helpers.isLoading) helpers.toggleLoading();
    }
    else {
      var message = new Message(data);
      messageCollection.add(message);
    }
  };

  wsWrapper.onerror = function(e) {
    this.ws.close();
    console.log(e);
  };

  wsWrapper.onclose = function(e) {
    // attempt to reopen
    if (!this.didError && !this.triedReopen) {
      this.triedReopen = true;
      this.open();
    }
    else {
      //var shouldRetry = confirm("Connection to Humbug Mobile lost. Retry?");
      helpers.showRetry();
      /*if (shouldRetry) {
        this.didError = false;
        this.triedReopen = true;
        this.open();
      }*/
    }
  };

  // used on future reconnections
  wsWrapper.onopen = function() {
    this.triedReopen = false;
    helpers.toggleLoading();
    this.send("load_since", {id: localStorage.getItem("last_id")});
  };
 
  wsWrapper.open();

  // used on initial load
  wsWrapper.ws.onopen = function() {
    this.send("load_initial");
  }.bind(wsWrapper);
  
  // View-ish stuff
 
  $("#bottom-bar #reply").click(function() {
    helpers.showChatEntry();
  });
  $("#chat-container").click(function() {
    if (helpers.chatOpen) 
      helpers.hideChatEntry();
  });
  
  $("form input, form select").attr("disabled", false);

  $("#chat-entry #send").submit(function(e) {
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
