Under www/js/app.js modify the appServer endpoint 
scDemoApp.value('appServerUrl', 'http://supply-chain-demo.mybluemix.net/');

## Setup Instructions

```
npm install
sudo npm install -g cordova
sudo npm install -g ionic
ionic state reset
ionic build ios
ionic run ios
```