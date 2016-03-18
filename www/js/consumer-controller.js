scDemoApp.controller('ConsumerCtrl', function($scope, $rootScope, $ionicLoading, $compile, $cordovaGeolocation, $cordovaBarcodeScanner, $ionicModal, $http, appServerUrl, $ionicLoading, $timeout) {

  // // ----------------- Set Variables
  // $scope.newBatch = {};
  // $scope.deliverBatch = {};
  // $scope.nbBatchInTruck = 0;
  // $scope.signaturePad;
  // var options = {timeout: 10000, enableHighAccuracy: true};
  $scope.batchTransactions = [];
  $scope.batchItem = {};

  //Loading
  $scope.showLoading = function() {
    $ionicLoading.show({
      template: '<ion-spinner icon="ios"></ion-spinner>'
    });
  };

  $scope.hideLoading = function(){
    $ionicLoading.hide();
  };
 


  // ----------------- Scan QRCode
  $scope.scanQRCode = function() {
   console.log("scan");
      $cordovaBarcodeScanner.scan().then(function(imageData) {
  
          console.log("Barcode Format -> " + imageData.format);
          console.log("Cancelled -> " + imageData.cancelled);

          if(!imageData.cancelled){
            
            var cData = {batchId:imageData.text}
            $scope.getBatchDetails(cData);
          }

      }, function(error) {
          console.error('ERR', err);
          alert("Houston we've got a problem!")
      })
    
  };


  // ----------------- Get Batch Details
  $scope.getBatchDetails = function(cData) {
      $scope.showLoading();
      $http.post(appServerUrl+'getBatch',cData).then(function(resp) {
       
      console.log("--- Get New Batch Details",resp.data);
      var batchDet = resp.data;
      $scope.batchTransactions = [];
      $scope.batchItem = {};
      if(batchDet){
        $scope.batchItem = {type:batchDet.bType, id:batchDet.id};
        for(var i=0; i<batchDet.transactions.length; i++){
          var tx = batchDet.transactions[i];
          var litem;
          if(tx.ttype == "CREATE"){
            litem = {avatar:"ion-ios-box-outline", date: tx.vDate, location: tx.location, desc:"ADDED BY ", owner:tx.owner};
          }
          else if(tx.ttype == "CLAIM"){
            litem = {avatar:"ion-ios-barcode-outline", date: tx.vDate, location: tx.location, desc:"PICKED UP BY ", owner:tx.owner};
          }
          else if(tx.ttype == "TRANSFER"){
            litem = {avatar:"ion-ios-shuffle", date: tx.vDate, location: tx.location, desc:"DELIVERED TO ", owner:tx.owner};
          }
          else if(tx.ttype == "SELL" && tx.owner == "CONSUMER"){
            litem = {avatar:"ion-ios-cart-outline", date: tx.vDate, location: tx.location, desc:"SOLD TO ", owner:tx.owner};
          }
          else if(tx.ttype == "UPDATE QUALITY"){
            litem = {ttype:tx.ttype, avatar:"ion-ios-bolt-outline", date: tx.vDate, location: tx.location, desc:"QUALITY IMPACTED DUE TO HIGH T°", owner:""};
          }
          if(litem){
            $scope.batchTransactions.push(litem);
          }
        }
        $scope.hideLoading(); 
        $scope.openTrackerModal();
      }
     
    }, function(err) {
      $scope.hideLoading();
      console.error('ERR', err);
      alert("Houston we've got a problem!")
    })
  };


  // ----------------- Deliver Batch Modal
  $ionicModal.fromTemplateUrl('templates/tracker.html', {
    scope: $scope,
    animation: 'slide-in-up'
  }).then(function(modal) {
    $scope.modalT = modal;
  });

  $scope.openTrackerModal = function() {
    $scope.modalT.show();
  };

  $scope.closeTrackerModal = function() {
    $scope.modalT.hide();
  };

    //Cleanup the modal when we're done with it!
  $scope.$on('$destroy', function() {
    $scope.modalT.remove();
  });

  // Execute action on hide modal
  $scope.$on('modal.hidden', function() {
    // Execute action
  });

  // Execute action on remove modal
  $scope.$on('modal.removed', function() {
    // Execute action
  });

});