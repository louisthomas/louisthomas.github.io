define([], function() {

    return {
        init :  function() {

                /**
                 *  Ad plugin for CTB video player
                 *  It will detect when an ad is ready to play and analyse if there an ad to play or not
                 *
                 *  @param options  an object containing basic init value
                 */
                videojs.plugin('ads_setup', function (options) {
                    // Init player object
                    var player = this;

                    console.log("Ads plugin loaded");

                    // Config value to set the ads
                    var config = {
                        'minimumAge': "under12", // The value of the value that the userAge need to have to be spotted as underAge
                        'exludedVideoType': "Bandes-annonces" // The value of the videoType we don't want to play ad
                    };

                    // These options are passed to the plugin on his initalisation
                    var gptAdUnitId = (options && options.gptAdUnitId) || ""; // The AdUnitId of the site -- needed to build the path of the adRequets
                    var gptAdZone = (options && options.gptAdZone) || "";// The AdZone of the site -- needed to build the path of the adRequets
                    var gptAdKeys = (options && options.gptAdKeys) || "";// The Key/value pair to add to the adServer URL


                    if (typeof Krux !== "undefined") {
                        gptAdKeys += "%26" + "u%3D" + Krux.user;
                    }

                    var userAge = (options && options.userAge) || ""; // The age of the user "under12" if the user is recognize as under 12
                    var videoType = (options && options.videoType) || ""; // The type of the video
                    var adEnabled = (options && options.adEnabled) || false;
                    /**
                     * The state that the plugin can be
                     * Exemple :
                     *   ad : state value for the ads // type, isPlaying, playCap
                     conent : state value for the contents // allowAd, previousTime, currentTime
                     **/
                    var state = {};

                    /**
                     * init the state to is default values
                     * called each time 'contentupdate' is fired (when a new content is loaded into the player)
                     */
                    var resetState = function () {
                        state = {
                            ad: {
                                type: "preroll", // Type of the ad (preroll/midroll/postroll) preroll as default
                                isPlaying: false, // if an ad is currently playing or not
                                count: 0, // the number of ad are played since the begin of a selected sequence
                                playCap: 1, // the number of ad to play in a sequence (1 by default, 2 if the duration is more than 300 sec)
                                callPending: false, // if an ad request is made but the content is not playing, will be true and waiting for content play
                            },
                            content: {
                                allowAd: false, // if the content allow an ad to be playing with
                                currentTime: 0, // current time of the playback (updated by the 'timeUpdate' event)
                                previousTime: 0, // will store the previous currentTime (will serve when user seek as start seeking time)
                                seekStart: 0, // store the previousTime when 'seeking' (begin of seek action) event is fired
                                seekEnd: 0, // store the currentTime when 'seeked' (end of seek action) event is fired
                                cues: {} // store the array of cuepoints of the video (use when search for skipped cuepoint)
                            }
                        };
                    };

                    /*
                     * This function is called on every oportunity to display an ad
                     * If the content allow an ad (state.content.allowAd == true) it do a verification of the playing state of the player
                     * As a player.ima3.adrequest start automatically the ad in some context, if the content is not playing, we just wait it does to make the adRequest
                     * if the content is playing, the ad request is make
                     * if no ad is allowed, it trigger 'adscanceled' event
                     */
                    var requestAds = function (videoPlayer) {

                        console.log('requestAds');
                        // retreive the adUrl
                        var adServerUrl = getAdServerUrl();

                        // Check if ad are allowed for this content
                        if (state.content.allowAd && state.ad.count < state.ad.playCap && !state.ad.isPlaying) {
                            /*
                             * Check if the content is currently paused
                             * If yes, a state callPending is set to true and will be activated when the content will start playing
                             * If not the ad is requested now
                             */
                            if (player.paused()) {
                                state.ad.callPending = true;
                            } else {
                                // make an adRequest to the ad server to retreive de VAST file
                                console.log('ima3 ad request');
                                player.ima3.adrequest(adServerUrl);
                                state.ad.callPending = false;
                            }
                        } else {
                            // tell the player that the content is not follow the adRule and cancel it
                            player.trigger('adscanceled');
                        }

                    };

                    /**
                     * Validate if options provided are not empty else an error will be send and no ad will be play
                     *
                     * @return the adUrl or false on error
                     */
                    var getAdServerUrl = function () {
                        // Construct the adServerUrl from options and state of current display
                        if (gptAdUnitId != "" && gptAdZone != "") {
                            var adPath = gptAdUnitId;
                            if (player.techName == "Html5") {
                                adPath += "html5"; // ad "html5" to the url if detect that the player used is html5
                            }
                            adPath += "/" + gptAdZone;
                            if (state.ad.type == "midroll") {
                                adPath += "/midroll";
                            }
                            return ("http://pubads.g.doubleclick.net/gampad/ads?iu=" + adPath + "&sz=9x10&gdfp_req=1&env=vp&output=xml_vast2&unviewed_position_start=1&cust_params=" + gptAdKeys); // The path to the VAST for the adRequest
                        } else {
                            console.log('Ad Error : missing AdUnitId and/or AdZone');
                            state.content.allowAd = false;
                            return (false);
                        }
                    };

                    /**
                     * Return if the userAge equal the minimum age value specified in the config
                     * As part of ad rules, an ad can only be display is this return false
                     * Called by setAd function
                     *
                     * @return boolean
                     */
                    var isUnderAge = function () {
                        return (typeof userAge != 'undefined' && userAge === config.minimumAge);
                    };

                    /**
                     * Return if the current content videoType is part of types than can't display ad
                     * As part of ad rules, an ad can only be display is this return false
                     * Called by setAd function
                     *
                     * @return boolean
                     * @todo make it scalable for multiple value
                     */
                    var isExcludedVideoType = function () {
                        return (typeof videoType != 'undefined' && videoType === config.exludedVideoType);
                    };

                    /**
                     * Validate if options provided are not empty else an error will be send and no ad will be play
                     * Verify if an ad can be play for that video by validate some ad rules (set state.content.allowAd at true if an ad can be play)
                     * Set also some config for the ad state.ad.playCap, state.ad.url)
                     * Called when a new content metadata is loaded into the player
                     */
                    var setAd = function () {
                        // Verify if content allow ad to display
                        if (adEnabled && !isUnderAge() && !isExcludedVideoType()) {
                            state.content.allowAd = true;

                            // If duration is more than 300 sec, allow 2 ad to be deplay in the same sequence
                            if (player.duration() > 300) {
                                state.ad.playCap = 2;
                            }
                        }
                    };

                    /**
                     * Verify if the current cue-point's type is "AD"
                     * If true, the type of ad will be "midroll" and an adRequest will be call else false will be return
                     * Called when an cuepoint is found
                     *
                     * @param cuePoint  the current cuepoint
                     * @return boolean  the return will be usefull for the loop hasSkipAdCuePoint to break if it's an ad cuepoint
                     */
                    var isAdCuePoint = function (cuePoint) {
                        var isAd = false;
                        if (cuePoint !== undefined && cuePoint.text === "AD") {
                            isAd = true;
                            // Set the ad type and reset count to 0
                            state.ad.type = "midroll";
                            state.ad.count = 0;
                            //request the ad
                            requestAds(this);
                        }
                        return (isAd);
                    };

                    /**
                     * Called when seek action is ended (see player.on('seeked', function(){}))
                     * Loop on cuepoint list to see if one was skipped between seek start and seek end time
                     * If a cuePoint is found, send it to 'isAdCuePoint()' to verify if it's an ad cupoint or not
                     * if yes, end the loop, if not continue searching
                     */
                    var hasSkipAdCuePoint = function () {
                        for (var i = 0; i < state.content.cues.length; i++) {
                            var cueTime = state.content.cues[i].startTime;
                            if (state.content.seekStart < cueTime && cueTime < state.content.seekEnd) {
                                if (isAdCuePoint(state.content.cues[i])) {
                                    break;
                                }
                            }
                        }
                    };


                    /**
                     * Fired when a content metadata is loaded into the player
                     * For unknown reason, it's called twice on flash player
                     * retreive content cuepoints
                     */
                    player.on('loadedmetadata', function () {

                        console.log('load metadata');

                        /**
                         * The textTracks are cummulative in the array when new video are loaded into the player
                         * To find the right textTrack for the current video, you have to reach the last item of the array
                         */
                        var currentTextTracks = player.textTracks().length - 1;
                        // Retreive the information about timeline and cuepoint
                        var tt = player.textTracks()[currentTextTracks];

                        /**
                         * this is a workaround - a ticket is open about this with brightcove
                         * add 1 second for the endTime of each cue to be able to have time to reach the activeCues array
                         * on HTML5 player, if the endTime is equal to startTime, when oncuechange is fired, the cues is aready disapear from activeCues
                         */
                        for (var i = 0; i < tt.cues.length; i++) {
                            tt.cues[i].endTime = tt.cues[i].endTime + 1;
                        }

                        // Store all cuepoints for the hasSkipAdCuePoint if user seek
                        state.content.cues = tt.cues;

                        // Fired when cuepoint is triggered
                        tt.oncuechange = function () {
                            isAdCuePoint(tt.activeCues[0]);
                        };

                        // look if the content follow the ad rules and set some option
                        setAd();

                        // make ad request call for preroll
                        requestAds(this);
                    });

                    /**
                     * Fired when content in the player change
                     */
                    player.on('contentupdate', function () {
                        resetState();
                    });

                    /**
                     * Fired when the content begin to play in the player
                     * Look if an ad call is pending, if yes call requestAds
                     */
                    player.on('play', function () {
                        console.log('Player play!');
                        if (state.ad.callPending) {
                            requestAds();
                        }
                    });

                    /**
                     * Fired when the ad start playing
                     * To prevent multiple event calls, we init isPlaying to true on first time this event is called
                     * We also look for the player.ads.state is 'ad-playback' to double check the state
                     * increment the ad counter if it's a new ad
                     */
                    player.on('adstart', function () {
                        console.log('Player adStart');
                        if (!state.ad.isPlaying) {
                            state.ad.isPlaying = true;
                            state.ad.count++;
                        }

                    });

                    /**
                     * Fired when the ad end
                     * To prevent multiple event calls, we init isPlayer to false if the player.ads.state is change to 'ad-playback' (because an adend is called twice when passed from ad to ad)
                     * Make a new ad request (in case that another ad can be play before the content resume)
                     */
                    player.on('adend', function () {
                        if (state.ad.isPlaying && (player.ads.state == 'ad-playback')) {
                            state.ad.isPlaying = false;
                            requestAds(this);
                        }
                    });

                    /**
                     * Fired when timeline change (call every 15 to 250 milliseconds according to videojs documentation)
                     * previousTime is store to be use in case of user seek action
                     */
                    player.on('timeupdate', function () {
                        state.content.previousTime = state.content.currentTime;
                        state.content.currentTime = player.currentTime();
                    });

                    /**
                     * Fired when user start seeking
                     * We store the previous time into the seekStart var
                     */
                    player.on('seeking', function () {
                        state.content.seekStart = state.content.previousTime;
                    });

                    /** Fired when user end seeking
                     * set current time as seekEnd time and verify if an ad cuepoint is skipped
                     */
                    player.on('seeked', function () {
                        state.content.seekEnd = player.currentTime();
                        hasSkipAdCuePoint();
                    });

                    player.on('ima3error', function(event) {
                        console.log('event', event);
                    });



                    player.ads_setup.getAdType = function () {
                        return (state.ad.type);
                    };

                    /**
                     * Initialization of the IMA3 plugin with basic options
                     * serverUrl: the adUrl (it will ad during the adRequest function)
                     * timout: The maximum amount of time to wait, in milliseconds, for an ad implementation to initialize before playback.
                     * prerollTimout: The maximum amount of time to wait for an ad implementation to initiate a preroll, in milliseconds. The prerollTimeout option is cumulative with the standard timeout parameter.
                     */

                    player.ima3({
                        serverUrl: '',
                        requestMode: 'ondemand',
                        timeout: 5000,
                        prerollTimeout: 5000,
                        debug: true,
                        loadingSpinner: true
                    });

                });
        }
    };

});
