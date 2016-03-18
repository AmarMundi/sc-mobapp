scDemoApp.controller('RetailerProfileCtrl', function($scope, $rootScope, $ionicLoading, $compile, $cordovaGeolocation, $cordovaBarcodeScanner, $ionicModal, $http, appServerUrl, $ionicLoading, $timeout) {

  // ----------------- Set Variables
  $scope.newBatch = {};
  $scope.deliverBatch = {};
  $scope.nbBatchInStore = 0;
  $scope.maxQuantity = 0;
  $scope.signaturePad;
  var options = {timeout: 10000, enableHighAccuracy: true};
  $scope.batchArray = [];
  $scope.batchesDetails = {};

  //Loading
  $scope.showLoading = function() {
    $ionicLoading.show({
      template: '<ion-spinner icon="ios"></ion-spinner>'
    });
  };

  $scope.hideLoading = function(){
    $ionicLoading.hide();
  };

 
  $scope.geolocate = function(){
    // ----------------- Geolocation for gmap
    $cordovaGeolocation.getCurrentPosition(options).then(function(position){

      var myLatlng = new google.maps.LatLng(-33.867895,151.206525);
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
      var map = new google.maps.Map(document.getElementById("rmap"),
        mapOptions);

      //Associate the styled map with the MapTypeId and set it to display.
      map.mapTypes.set('map_style', styledMap);
      map.setMapTypeId('map_style');

      //Marker + infowindow + angularjs compiled ng-click
      var contentString = "<div><a ng-click=''>George Street Sydney</a></div>";
      var compiled = $compile(contentString)($scope);

      var infowindow = new google.maps.InfoWindow({
        content: compiled[0]
      });

      var marker = new google.maps.Marker({
        position: myLatlng,
        map: map,
        title: 'George Street Sydney'
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

  // ----------------- Scan QRCode
  $scope.scanQRCode = function() {
   console.log("scan");
      $cordovaBarcodeScanner.scan().then(function(imageData) {
  
          console.log("Barcode Format -> " + imageData.format);
          console.log("Cancelled -> " + imageData.cancelled);

          if(!imageData.cancelled){
            
            var cData = {batchId:imageData.text}
    
            var isInStore = false;
            for(var i=0; i<$scope.batchArray.length; i++){
              if($scope.batchArray[i] == cData.batchId){
                  console.log("In Store " + $scope.batchArray[i]);
                  isInStore = true;
              }
            }

            if(isInStore)
            {

                $scope.getDeliverBatchDetails(cData);
            }
            else 
            {
                 alert("Houston we've got a problem! This batch is not in your store.")
            }
          }

      }, function(error) {
          console.log("An error happened -> " + error);
      })
    

  };


  // ----------------- Get Nb of Batches
  $scope.getNbBatches = function() {
      $scope.showLoading();
      $http.post(appServerUrl+'getAllBatches',{user:"RETAILER"}).then(function(resp) {
      console.log(resp.data);
      if(resp.data.batches){
        $scope.nbBatchInStore = resp.data.batches.length;
        $scope.batchArray = resp.data.batches;
      }
      else
      {
        $scope.nbBatchInStore = 0;
      }
      $scope.hideLoading();
    }, function(err) {
      console.error('ERR', err);
      $scope.hideLoading()
      alert("Houston we've got a problem!")
    })
  };

  // ----------------- Get Nb of Batches
  $scope.getAllBatchesDetails = function() {
      $scope.showLoading();
      $scope.batchesDetails = {};
      $http.post(appServerUrl+'getAllBatchesDetails',{user:"RETAILER"}).then(function(resp) {
      console.log(resp.data);
      var bts = resp.data.batches;
      if(bts){
        for(var i=0; i<bts.length; i++)
        {
          if(!$scope.batchesDetails[bts[i].bType]){
            $scope.batchesDetails[bts[i].bType] = bts[i].quantity;
          }
          else
          {
            $scope.batchesDetails[bts[i].bType] = $scope.batchesDetails[bts[i].bType] + bts[i].quantity;
          }
        }
      }
      else
      {
         $scope.batchesDetails = {};
      }
      console.log($scope.batchesDetails);
      $scope.hideLoading();
    }, function(err) {
      console.error('ERR', err);
      $scope.hideLoading()
      alert("Houston we've got a problem!")
    })
  };


  // ----------------- Get Batch Details
  $scope.getBatchDetails = function(cData) {
      $http.post(appServerUrl+'getBatch',cData).then(function(resp) {
      console.log("--- Get New Batch Details",resp.data);
      var batchDet = resp.data
      if(batchDet){
        $scope.newBatch.batchId = batchDet.id;
        $scope.newBatch.fType = batchDet.bType;
        $scope.newBatch.date = formatDate(new Date(), '%d-%M-%Y %I:%m%p');
        $scope.newBatch.location = "Sydney Fish Market"
        $scope.newBatch.quantity = batchDet.quantity;
      }
      $scope.openNewBatchModal();
    }, function(err) {
      console.error('ERR', err);
      alert("Houston we've got a problem!")
    })
  };


  // ----------------- Get Deliver Batch Details
  $scope.getDeliverBatchDetails = function(cData) {
      $http.post(appServerUrl+'getBatch',cData).then(function(resp) {
      console.log("--- Get Deliver Batch Details",resp.data);
      var batchDet = resp.data
      if(batchDet){
        $scope.deliverBatch.batchId = batchDet.id;
        $scope.deliverBatch.fType = batchDet.bType;
        $scope.deliverBatch.date = formatDate(new Date(), '%d-%M-%Y %I:%m%p');
        $scope.deliverBatch.location = "George Street Sydney"
        $scope.deliverBatch.quantity = 1;
        $scope.deliverBatch.recipient = "CONSUMER"
        $scope.maxQuantity = batchDet.quantity;

        $scope.openSellItemModal();
      }
      
    }, function(err) {
      console.error('ERR', err);
      alert("Houston we've got a problem!")
    })
  };


  // ----------------- Sell Item from Batch
  $scope.sellItem = function() {

      var cData = {batchId:$scope.deliverBatch.batchId, user:"RETAILER", date:$scope.deliverBatch.date, location:$scope.deliverBatch.location, quantity:$scope.deliverBatch.quantity, newOwner:$scope.deliverBatch.recipient};
          $http.post(appServerUrl+'sellItem',cData).then(function(resp) {
          console.log(resp.data);
          var resD = resp.data
          if(resD){
            $scope.showLoading();
            $timeout(function(){$scope.getNbBatches();}, 3000);
            $timeout(function(){$scope.getAllBatchesDetails();}, 3000);
          }
        }, function(err) {
          console.error('ERR', err);
          $scope.hideLoading();
          alert("Houston we've got a problem!")
        });
        $scope.closeSellItemModal();  
      
  } 
  // ----------------- New Batch Modal
  $ionicModal.fromTemplateUrl('templates/sell-item.html', {
    scope: $scope,
    animation: 'slide-in-up'
  }).then(function(modal) {
    $scope.modalSI = modal;
  });

  $scope.openSellItemModal = function() {
    $scope.modalSI.show();
  };

  $scope.closeSellItemModal = function() {
    $scope.modalSI.hide();
  };

  //Cleanup the modal when we're done with it!
  $scope.$on('$destroy', function() {
    $scope.modalSI.remove();
  });

  // Execute action on hide modal
  $scope.$on('modal.hidden', function() {
    // Execute action
  });

  // Execute action on remove modal
  $scope.$on('modal.removed', function() {
    // Execute action
  });


  // Events
  $rootScope.$on('rcologgedIn', function(event, args) { 
    $scope.geolocate();
    $scope.getNbBatches();
    $scope.getAllBatchesDetails();
  });


  // $scope.geolocate();
  // $scope.getNbBatches();
  // $scope.getAllBatchesDetails();

  // ----------------- Utils
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