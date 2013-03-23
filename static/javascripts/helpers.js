// various utilities and dom manipulation stuff

define([], {
  chatOpen: false,
  online: false,
  showChatEntry: function() {
    if (this.online) {
      this.chatOpen = true;
      $("#bottom-bar").addClass("hidden");
      $("#chat-entry").addClass("visible");
      $("#chat-container").addClass("withChatEntry");
      $("#chat-container").scrollTop($("#chat-container").scrollTop() + 40);
    }
  },
  hideChatEntry: function() {
    this.chatOpen = false;
    $("#chat-entry").removeClass("visible");
    $("#bottom-bar").removeClass("hidden");
    $("#chat-container").removeClass("withChatEntry");

  },
  showLoading: function() {
    $("#bottom-bar .buttons-container").hide();
    $("#bottom-bar #lost-connection").hide();
    $("#bottom-bar #loading-spinner").show();
  },
  hideLoading: function() {
    $("#bottom-bar .buttons-container").show();
    $("#bottom-bar #loading-spinner").hide();
  },
  showRetry: function() {
    $("#bottom-bar .buttons-container").hide();
    $("#bottom-bar #loading-spinner").hide();
    $("#bottom-bar #lost-connection").show();
  },
});

