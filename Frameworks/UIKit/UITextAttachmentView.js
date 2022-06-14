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
// #import "UIView.js"
'use strict';

JSClass("UITextAttachmentView", JSTextAttachment, {

    view: null,

    initWithView: function(view){
        this.view = view;
    },

    getSize: function(){
        return this.view.frame.size;
    },

    layout: function(font, lineWidth){
        this.view.sizeToFitSize(JSSize(lineWidth, Number.MAX_VALUE));
        this.baselineAdjustment = this.view.lastBaselineOffsetFromBottom;
    },

    drawInContextAtPoint: function(context, point){
        this.view.layer.renderInContext(context);
    }

});