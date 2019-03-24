// #import "Builder.js"
/* global JSClass, JSObject, JSURL, Builder, HTMLBuilder */
'use strict';

JSClass("HTMLBuilder", Builder, {

    bundleType: "html",

    options: {
        'http-port': {valueType: "integer", default: 8080, help: "The port on which the static http server will be configured"},
        'docker-owner': {default: null, help: "The docker repo prefix to use when building a docker image"}
    },

    needsDockerBuild: false,

});