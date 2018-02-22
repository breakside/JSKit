// #import "Foundation/Foundation.js"
/* global JSClass, JSObject */
'use strict';

JSClass("SKHTTPRoute", JSObject, {

    fixedComponent: null,
    pattern: null,
    matches: null,
    matchNames: null,
    children: null,

    _init: function(){
        this.children = [];
    },

    initWithFixedComponent: function(fixedComponent){
        this.initWithMatchFunction(this._matchesFixed);
        this.fixedComponent = fixedComponent;
    },

    initWithPattern: function(pattern, matchNames){
        this.initWithMatchFunction(this._matchesPattern);
        this.pattern = pattern;
        this.matchNames = matchNames;
    },

    initDigits: function(matchName){
        this.initWithPattern(/^(\d+)$/, [matchName || 'digits']);
    },

    initWildcard: function(){
        this.initWithMatchFunction(this._matchesWildcard);
    },

    initWithMatchFunction: function(matchFunction){
        this._init();
        this.matchesComponent = matchFunction;
    },

    routeForPathComponents: function(pathComponents){
        if (!this.matchesComponent(pathComponents[0])){
            return null;
        }
        if (pathComponents.length === 1){
            return this;
        }
        var child;
        var route = null;
        for (var i = 0, l = this.children.length; i < l && route === null; ++i){
            child = this.children[i];
            route = child.routeForPathComponents(pathComponents.slice(1));
        }
        return route;
    },

    addChild: function(route){
        this.children.push(route);
    },

    _matchesFixed: function(component){
        return this.fixedComponent === component;
    },

    _matchesPattern: function(component){
        var matches = this.pattern.exec(component);
        if (matches !== null){
            this.matches = matches;
            if (this.matchNames){
                var name;
                for (var i = 0, l = this.matchNames.length; i < l; ++i){
                    name = this.matchNames[i];
                    this[name] = this.matches[i + 1];
                }
            }
            return true;
        }
        return false;
    },

    _matchesWildcard: function(){
        return true;
    }

});