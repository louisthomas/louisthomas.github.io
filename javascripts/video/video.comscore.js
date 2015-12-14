define(['streamsense'], function() {

    return {
        init :  function() {
                /**
                 * StreamSenseClip
                 * This constructor will init the base variable and init the StreamSens object.
                 *
                 * @param string streamSenseC2 value of the C2 variable of the comscore API call
                 * @param string entity        value of the siteTag of the current video site
                 **/
                function StreamSenseClip(streamSenseC2, videoMetrixC2, entity) {

                    this.currentClip = 0;
                    this.currentContentClip = 0;
                    this.clips = [];

                    this.videoMetrix = videoMetrixC2;
                    this.entity = entity
                    //comScore StreamSense Analytics
                    this.streamSense = new ns_.StreamSense({}, 'http://b.scorecardresearch.com/p?c1=2&c2=' + streamSenseC2 + "&c3=" + entity);
                    this.streamSense.setPlaylist();
                }

                /**
                 * newContentClip
                 * This method init a new content clip object from the video information
                 * It's called when a new video content is start in the player
                 *
                 * @param object videoInfo information about the current video (refID, duration, etc)
                 **/
                StreamSenseClip.prototype.newContentClip = function (videoInfo) {

                    this.currentClip++;
                    this.currentContentClip = this.currentClip;

                    // Init the classification value if the content is a long form (more than 600 seconds) or a short form (less than 600 seconds)
                    if (videoInfo.duration > 600) {
                        var classification = "vc12";
                        this.beaconUpdate('03');
                    } else {
                        var classification = "vc11";
                        this.beaconUpdate('02');
                    }

                    // Init the currentClip values
                    this.clips[this.currentClip] = {
                        'ns_st_cn': this.currentContentClip,
                        'ns_st_ci': videoInfo.refId,
                        'ns_st_pn': 1,
                        'ns_st_tp': videoInfo.totalPart,
                        'ns_st_cl': videoInfo.duration * 1000,
                        'ns_st_pu': videoInfo.publisher,
                        'ns_st_cu': videoInfo.source,
                        'ns_st_ct': classification,
                        'ns_st_de': videoInfo.entity
                    };

                    // Tell the streamSense object it's now the current clip that play
                    this.streamSense.setClip(this.clips[this.currentContentClip]);
                    this.streamSense.notify(ns_.StreamSense.PlayerEvents.PLAY, {}, 0);
                }

                /**
                 * newAdClip
                 * This method init a new ad clip object from the video information
                 * It's called when a new ad is start in the player
                 *
                 * @param string adType     the type of the ad (preroll/midroll/postroll)
                 * @param object videoInfo  information about the current video (refID, duration, etc)
                 * @param int position      the current position in the video content
                 **/
                StreamSenseClip.prototype.newAdClip = function (adType, videoInfo, position) {
                    this.currentClip += 1;

                    // Init the classification value if the ad is a midroll or not
                    if (adType == "midroll") {
                        var classification = "va12";
                        this.beaconUpdate('11');
                    } else {
                        var classification = "va11";
                        this.beaconUpdate('09');
                    }

                    // Init the currentClip values
                    this.clips[this.currentClip] = {
                        'ns_st_cn': this.currentClip,
                        'ns_st_ci': videoInfo.refId,
                        'ns_st_pn': 1,
                        'ns_st_tp': 1,
                        'ns_st_cl': 0,
                        'ns_st_pu': videoInfo.publisher,
                        'ns_st_cu': 'none',
                        'ns_st_ad': 1,
                        'ns_st_ct': classification,
                        'ns_st_de': videoInfo.entity
                    };

                    // Tell the streamSense object it's now the current clip that play
                    this.streamSense.setClip(this.clips[this.currentClip]);
                    this.streamSense.notify(ns_.StreamSense.PlayerEvents.PLAY, {}, position * 1000);
                }

                /**
                 * Playing
                 * This method trigger the PLAY event to the streamSense object
                 * This method is called from the base_bcplayer_comscore plugin when the player trigger the "playing" event
                 * This can be the PLAY of a content or ad video
                 *
                 * @param boolean isNewPart tell if the method should increment or not the part number of the current content clip
                 * @param int position      the current position of the video content
                 **/
                StreamSenseClip.prototype.playing = function (isNewPart, position) {

                    if (isNewPart) {
                        this.clips[this.currentContentClip].ns_st_pn++;
                        console.log('this.streamSense.setClip(this.clips[this.currentContentClip]);');
                    }
                    this.streamSense.notify(ns_.StreamSense.PlayerEvents.PLAY, {}, position * 1000);
                }

                /**
                 * Playing
                 * This method trigger the END event to the streamSense object
                 * This method is called from the base_bcplayer_comscore plugin when the player trigger the "ended" event
                 * This can be the END of a content or ad video
                 *
                 * @param int position  the current position of the video content
                 **/
                StreamSenseClip.prototype.ended = function (position) {
                    this.streamSense.notify(ns_.StreamSense.PlayerEvents.END, {}, position * 1000);
                }

                /**
                 * Playing
                 * This method trigger the PAUSE event to the streamSense object
                 * This method is called from the base_bcplayer_comscore plugin when the player trigger the "pause" event
                 *
                 * @param int position  the current position of the video content
                 **/
                StreamSenseClip.prototype.pause = function (position) {
                    this.streamSense.notify(ns_.StreamSense.PlayerEvents.PAUSE, {}, position * 1000);
                }

                StreamSenseClip.prototype.beaconUpdate = function (c5) {
                    COMSCORE.beacon({
                        c1: 1,
                        c2: this.videoMetrix,
                        c3: this.entity,
                        c5: c5
                    });
                }

                // Export symbols.
                window.StreamSenseClip = StreamSenseClip;

                /*
                 * This is the comscore plugin to control the comscore analytics calls
                 * We receive options from the player initialization
                 this options contains content video information and comscore account information
                 * This call the StreamSense object
                 *
                 * @param options   contain ads and content options needed by other plugin
                 */
                videojs.plugin('comscore_setup', function (options) {
                    // Init player object
                    var player = this;

                    // Init the streamSenseClip object
                    var streamSenseClip = new StreamSenseClip(options.streamSenseC2, options.videoMetrixC2, options.siteTag);

                    // Init the video information object
                    var videoInfo = {};

                    // isAfterAd will indicate if an ad just finish or not
                    var isAfterAd = false;

                    // Player State
                    var state = {
                        ad: {
                            isPlaying: false
                        },
                        content: {
                            isLoaded: false,
                            isFirstTimePlaying: true,
                            isPlaying: false,
                            previousTime: 0,
                            currentTime: 0,
                            seeked: false
                        }
                    };

                    /**
                     * Fired when 'contentupdate' event is triggered by the player
                     * This will reset the content state
                     **/
                    player.on('contentupdate', function () {
                        state.ad.isPlaying = false;
                        state.content = {
                            isLoaded: false,
                            isFirstTimePlaying: true,
                            isPlaying: false,
                            previousTime: 0,
                            currentTime: 0,
                            seeked: false
                        }
                    });

                    /**
                     * Fired when 'loadedmetadata' event is triggered by the player
                     * Set the video information that will be use to send event to comscore
                     **/
                    player.on('loadedmetadata', function () {
                        if (!state.content.isLoaded) {
                            // isLoaded is to avoid the event called twice
                            state.content.isLoaded = true;

                            videoInfo = {
                                'duration': player.duration(),
                                'refId': player.mediainfo.reference_id,
                                'totalPart': player.mediainfo.cue_points.length + 1,
                                'publisher': (options && options.publisher) || "Bell Media",
                                'source': player.src(),
                                'entity': (options && options.siteTag) || ""
                            }
                        }
                    });

                    /**
                     * Fired when 'playing' event is triggered by the player
                     * This will call the creation of a new clip if it's the first time playing this content
                     * If not will call the streamSense playing event
                     **/
                    player.on('playing', function () {
                        if (!state.ad.isPlaying && !state.content.isPlaying) {
                            state.content.isPlaying = true;

                            // If it's the first time the content play (after preroll)
                            if (state.content.isFirstTimePlaying) {
                                streamSenseClip.newContentClip(videoInfo);
                                state.content.isFirstTimePlaying = false;
                            } else {
                                // Restart after a "pause" or after a midroll
                                streamSenseClip.playing(isAfterAd, player.currentTime());
                                isAfterAd = false;
                            }
                        }
                    });

                    /**
                     * Fired when 'pause' event is triggered by the player
                     * This will take care of 3 case
                     - A standard pause
                     - The end of the video
                     - A seeking event
                     * In each case, the right streamsense event will be called
                     **/
                    player.on('pause', function () {
                        if (state.content.isPlaying) {
                            state.content.isPlaying = false;

                            if (!player.ended()) {
                                if (state.content.seeked) {
                                    // If the user have seek into the video (position will be the time at the beginning of the seek)
                                    streamSenseClip.pause(state.content.previousTime);
                                    state.content.seeked = false;
                                } else {
                                    // A regular user 'pause'
                                    streamSenseClip.pause(player.currentTime());
                                }
                            } else {
                                // If the content is ended
                                streamSenseClip.ended(player.currentTime());
                            }
                        }
                    });

                    /**
                     * Fired when user end seeking
                     * set the content state 'seeked' to true
                     * This is use in the 'pause' event listener
                     **/
                    player.on('seeked', function () {
                        state.content.seeked = true;
                    });

                    /**
                     * Fired when 'adstart' event is triggered by the player
                     * Call the creation of a new clip of type 'ad'
                     * If the current ad is a 'midroll' set the isAterAd to true, this is use to change the part number of the current content
                     **/
                    player.on('adstart', function () {
                        if (!state.ad.isPlaying) {
                            state.ad.isPlaying = true;
                            streamSenseClip.newAdClip(player.base_bcplayer_ads.getAdType(), videoInfo, player.currentTime());
                            if (player.base_bcplayer_ads.getAdType() == "midroll") {
                                isAfterAd = true;
                            }
                        }
                    });

                    /**
                     * Fired when 'adend' event is triggered by the player
                     * Trigger the ended method of streamsense
                     **/
                    player.on('adend', function () {
                        if (state.ad.isPlaying && (player.ads.state == 'ad-playback')) {
                            state.ad.isPlaying = false;
                            streamSenseClip.ended(player.currentTime());
                        }
                    });

                    /**
                     * Fired when 'adserror' event is triggered by the player
                     * Trigger the ended method of streamsense
                     **/
                    player.on('adserror', function () {
                        state.ad.isPlaying = false;
                        streamSenseClip.ended(player.currentTime());
                    });

                    /**
                     * Fired when timeline change (call every 15 to 250 milliseconds according to videojs documentation)
                     * previousTime is store to be use in case of user seek action
                     */
                    player.on('timeupdate', function () {
                        state.content.previousTime = state.content.currentTime;
                        state.content.currentTime = player.currentTime();
                    });
                    console.log("Comscore plugin loaded");
                });
        }
    };

});