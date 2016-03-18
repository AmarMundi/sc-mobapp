scDemoApp.controller('LoginCtrl', function($rootScope, $scope, $state) {

  // Form data for the login modal
  $scope.loginData = {username:"SHIP&CO",password:"blablabla"};
  $scope.errorMsg="";

  // Perform the login action when the user submits the login form
  $scope.doLogin = function() {
    console.log('Doing login', $scope.loginData);
    if($scope.loginData.username == "SHIP&CO")
    {
      $scope.errorMsg="";
      $state.go('app.profile').then(function(data){$rootScope.$emit('scologgedIn',"");});
   
    }
    else if($scope.loginData.username == "RETAIL&CO")
    {
      $scope.errorMsg="";
      $state.go('app.rprofile').then(function(data){$rootScope.$emit('rcologgedIn',"");});
    }
    else if($scope.loginData.username == "CONSUMER"){
       $scope.errorMsg="";
       $state.go('app.consumer');
    }
    else
    {
      $scope.errorMsg = "Wrong Username/Password";
    }

  };

  $scope.doLogout = function() {
    console.log('Doing logout');
    if($scope.loginData.username == "SHIP&CO")
    {
      $rootScope.$emit('scologgedOut',"");
    }
    $state.go('login');
  };

});