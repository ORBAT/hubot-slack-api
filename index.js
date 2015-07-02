// Description:
//   hubot-slack-api is a Slack web API call extension for Hubot that adds new methods to your Robot instance
//
// Dependencies:
//   hubot-slack: ^3.3.0
//
// Configuration:
//   HUBOT_SLACK_API_TOKEN
//
// Notes:
//   The environment variable is optional. HUBOT_SLACK_TOKEN or an explicit token argument can also be used.
//
// Author:
//   ORBAT


var Promise = require("bluebird");
var _ = require("lodash");
var util = require("util");
var req = Promise.promisifyAll(require("request")); // TODO(ORBAT): figure out why robot.http.post didn't work

var inspect = _.partialRight(util.inspect, {depth: 10});

var apiCalls = ["api.test", "auth.test", "channels.archive", "channels.create", "channels.history", "channels.info",
                "channels.invite", "channels.join", "channels.kick", "channels.leave", "channels.list", "channels.mark",
                "channels.rename", "channels.setPurpose", "channels.setTopic", "channels.unarchive", "chat.delete",
                "chat.postMessage", "chat.update", "emoji.list", "files.delete", "files.info", "groups.archive",
                "groups.close", "groups.create", "groups.createChild", "groups.history", "groups.info", "groups.invite",
                "groups.kick", "groups.leave", "groups.list", "groups.mark", "groups.open", "groups.rename",
                "groups.setPurpose", "groups.setTopic", "groups.unarchive", "im.close", "im.history", "im.list",
                "im.mark", "im.open", "oauth.access", "rtm.start", "search.all", "search.files", "search.messages",
                "stars.list", "team.accessLogs", "team.info", "users.getPresence", "users.info", "users.list",
                "users.setActive", "users.setPresence"];

var postUrl = "https://slack.com/api/";

var token = process.env.HUBOT_SLACK_API_TOKEN || process.env.HUBOT_SLACK_TOKEN;

module.exports = function(robot) {
  robot.logger.debug("Adding Slack API to robot instance");
  robot.slack = _(apiCalls)
    .map(function(str) {
      return str.split('.');
    })
    .reduce(function(acc,v) {
      var group = v[0];
      if(!acc[group]) {
        acc[group] = {};
      }

      acc[group][v[1]] = function(args, callback) {
        var callName = v.join('.');
        this.logger.debug("Doing Slack API call to " + callName + " with args " +
                          inspect(_.defaults(_.omit(args, "token"), {token: "[CENSORED]"})));
        return req.postAsync(postUrl + callName, {form: _.defaults(args, {token: token})}).spread(function (res, body) {
          this.logger.debug("Slack API call to " + callName + " ok");
          return body;
        }.bind(this)).nodeify(callback);
      }.bind(this);

      return acc;

  }.bind(robot), {})
  ;
};
