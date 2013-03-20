// various utilities and dom manipulation stuff

define([], {
  chatOpen: false,
  showChatEntry: function(e) {
    console.log("Showing chat entry");
    this.chatOpen = true;
    $("#bottom-bar").addClass("hidden");
    $("#chat-entry").addClass("visible");
    $("#chat-container").addClass("withChatEntry");
  },
  hideChatEntry: function(e) {
    console.log("Hiding chat entry");
    this.chatOpen = false;
    $("#chat-entry").removeClass("visible");
    $("#bottom-bar").removeClass("hidden");
    $("#chat-container").removeClass("withChatEntry");
  }
});

