// Description:
//   post-attachment posts Slack attachments
//
// Dependencies:
//   "hubot-slack": "^3.3.0"
//
//
// Commands:
//   hubot post attachment - posts a message with an attachment. Recognizes arguments in the form [argument name] "[content]". Allowed arguments are fallback, color, pretext, author_name, author_link, author_icon, title,\ntitle_link, text, image_url, thumb_url. Example: @hubot post attachment text "Attachment body" pretext "some pretext" title "this link goes to reddit" title_link "http://reddit.com" thumb_url "https://i.imgur.com/1z08u41.jpg" color "#FF0000 " author_name "Tom" fallback "NO ATTACHMENT FOR YOU!"
//
//
// Author:
//   ORBAT

var util = require("util");
var _ = require("lodash");
var inspect = _.partialRight(util.inspect, {depth: 10});

function postMessage(msgObj, robot) {

  var params = {
    channel: "#" + msgObj.channel
    , attachments: JSON.stringify(msgObj.attachments)
    , text: "attachment ahoy!"
  };

  robot.slack.chat.postMessage(params)// NOTE: could also give postMessage a callback
    .then(function (res) {
      robot.logger.debug("Successfully posted attachment. Result was " + inspect(res));
    })
    .catch(function (err) {
      robot.logger.error("Couldn't post message: " + err);
    });

}


var cmds = [ "fallback",
             "color",
             "pretext",
             "author_name",
             "author_link",
             "author_icon",
             "title",
             "title_link",
             "text",
             "image_url",
             "thumb_url" ];

var regexen = _.map(cmds, function (cmd) {
  return new RegExp(util.format('(%s)\\W+"(.*?)"', cmd), "i");
});


function reqToAttachment(reqTxt, robot) {
  var attachment = _.reduce(regexen, function (acc, re) {
    var match = reqTxt.match(re);
    if(match) {
      acc[match[1]] = match[2];
    }
    return acc;
  }, {});

  robot.logger.debug("Turned " + reqTxt + " into " + inspect(attachment));

  return attachment;
}

module.exports = function(robot) {
  robot.respond(/post attachment (.*)/i, {id: "postMessage.attachment"}, function (res) {
    var message = res.match[1];
    res.reply("posting " + message + " as attachment");

    postMessage({
      channel: res.message.room
      , user: res.message.user
      , attachments: [reqToAttachment(message, robot)]
    }, robot);

  });
};