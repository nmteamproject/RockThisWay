# Rock This Way

## Installation
    npm install
    
## Develop
We're using gulp to take care of our sass and javascript compilation. Running this will watch for changes on your sass and javascript and compile them. It also rebuilds the browser version on any changes in the js.

    gulp

If you're using the browser version to debug, run the following to rebuild on any changes (and then you can refresh the browser to see them)
    
    gulp cordova-watch
    
## Build
To build and run iOS version:
    
    gulp build
   