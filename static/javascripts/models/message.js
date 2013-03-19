define(function() {
  var Message = Backbone.Model.extend({
    sender: undefined,
    subject: undefined,
    stream: undefined,
    content: undefined
  });

  return Message;
});
