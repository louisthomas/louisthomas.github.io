define(['modules/Base', 'jquery', 'require'], function (Base, $, require) {
    "use strict";

    var videoPlayerId;

    var VideoPlayer = Base.extend({
        defaultOptions: {
            pluginName: "VideoPlayer",
            containerSelector: '.base-brightcovePlayer'
        },

        /* default methods ------------------------------------------------------------------------------------------ */

        main: function () {
            var self = this;

            self.container.each(function () {
                var player = $(this);

                self.createPlayer(player);
            });
        },

        createPlayer: function (player) {
            var self        = this;
            var publisherId = player.data('publisher-id');
            var playerId    = player.data('player-id');
            var options = player.data('player-options');

            //TODO: Add age restriction
            var bcModule    = "//players.brightcove.net/"+ publisherId+ "/" + playerId + "_default/index.js";
            self.appendVideoTag(publisherId, playerId);

            require([bcModule], function () {
                require(['bc', 'videojs.ima3'], function () {
                    require(['modules/video/video.manager'], function (VideoManager) {
                        VideoManager.init();
                        self.initPlayer(videoPlayerId, player, options)
                    });
                });
            });

        },

        initPlayer: function (videoPlayerId, player, options) {
            /*
             * When player is ready, this method is fired
             * Options is created with data from content/gui
             * We init the video manager plugin with these options
             * This plugin will take care of init everything else (ads, analytics, playlist, etc)
             */
            videojs(videoPlayerId).ready(function () {
                player = this;
                var playlistOptions = options.playlist;

                /**
                 * Initialisation of the base_bcplayer_playlist
                 * This plugin manage the playlist of videos and the display of the next video title
                 *
                 * @param firstVideo    the default video to load into the player on ready
                 * @param playlist      a list of other videos to play after the default one
                 *                      (refID and title)
                 **/
                player.mediaPlugin({
                    'firstVideo': options.content,
                    'playlist': playlistOptions,
                    'autoStart': options.player.autoStart
                });

            });
        },

        appendVideoTag : function(publisherId, playerId) {
            var self                 = this;
            var UID                  = self.generateUID();
            videoPlayerId            = "videoPlayer-" + UID;
            var videoPlayerContainer = self.container;
            var videoTag             = $('<video id="'+ videoPlayerId +'" data-account='+ publisherId +' data-player='+ playerId +' data-embed="default" class="video-js" controls />');
            videoPlayerContainer.prepend(videoTag);
        },

        generateUID: function () {
            return (((1 + Math.random()) * 0x10000) | 0).toString(16).substring(1);
        }
    });

    return VideoPlayer;

});