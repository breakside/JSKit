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

// #import "UIView.js"
'use strict';

JSClass("UIContainerView", UIView, {

    contentView: JSDynamicProperty("_contentView", null),
    contentInsets: JSDynamicProperty("_contentInsets", null),
    alignment: JSDynamicProperty("_alignment", 0),
    maximumContentSize: JSDynamicProperty("_maximumContentSize", null),

    initWithFrame: function(frame){
        UIContainerView.$super.initWithFrame.call(this, frame);
        this._contentInsets = JSInsets.Zero;
        this._maximumContentSize = JSSize.Zero;
    },

    initWithContentView: function(contentView){
        this.init();
        this.contentView = contentView;
    },

    initWithSpec: function(spec){
        UIContainerView.$super.initWithSpec.call(this, spec);
        if (spec.containsKey("contentInsets")){
            this._contentInsets = spec.valueForKey("contentInsets", JSInsets);
        }else{
            this._contentInsets = JSInsets.Zero;
        }
        if (spec.containsKey("maximumContentSize")){
            this._maximumContentSize = spec.valueForKey("maximumContentSize", JSSize);
        }else{
            this._maximumContentSize = JSSize.Zero;
        }
        if (spec.containsKey("alignment")){
            this._alignment = spec.valueForKey("alignment", UIContainerView.Alignment);
        }
        if (spec.containsKey("contentView")){
            this.contentView = spec.valueForKey("contentView", UIView);
        }
    },

    setContentInsets: function(contentInsets){
        this._contentInsets = JSInsets(contentInsets);
        this.setNeedsLayout();
    },

    setMaximumContentSize: function(maximumContentSize){
        this._maximumContentSize = JSSize(maximumContentSize);
        this.setNeedsLayout();
    },

    setContentView: function(contentView){
        var index = this.subviews.length;
        if (this._contentView !== null){
            index = this._contentView.subviewIndex;
            this._contentView.removeFromSuperview();
        }
        this._contentView = contentView;
        this.setNeedsLayout();
        if (this._contentView !== null){
            this.insertSubviewAtIndex(contentView, index);
        }
    },

    setAlignment: function(alignment){
        this._alignment = alignment;
        this.setNeedsLayout();
    },

    getIntrinsicSize: function(){
        var contentSize;
        if (this._contentView !== null){
            contentSize = this._contentView.intrinsicSize;
        }else{
            contentSize = JSSize(UIView.noIntrinsicSize, UIView.noIntrinsicSize);
        }
        return JSSize(
            contentSize.width !== UIView.noIntrinsicSize ? contentSize.width + this._contentInsets.width : UIView.noIntrinsicSize,
            contentSize.height !== UIView.noIntrinsicSize ? contentSize.height + this._contentInsets.height : UIView.noIntrinsicSize
        );
    },

    sizeToFitSize: function(maxSize){
        if (this._contentView === null){
            UIContainerView.$super.sizeToFitSize.call(this, maxSize);
        }else{
            var maxContentSize = JSSize(
                maxSize.width < Number.MAX_VALUE ? maxSize.width - this._contentInsets.width : Infinity,
                maxSize.height < Number.MAX_VALUE ? maxSize.height - this._contentInsets.height : Infinity
            );
            this._contentView.sizeToFitSize(maxContentSize);
            this.bounds = JSRect(0, 0, this._contentView.bounds.size.width + this._contentInsets.width, this._contentView.bounds.size.height + this._contentInsets.height);
        }
    },

    layoutSubviews: function(){
        var rect = this.bounds.rectWithInsets(this._contentInsets);
        if (this._contentView !== null){
            if (this._alignment === UIContainerView.Alignment.full){
                this._contentView.frame = rect;
            }else if (this._alignment === UIContainerView.Alignment.center){
                var maxSize = JSSize(rect.size);
                if (this._maximumContentSize.width > 0 && this._maximumContentSize.width < maxSize.width){
                    maxSize.width = this._maximumContentSize.width;
                }
                if (this._maximumContentSize.height > 0 && this._maximumContentSize.height < maxSize.height){
                    maxSize.height = this._maximumContentSize.height;
                }
                var intrinsicSize = this._contentView.intrinsicSize;
                if (intrinsicSize.width !== UIView.noIntrinsicSize && intrinsicSize.height !== UIView.noIntrinsicSize){
                    this._contentView.bounds = JSRect(this._contentView.bounds.origin, JSSize(Math.min(intrinsicSize.width, maxSize.width), Math.min(intrinsicSize.height, maxSize.height)));
                }else{
                    if (intrinsicSize.width !== UIView.noIntrinsicSize){
                        this._contentView.bounds = JSRect(this._contentView.bounds.origin, JSSize(intrinsicSize.width, this._contentView.bounds.size.height));
                        if (intrinsicSize.width < maxSize.width){
                            maxSize.width = intrinsicSize.width;
                        }
                    }
                    if (intrinsicSize.height !== UIView.noIntrinsicSize){
                        this._contentView.bounds = JSRect(this._contentView.bounds.origin, JSSize(this._contentView.bounds.size.width, intrinsicSize.height));
                        if (intrinsicSize.height < maxSize.height){
                            maxSize.height = intrinsicSize.height;
                        }
                    }
                    this._contentView.sizeToFitSize(maxSize);
                }
                this._contentView.position = rect.center;
            }
        }
    }

});

UIContainerView.Alignment = {
    full: 0,
    center: 1
};