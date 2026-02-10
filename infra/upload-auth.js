var crypto = require('crypto');
var SECRET = '9fKUPxt3LEXAykGnl53ZNA3+8iE+x4Vt9QZyRTmmV/c=';
var EPOCH = 1735689600;

function handler(event) {
  var request = event.request;

  if (request.method === 'GET' || request.method === 'HEAD') {
    return request;
  }

  if (request.method !== 'PUT') {
    return { statusCode: 405, statusDescription: 'Method Not Allowed' };
  }

  var t = request.querystring.t;
  if (!t || !t.value || t.value.length < 20) {
    return { statusCode: 403, statusDescription: 'Forbidden' };
  }
  var token = t.value;

  var expiryB36 = token.substring(0, 4);
  var sig = token.substring(4);

  var expiryHours = parseInt(expiryB36, 36);
  var expirySeconds = EPOCH + (expiryHours * 3600);
  if (Math.floor(Date.now() / 1000) > expirySeconds) {
    return { statusCode: 403, statusDescription: 'Token expired' };
  }

  var hmac = crypto.createHmac('sha256', SECRET);
  hmac.update(request.uri + ':' + expiryB36);
  var expected = hmac.digest('base64url').substring(0, 16);
  if (sig !== expected) {
    return { statusCode: 403, statusDescription: 'Invalid token' };
  }

  delete request.querystring.t;
  return request;
}
