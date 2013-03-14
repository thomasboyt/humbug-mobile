// todo: build process for this. hate backslashes.

define(function() {
  return {
    chatbox: _.template('<div class="chatbox"> \
      <span class="username"><%= sender %></span> in \
      <span class="stream"><%= stream %></span> &gt; \
      <span class="subject"><%= subject %></span> \
      <p class="content"><%= content %></p> \
    </div>')
  };
});
