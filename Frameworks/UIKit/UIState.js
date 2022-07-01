// Copyright 2020 Breakside Inc.
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

// #import Foundation
'use strict';

(function(){

JSClass("UIState", JSObject, {

    path: JSReadOnlyProperty("_path", null),
    pathComponents: JSReadOnlyProperty("_pathComponents", null),
    lastPathComponent: JSReadOnlyProperty(),
    fileExtension: JSReadOnlyProperty(),

    init: function(){
        this.initWithPath(null);
    },

    initWithPath: function(path){
        this._setPath(path);
    },

    initWithPathComponents: function(components){
        this._setPathComponents(components);
    },

    _setPath: function(path){
        if (path === null || path === undefined){
            path = "";
        }
        if (!path.startsWith("/")){
            path = "/" + path;
        }
        this._path = path;
        this._pathComponents = null;
    },

    _updatePathFromComponents: function(){
        this._path = "/" + this._pathComponents.slice(1).join("/");
    },

    getLastPathComponent: function(){
        var components = this._pathComponents;
        if (components.length > 0){
            return components[components.length - 1];
        }
        return null;
    },

    getFileExtension: function(){
        var components = this._pathComponents;
        if (components.length > 0){
            return components[components.length - 1].fileExtension;
        }
        return '';
    },

    getPathComponents: function(){
        if (this._pathComponents === null){
            this._pathComponents = componentsFromPath(this._path);
        }
        return this._pathComponents;
    },

    _setPathComponents: function(components){
        this._pathComponents = [];
        this._appendPathComponents(components);
    },

    _appendPathComponents: function(components){
        var finalComponent = components[components.length - 1];
        if (this._pathComponents === null){
            this._pathComponents = componentsFromPath(this._path);
        }
        if (this._pathComponents.length === 0){
            this._pathComponents.push("/");
        }
        components = components.join("/").split("/");
        var component;
        for (var i = 0, l = components.length; i < l; ++i){
            component = components[i];
            if (component !== ""){
                this._pathComponents.push(component);
            }
        }
        this._updatePathFromComponents();
    },

    _appendPathComponent: function(component, isDirectory){
        this._appendPathComponents([component], isDirectory);
    },

    appendingPathComponents: function(components, isFinalDirectory){
        var state = UIState.initWithPath(this._path);
        state._appendPathComponents(components, isFinalDirectory);
        return state;
    },

    appendingPathComponent: function(component, isDirectory){
        var state = UIState.initWithPath(this._path);
        state._appendPathComponent(component, isDirectory);
        return state;
    },

    _appendFileExtension: function(ext){
        if (!ext.startsWith('.')){
            ext = ".%s".sprintf(ext);
        }
        this._path += ext;
        this._pathComponents = null;
    },

    appendingFileExtension: function(ext){
        var state = UIState.initWithPath(this._path);
        state._appendFileExtension(ext);
        return state;
    },

    _removeLastPathComponent: function(){
        if (this._pathComponents === null){
            this._pathComponents = componentsFromPath(this._path);
        }
        if (this._pathComponents.length > 0){
            this._pathComponents.pop();
            this._updatePathFromComponents();
        }
    },

    removingLastPathComponent: function(){
        var state = UIState.initWithPath(this._path);
        state._removeLastPathComponent();
        return state;
    },

    _removeFileExtension: function(){
        if (this._pathComponents === null){
            this._pathComponents = componentsFromPath(this._path);
        }
        if (this._pathComponents.length > 0){
            var last = this._pathComponents.pop();
            last = last.removingFileExtension();
            this._pathComponents.push(last);
            this._updatePathFromComponents();
        }
    },

    removingFileExtension: function(){
        var state = UIState.initWithPath(this._path);
        state._removeFileExtension();
        return state;
    },

    isEqual: function(other){
        if (other === null || other === undefined){
            return false;
        }
        return this._path === other._path;
    },

    startsWithState: function(state){
        if (state === null || state === undefined){
            return false;
        }
        var a = this.pathComponents;
        var b = state.pathComponents;
        if (a.length < b.length){
            return false;
        }
        var i, l;
        for (i = 0, l = b.length; i < l; ++i){
            if (a[i] != b[i]){
                return false;
            }
        }
        return true;
    }

});

function componentsFromPath(path){
    if (path === null || path.length === 0){
        return [];
    }
    var result = [];
    if (path.startsWith("/")){
        result.push("/");
        path = path.substr(1);
    }
    var components = path.split('/');
    var component;
    for (var i = 0, l = components.length; i < l; ++i){
        component = components[i];
        if (component !== ""){
            result.push(component);
        }
    }
    return result;
}

})();