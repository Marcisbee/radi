(function () { 'use strict';

  window.http = {
    get(u, p, h) { return new HTTP('get', u, p, h) },
    post(u, p, h) { return new HTTP('post', u, p, h) },
    put(u, p, h) { return new HTTP('put', u, p, h) },
    delete(u, p, h) { return new HTTP('delete', u, p, h) },
    options(u, p, h) { return new HTTP('options', u, p, h) },
    head(u, p, h) { return new HTTP('head', u, p, h) }
  }

  var HTTP = function HTTP(t, url, params, headers) {
    this.http = new XMLHttpRequest()
    this.params = JSON.stringify(params)

    var n = url.split('?').length - 1
    if (t === 'get')
      for (var i in params) {
        url = url.concat(((!n)?'?':'&') + i + '=' + params[i])
        n += 1
      }

    this.http.open(t, url, true)

    for (var h in this.headers) {
      this.http.setRequestHeader(h, this.headers[h]);
    }
  }
  HTTP.prototype.then = function then(OK, ERR) {
    // loading(true)
    var self = this
    this.http.onreadystatechange = function(e) {
      var res = this
      if (res.readyState === XMLHttpRequest.DONE) {
        var h = {
          headers: self.http.getAllResponseHeaders(),
          status: res.status,
          response: res.response
        }
        if (res.status === 200) {
          h.text = function() { return res.responseText }
          h.json = function() { return this.text() }
          OK(h)
        } else {
          if (typeof ERR === 'function') ERR(h)
        }
        // loading(false)
      }
    }
    this.http.send(this.params)
    return this
  }

})();
