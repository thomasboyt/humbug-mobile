define(['templates', 'helpers'], function(templates, helpers) {
  var MessageView = Backbone.View.extend({
    template: templates['templates/underscore/chatbox.html'],

    addMessage: function(newMessage, addName) {
      if (addName) {
        this.$(".messages").append("<div class='name'>" + newMessage.get("sender") + ("</div>"));
      }
      this.$(".messages").append("<div class='content'>" + newMessage.get("content") + "</div>");
    },

    render: function() {
      this.$el.html(this.template(this.model.attributes));
      this.$("a").attr("target", "_blank");

      this.$(".header").css("background-color", this.model.get("stream").get("color"));

      this.$("a").click(function(e) {
        e.stopPropagation();
      });

      this.$el.click(function(e) {
        if (!helpers.chatOpen) {
          e.stopPropagation();
          helpers.showChatEntry();
        }
        $(".stream-selector").val(this.model.get("stream").get("name"));
        $(".subject-entry").val(this.model.get("subject"));
      }.bind(this));
      
      return this;
    }
  });

  return MessageView;
});


