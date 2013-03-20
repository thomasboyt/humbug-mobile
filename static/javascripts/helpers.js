// various utilities and dom manipulation stuff

define([], {
  chatOpen: false,
  isLoading: true,
  showChatEntry: function() {
    this.chatOpen = true;
    $("#bottom-bar").addClass("hidden");
    $("#chat-entry").addClass("visible");
    $("#chat-container").addClass("withChatEntry");
  },
  hideChatEntry: function() {
    this.chatOpen = false;
    $("#chat-entry").removeClass("visible");
    $("#bottom-bar").removeClass("hidden");
    $("#chat-container").removeClass("withChatEntry");
  },
  toggleLoading: function() {
    this.isLoading = !this.isLoading;
    $("#bottom-bar .buttons-container").toggle();
    $("#bottom-bar #loading-spinner").toggle();
  },
});

