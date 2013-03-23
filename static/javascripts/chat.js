define(['models/stream', 'models/message', 'templates', 'views/message_view', "views/chat_view", "ws_adapter", "helpers"], function(Stream, Message, templates, MessageView, ChatView, HumbugWS, helpers) { 

  // Initialize Collections
  var MessageCollection = Backbone.Collection.extend({
    model: Message
  });
  var messageCollection = new MessageCollection();

  var StreamCollection = Backbone.Collection.extend({
    model: Stream
  });
  var streamCollection = new StreamCollection();

  // Initialize WebSocket adapter thing
  
  var humbugWS = new HumbugWS(messageCollection, streamCollection);

  humbugWS.on("connecting", function() {
    helpers.showLoading();
  });
  humbugWS.on("connected", function() {
    helpers.online = true;
  });
  humbugWS.on("loaded:messages", function() {
    helpers.hideLoading();
  });
  humbugWS.on("connection_lost", function() {
    helpers.online = false;
    helpers.hideChatEntry();
    helpers.showRetry();
  });

  // Misc View Stuff
  
  var chatView = new ChatView({
    collection: messageCollection,
    el: $("#chat-container")
  });
 
  $("#bottom-bar #reply").click(function() {
    helpers.showChatEntry();
  });
  $("#bottom-bar #reconnect").click(function() {
    humbugWS.open();
  });
  $("#chat-container").click(function() {
    if (helpers.chatOpen) 
      helpers.hideChatEntry();
  });
  
  $("form input, form select").attr("disabled", false);
  
  streamCollection.on("reset", function(streams) {
    streams.forEach(function(stream) {
      var option = $("<option value='" + stream.get("name") + "'>");
      option.text(stream.get("name"));
      $(".stream-selector").append(option);

      $("form input, form select").attr("disabled", false);
    });
  });

  $("#chat-entry #send").submit(function(e) {
    e.preventDefault();
    var data = {
      content: $(".message-entry").val(),
      stream: $(".stream-selector").val(),
      subject: $(".subject-entry").val()
    };

    humbugWS.send("new_message", data);

    $(".message-entry").val("");
    helpers.hideChatEntry();
    $("#chat-container").scrollTop($("#chat-container")[0].scrollHeight);
  });
 
});
