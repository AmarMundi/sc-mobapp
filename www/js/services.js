scDemoApp.factory('BLE', function($q,$rootScope) {

  var connected;
  var SENSOR_ID = "A6FC06A5-5751-B277-1B22-A62FFFA4C784"

  return {

    devices: [],

    scan: function() {
        var that = this;
        var deferred = $q.defer();

        that.devices.length = 0;

        if(typeof ble == 'undefined'){
          deferred.reject("ble not defined");
          return deferred.promise;
        }

        // disconnect the connected device (hack, device should disconnect when leaving detail page)
        if (connected) {
            var id = connected.id;
            ble.disconnect(connected.id, function() {
                console.log("Disconnected " + id);
            });
            connected = null;
        }

        ble.startScan([],  /* scan for all services */
            function(peripheral){
                if(peripheral.id == SENSOR_ID){
                  that.devices.push(peripheral);
                }
            },
            function(error){
                deferred.reject(error);
            });

        //stop scan after 5 seconds
        setTimeout(ble.stopScan, 5000,
            function() {
                deferred.resolve();
            },
            function() {
                console.log("stopScan failed");
                deferred.reject("Error stopping scan");
            }
        );

        return deferred.promise;
    },
    connect: function(deviceId) {
        var deferred = $q.defer();

        ble.connect(deviceId,
            function(peripheral) {
                connected = peripheral;
                deferred.resolve(peripheral);
            },
            function(reason) {
                deferred.reject(reason);
            }
        );

        return deferred.promise;
    },
    disconnect: function(deviceId) {
        var deferred = $q.defer();

        if (connected) {
            var id = connected.id;
            ble.disconnect(connected.id, function() {
                console.log("Disconnected " + id);
            });
            connected = null;
        }
        deferred.resolve();

        return deferred.promise;
    },
    getTemperature: function(deviceId) {
        var that = this;
        var deferred = $q.defer();
        var irtmp = {
            service: "F000AA00-0451-4000-B000-000000000000",
            data: "F000AA01-0451-4000-B000-000000000000",
            notification: "F0002902-0451-4000-B000-000000000000",
            configuration: "F000AA02-0451-4000-B000-000000000000",
            period: "F000AA03-0451-4000-B000-000000000000"

        };
        
        // console.log("---- Get Temperature ", deviceId, irtmp.data, irtmp.service);
        ble.startNotification(deviceId, irtmp.service, irtmp.data, 
          function(data) {
               // console.log(data);
               deferred.resolve();

               var message;
               var a = new Uint8Array(data);

               //0-1 Obj Temp
               //2-3 Ambience Temp
               var objTmp = a[0] | (a[1] << 8);
               // console.log("--- ", objTmp);

               var ambTmp = a[2] | (a[3] << 8);
               // console.log("--- ", ambTmp);

              var SCALE_LSB = 0.03125;
              var t = 1.0;
              var it = 0;

              //it = (int)((objTemp) >> 2);
              it = (objTmp >> 2);
              tObj = it * SCALE_LSB
             // console.log("-------- Obj Tmp ", tObj);

              it = (ambTmp >> 2);
              tAmb = it * SCALE_LSB
              // console.log("-------- Amb Tmp ", t);

              $rootScope.$emit("tmpValueChanged",tObj);


          }, function(error) {
                console.log("--- error ", error)
                deferred.reject(error);
            } 
          );


        //Turn on Tmp Sensor
        var irtmpConfig = new Uint8Array(1);
        irtmpConfig[0] = 0x01;
        ble.write(deviceId, irtmp.service, irtmp.configuration, irtmpConfig.buffer,
          function() { console.log("Started Infra Red tmp."); },
          function() { console.log("Error starting Infra Red tmp."); });

        return deferred.promise;
    }


  };
});
