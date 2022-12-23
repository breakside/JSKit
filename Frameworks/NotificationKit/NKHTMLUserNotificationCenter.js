// Copyright 2021 Breakside Inc.
//
// Licensed under the Breakside Public License, Version 1.0 (the "License");
// you may not use this file except in compliance with the License.
// If a copy of the License was not distributed with this file, you may
// obtain a copy at
//
//     http://breakside.io/licenses/LICENSE-1.0.txt
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

// #import "NKUserNotificationCenter.js"
// #import SecurityKit
// jshint browser: true
"use strict";

(function(){

var logger = JSLog("notify", "html");

JSClass("NKHTMLUserNotificationCenter", NKUserNotificationCenter, {

    initWithDOMDocument: function(domDocument, serviceWorkerContainer){
        this.domDocument = domDocument;
        this.serviceWorkerContainer = serviceWorkerContainer;
        this.pendingNotificationsByID = {};
        this.showingNotificationsByID = {};
        this.supportsHTMLNotifications = !!JSGlobalObject.Notification;
    },

    domDocument: null,
    serviceWorkerContainer: null,

    registerForRemoteNotifications: function(request, completion, target){
        if (!completion){
            completion = Promise.completion();
        }
        if (this.serviceWorkerContainer === null){
            logger.warn("Remote notifications not supported on this device (no service workers)");
            JSRunLoop.main.schedule(completion, target, null);
        }else{
            this.serviceWorkerContainer.getRegistration().then(function(serviceWorkerRegistration){
                if (!serviceWorkerRegistration){
                    logger.warn("Missing service worker registration");
                    completion.call(target, null);
                    return;
                }
                if (!serviceWorkerRegistration.pushManager){
                    logger.warn("Remote notifications not supported on this device (no push manager)");
                    completion.call(target, null);
                    return;
                }
                var options = {};
                if (request.signingJWK !== null){
                    options.applicationServerKey = JSData.initWithChunks([
                        JSData.initWithArray([0x04]),
                        request.signingJWK.x.dataByDecodingBase64URL(),
                        request.signingJWK.y.dataByDecodingBase64URL()
                    ]).base64URLStringRepresentation();
                }
                serviceWorkerRegistration.pushManager.subscribe(options).then(function(subscription){
                    var registration = {
                        type: NKUserNotificationCenter.RegistrationType.web,
                        endpoint: subscription.endpoint,
                        encryptionKey: JSData.initWithBuffer(subscription.getKey("p256dh")).base64URLStringRepresentation(),
                        secret: JSData.initWithBuffer(subscription.getKey("auth")).base64URLStringRepresentation()
                    };
                    completion.call(target, registration);
                }, function(error){
                    logger.error("Failed to subscribe to push: %{error}", error);
                    completion.call(target, null);
                });
            });
        }
        return completion.promise;
    },

    pendingNotificationsByID: null,
    showingNotificationsByID: null,

    addNotification: function(notification, date){
        if (!date){
            this.showNotificationIfAppropriate(notification);
            return;
        }
        if (date.isPast()){
            return;
        }
        var pending = this.pendingNotificationsByID[notification.identifier];
        if (pending){
            delete this.pendingNotificationsByID[notification.identifier];
            pending.timer.invalidate();
        }
        var interval = date.timeIntervalSinceDate(JSDate.now);
        var timer = JSTimer.scheduledTimerWithInterval(interval, function(){
            delete this.pendingNotificationsByID[notification.identifier];
            this.showNotificationIfAppropriate(notification);
        }, this);
        this.pendingNotifications[notification.identifier] = {timer: timer, notification: notification};
    },

    removeNotification: function(notification){
        var pending = this.pendingNotificationsByID[notification.identifier];
        if (pending){
            delete this.pendingNotificationsByID[notification.identifier];
            pending.timer.invalidate();
        }
        var showing = this.showingNotificationsByID[notification.identifier];
        if (showing){
            showing.htmlNotification.close();
        }
    },

    showNotificationIfAppropriate: function(notification){
        if (this.domDocument.visibilityState == "visible"){
            if (this.delegate && this.delegate.notificationCenterWillShowNotification){
                this.delegate.notificationCenterWillShowNotification(this, notification, (function(shouldShow){
                    if (shouldShow){
                        this.showNotification(notification);
                    }
                }).bind(this));
            }else{
                // don't show
            }
        }else{
            this.showNotification(notification);
        }
    },

    showNotification: function(notification){
        if (!this.supportsHTMLNotifications){
            return;
        }
        var options = {
            tag: notification.identifier
        };
        if (notification.body !== null){
            options.body = notification.body;
        }
        if (this.defaultIcon){
            options.icon = this.defaultIcon.htmlURLString();
        }
        var htmlNotification = new Notification(notification.title, options);
        htmlNotification.addEventListener("click", this);
        htmlNotification.addEventListener("show", this);
        htmlNotification.addEventListener("error", this);
        htmlNotification.addEventListener("close", this);
    },

    requestAuthorization: function(completion, target){
        if (!completion){
            completion = Promise.completion();
        }
        if (this.supportsHTMLNotifications){
            var handled = false;
            var handler = function(permission){
                if (!handled){
                    handled = true;
                    completion.call(target, statusByPermission[permission]);
                }
            };
            var promise = Notification.requestPermission(handler);
            if (promise instanceof Promise){
                promise.then(handler, function(){
                    handler("denied");
                });
            }
        }else{
            JSRunLoop.main.schedule(completion, target, NKUserNotificationCenter.AuthorizationStatus.denied);
        }
        return completion.promise;
    },

    getAuthorizationStatus: function(completion, target){
        if (!completion){
            completion = Promise.completion();
        }
        var status = NKUserNotificationCenter.AuthorizationStatus.denied;
        if (this.supportsHTMLNotifications){
            status = statusByPermission[Notification.permission];
        }
        JSRunLoop.main.schedule(completion, target, status);
        return completion.promise;
    },

    handleEvent: function(e){
        this["_event_" + e.type](e);
    },

    _event_click: function(e){
        var htmlNotification = e.currentTarget;
        htmlNotification.close();
        // TODO: notify delegate
    },

    _event_show: function(e){
        var htmlNotification = e.currentTarget;
        this.showingNotificationsByID[htmlNotification.tag] = {htmlNotification: htmlNotification};
    },

    _event_error: function(e){
    },

    _event_close: function(e){
        var htmlNotification = e.currentTarget;
        delete this.showingNotificationsByID[htmlNotification.tag];
        htmlNotification.removeEventListener("click", this);
        htmlNotification.removeEventListener("show", this);
        htmlNotification.removeEventListener("error", this);
        htmlNotification.removeEventListener("close", this);
    }

});

var statusByPermission = {
    "default": NKUserNotificationCenter.AuthorizationStatus.unknown,
    "granted": NKUserNotificationCenter.AuthorizationStatus.authorized,
    "denied": NKUserNotificationCenter.AuthorizationStatus.denied,
};

Object.defineProperties(NKUserNotificationCenter, {
    shared: {
        configurable: true,
        get: function NKUserNotificationCenter_getShared(){
            var center = NKHTMLUserNotificationCenter.initWithDOMDocument(document, navigator.serviceWorker || null);
            var info = JSBundle.mainBundle.info;
            if (info.NKNotificationIcon){
                center.defaultIcon = JSImage.initWithResourceName(info.NKNotificationIcon);
            }else if (info.UIApplicationIcon){
                center.defaultIcon = JSImage.initWithResourceName(info.UIApplicationIcon);
            }
            Object.defineProperty(this, "shared", {value: center, writable: true});
            return center;
        }
    }
});

})();