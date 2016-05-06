Rtc
===

 
__Supported Meteor version: >= 1.3 (only with `modules` enabled)__
 
 
### What is this thing?

Essentially it's an abstraction of the WebRTC-API and makes use of *Meteors* real-time connection
based on DDP with its API and concepts on top, which are really handy, when it comes to the process
of signaling in WebRTC-land (in short, it's the process about browsers exchanging information on
how they can be reached or can connect to each other).
The goal was to simplify the whole *web real-time connection* API with the focus on the data
connection to make them feel more websockets-ish and Meteor-like.



### Quick start

```javascript
import Rtc from 'meteor/lucendio:rtc';

// @ Alices & Bobs client
Rtc.bootup();

// when Rtc.status === 'up'
// |
// V

// Alice wants to connect to Bob:
Rtc.connect( bobsUserId ).then( ( rtconnection )=>{
    rtconnection.send( 'hi there!' );
});

// Bob is ready for incoming connections
Rtc.incoming().connections( ( promise )=>{
    promise.then( ( rtconnection )=>{
        rtconnection.receive( ( data )=>{
            console.log( data ); //outputs: 'hi there!'
        });
    });
});
```


### Good to know

+   it uses the [WebRTC adapter](https://github.com/webrtc/adapter) to polyfill things

+   currently the supported browsers are Chrome, Opera and Firefox; other browsers might 
    need an additional plugin
    
+   not only the [WebRTC Standard](http://www.w3.org/TR/webrtc/) is still a *working draft*,
    but this package as well is missing some important things (see [Checklist](#checklist)).
    Therefore it's recommended to __not use it in production__. As of now it's __not 
    considered stable__.


### API

#### .bootup( options )

Basic initiation, setting default configurations and starts to accept and handle 
incoming connections.

+   `options:` *(not required)*
    -   `ices: [ String ]` - [list of servers, which are used to determine how 
                             browsers are reachable](https://en.wikipedia.org/wiki/Interactive_Connectivity_Establishment)
    -   `video: Boolean` - enable/disable video
    -   `audio: Boolean` - enable/disable audio
    -   `data: Boolean` - enable/disable data capabilities
    -   `reliable: Boolean` - defined how data gets transfered

__NOTE:__ needs to be called before anything else on `Rtc`-API


#### .shutdown()

Closes every existing connection, stops handling connections and doesn't allow 
incoming attempts anymore.

+   *@return:*  amount of closed connections


#### .status

Reflects the status of the `Rtc runtime.

+   reactive data source
+   possible values:
    -   `'boot'`:   initiating...
    -   `'up'`:     everything is up and running, handles incoming connections, can 
                    connect to someone else
    -   `'block'`:  blocks incoming connections; still able to connect to others
    -   `'down'`:   `Rtc` doesn't work anymore (all connections closed, blocks all 
                    incoming attempts)


#### .connect( userId [, options] )

Triggers an attempt to connect to a given user.

__NOTE:__ information about a users status (e.g. about her availability) is not 
provided by this package and needs to be done independently

+   *@return: Rtconnection wrapped in a Promise*
+   `userId: String` *(not required)* 
+   `options:` *(not required)*, please see `.bootup` for more information



#### .disconnect( userId )

Cancels one or all connection(s).

__NOTE:__ If no argument is given, all connections are going to be closed.

+   `userId: String` *(not required)*


#### .incoming()[.filter( filterFn )].connections( handleFn )

+   `.filter( filterFn )`
    -   *(not required)* 
    -   `filterFn( userId [, options ] )` has to return `Boolean`
    
+   `.connections( handleFn )`
    -   `handleFn( promise )` gets called on every incoming connection attempt;
        wraps a Rtconnection`


#### .connection( userId )

A simple getter for an existing connection.

+   *@return:` `Rtconnection` OR `null (if not exist)
+   `userId: String`


#### Rtconnection

+   `.id` - getter, *@return String*
+   `.role` - getter, *@return String*, `'dispatcher'` or `'recipient'`
+   `.state` - reactive data source; possible values:+   
    -   `'initialized'`: instantiated
    -   `'gathering'`: ICE candidates are getting determined
    -   `'signaling'`: ICE information are getting exchanged
    -   `'open'`: connection is established
    -   `'closed'`: connection was terminated
+   `.on( eventName, handleFn )` - registers event handler, *@return handler*
+   `.when()` - promisified version of `.on()`
+   `.off( eventName [, handler ] )` - removes event listener(s); if `handler` 
    is not defined, the call will remove all registered handlers
+   `.send( data )` - sends data (Note: plain `RTCDatachannel.send`, serialization 
    is not taking care of)
+   `receive( handleFn )` - `handleFn` gets called on every incoming data, which is
    the first and only argument
+   `.close()` - closes the given connection
+   `.stream` - reactive data source; *@return* `null` or `MediaStream`



### Checklist

- [X]   abstracting webrtc and providing basic API 
- [X]   support data and media
- [X]   major refactoring towards ES6 modules
- [ ]   round up API (remove incoming handler, temp. blocking, document existing events, ...)
- [ ]   automated testing
- [ ]   check browser compatibility
- [ ]   add support for 1/n-to-n connections
- [ ]   update to latest version of the [working draft](https://www.w3.org/TR/webrtc/)



### License

[FVUS](./LICENSE.md)
