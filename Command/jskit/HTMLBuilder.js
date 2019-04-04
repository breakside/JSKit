// #import "Builder.js"
// #import Hash
/* global JSClass, JSObject, JSURL, Builder, HTMLBuilder, JSSHA1Hash */
'use strict';

JSClass("HTMLBuilder", Builder, {

    bundleType: "html",

    options: {
        'http-port': {valueType: "integer", default: 8080, help: "The port on which the static http server will be configured"},
        'docker-owner': {default: null, help: "The docker repo prefix to use when building a docker image"}
    },

    needsDockerBuild: false,

    rootURL: null,
    wwwURL: null,
    confURL: null,
    cacheBustingURL: null,
    resourcesURL: null,

    setup: async function(){
        await HTMLBuilder.$super.setup.call(this);
        this.wwwURL = this.rootURL.appendingPathComponent('www', true);
        this.confURL = this.rootURL.appendingPathComponent('conf', true);
        this.cacheBustingURL = this.rootURL.appendingPathComponent(this.debug ? this.buildLabel : this.buildId);
        this.resourcesURL = this.wwwURL.appendingPathComponent('Resources', true);
        await this.fileManager.createDirectoryAtURL(this.rootURL);
        await this.fileManager.createDirectoryAtURL(this.confURL);
        await this.fileManager.createDirectoryAtURL(this.wwwURL);
        await this.fileManager.createDirectoryAtURL(this.cacheBustingURL);
        await this.fileManager.createDirectoryAtURL(this.resourcesURL);
    },

    build: async function(){
        await this.setup();
    }

});