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

// #import "UILayer.js"
/* global UIHTMLDisplayServerCanvasContext */
'use strict';

JSClass("UIHTMLElementLayer", UILayer, {

    init: function(){
        UIHTMLElementLayer.$super.init.call(this);
        this.elementInsets = JSInsets.Zero;
        this.needsDisplayOnBoundsChange = true;
    },

    element: null,
    elementInsets: JSDynamicProperty('_elementInsets', null),

    setElementInsets: function(elementInsets){
        this._elementInsets = JSInsets(elementInsets);
        this.setNeedsDisplay();
    },

    createElement: function(document){
        var name = "div";
        if (this.delegate && this.delegate.elementNameForLayer){
            name = this.delegate.elementNameForLayer(this);
        }
        this.element = document.createElement(name);
        this.didCreateElement();
        this.setNeedsDisplay();
    },

    didCreateElement: function(){
        if (this.delegate && this.delegate.layerDidCreateElement){
            this.delegate.layerDidCreateElement(this);
        }
    },

    willDestroyElement: function(){
        if (this.delegate && this.delegate.layerWillDestroyElement){
            this.delegate.layerWillDestroyElement(this);
        }
    },

    drawInContext: function(context){
        if (context.isKindOfClass(UIHTMLDisplayServerCanvasContext)){
            context.addExternalElementInRect(this.element, this.presentation.bounds.rectWithInsets(this.elementInsets));
        }
    },

});