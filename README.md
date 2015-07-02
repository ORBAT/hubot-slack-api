# hubot-slack-api
hubot-slack-api is a [Slack web API](https://api.slack.com/methods) call extension for Hubot that adds new methods to the `Robot` class prototype, under `Robot.prototype.slack`. Each API call lives in a subobject corresponding to the first part of the API call name, so for example `channels.list` is `robot.slack.channels.list()`. Each method has the signature `function(args, callback)`. The callback should have the signature `function(err, res)`. If the callback is omitted, a [bluebird](https://github.com/petkaantonov/bluebird) `Promise` is returned.

To use it, run `npm install --save hubot-slack-api`, then add `hubot-slack-api` to `external-scripts.json`.
