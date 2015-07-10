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
      //console.log("Returning from", inspect(obj), "using", currPtr);


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

  if(!shouldCompact) {
    return _.flatten(res);
  }

  return _.compact(_.flatten(res));
}

function filter(obj, ptr, value) {
  var byStars = ptr.split(/\*\??/);

  function inner(currPtr, restPtrs, acc, obj) {

    if (acc == null) {
      acc = [];
    }

    // last accessor: if obj has value at currPtr, add obj to the accumulator
    if (restPtrs.length === 0) {
      if (jp.has(obj, currPtr) && jp.get(obj, currPtr) == value) {
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