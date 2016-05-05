
Package.describe({
    name: 'lucendio:rtc',
    summary: 'a meteorized and simplified WebRTC API',
    version: '0.2.0',
    git: 'https://github.com/lucendio/meteor_rtc.git',
    documentation: 'README.md'
});




Package.onUse( function( api ){

    api.versionsFrom( 'METEOR@1.3' );
    
    
    Npm.depends({
        'webrtc-adapter': '1.0.7'
    });


    api.use([
        'mongo',
        'random',
        'check',

        //TODO remove these
        'aldeed:simple-schema',
        'aldeed:collection2@2.9.1',

        'ecmascript',
        'es5-shim',
        'modules'
    ], [ 'server', 'client' ] );


    api.use([
        'tracker'
    ], 'client' );


    api.use([

    ], 'server' );
    
    
    
    api.mainModule( './server/main.js', 'server' );
    api.mainModule( './client/main.js', 'client' );

});




Package.onTest( function( api ){
    // TODO
});
