define([], function () {

    // References to the current sessionId
    var sessionId = null;
    var _options;

    // When the stream is done with playback
    var cleanUpSession = function(){
        if (sessionId != null) {
            Conviva.LivePass.cleanupSession(sessionId);
            sessionId = null;
        }
    };

    // When the user clicks play
    var createSession = function(player){
        // Clean up previous session
        cleanUpSession();
        var content = _options.content;

        // Begin: Set up metadata
        //Pattern"[{contentId}] {series or movie title} - {episode or show title for series}"
        var assetName = "["+content.refId+"] "+content.title;

        if(content.episode){
           assetName += " - " + content.episode;
        }
        if(content.showName){
            assetName += " - " + content.showName;
        }

        var tags = {
            accessType : "non-Authenticated",
            affiliate : "bellmedia",
            appVersion: "1.0.0",
            //TODO add new macro VM
                brand: "canald",
            isDRM:"false",
            playerVersion:"1.0.0"
        };

        var convivaMetadata = new Conviva.ConvivaContentInfo(assetName,tags);
        convivaMetadata.defaultReportingCdnName = Conviva.ConvivaContentInfo.CDN_NAME_AKAMAI;
        convivaMetadata.defa = Conviva.ConvivaContentInfo.FRAMEWORK_NAME_BRIGHTCOVE

        var mediaInfo = player.mediainfo;

        /**
         * Find first MP4 video source stream url and add it as default stream URL.
         * One video can have multiple source, it depends on Brightcove rendition configuration .
         **/
        for(var i = 0; i < mediaInfo.sources.length; i++){
            var videoSource = mediaInfo.sources[i];
            if(videoSource.container == "MP4"){
                convivaMetadata.streamUrl = videoSource.streaming_src;
                break;
            }
        }
        //TODO add checkbox to UI
        convivaMetadata.isLive = false;

        //Brightcove - accountId - playerId
        convivaMetadata.playerName = "brightcove - " + player.el_.attributes['data-account'].nodeValue + " - " + player.el_.attributes['data-player'].nodeValue;
        convivaMetadata.viewerId = "brightcove_videojs_test";
        var streamer = new Conviva.ConvivaVideojsStreamerProxy(player);
        sessionId = Conviva.LivePass.createSession(streamer,convivaMetadata);

    };

    convivaFramework = function (options) {
        // Init player object
        var player = this;
        _options=options;
        /**
         * Fired when the content begin to play in the player
         */

        player.on('loadedmetadata', function () {
            createSession(this);
        });

        player.on('ended', function () {
            cleanUpSession();
        });
    }

    /*
     * This is the plugin to control ads events and methods
     *
     * @param options
     */
    return convivaFramework;
});