define(['modules/Base', 'jquery', 'require'], function (Base, $, require) {
    "use strict";

    var TritonPlayer = Base.extend({
        defaultOptions: {
            pluginName: "TritonPlayer",
            containerSelector: '#td_container'
        },

        /* default methods ------------------------------------------------------------------------------------------ */

        main: function () {
            var self = this;
            var player;

            window.dojoConfig = {
                onReady:tdPlayerApiReady,
                async: 1,
                tlmSiblingOfDojo: 0,
                deps:['tdapi/run']
            };

            require(['dojo']);

            function tdPlayerApiReady() {
                console.log('TdPlayerApi is ready');
                //Player API is ready to be used, this is where you can instantiate a new TdPlayerApi instance.
                //Player configuration: list of modules
                var tdPlayerConfig = {
                    coreModules: [
                        {
                            id: 'MediaPlayer',
                            playerId: 'td_container',
                            techPriority: ['Html5', 'Flash'],
                            plugins: [
                                {
                                    id: "vastAd"
                                }
                            ]
                        },
                        {
                            id: 'NowPlayingApi'
                        }
                    ]
                };
                //Player instance
                player = new TdPlayerApi(tdPlayerConfig);
                //Listen for player-ready callback
                player.addEventListener('player-ready', onPlayerReady);
                //Listen for module-error callback
                player.addEventListener('module-error', onModuleError);
                //Load the modules
                player.loadModules();
            }

            /* Callback function called to notify that the API is ready to be used */
            function onPlayerReady() {
                //Listen for 'track-cue-point' event
                player.addEventListener('track-cue-point', onTrackCuePoint);
                //Play the stream: station is TRITONRADIOMUSIC
                player.play({station: 'TRITONRADIOMUSIC'});
            }

            /* Callback function called to notify that a module has not been loaded properly */
            function onModuleError(object) {
                console.log(object);
                console.log(object.data.errors);
                //Error code : object.data.errors[0].code
                //Error message : object.data.errors[0].message
            }

            /* Callback function called to notify that a new Track CuePoint comes in. */
            function onTrackCuePoint(e) {
                $('#cuePoint').html(JSON.stringify(e.data.cuePoint));
                $('#nowPlaying').load(e.data.cuePoint.nowplayingURL);
            }
        }
    });

    return TritonPlayer;

});