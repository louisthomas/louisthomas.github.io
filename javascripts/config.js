//Fix the console on IE <= 8
if (typeof window.console == "undefined") {
    window.console = {log: function(){}};
}

require.config({
    baseUrl: '/javascripts',
    paths: {
        'jquery':           ['//code.jquery.com/jquery-1.11.3.min'],
        'streamsense':      ['http://ztele.com/js/astral/streamsense.min'],
        'ima3.sdk':         ['//imasdk.googleapis.com/js/sdkloader/ima3'],
        'videojs.ima3':     ['//players.brightcove.net/videojs-ima3/videojs.ima3.min'],
        'videoPlayer':      ['modules/videoPlayer']
    },
    shim: {
        'videojs.ima3': {
            deps: ['ima3.sdk']
        }
    }
});