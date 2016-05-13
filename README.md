# Rock This Way

## Installation
    npm install
    
## Develop
The app/www/ directory contains all the code that goes into your app. To make changes to the app, edit the files in this directory.

First run this in one window
    
    cordova run browser

Watch your sass, js, and html files, and then rebuild the browser (manually refresh)

    gulp
    
## Build
Setting up cordova Application:

    https://cordova.apache.org/docs/en/latest/guide/cli/

Add a platform (iOS and Android):
    
    cordova platform add ios //for ios
    
    cordova platform add android //for android
    
Rebuild a platform:
    
    cordova platform remove ios //for ios
    cordova platform remove android //for android
    // add the platform again after this
    
    
To build iOS version:
    
    gulp build
    
To build Android version:
    
    cordova build android
    
Adding app to a device:
 - Add platforms
 - Go into app/platform/(ios or android)
 - Open the app file in either Android Studios or xCode depending on platform
 - Plug in device
 - Run applicaion

 
Beacon Setup:
 - go to  yourday.html
 - locate the main script portion
 - locate the variable "mRegions"
 - To add a beacon to your app, include it's id, uuid, major valu, and minor value in the following structure:
    
        {
            id: 'region1',
            uuid: '7b44b47b-52a1-5381-90c2-f09b6838c5d4',
            major: 112,
            minor: 154
        }
 - Then change in the displayNearestBeacon function to make your app react to the change in beacon locations

Content:
  To edit content for games, change the following files to edit the corresponding games
 - lyrics/lyrics.js
 - trivia/triviasheet.js
 - againstthecrowd/crowdanswers.js





   
