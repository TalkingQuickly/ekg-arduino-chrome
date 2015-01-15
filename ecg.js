var ecg = {};

byteArrayToLong = function(/*byte[]*/byteArray) {
    var value = 0;
    for ( var i = byteArray.length - 1; i >= 0; i--) {
        value = (value * 256) + byteArray[i];
    }

    return value;
};

ecg.onConnected = function(connectionInfo) {
  console.log("connected to ECG");
  ecg.serialID = connectionInfo.connectionId;
};

ecg.connect = function() {
  chrome.serial.connect("/dev/tty.usbmodem1411", {bitrate: 57600}, ecg.onConnected);
};

ecg.resetBuffer = function() {
  ecg.buffer=[]
};

ecg.pointCount = 0;
ecg.vals = [];

ecg.processPacket = function() {
  //console.log(
  //  byteArrayToLong([ecg.buffer[5], ecg.buffer[4]])+ ","+
  //  byteArrayToLong([ecg.buffer[7], ecg.buffer[6]])+ ","+
  //  byteArrayToLong([ecg.buffer[9], ecg.buffer[8]])
  //);
  ecg.pointCount++;
  var graphPoint = {
    y: byteArrayToLong([ecg.buffer[7], ecg.buffer[6]]),
    x: ecg.pointCount
  };
  ecg.vals.push(graphPoint);
  if (ecg.vals.length > 500)
  {
    ecg.vals.shift();
  }

  chart.render();
  ecg.resetBuffer();
};

ecg.handleData = function(data) {
  if (data.data) {
    vals = new Uint8Array(data.data);
    for (var i = 0; i < vals.length; i++) {
      if (ecg.buffer.length === 0) {
        if (vals[i] === 165) {
          ecg.buffer.push(165);
        }
      } else if (ecg.buffer.length === 1) {
        if (vals[i] === 90) {
          ecg.buffer.push(90);
        } else {
          ecg.resetBuffer();
        }
      } else if (ecg.buffer.length >= 2) {
        if (ecg.buffer.length === 16) {
          if (vals[i] === 1) {
            ecg.processPacket();
          } else {
            ecg.resetBuffer();
          }
        } else {
          ecg.buffer.push(vals[i]);
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
      text: "ECG Channel 1"
    },
    data: [{
      type: "line",
      dataPoints: ecg.vals
    }]
  });
});

var xVal = 0;
var yVal = 100;
var updateInterval = 20;
var dataLength = 500; // number of dataPoints visible at any point

// actually do stuff
ecg.resetBuffer();
chrome.serial.onReceive.addListener(ecg.handleData);
ecg.connect();
