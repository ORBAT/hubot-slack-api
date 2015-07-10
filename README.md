# hubot-slack-api

[![NPM](https://nodei.co/npm/hubot-slack-api.png?mini=true)](https://nodei.co/npm/hubot-slack-api/)

hubot-slack-api is a [Slack web API](https://api.slack.com/methods) call extension for Hubot that adds new methods to your `robot` instance, under `robot.slack`. Each API call lives in a subobject corresponding to the first part of the API call name, so for example `channels.list` is `robot.slack.channels.list()`. Each method has the signature `function(args, callback)`. The argument object keys should be API argument names, and the callback should have the signature `function(err, res)`. If the callback is omitted a [bluebird](https://github.com/petkaantonov/bluebird) `Promise` is returned.

The API key is read from either the `HUBOT_SLACK_TOKEN` environment variable that `hubot-slack` uses, or – if you want to use a separate API key – you can either use the `HUBOT_SLACK_API_TOKEN` env variable *or* give the token in the `token` key in the argument object.

To use it, run `npm install --save hubot-slack-api` and add `hubot-slack-api` to your `external-scripts.json`.

# slackage

slackage is a command line tool for making Slack web API calls (and not just message sending, but the whole API is supported). Read more [here](bin/README.md).