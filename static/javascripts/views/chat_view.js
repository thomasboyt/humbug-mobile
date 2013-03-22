define(['views/message_view'], function(MessageView) {
  var ChatView = Backbone.View.extend({
    views: [],

    initialize: function() {
      this.collection.on("add", function(newMessage) {
        this.add(newMessage);
      }.bind(this));
    },

    add: function(message) {
      var last = _.last(this.views);
      if (last) last = last.model;

      var isScrolledBottom = this._isScrolledBottom();

      if (last && last.get("subject") == message.get("subject") && last.get("stream") == message.get("stream")) {
        var addName = !(last.get("sender") == message.get("sender"));
        var lastView = _.last(this.views);
        _.last(this.views).addMessage(message, addName);
      }
      else {
        var view = new MessageView({
          model: message
        });
        this.$el.append(view.render().el);
        this.views.push(view);
      }

      if (isScrolledBottom) {
        this.$el.scrollTop(this.el.scrollHeight);
      }
    },

    _isScrolledBottom: function() {
      var scrollHeight = this.el.scrollHeight - 10;
      var viewportHeight = this.$el.height();
      var scrollTop = this.$el.scrollTop();

      return (scrollHeight - viewportHeight == scrollTop);
    }
  });

  return ChatView;
});
