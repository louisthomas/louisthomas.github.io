define(['video/video.media','video/video.ads', 'video/video.comscore'], function(Media, Ads, Comscore) {

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
            videojs.plugin('plugin_configuration', function (options) {

                // Init player object
                var myPlayer = this;
                console.log("video manager loaded");

                /**
                 * Initialisation of the base_bcplayer_playlist
                 * This plugin manage the playlist of videos and the display of the next video title
                 *
                 * @param firstVideo    the default video to load into the player on ready
                 * @param playlist      a list of other videos to play after the default one
                 *                      (refID and title)
                 **/


                Media.init();

                myPlayer.media_setup({
                    'firstVideo': options.content.refId,
                    'playlist': options.playlist
                });

                /**
                 * Initialisation of the base_bcplayer_comscore
                 * This plugin manage all calls about the traking for comscore
                 *
                 * @param options   options needed by the plugin
                 *                  (siteTag, comscoreID, etc)
                 **/

                Comscore.init();
                myPlayer.comscore_setup(options.comscore);

                /*
                 * Initialisation of the base_bcplayer_ads plugin
                 * This plugin manage every aspect of the ad display
                 *
                 * @param options   options needed by the plugin
                 */

                Ads.init();
                myPlayer.ads_setup({
                    'gptAdUnitId': options.ad.unitId,
                    'gptAdZone': options.ad.zone,
                    'gptAdKeys': options.ad.gptAdKeys,
                    'userAge': options.ad.userAge,
                    'adEnabled': options.ad.adEnabled,
                    'videoType': options.content.videoType
                });

                /*
                 * Fired when the ima3 plugin is ready
                 * This lunch the load of the first video into the player
                 * We wait for this to be sure an adrequest will be lunch when the video is loaded
                 */

                myPlayer.ima3.ready(function () {
                    console.log("Fired ima3 plugin!");
                    this.media_setup.loadDefaultVideo(options.content.autoStart);
                });
            });
        }
    };
});