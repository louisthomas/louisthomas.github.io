/* BrightcovePlayer Class
 * Namespace: astral.brightcovePlayer
 ---------------------------------------*/
define(['jquery'], (function ($) {
    "use strict";


    var playerId;
    var videoPlayerId;

    var appendVideoTag = function (player,publisherId, playerId) {
        var self = this;
        var UID = generateUID();
        var videoPlayerContainer = player.find('.video-player');
        videoPlayerId = "videoPlayer-" + UID;
        var videoTag = $('<video id="' + videoPlayerId + '" data-account=' + publisherId + ' data-player=' + playerId + ' data-embed="default" class="video-js" controls />');
        videoPlayerContainer.prepend(videoTag);
    };

    var generateUID = function () {
        return (((1 + Math.random()) * 0x10000) | 0).toString(16).substring(1);
    };


    return {
        init: function (player) {
            var publisherId = player.data('publisher-id');
            playerId = player.data('player-id');
            var options = $.parseJSON(player.data('player-options'));
            var bcModule = "//players.brightcove.net/" + publisherId + "/" + playerId + "_default/index.js";
            appendVideoTag(player, publisherId, playerId);

            require([bcModule], function () {
                require(['bc', 'video/video.manager', 'videojs.ima3'], function (BC, VideoManager) {
                    VideoManager.init();

                    videojs(videoPlayerId).ready(function () {
                        player = this;
                        player.plugin_configuration(options);
                    });

                });
            });

        }
    }
}));




