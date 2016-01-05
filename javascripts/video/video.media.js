define([], function() {

    //Private method
    var nextVideoIndex = 0;
    var nextTitleDisplayed = false;
    var playWhenLoaded = false;
    var _options;

    /**
     * This function hide the next video title
     * Called when a new content is loading into the player (on 'contentupdate')
     */
    var resetDisplayNextVideoTitle = function () {
        $(".next-media-caption").hide(800);
        $("em.next-title").html("");
        nextTitleDisplayed = false;
    };

    /**
     * This function display the next video title in the playlist
     * To display the title, is should not already display, be in the last 10 sec of the current video, and has a next video in the playlist
     */
    var displayNextVideoTitle = function (player) {
        var nextVideoTitle;
        if (!nextTitleDisplayed && (player.remainingTime() < 10) && nextVideoIndex < _options.playlist.length) {
            $("div.next-media-caption").show(800);

            //set new Video
            nextVideoTitle = _options.playlist[nextVideoIndex].title;
            $("em.next-title").html(nextVideoTitle);
            nextTitleDisplayed = true;
        }
    };

    /*
     * LoadNextVideo
     * If the playlist has a next video, retreive the selected video into the catalog and load it into the player
     * Called when conent "ended" is fired
     *
     * @todo : take care of the error case
     */
    var loadNextVideo = function (player) {
        if (nextVideoIndex < _options.playlist.length) {
            player.catalog.getVideo('ref:' + _options.playlist[nextVideoIndex].id, function (error, video) {


                for (var i = 0; i < player.textTracks().length; i++) {
                    if (player.textTracks()[i].kind == 'metadata') { //If the textTracsk are about cuePonts .kind==metadata
                        player.textTracks()[i].oncuechange = null;
                    }
                }
                player.catalog.load(video);
                nextVideoIndex++;
                playWhenLoaded = true;
            });
        }
    };

    function loadDefaultVideo(player, options) {
        if (options && options.firstVideo != "") {
            player.catalog.getVideo('ref:' + options.firstVideo, function (error, video) {
                player.catalog.load(video);
                playWhenLoaded = options.autoStart;
            });
        } else {
            loadNextVideo(player);
        }
    };

    mediaFramework = function (options) {
        var player = this;
        _options = options;

        console.log("Media plugin loaded");

        loadDefaultVideo(player, options);

        /**
         * Fired when a new content is initiate into the player
         */
        player.on('contentupdate', function () {
            resetDisplayNextVideoTitle();
        });

        /**
         * Fired when the metada of content is loaded into the player
         * Called after contentupdate
         */
        player.on('loadedmetadata', function () {
            this.on('timeupdate', function () {
                displayNextVideoTitle(this);
            });

            console.log("ADS STATE: " + this.ads.state);

            if ((player.autoplay() || playWhenLoaded)) {
                isPlaying = true;
                player.play();
            }
        });

        /**
         * Fired when the video content is finish
         * This include if a postroll need to be play (fired after it)
         */
        player.on('ended', function () {
            loadNextVideo(this);
        });

    };

    /*
     * This is the plugin to control playlist events and methods
     *
     * @param options   contain the list of next videos
     */
    videojs.plugin('mediaPlugin', mediaFramework);
});