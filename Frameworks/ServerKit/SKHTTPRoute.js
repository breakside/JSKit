// #import Foundation
// #import "ServerKit/SKHTTPResponderContext.js"
/* global JSClass, JSObject, JSDeepCopy, SKHTTPRoute, SKHTTPResourceRoute, JSCopy, JSSpec, SKHTTPResponderContext */
'use strict';

(function(){

JSClass("SKHTTPRoute", JSObject, {

    children: null,
    parent: null,
    _componentMatchers: null,
    _responderClass: null,
    _routesByResponderClass: null,
    _root: null,

    _init: function(){
        this._componentMatchers = [];
        this.children = [];
    },

    initWithSpec: function(spec, values){
        SKHTTPRoute.$super.initWithSpec.call(this, spec, values);
        this.initWithComponentStrings(values.components, values.responder);
    },

    initWithComponentStrings: function(componentStrings, responderClassName){
        this._init();
        this._responderClass = JSClass.FromName(responderClassName);
        if (componentStrings.length === 0){
            throw Error("Must have at least 1 component string for route");
        }
        for (var i = 0, l = componentStrings.length; i < l; ++i){
            this._addComponentString(componentStrings[i], i == componentStrings.length - 1);
        }
    },

    _addComponentString: function(specComponent, isFinal){
        if (specComponent.charAt(0) == '*'){
            if (specComponent.length > 1 && specComponent.charAt(1) == '*'){
                if (!isFinal){
                    throw Error("Invalid route configuration with specific path component after greedy wildcard");
                }
                this._componentMatchers.push(WildcardComponentMatcher(specComponent.substr(2), true));
            }else{
                this._componentMatchers.push(WildcardComponentMatcher(specComponent.substr(1)));
            }
        }else{
            this._componentMatchers.push(FixedComponentMatcher(specComponent));
        }
    },

    contextWithMatches: function(matches){
        var route = this;
        var contextClass = null;
        do{
            contextClass = route._responderClass.prototype.contextClass || null;
            route = route.parent;
        }while (route !== null && contextClass === null);
        if (contextClass !== null){
            return contextClass.initWithPathComponentMatches(matches);
        }
        return null;
    },

    responderWithRequest: function(request, context){
        var responder = this._responderClass.initWithRequest(request, context);
        responder.route = this;
        return responder;
    },

    routeInfoForRequest: function(request){
        var matches = {};
        var routeInfo = this._routeInfoForPathComponents(request.url.pathComponents, matches);
        return routeInfo;
    },

    _routeInfoForPathComponents: function(pathComponents, matches){
        if (pathComponents.length === null){
            return null;
        }
        var componentIndex = 0;
        var matcherIndex = 0;
        var matcher;
        var component;
        for (; componentIndex < pathComponents.length && matcherIndex < this._componentMatchers.length; ++componentIndex){
            matcher = this._componentMatchers[matcherIndex];
            component = pathComponents[componentIndex];
            if (!matcher.matches(component, matches)){
                return null;
            }
            if (!matcher.isGreedy){
                ++matcherIndex;
            }
        }
        if (!matcher.isGreedy && matcherIndex < this._componentMatchers.length){
            return null;
        }
        if (matcher.isGreedy && this.children.length > 0){
            // FIXME: unwind components
        }
        if (componentIndex == pathComponents.length){
            return {route: this, matches: matches};
        }
        var child;
        var routeInfo = null;
        for (var i = 0, l = this.children.length; i < l && routeInfo === null; ++i){
            child = this.children[i];
            routeInfo = child._routeInfoForPathComponents(pathComponents.slice(componentIndex), Object.create(matches));
        }
        return routeInfo;
    },

    pathComponentsForResponder: function(responderClass, params){
        var route = this._routesByResponderClass[responderClass.className];
        if (!route){
            return null;
        }
        return route.pathComponentsForParams(params);
    },

    pathComponentsForParams: function(params){
        var components = [];
        var matchers = [];
        var matcher;
        var component;
        var i, l;

        var stack = [];
        var route = this;
        while (route !== null){
            stack.unshift(route);
            route = route.parent;
        }

        for (i = 0, l = stack.length; i < l; ++i){
            route = stack[i];
            for (var j = 0, k = route._componentMatchers.length; j < k; ++j){
                matchers.push(route._componentMatchers[j]);
            }
        }

        for (i = 0, l = matchers.length; i < l; ++i){
            matcher = matchers[i];
            component = matcher.replace(params);
            if (typeof(component) == "string"){
                components.push(component);
            }else{
                components = components.concat(component);
            }
        }
        return components;
    },

    addChild: function(route){
        route.parent = this;
        this.children.push(route);
    },

    updateRoutesByResponderClass: function(){
        var routesByResponderClass = {};
        var visit = function(route){
            route._routesByResponderClass = routesByResponderClass;
            routesByResponderClass[route._responderClass.className] = route;
            for (var i = 0, l = route.children.length; i < l; ++i){
                visit(route.children[i]);
            }
        };
        visit(this);
    }

});

JSClass("SKHTTPResourceRoute", SKHTTPRoute, {

    _resourceMetadata: null,
    _bundle: null,

    initWithSpec: function(spec, values){
        if (!values.responder){
            values = JSDeepCopy(values);
            values.responder = "SKHTTPResourceResponder";
        }
        SKHTTPResourceRoute.$super.initWithSpec.call(this, spec, values);
        this._bundle = spec.bundle;
        this._resourceMetadata = this._bundle.metadataForResourceName(values.resource, values.type);
    },

    responderWithRequest: function(request, context){
        var responder = this._responderClass.initWithResourceMetadata(this._bundle, this._resourceMetadata, request, context);
        responder.route = this;
        return responder;
    },

    addChild: function(route){
        throw new Error("SKHTTPResourceRoute cannot contain child routes");
    }

});

SKHTTPRoute.CreateFromMap = function(routes, spec){
    var routeMap = {};
    var route;
    var path;
    var components;
    var parentPath;
    var cls;

    // normalize paths and create temporary objects to hold intermediate data
    //
    // NOTE: It may be better to throw errors here so we don't encourage lazy
    // spec writing, but these are common, unambiguous, easy to fix errors.
    for (path in routes){
        route = routes[path];
        // remove consecutive slashes
        path = path.replace(/\/{2,}/g, '/');
        // remove trailing slash, but not a leading /
        if (path.length > 1 && path.charAt(path.length - 1) == '/'){
            path = path.substr(0, path.length - 1);
        }
        // ensure leading slash
        if (path.charAt(0) != '/'){
            path = '/' + path;
        }
        routeMap[path] = {parentPath: null, specValue: route, instantiated: null};
    }

    // determine route-specific components, parent relationships, and instantiate route objects
    //
    // NOTE: this cheats a little bit by modifying each route's spec value, which
    // were basically incomplete in the specfile itself.  All the information
    // we need is in the spec file, but its format is adjusted there for easier
    // human reading/writing.  So we rearrange the data here in order to
    // properly instanitate the route objects.
    for (path in routeMap){
        route = routeMap[path];
        route.specValue.components = [];
        if (!(JSSpec.Keys.ObjectClass in route.specValue)){
            if (route.specValue.resource){
                route.specValue[JSSpec.Keys.ObjectClass] = "SKHTTPResourceRoute";
            }else{
                route.specValue[JSSpec.Keys.ObjectClass] = "SKHTTPRoute";
            }
        }
        if (path === '/'){
            route.specValue.components.push("/");
        }else{
            components = path.split('/');
            while (components.length > 1 && route.parentPath === null){
                route.specValue.components.unshift(components.pop());
                parentPath = components.join('/');
                if (parentPath in routeMap){
                    route.parentPath = parentPath;
                }
            }
            if (route.parentPath === null){
                route.parentPath = '/';
            }
        }
        cls = JSClass.FromName(route.specValue[JSSpec.Keys.ObjectClass]);
        route.instantiated = cls.initWithSpec(spec || null, route.specValue);
    }

    // Link parents and children
    for (path in routeMap){
        route = routeMap[path];
        if (route.parentPath !== null){
            routeMap[route.parentPath].instantiated.addChild(route.instantiated);
        }
    }
    var rootRoute = routeMap['/'].instantiated;
    rootRoute.updateRoutesByResponderClass();
    return rootRoute;
};

var FixedComponentMatcher = function(fixed){
    if (this === undefined){
        return new FixedComponentMatcher(fixed);
    }
    this.fixed = fixed;
};

FixedComponentMatcher.prototype = {
    fixed: null,

    matches: function(component, matches){
        return component === this.fixed;
    },

    replace: function(params){
        return this.fixed;
    }
};

var WildcardComponentMatcher = function(name, isGreedy){
    if (this === undefined){
        return new WildcardComponentMatcher(name, isGreedy);
    }
    this.name = name;
    this.isGreedy = !!isGreedy;
};

WildcardComponentMatcher.prototype = {
    name: null,
    isGreedy: false,

    matches: function(component, matches){
        if (this.isGreedy){
            if (!(this.name in matches)){
                matches[this.name] = [];
            }
            matches[this.name].push(component);
        }else{
            matches[this.name] = component;
        }
        return true;
    },

    replace: function(params){
        var component = params[this.name];
        if (component === undefined){
            return "undefined";
        }
        if (component === null){
            return "null";
        }
        if (component instanceof Array){
            return component;
        }
        return component.toString();
    }
};

/*
var PatternComponentMatcher = function(pattern, matchNames){
    if (this === undefined){
        return new PatternComponentMatcher(pattern);
    }
    this.pattern = pattern;
    this.matchNames = matchNames || null;
};

PatternComponentMatcher.prototype = {
    pattern: null,
    matched: null,
    matchNames: null,

    matches: function(component){
        this.matched = this.pattern.exec(component);
        if (this.matched && this.matchNames){
            var name;
            for (var i = 0, l = this.matchNames.length; i < l; ++i){
                name = this.matchNames[i];
                this[name] = this.matched[i + 1];
            }
        }
        return this.matched !== null;
    }
};
*/

})();