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

  function inner(currPtr, restPtrs, obj) {

    // this is the last accessor in the chain: this is where we want the value from
    if(restPtrs.length === 0) {

      if(!jp.has(obj, currPtr)) {
        return undefined;
      }

      return jp.get(obj, currPtr);
    }

    // currPtr wasn't the last accessor. This means it's somewhere down restPtrs and we need to dig into the current
    // pointer
    var trimmed = trim(currPtr);

    if(jp.has(obj, trimmed))
      return _.map(jp.get(obj, trimmed), _.partial(inner, _.head(restPtrs), _.tail(restPtrs)));

    return [];
  }

  var res = inner(_.head(byStars), _.tail(byStars), obj);

  if(_.isArray(res)) {
    res = _.flatten(res);
    if(!shouldCompact) {
      return res;
    }

    return _.compact(res);
  } else {
    return res;
  }

}
var isRe = /\/.*?\/[a-zA-Z]*/;

function _check(obj, ptr, val) {
  if(!jp.has(obj, ptr)) {
    return false;
  }

  var got = jp.get(obj, ptr);

  if(isRe.test(val)) {
    var lastSlash = _.lastIndexOf(val, '/')
      , pattern = _.initial(_.rest(val)).join('').substring(0,lastSlash - 1)
      , flags = val.substring(lastSlash + 1)
      , re = new RegExp(pattern, flags);

    return re.test(got);
  }

  return jp.get(obj, ptr) == val;
}

function filter(obj, ptr, value) {
  var byStars = ptr.split(/\*\??/);

  if(byStars.length == 1) {
    // if there were no * accessors, just return the entire object if it matches
    if(_check(byStars[0])) {
      return obj;
    }
  }

  function inner(currPtr, restPtrs, obj) {
    // this is the last accessor in the chain: if this matches, return true
    if(restPtrs.length === 0) {
      return _check(obj, currPtr, value);
      //return jp.has(obj, currPtr) && (jp.GET(obj, currPtr) == value);
    }

    var trimmed = trim(currPtr);

    if(jp.has(obj, trimmed)) {
      var got = jp.get(obj, trimmed);
      return _.filter(got, _.partial(inner, _.head(restPtrs), _.tail(restPtrs)))
    }
    return [];
  }

  var o = {};

  jp.set(o, trim(_.head(byStars)), inner(_.head(byStars), _.tail(byStars), obj));

  return o;
}

exports.filter = filter;
exports.iter = iter;

function addSlash(ptr) {
  if (ptr[0] != "/") {
    ptr = "/" + ptr;
  }
  return ptr;
}

exports.addSlash = addSlash;

