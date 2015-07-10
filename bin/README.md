# slackage

Slackage is a [Slack web API](https://api.slack.com/methods) command line tool. It supports easy passing of paramters
via command line options, and filtering the result of the API call.

Tokens are passed either via the `HUBOT_SLACK_API_TOKEN` or `HUBOT_SLACK_TOKEN` environment variables, or the `-t`
option.

Slackage will output JSON by default, but for example arrays can be printed in a shell-friendly format (just text
separated by newlines) with `-x`.

To install slackage, run `npm install -g hubot-slack-api`

## Options

```
  -t, --token   Slack API token (Optional. Defaults to using env variables
                HUBOT_SLACK_API_TOKEN || HUBOT_SLACK_TOKEN              [string]
  -h, --help    Show help                                              [boolean]
  -p, --param   Parameter for method call. The first argument must be a JSON
                pointer and the second argument a value. Can be supplied
                multiple times to pass multiple parameters: slackage files.list
                -p types zips -p user U666666666
  -o, --outptr  Use this JSON pointer (e.g. /channel/topic) to select what to
                output. To get a certain property of each element of an array,
                like when calling channels.list, use /channels/*/name.
                To filter out falsy values, use *? in place of *: slackage users
                .list -o /members/*?/profile/skype would return the skype name
                of all users in a team who have one. If -o and -f are both
                supplied, the filter will be applied first, and -o will apply to
                the results of the filter. Can be supplied multiple times
  -x, --text    Output a more shell-friendly text format instead of JSON
                                                                       [boolean]
  -f, --filter  Output objects for which JSON pointer matches a value: slackage
                -f /members/*/deleted true users.list would only output user
                objects for which deleted is true. The value can also be a regex
                : slackage users.list -xf /members/*/tz /^america//i -o /members
                /*/name would output the user name of all users  who have their
                time zone set to something in the US.
                Can only be supplied ONCE

The first non-option parameter will be used as the method name: slackage users.
list -o ...

Exit code will be 0 if API call executed successfully, 1 if there was an
argument error, 2 if the API call couldn't be made, and 3 if the API call
returned an error
```

## Examples

### Message everyone who doesn't have a title in their profile
```
slackage users.list -xf /members/*/profile/title /^$/i -o /members/*/id |\
xargs -I{} slackage im.open -xp user {} -o channel/id |\
xargs -I{} slackage chat.postMessage -xp as_user true -p channel {} -p text\
'Please add a title to your profile, kthxbai' -o channel |\
xargs -I{} slackage im.close -p channel {}
```

### Get the Slack username of the user whose Skype name matches something

```
slackage users.list -xf /members/*/profile/skype someskypename -o /members/*/name
```

### List all the admins who are currently active

```
slackage users.list -xf /members/*/is_admin true -o /members/*/id |\
xargs -I{} bash -c 'res=$(./bin/slackage.js -x users.getPresence -p user {}\
 -o presence); if [ $res = 'active' ]; then echo {}; fi'|\
xargs -I{} slackage users.info -xp user {} -o user/name
```

### Get the Slack username of everyone who has done a git commit in the last two weeks

```
git log --since="2 weeks ago" --format=%aE|sort -u|xargs -I{} slackage users.list -xf \
/members/*/profile/email {} -o /members/*/name
```