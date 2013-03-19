define(function() {
  var Stream = Backbone.Model.extend({
    color: "#ccc",
    invite_only: false,
    name: undefined,
  });

  return Stream;
});

