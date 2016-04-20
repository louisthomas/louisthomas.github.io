define(['streamsense'], function() {

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
}

/**
 * setPlaylist
 * This method is called on every new video content, to create a new playlist related to the video content
 */
StreamSenseClip.prototype.setPlaylist = function(){
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
};

/**
 * newAdClip
 * This method init a new ad clip object from the video information
 * It's called when a new ad is start in the player
 *
 * @param string adType     the type of the ad (preroll/midroll/postroll)
 * @param object videoInfo  information about the current video (refID, duration, etc)
 * @param int position      the current position in the video content
 **/
StreamSenseClip.prototype.newAdClip = function (adType, videoInfo, adDuration) {
    this.currentClip += 1;

    // Init the classification value if the ad is a midroll or not
    if (adType == "MIDROLL") {
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
        'ns_st_cl': adDuration * 1000,
        'ns_st_pu': videoInfo.publisher,
        'ns_st_cu': 'none',
        'ns_st_ad': 1,
        'ns_st_ct': classification,
        'ns_st_de': videoInfo.entity
    };

    // Tell the streamSense object it's now the current clip that play
    this.streamSense.setClip(this.clips[this.currentClip]);
};

/**
 * Playing
 * This method trigger the PLAY event to the streamSense object
 * This method is called from the base_bcplayer_comscore plugin when the player trigger the "playing" event
 * This can be the PLAY of a content or ad video
 *
 * @param boolean isNewPart tell if the method should increment or not the part number of the current content clip
 * @param int position      the current position of the video content
 **/
StreamSenseClip.prototype.updateContentPart = function () {
    this.clips[this.currentContentClip].ns_st_pn++;
    this.streamSense.setClip(this.clips[this.currentContentClip]);
};

StreamSenseClip.prototype.playing = function (position) {
    this.streamSense.notify(ns_.StreamSense.PlayerEvents.PLAY, {}, Math.round(position * 1000));
};

/**
 * Playing
 * This method trigger the END event to the streamSense object
 * This method is called from the base_bcplayer_comscore plugin when the player trigger the "ended" event
 * This can be the END of a content or ad video
 *
 * @param int position  the current position of the video content
 **/
StreamSenseClip.prototype.ended = function (position) {
    this.streamSense.notify(ns_.StreamSense.PlayerEvents.END, {}, Math.round(position * 1000));
};

/**
 * Playing
 * This method trigger the PAUSE event to the streamSense object
 * This method is called from the base_bcplayer_comscore plugin when the player trigger the "pause" event
 *
 * @param int position  the current position of the video content
 **/
StreamSenseClip.prototype.pause = function (position) {
    this.streamSense.notify(ns_.StreamSense.PlayerEvents.PAUSE, {}, Math.round(position * 1000));
};

/**
 * Buffering
 * This method trigger the BUFFER event to the streamSense object
 * This method is called from the base_bcplayer_comscore plugin when the player trigger the "waiting" event
 *
 * @param int position  the current position of the video content
 **/
StreamSenseClip.prototype.buffer = function (position) {
    this.streamSense.notify(ns_.StreamSense.PlayerEvents.BUFFER, {}, Math.round(position * 1000));
};

StreamSenseClip.prototype.beaconUpdate = function (c5) {
    COMSCORE.beacon({
        c1: 1,
        c2: this.videoMetrix,
        c3: this.entity,
        c5: c5
    });
};

return StreamSenseClip;
});