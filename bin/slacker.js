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

var inspect = _.partialRight(require("util").inspect, {depth: 10});

var argv = require("yargs")
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
    .describe("param", "Parameter for method call. The first argument must be a JSON pointer and the second argument a " +
                   "value. Can be supplied multiple times to pass multiple parameters: slacker files.list " +
                   "-p types zips -p user U666666666")

    .alias("o", "outptr")
    .nargs("outptr", 1)
    .describe("outptr", "Use this JSON pointer (e.g. /channel/topic) to select what to output. To get a certain property "
                   + "of each element of an array, like when calling channels.list, use /channels/*/name. "
                   + "\nTo filter out falsy values, use *? in place of *: slacker users.list -o /members/*?/profile/skype would "
                   + "return the skype name of all users in a team, and no undefined values.\n"
                   + "Can be supplied multiple times")

    .boolean("text")
    .alias("x", "text")
    .describe("text", "Output a more shell-friendly text format instead of JSON")

    .alias("u", "fltout")
    .nargs("fltout", 2)
    .describe("fltout", "Output objects which JSON pointer matches: slacker -u /members/*/deleted true users.list. "
                        + "Can be supplied multiple times")

    .strict()
    .argv
  ;

function loggerFor(level) {
  return function() {
    console.error.apply(console, [new Date().toISOString(), "["+ level.toUpperCase() + "]"].concat(Array.prototype.slice.call(arguments)))
  };
}

var output = process.stdout;

var debug;
var error = loggerFor("error");
if(argv.v)
  debug = loggerFor("debug");
else
  debug = function (){};

var slack = require("../index").generateApiCalls(null, argv.token, {logger: {debug: debug, error: console.error}});

// NOTE: if the pointer part of --param doesn't have a slash at the beginning, add a slash

debug(inspect(argv));

var cmd = argv._[0];

var fn = _.get(slack, cmd);

if(!fn) {
  error("'"+cmd + "'", "ain't no method I've ever heard of. They speak Slack web API in", "'"+cmd + "'?");
  process.exit(1);
}

debug("API method", cmd);

function pickUsingPtrs(obj, ptrs) {
  if(!_.isArray(ptrs)) ptrs = [ptrs];

  debug("pickUsingPtrs", inspect(ptrs));
  if(!ptrs || !ptrs.length)
    return obj;

  var out = _.reduce(ptrs, function (acc, ptr) {
    ptr = addSlash(ptr);
    var elemName = _.last(ptr.split("/"));
    debug("Including", ptr, "as", elemName, "in output");
    acc[elemName] = iter(obj, ptr);
    return acc;
  }, {});

  //debug("pickUsingPtrs ", inspect(out));
  return out;
}

function parseVal(val) {
  var v;
  if (/true|false/.test(val)) {
    v = val === 'true';
  } else {
    var n = Number(val);
    if (!_.isNaN(n))
      v = n;
    else
      v = val;
  }
  return v;
}

function paramsToObj(params) {
  if(!_.isArray(params)) params = [params];

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

var paramsFromOpts = paramsToObj(argv.param);

debug("paramsFromOpts", inspect(paramsFromOpts));

fn(paramsFromOpts).then(function(out) {
  var outObj = pickUsingPtrs(out, argv.outptr);
  var result;
  if(!argv.text) {
    result = JSON.stringify(outObj)
  } else {
    result = _.flattenDeep(_.reduce(outObj, function (acc, value) {
      return acc.concat(value);
    }, [])).join("\n");
  }
  $([result]).pipe(output);
  //debug(outObj);
});