var ekg = {};

byteArrayToLong = function(/*byte[]*/byteArray) {
    var value = 0;
    for ( var i = byteArray.length - 1; i >= 0; i--) {
        value = (value * 256) + byteArray[i];
    }

    return value;
};

ekg.onConnected = function(connectionInfo) {
  console.log("connected to ekg");
  ekg.serialID = connectionInfo.connectionId;
};

ekg.connect = function() {
  chrome.serial.connect("/dev/tty.usbmodem1411", {bitrate: 57600}, ekg.onConnected);
};

ekg.resetBuffer = function() {
  ekg.buffer=[]
};

ekg.pointCount = 0;
ekg.vals = [];

ekg.processPacket = function() {
  //console.log(
  //  byteArrayToLong([ekg.buffer[5], ekg.buffer[4]])+ ","+
  //  byteArrayToLong([ekg.buffer[7], ekg.buffer[6]])+ ","+
  //  byteArrayToLong([ekg.buffer[9], ekg.buffer[8]])
  //);
  ekg.pointCount++;
  var graphPoint = {
    y: byteArrayToLong([ekg.buffer[7], ekg.buffer[6]]),
    x: ekg.pointCount
  };
  ekg.vals.push(graphPoint);
  if (ekg.vals.length > 500)
  {
    ekg.vals.shift();
  }

  chart.render();
  ekg.resetBuffer();
};

ekg.handleData = function(data) {
  if (data.data) {
    vals = new Uint8Array(data.data);
    for (var i = 0; i < vals.length; i++) {
      if (ekg.buffer.length === 0) {
        if (vals[i] === 165) {
          ekg.buffer.push(165);
        }
      } else if (ekg.buffer.length === 1) {
        if (vals[i] === 90) {
          ekg.buffer.push(90);
        } else {
          ekg.resetBuffer();
        }
      } else if (ekg.buffer.length >= 2) {
        if (ekg.buffer.length === 16) {
          if (vals[i] === 1) {
            ekg.processPacket();
          } else {
            ekg.resetBuffer();
          }
        } else {
          ekg.buffer.push(vals[i]);
        }
      }
    }
  }
};

var dps;
var chart;

$(document).ready(function() {
  dps = []; // dataPoints

  chart = new CanvasJS.Chart("chartContainer",{
    title :{
      text: "ekg Channel 1"
    },
    data: [{
      type: "line",
      dataPoints: ekg.vals
    }]
  });
});

var xVal = 0;
var yVal = 100;
var updateInterval = 20;
var dataLength = 500; // number of dataPoints visible at any point

// actually do stuff
ekg.resetBuffer();
chrome.serial.onReceive.addListener(ekg.handleData);
ekg.connect();
