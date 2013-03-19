define(function(){

this["JST"] = this["JST"] || {};

this["JST"]["templates/underscore/chatbox.html"] = function(obj) {
obj || (obj = {});
var __t, __p = '', __e = _.escape;
with (obj) {
__p += '<div class="chatbox"> \n  <div class="header">\n    <span class="stream">' +
((__t = ( stream )) == null ? '' : __t) +
'</span> &gt; \n    <span class="subject">' +
((__t = ( subject )) == null ? '' : __t) +
'</span>\n  </div> \n  <div class="messages">\n    <div class="name">' +
((__t = ( sender )) == null ? '' : __t) +
'</div>\n    <div class="content">' +
((__t = ( content )) == null ? '' : __t) +
'</div>\n  </div>\n</div>\n';

}
return __p
};

  return this["JST"];

});