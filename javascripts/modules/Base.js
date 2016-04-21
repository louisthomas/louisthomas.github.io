/**
 * @module   lib/Base
 * @requires module:jquery
 * @requires module:require
 * @requires module:lib/vendor/class
 */
define(['jquery', 'require', 'lib/class'], function ($, require) {
    "use strict";

    /**
     * @constructor
     */
    var Base = Class.extend({

        //base options.
        baseOptions: {
            pluginRunning : false,
            debug         : false
        },

        // base events - the only place where you should define the events
        baseEvents: {
            afterAjaxNavigation   : 'afterAjaxNavigation',
            beforeAjaxNavigation  : 'beforeAjaxNavigation',
            imagerCall            : 'imagerWeNeedYou',
            imagerOnce            : 'imagerOnce',
            imagerDone            : 'imagerIsDone',
            testEvent             : 'testEventLoaded',
            panelLoadedEvent      : 'side-panel-loaded',
            panelClosedEvent      : 'side-panel-closed',
            dotdotdotCall         : 'dddWeNeedYou',
            ajaxEvent             : 'ajaxIsLoaded',
            carouselSlid          : 'slid.bs.carousel',
            carouselSlide         : 'slide.bs.carousel',
            horoscopeSemaineEvent : 'horoscope-traditionel-semaine-loaded',
            pollAnswerReady       : "pollAnswerIsReady",
            adLoadedEvent         : 'ad-loaded',
            gigyaEvent            : 'gigyaWeNeedYou',
            mosaicEvent           : 'mosaicNewItems',
            imagerEvent           : 'imagerIsDone',
            paginationChanged     : 'paginationChanged',
            typeSearchEvent       : 'typeSearchEvent',
            beforeTritonPreroll   : 'beforeTritonPreroll',
            afterTritonPreroll    : 'afterTritonPreroll',
            stationStreamStarted  : 'stationStreamStarted',
            hideFirstVisitContent : 'hideFirstVisitContent',
            triggerLocalize       : 'triggerLocalize'
        },

        /**
         * The constructor merge the default options of the module with the arguments passed in parameter.
         * Then the main method is executed and we bind the load events.
         *
         * @param {object} options
         * @param {object} _events
         */
        init: function (options, _events) {
            var self = this;

            // inheritance / merge for options and events
            options = $.extend(true, {}, self.baseOptions, self.defaultOptions, options);
            self.o = options;

            _events = $.extend(true, {}, self.baseEvents, self.defaultEvents);
            self.e = _events;

            // stop execution if the library exist or if the containerSelector is undefined
            if (typeof self.o.library !== 'undefined' || self.o.library || typeof self.o.containerSelector === 'undefined') {
                return false;
            }

            // run execution and bind load events
            this.execute();
            this.bindLoadEvents();
        },

        /**
         * It tells if the element passed in parameter is in the DOM
         * @param   {object} el - jQuery element
         * @returns {boolean}
         */
        isElementInDOM: function(el) {
            return $.contains(document.documentElement, el[0])
        },

        /**
         * It tells if the require module passed in parameter is defined
         * @param   {string} modulePath - path of the module
         * @returns {boolean}
         */
        isModuleDefined: function(modulePath) {
            return require.defined(modulePath);
        },

        /**
         * Listen events, related to the AJAX Navigation
         */
        bindLoadEvents: function () {
            var self = this;

            self._listen(self.e.afterAjaxNavigation, function () {
                if (self.isElementInDOM($(self.o.containerSelector))) {
                    self.execute();
                    self.bindListeners();
                }
            });

            self._listen(self.e.beforeAjaxNavigation, function () {
                if (self.isElementInDOM($(self.o.containerSelector))) {
                    self.unbindListeners();
                }
            });
        },

        /**
         * It tests if the container selector is in the DOM and tests if there are some remote dependencies before it runs the plugin
         */
        execute: function () {
            var self = this;
            // Test if the element is in DOM
            self.container = $(self.o.containerSelector);

            if (self.isElementInDOM(self.container)) {
                // if you want to load remote dependencies, you can add them to the plugin baseOptions
                if (self.o.remoteDependencies) {
                    self.loadRemoteDependencies(self.o.remoteDependencies);
                } else {
                    self.runPlugin();
                }
            }
        },

        /**
         * It requires remote dependencies the plugin needs in order to run
         *
         * @param  {array} remoteDependencies
         */
        loadRemoteDependencies: function (remoteDependencies) {
            var self = this;

            if (remoteDependencies.constructor !== Array) {
                self.log('Remote dependencies must be inside an array', 'warning');
                return false;
            }

            require(remoteDependencies, function () {
                self.runPlugin();
            }, function (err) {
                var failedId = err.requireModules && err.requireModules[0];
                self.log('Remote dependency ' + failedId + ' failed to load', 'error');
            });
        },

        /**
         * It tests if the plugin has already been ran, then call the appropriate methods
         */
        runPlugin: function () {
            var self = this;

            try {
                if(self.o.pluginRunning) {
                    self.reload();
                } else {
                    self.main();
                    self.bindListeners();
                    self.o.pluginRunning = true;
                }
            } catch (err) {
                self.log(err, 'error');
            }
        },

        /**
         * It loads options from the div markup
         */
        loadOptionsFromDiv: function (options, item) {
            var attributes = item.data();
            var attributesNames = Object.keys(attributes);

            for (var i in attributesNames) {
                options[attributesNames[i]] = attributes[attributesNames[i]];
            }
        },

        /**
         * It publish events through the application
         *
         * @param {...*} var_args (event, options)
         */
        _trigger: function (var_args) {
            var self    = this;
            var event   = arguments[0];
            var args    = (arguments[1] && arguments[1].length > 0) ? arguments[1] : null;
            var context = arguments[2] || document;

            if (arguments.length < 1) {
                self.log("Plugin " + self.o.pluginName + ": missing parameters in trigger.", 'error');
                return;
            }

            if (!($.inArray(arguments[0], self.e))) {
                self.log("In plugin " + self.o.pluginName + " - The triggered event " + arguments[0] + " is not registered.", 'warning');
            }

            $(context).trigger(event, args);
        },

        /**
         * It subscribes an event through the application
         *
         * @param {...*} var_args (event, callback and context)
         */
        _listen: function (var_args) {
            var self    = this;
            var event   = arguments[0];
            var fn      = arguments[1];
            var context = arguments[2] || document;

            if (arguments.length < 2) {
                self.log("Plugin " + self.o.pluginName + ": missing parameters in listener.", 'error');
                return;
            }

            if (!($.inArray(arguments[0], self.e))) {
                self.log("In plugin " + self.o.pluginName + " - Event " + arguments[0] + " is not registered.", 'warning');
            }

            if (!$.isFunction(fn)) {
                self.log("In plugin " + self.o.pluginName + " - Parameter " + arguments[1] + " is not a registered function.", 'error');
            }

            $(context).on(event, function () {
                var args = (arguments && arguments.length > 0 ) ? arguments : null;
                fn.apply(self, args);
            });
        },

        /**
         * It subscribes an event through the application and fire only one time
         *
         * @param {...*} var_args (event, callback and context)
         */
        _one: function (var_args) {
            var self    = this;
            var event   = arguments[0];
            var fn      = arguments[1];
            var context = arguments[2] || document;

            if (arguments.length < 2) {
                self.log("Plugin " + self.o.pluginName + ": missing parameters in listener.", 'error');
                return;
            }

            if (!($.inArray(arguments[0], self.e))) {
                self.log("In plugin " + self.o.pluginName + " - Event " + arguments[0] + " is not registered.", 'warning');
            }

            if (!$.isFunction(fn)) {
                self.log("In plugin " + self.o.pluginName + " - Parameter " + arguments[1] + " is not a registerd function.", 'warning');
            }

            $(context).one(event, function () {
                var args = (arguments && arguments.length > 0 ) ? arguments : null;
                fn.apply(self, args);
            });

        },

        /**
         * It unsubscribes an event
         *
         * @param {...*} var_args (event, context)
         */
        _unsubscribe: function(var_args) {
            var event   = arguments[0];
            var context = arguments[1] || document;

            $(context).off(event);
        },

        /**
         * In debug mode, it logs a message in the console.
         *
         * @param {string} message
         * @param {string} type
         */
        log: function (message, type) {
            if (this.o.debug) {
                if (typeof console === "object") {
                    if (type === 'warning') {
                        console.warn("***WARNING: " + message);
                    } else if (type === 'error') {
                        console.error("***ERROR: " + message);
                    } else {
                        console.log(message);
                    }
                }
            }
        },

        /* OVERRIDES - default methods that run if the method is not present in the plugin */

        /**
         * Default main method. Needs to be overridden by plugin
         */
        main: function () {
            var self = this;
            self.log("main() method is missing.", 'warning');
        },

        /**
         * Default reload method. Needs to be overridden by plugin
         */
        reload: function () {
            var self = this;
            self.log("In plugin " + self.o.pluginName + " reload() method is missing.", 'warning');
        },

        /**
         * Default bindListeners method. Needs to be overridden by plugin
         */
        bindListeners: function () {
            var self = this;
            self.log("In plugin " + self.o.pluginName + " bindListeners() method is missing.", 'warning');
        },

        /**
         * Default unbindListeners method. Needs to be overridden by plugin
         */
        unbindListeners: function() {
            var self = this;
            self.log("In plugin " + self.o.pluginName + " unbindListeners() method is missing.", 'warning');
        },

        //Default options override.
        defaultOptions: {},

        //Default events override.
        defaultEvents: {}

        /* end OVERRIDES ------------------------------------------------------------------- */

    });

    return Base;
});
