// #import "Foundation/Foundation.js"
/* global JSClass, JSObject, SKHTTPRoute, JSCopy, JSSpec */
'use strict';

(function(){

JSClass("SKHTTPRoute", JSObject, {

    children: null,
    _componentMatchers: null,
    _responderClassName: null,

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
        this._responderClassName = responderClassName;
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
                    throw Error("Invalid route configuration with multiple greedy wildcards");
                }
                this._componentMatchers.push(WildcardComponentMatcher(specComponent.substr(2), true));
            }else{
                this._componentMatchers.push(WildcardComponentMatcher(specComponent.substr(1)));
            }
        }else{
            this._componentMatchers.push(FixedComponentMatcher(specComponent));
        }
    },

    responderForRequest: function(request, pathComponents, matches, contextClass){
        if (pathComponents === undefined){
            pathComponents = request.url.pathComponents;
        }
        if (matches === undefined){
            matches = {};
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
        var cls = JSClass.FromName(this._responderClassName);
        if (cls.contextClass){
            contextClass = cls.contextClass;
        }
        if (componentIndex == pathComponents.length){
            var context = null;
            if (contextClass){
                context = contextClass.initWithPathComponentMatches(matches);
            }
            return cls.initWithRequest(request, context);
        }
        var child;
        var responder = null;
        for (var i = 0, l = this.children.length; i < l && responder === null; ++i){
            child = this.children[i];
            responder = child.responderForRequest(request, pathComponents.slice(componentIndex), JSCopy(matches), contextClass);
        }
        return responder;
    },

    addChild: function(route){
        this.children.push(route);
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
            route.specValue[JSSpec.Keys.ObjectClass] = "SKHTTPRoute";
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
    return routeMap['/'].instantiated;
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