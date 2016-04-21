//Fix the console on IE <= 8
if (typeof window.console == "undefined") {
    window.console = {log: function(){}};
}

require.config({
    baseUrl: './javascripts',
    paths: {
        'jquery':           'lib/jquery',
        'streamsense':      ['http://ztele.com/js/astral/streamsense.min'],
        'videojs.ima3':     ['//players.brightcove.net/videojs-ima3/videojs.ima3.min'],
        'videoPlayer':      ['modules/videoPlayer'],
        'dojo':             ['//api.listenlive.co/tdplayerapi/2.8/dojo/dojo']
    }
});