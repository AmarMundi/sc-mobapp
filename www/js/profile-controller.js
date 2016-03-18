scDemoApp.controller('ProfileCtrl', function($scope, $rootScope, $ionicLoading, $compile, $cordovaGeolocation, $cordovaBarcodeScanner, $ionicModal, $http, appServerUrl, $ionicLoading, $timeout, BLE) {

  // ---------------------------------- Set Variables ----------------------------------
  $scope.newBatch = {};
  $scope.deliverBatch = {};
  $scope.nbBatchInTruck = 0;
  $scope.signaturePad;
  var options = {timeout: 10000, enableHighAccuracy: true};
  $scope.batchArray = [];

  //Loading
  $scope.showLoading = function() {
    $ionicLoading.show({
      template: '<ion-spinner icon="ios"></ion-spinner>'
    });
  };

  $scope.hideLoading = function(){
    $ionicLoading.hide();
  };
 
  // ---------------------------------- Geolocation for gmap ----------------------------------
  $scope.geolocate = function(){
    $cordovaGeolocation.getCurrentPosition(options).then(function(position){

      var myLatlng = new google.maps.LatLng(-33.8725, 151.1924);
      console.log(myLatlng);

      var styles =[{"featureType":"water","elementType":"geometry","stylers":[{"color":"#e9e9e9"},{"lightness":17}]},{"featureType":"landscape","elementType":"geometry","stylers":[{"color":"#f5f5f5"},{"lightness":20}]},{"featureType":"road.highway","elementType":"geometry.fill","stylers":[{"color":"#ffffff"},{"lightness":17}]},{"featureType":"road.highway","elementType":"geometry.stroke","stylers":[{"color":"#ffffff"},{"lightness":29},{"weight":0.2}]},{"featureType":"road.arterial","elementType":"geometry","stylers":[{"color":"#ffffff"},{"lightness":18}]},{"featureType":"road.local","elementType":"geometry","stylers":[{"color":"#ffffff"},{"lightness":16}]},{"featureType":"poi","elementType":"geometry","stylers":[{"color":"#f5f5f5"},{"lightness":21}]},{"featureType":"poi.park","elementType":"geometry","stylers":[{"color":"#dedede"},{"lightness":21}]},{"elementType":"labels.text.stroke","stylers":[{"visibility":"on"},{"color":"#ffffff"},{"lightness":16}]},{"elementType":"labels.text.fill","stylers":[{"saturation":36},{"color":"#333333"},{"lightness":40}]},{"elementType":"labels.icon","stylers":[{"visibility":"off"}]},{"featureType":"transit","elementType":"geometry","stylers":[{"color":"#f2f2f2"},{"lightness":19}]},{"featureType":"administrative","elementType":"geometry.fill","stylers":[{"color":"#fefefe"},{"lightness":20}]},{"featureType":"administrative","elementType":"geometry.stroke","stylers":[{"color":"#fefefe"},{"lightness":17},{"weight":1.2}]}];

      var styledMap = new google.maps.StyledMapType(styles, {name: "Styled Map"});

      var mapOptions = {
        center: myLatlng,
        zoom: 16,
        streetViewControl: false,
        mapTypeControl: false,
        mapTypeControlOptions: {
          mapTypeIds: [google.maps.MapTypeId.ROADMAP, 'map_style']
        }
      };
      var map = new google.maps.Map(document.getElementById("map"),
        mapOptions);

      //Associate the styled map with the MapTypeId and set it to display.
      map.mapTypes.set('map_style', styledMap);
      map.setMapTypeId('map_style');

      //Marker + infowindow + angularjs compiled ng-click
      var contentString = "<div><a ng-click=''>Sydney Fish Market</a></div>";
      var compiled = $compile(contentString)($scope);

      var infowindow = new google.maps.InfoWindow({
        content: compiled[0]
      });

      var marker = new google.maps.Marker({
        position: myLatlng,
        map: map,
        title: 'Sydney Fish Market'
      });

      google.maps.event.addListener(marker, 'click', function() {
        infowindow.open(map, marker);
      });

      $scope.map = map;
      console.log($scope.map);

    }, function(error){
      console.log("Could not get location");
    });
  }
   

  // ---------------------------------- Scan QRCode ----------------------------------
  $scope.scanQRCode = function() {
   console.log("scan");
      $cordovaBarcodeScanner.scan().then(function(imageData) {
  
          console.log("Barcode Format -> " + imageData.format);
          console.log("Cancelled -> " + imageData.cancelled);

          if(!imageData.cancelled){
            
            var cData = {batchId:imageData.text}
    
            var isInTruck = false;
            for(var i=0; i<$scope.batchArray.length; i++){
              if($scope.batchArray[i] == cData.batchId){
                  console.log("In truck " + $scope.batchArray[i]);
                  isInTruck = true;
              }
            }

            console.log("--- " + isInTruck);
            if(isInTruck)
            {

                $scope.getDeliverBatchDetails(cData);
            }
            else 
            {
                $scope.getBatchDetails(cData);
            }
          }

      }, function(error) {
          console.log("An error happened -> " + error);
      })
    

  };


  // ---------------------------------- Get Nb of Batches ----------------------------------
  $scope.getNbBatches = function() {
      $scope.showLoading();
      $http.post(appServerUrl+'getAllBatches',{user:"SHIPPINGCO"}).then(function(resp) {
      console.log(resp.data);
      if(resp.data.batches){
        $scope.nbBatchInTruck = resp.data.batches.length;
        $scope.batchArray = resp.data.batches;
      }
      else
      {
        $scope.nbBatchInTruck = 0;
      }
      $scope.hideLoading();
    }, function(err) {
      console.error('ERR', err);
      $scope.hideLoading()
      alert("Houston we've got a problem!")
    })
  };

  // ---------------------------------- Get Batch Details ----------------------------------
  $scope.getBatchDetails = function(cData) {
      $scope.showLoading();
      $http.post(appServerUrl+'getBatch',cData).then(function(resp) {
      console.log("--- Get New Batch Details",resp.data);
      var batchDet = resp.data
      if(batchDet){
        $scope.newBatch.batchId = batchDet.id;
        $scope.newBatch.fType = batchDet.bType;
        $scope.newBatch.date = formatDate(new Date(), '%d-%M-%Y %I:%m%p');
        $scope.newBatch.location = "Sydney Fish Market"
        $scope.newBatch.quantity = batchDet.quantity;

        $scope.hideLoading();
         $scope.openNewBatchModal();
      }
     
    }, function(err) {
      $scope.hideLoading();
      console.error('ERR', err);
      alert("Houston we've got a problem!")
    })
  };

  // ---------------------------------- Add Batch (transfer ownership) ----------------------------------
  $scope.addBatch = function() {

      for(var i=0; i<$scope.batchArray.length; i++){
        if($scope.batchArray[i] == $scope.newBatch.batchId){
            alert("This batch is already in your truck!");
            return;
        }
      }

      var cData = {batchId:$scope.newBatch.batchId, user:"SHIPPINGCO", date:$scope.newBatch.date, location:$scope.newBatch.location};
          $http.post(appServerUrl+'claimBatch',cData).then(function(resp) {
          console.log(resp.data);
          var resD = resp.data
          if(resD){
            $scope.showLoading();
            $timeout(function(){$scope.getNbBatches();}, 3000);
            // $scope.nbBatchInTruck++;
            // $scope.batchArray.push($scope.newBatch.batchId);
          }
        }, function(err) {
          console.error('ERR', err);
          $scope.hideLoading();
          alert("Houston we've got a problem!")
        });
        $scope.closeNewBatchModal();  
      
  } 


  // ---------------------------------- Get Deliver Batch Details ----------------------------------
  $scope.getDeliverBatchDetails = function(cData) {
      $scope.showLoading();
      $http.post(appServerUrl+'getBatch',cData).then(function(resp) {
      console.log("--- Get Deliver Batch Details",resp.data);
      var batchDet = resp.data
      if(batchDet){
        $scope.deliverBatch.batchId = batchDet.id;
        $scope.deliverBatch.fType = batchDet.bType;
        $scope.deliverBatch.date = formatDate(new Date(), '%d-%M-%Y %I:%m%p');
        $scope.deliverBatch.location = "George Street Sydney"
        $scope.deliverBatch.quantity = batchDet.quantity;

        var qual = "GOOD";
        if(batchDet.quality != "OK"){
          qual = "AFFECTED DUE TO HIGH T°";
        }
        $scope.deliverBatch.quality = qual;
        $scope.deliverBatch.recipient = "RETAILER"
      }
      $scope.hideLoading();
      $scope.openDeliverBatchModal();
    }, function(err) {
      $scope.hideLoading();
      console.error('ERR', err);
      alert("Houston we've got a problem!")
    })
  };


  // ---------------------------------- Deliver Batch (transfer ownership) ----------------------------------
  $scope.deliverBatch = function() {

      var cData = {batchId:$scope.deliverBatch.batchId, user:"SHIPPINGCO", date:$scope.deliverBatch.date, location:$scope.deliverBatch.location, newOwner:$scope.deliverBatch.recipient, signature:$scope.signaturePad.toDataURL()};
          $http.post(appServerUrl+'transferBatch',cData).then(function(resp) {
          console.log(resp.data);
          var resD = resp.data
          if(resD){
            $scope.showLoading();
            $timeout(function(){$scope.getNbBatches();}, 3000);
            // $scope.nbBatchInTruck--;
            // var ind=-1;
            // for(var i=0; i<$scope.batchArray.length; i++){
            //   if($scope.batchArray[i] == $scope.deliverBatch.batchId){
            //       ind =i;              }
            // }
            // if(ind !=-1){
            //   $scope.items.splice(ind, 1);
            // }

          }
        }, function(err) {
          console.error('ERR', err);
          $scope.hideLoading();
          alert("Houston we've got a problem!")
        });
        $scope.closeDeliverBatchModal();  
      
  } 
  // ---------------------------------- New Batch Modal ----------------------------------
  $ionicModal.fromTemplateUrl('templates/new-batch.html', {
    scope: $scope,
    animation: 'slide-in-up'
  }).then(function(modal) {
    $scope.modalNB = modal;
  });

  $scope.openNewBatchModal = function() {
    $scope.modalNB.show();
  };

  $scope.closeNewBatchModal = function() {
    $scope.modalNB.hide();
  };

  //Cleanup the modal when we're done with it!
  $scope.$on('$destroy', function() {
    $scope.modalNB.remove();
    $scope.modalDB.remove();
  });

  // Execute action on hide modal
  $scope.$on('modal.hidden', function() {
    // Execute action
  });

  // Execute action on remove modal
  $scope.$on('modal.removed', function() {
    // Execute action
  });


  // ---------------------------------- Deliver Batch Modal ----------------------------------
  $ionicModal.fromTemplateUrl('templates/deliver-batch.html', {
    scope: $scope,
    animation: 'slide-in-up'
  }).then(function(modal) {
    $scope.modalDB = modal;
  });

  $scope.openDeliverBatchModal = function() {
    $scope.modalDB.show();
      // ----------------- Signature
    var canvas = document.getElementById('signatureCanvas');
    $scope.signaturePad = new SignaturePad(canvas);
    $scope.signaturePad.clear();

  };

  $scope.closeDeliverBatchModal = function() {
    $scope.modalDB.hide();
  };

  // ---------------------------------- IOT - Temperature Sensor ----------------------------------
  $scope.devices = BLE.devices;
  $scope.truckTmp = 0;


  var success = function () {
      
      if ($scope.devices.length < 1) {
          // a better solution would be to update a status message rather than an alert
          alert("Didn't find your Bluetooth Low Energy devices.");
          $scope.truckTmp = -5;
      }
      else
      {
        
        //Auto Connect
         BLE.connect($scope.devices[0].id).then(
            function(peripheral) {
                //console.log(peripheral);
                BLE.getTemperature(peripheral.id).then(
                    function(){console.log("tmp sucess");},
                    function(error){console.log("tmp error");}
                );
            }
        );
      } 
  };

  var failure = function (error) {
      //alert("Problem finding your Bluetooth Low Energy devices.");
      $scope.truckTmp = -5;
  };

  // ---------------------------------- Events ----------------------------------
  var inAlert=false;
  var alertTriggered=false;

  // Events
  $rootScope.$on('scologgedIn', function(event, args) { 
    $scope.geolocate();
    $scope.getNbBatches();
    alertTriggered=false;
    $scope.truckTmp=null;
    // initial scan
    BLE.scan().then(success, failure);
  });

  $rootScope.$on('scologgedOut', function(event, args) { 
    // disconnect IOT sensor
    BLE.disconnect().then(
      function(){console.log("disconnect success");},
      function(error){console.log("disconnect error");}
    );
  });

  
  $rootScope.$on('tmpValueChanged', function(event, data) { 
    //console.log("Tmp Value Changed" , data);
    var faketmp = data - 25;
    $scope.truckTmp = faketmp.toFixed(1);
    $scope.$apply();

    if(faketmp > 0 && !inAlert && !alertTriggered) {
          inAlert=true;
          console.log("in alert");
          $timeout(function(){ 
            if(inAlert) {
              alert("Temperature too high"); 
              alertTriggered=true;

              var cData = {user:"SHIPPINGCO", date:formatDate(new Date(), '%d-%M-%Y %I:%m%p'), location:"Liverpool Street Sydney", msg:"Storage temperature was too high and can have impacted the quality of the fish"};
              $http.post(appServerUrl+'updateBatchQuality',cData).then(function(resp) {
                console.log(resp);
              }, function(err) {
                console.error('ERR', err);
              });
            }
            inAlert=false;
          }, 5000);
    }
    else
    {
      inAlert = false;
    }
  });

  // $scope.geolocate();
  // $scope.getNbBatches();


  // ---------------------------------- Utils ----------------------------------
  function formatDate(date, fmt) {
  date = new Date(date);
    function pad(value) {
      return (value.toString().length < 2) ? '0' + value : value;
    }
    return fmt.replace(/%([a-zA-Z])/g, function (_, fmtCode) {
      var tmp;
      switch (fmtCode) {
      case 'Y':               //Year
        return date.getUTCFullYear();
      case 'M':               //Month 0 padded
        return pad(date.getUTCMonth() + 1);
      case 'd':               //Date 0 padded
        return pad(date.getUTCDate());
      case 'H':               //24 Hour 0 padded
        return pad(date.getUTCHours());
      case 'I':               //12 Hour 0 padded
        tmp = date.getUTCHours();
        if(tmp == 0) tmp = 12;        //00:00 should be seen as 12:00am
        else if(tmp > 12) tmp -= 12;
        return pad(tmp);
      case 'p':               //am / pm
        tmp = date.getUTCHours();
        if(tmp >= 12) return 'pm';
        return 'am';
      case 'P':               //AM / PM
        tmp = date.getUTCHours();
        if(tmp >= 12) return 'PM';
        return 'AM';
      case 'm':               //Minutes 0 padded
        return pad(date.getUTCMinutes());
      case 's':               //Seconds 0 padded
        return pad(date.getUTCSeconds());
      case 'r':               //Milliseconds 0 padded
        return pad(date.getUTCMilliseconds(), 3);
      case 'q':               //UTC timestamp
        return date.getTime();
      default:
        throw new Error('Unsupported format code: ' + fmtCode);
      }
    });
  }

});