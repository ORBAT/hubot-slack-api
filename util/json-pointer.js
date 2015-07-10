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

function filter(obj, ptr, value) {
  var byStars = ptr.split(/\*\??/);

  if(byStars.length == 1) {
    // if there were no * accessors, we need to return the last object the JSON pointer matched, so a filter of
    // /user/has_files should only return the /user object
    var fst = byStars[0];
    if(jp.has(obj, fst) && jp.get(obj, fst) == parseVal(value)) { // see comment below
      // tail to get rid of empty element caused by intial / in ptr, dropRight to get a pointer to whatever encloses
      // the last accessor
      var toks = _.dropRight(_.tail(fst.split("/")), 1);
      return jp.get(obj, jp.compile(toks));
    }
  }

  function inner(currPtr, restPtrs, acc, obj) {

    if (acc == null) {
      acc = [];
    }

    // last accessor: if obj has value at currPtr, add obj to the accumulator
    if (restPtrs.length === 0) {
      if (jp.has(obj, currPtr) && jp.get(obj, currPtr) == parseVal(value)) { // lol too drunk to think this through: why am I always getting a string as a value
        acc.push(obj);
      }

      return acc;
    }

    var trimmed = trim(currPtr);

    // not the last accessor: get every element pointed to by currPtr and recurse down restPtrs
    if (jp.has(obj, trimmed)) {
      return _.map(jp.get(obj, trimmed), _.partial(inner, _.head(restPtrs), _.tail(restPtrs), null))
    }

    return [];
  }

  return _.flattenDeep(inner(_.head(byStars), _.tail(byStars), [], obj));
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

exports.parseVal = parseVal;