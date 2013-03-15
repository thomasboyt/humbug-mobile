// todo: build process for this. hate backslashes.

define(function() {
  return {
    chatbox: _.template('<div class="chatbox"> \
      <div class="header"><span class="username"><%= sender %></span> in \
      <span class="stream"><%= stream %></span> &gt; \
      <span class="subject"><%= subject %></span></div> \
      <p class="content"><%= content %></p> \
    </div>')
  };
});
