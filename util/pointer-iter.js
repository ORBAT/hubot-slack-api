/**
 * Created by teklof on 9.7.15.
 */

var jp = require("json-pointer");
var _ = require('lodash');
var inspect = _.partialRight(require("util").inspect, {depth: 10});

function trim(str) {
  var len = str.length;

  if(str[len - 1] === '/') {
    return str.substring(0, len - 1);
  } else return str;
}

function iter(obj, ptr) {
  var byStars = ptr.split(/\*\??/);

  var shouldCompact = /\*\?/.test(ptr);

  function inner(curr, rest, obj) {
    //console.log("Obj",inspect(obj),"curr", inspect(curr), "rest",inspect(rest));
    if(rest.length === 0) {
      //console.log("Returning from", inspect(obj), "using", curr);


      if(!jp.has(obj, curr)) {
        return undefined;
      }

      return jp.get(obj, curr);
    }

    //console.log("Getting all", rest.join("/*/"));

    var trimmed = trim(curr);

    if(jp.has(obj, trimmed))
      return _.map(jp.get(obj, trimmed), _.partial(inner, _.head(rest), _.tail(rest)));

    return [];
  }

  var res = inner(_.head(byStars), _.tail(byStars), obj);

  if(!shouldCompact) {
    return _.flatten(res);
  }

  return _.compact(_.flatten(res));
}

module.exports = iter;