// various utilities and dom manipulation stuff

define([], {
  chatOpen: false,
  showChatEntry: function(e) {
    console.log("Showing chat entry");
    $("#bottom-bar").addClass("hidden");
    $("#chat-entry").addClass("visible");
    $("#chat-container").addClass("withChatEntry");
    this.chatOpen = true;
  },
  hideChatEntry: function(e) {
    console.log("Hiding chat entry");
    $("#chat-entry").removeClass("visible");
    $("#bottom-bar").removeClass("hidden");
    $("#chat-container").removeClass("withChatEntry");
    this.chatOpen = false;
  }
});

