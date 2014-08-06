// Generated by CoffeeScript 1.7.1
(function() {
  var child_process, events, path, queueReceive, queueSend, receiverChild, receiverPath, receiverQueue, send, senderChild, senderPath, senderQueue, senderReady;

  child_process = require('child_process');

  path = require('path');

  events = require('events');

  module.exports.emitter = new events.EventEmitter();

  senderReady = false;

  senderQueue = [];

  receiverQueue = [];

  queueReceive = function(data, time) {
    var iterator, obj, valid;
    valid = true;
    iterator = 0;
    while (valid && iterator < senderQueue.length) {
      obj = senderQueue[iterator];
      if (obj.data === data) {
        if (time - obj.timestamp < 1200) {
          valid = false;
          break;
        }
      }
      iterator++;
    }
    if (valid) {
      iterator = 0;
      while (valid && iterator < receiverQueue.length) {
        obj = receiverQueue[iterator];
        if (obj.data === data) {
          if (time - obj.timestamp < 1200) {
            valid = false;
            break;
          }
        }
        iterator++;
      }
    }
    receiverQueue.push({
      data: data,
      timestamp: time
    });
    if (valid) {
      return module.exports.emitter.emit('data', data);
    }
  };

  queueSend = function(data, time) {
    senderQueue.push({
      data: data,
      timestamp: time
    });
    return senderChild.stdin.write(data + '\n');
  };

  receiverPath = path.join(__dirname, 'rcswitch', 'receive');

  receiverChild = child_process.spawn(receiverPath);

  receiverChild.on('exit', function(code, signal) {
    return receiverChild = child_process.spawn(receiverPath);
  });

  senderPath = path.join(__dirname, 'rcswitch', 'send');

  senderChild = child_process.spawn(senderPath);

  senderChild.on('exit', function(code, signal) {
    return senderChild = child_process.spawn(senderPath);
  });

  receiverChild.stdout.on('data', function(chunk) {
    var data;
    data = parseInt(chunk.toString());
    return queueReceive(data, (new Date()).getTime());
  });

  senderChild.stdout.on('data', function(chunk) {
    var data;
    data = chunk.toString();
    if (data.indexOf('EAD' > -1)) {
      senderReady = true;
      return module.exports.emitter.emit('ready');
    }
  });

  send = function(int, cb) {
    if (senderReady) {
      queueSend(parseInt(int), (new Date()).getTime());
      return cb(null);
    } else {
      return cb("Sender isn't ready yet!");
    }
  };

  module.exports.send = send;

}).call(this);