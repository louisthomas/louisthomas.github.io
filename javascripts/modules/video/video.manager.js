define(['modules/video/video.media',], function(Media) {

    /*
     * This is the base plugin to control every aspect of the bcplayer
     * We receive options from the player initialization
     options.ad contain information about ads (adUnit, zone, userAge, etc)
     options.content contain information about content (refId, videoType, etc)
     options.playlist contain array of incomming videos (array)
     * This initialize other base_bcplayer plugin (ads, playlist, analytics, etc)
     *
     * @param options   contain ads and content options needed by other plugin
     */
    return {
        init : function() {
            videojs.plugin('mediaPlugin', Media);
        }
    };
});