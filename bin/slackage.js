/**
 * Created by teklof on 9.7.15.
 */
var _ = require('lodash');
var $ = require('highland');
var putil = require("../util/json-pointer");

var jp = require("json-pointer");

var addSlash = putil.addSlash;
var filter = putil.filter;
var iter = putil.iter;
var parseVal = putil.parseVal;

var inspect = _.partialRight(require("util").inspect, {depth: 10});

var ERR_ARG = 1, ERR_CALL = 2, ERR_API = 3;

var argv = require("yargs")
    .demand(1, 1, "One and only one API call name needs to be supplied")
    .count("verbose")
    .alias("v", "verbose")
    .alias("t", "token")
    .string("t")
    .describe("token", "Slack API token (Optional. Defaults to using env variables " +
                       "HUBOT_SLACK_API_TOKEN || HUBOT_SLACK_TOKEN")
    .alias("h", "help")
    .help("help")

    .alias("p", "param")
    .nargs("param", 2)
    .describe("param",
    "Parameter for method call. The first argument must be a JSON pointer and the second argument a " +
    "value. Can be supplied multiple times to pass multiple parameters: slackage files.list " +
    "-p types zips -p user U666666666")

    .alias("o", "outptr")
    .nargs("outptr", 1)
    .describe("outptr",
    "Use this JSON pointer (e.g. /channel/topic) to select what to output. To get a certain property "
    + "of each element of an array, like when calling channels.list, use /channels/*/name. "
    + "\nTo filter out falsy values, use *? in place of *: slackage users.list -o /members/*?/profile/skype would "
    + "return the skype name of all users in a team, and no undefined values. If -o and -f are both "
    + "supplied, the filter will be applied first, and -o will apply to the results of the filter: "
    + " slackage users.info -xp user U66666666 -vf user/has_files true -o /name would return the name of the user from "
    + "inside the user object.\n"
    + "Can be supplied multiple times")

    .boolean("text")
    .alias("x", "text")
    .describe("text", "Output a more shell-friendly text format instead of JSON")

    .alias("f", "filter")
    .nargs("filter", 2)
    .describe("filter",
    "Output objects for which JSON pointer matches a value: slackage -u /members/*/deleted true users.list "
    + "would only output user objects for which deleted is true.\n"
    + "Can only be supplied ONCE")
    .epilogue("Exit code will be 0 if API call executed successfully, 1 if there was an argument error, 2 " +
              "if the API call couldn't be made, and 3 if the API call returned an error")
    .strict()
    .argv
  ;

function loggerFor(level) {
  return function () {
    console.error.apply(console,
      [new Date().toISOString(), "[" + level.toUpperCase() + "]"].concat(Array.prototype.slice.call(arguments)))
  };
}

var output = process.stdout;

var debug;
var error = loggerFor("error");
if (argv.v)
  debug = loggerFor("debug");
else
  debug = function () {};

var slack = require("../index").generateApiCalls(null, argv.token, {logger: {debug: debug, error: error}});

// NOTE: if the pointer part of --param doesn't have a slash at the beginning, add a slash

debug(inspect(argv));

var cmd = argv._[0];

var fn = _.get(slack, cmd);

if (!fn) {
  error("'" + cmd + "'", "ain't no method I've ever heard of. They speak Slack web API in", "'" + cmd + "'?");
  process.exit(ERR_ARG);
}

if (_.isArray(argv.filter) && argv.filter.length > 2) {
  error("You gave me", argv.filter.length, "filters, but I can only handle one");
  process.exit(ERR_ARG);
}

debug("API method", cmd);

function pickUsingPtrs(obj, ptrs) {
  if (!_.isArray(ptrs)) ptrs = [ptrs];

  debug("pickUsingPtrs", inspect(ptrs));
  if (!ptrs || !ptrs.length)
    return obj;

  return _.reduce(ptrs, function (acc, ptr) {
    ptr = addSlash(ptr);
    var res = iter(obj, ptr);
    debug("Including", ptr, "as", inspect(res), "from", inspect(obj));
    return acc.concat(res);
  }, []);
}

function textify(obj) {
  debug("textifying", inspect(obj));
  if (_.isArray(obj))
    return _.map(obj, textify).join("\n");
  else if (_.isObject(obj))
    return JSON.stringify(obj);
  else return obj;
}

function paramsToObj(params) {
  if (!_.isArray(params)) params = [params];

  debug("paramsToObj", inspect(params));
  return _(params).chunk(2).reduce(function (acc, ptrAndVal) {
    var ptr = ptrAndVal[0], val = ptrAndVal[1];
    ptr = addSlash(ptr);
    debug("Adding", ptr, val, "into", inspect(acc));

    var v = parseVal(val);
    jp.set(acc, ptr, v);

    return acc;
  }, {});
}

var paramsFromOpts = argv.param ? paramsToObj(argv.param) : {};

debug("paramsFromOpts", inspect(paramsFromOpts));

fn(paramsFromOpts)
  .catch(function (e) {
    error("Error with call to", cmd, "with params", inspect(paramsFromOpts));
    process.exit()
  })
  .then(function (out) {
    if (!out.ok) {
      error("API call returned error:", inspect(out));
      process.exit(ERR_API);
    }

    var filtered;

    if (argv.filter) {
      filtered = filter(out, addSlash(argv.filter[0]), argv.filter[1]);
    } else {
      filtered = out;
    }

    var outObj;

    if (argv.outptr)
      outObj = pickUsingPtrs(filtered, argv.outptr);
    else
      outObj = filtered;

    var result;

    if (!argv.text) {
      result = inspect(outObj)
    } else {
      result = textify(outObj);
    }

    if(result.length) {
      result += "\n";
    }
    $([result]).pipe(output);
  })
  .catch(function (e) {
    error("Something weird happened:", e.stack || e.toString());
    process.exit(ERR_CALL);
  })
;