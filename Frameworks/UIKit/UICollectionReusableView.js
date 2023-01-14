// Copyright 2022 Breakside Inc.
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
// #import "UILabel.js"
// #import "UIImageView.js"
'use strict';

JSClass("UICollectionReusableView", UIView, {

    collectionView: null,
    indexPath: null,
    reuseIdentifier: null,
    contentView: JSReadOnlyProperty('_contentView', null),
    stylerProperties: null,
    _styler: null,

    initWithReuseIdentifier: function(identifier, styler){
        this.init();
        this.reuseIdentifier = identifier;
        this._styler = styler;
    },

    initWithFrame: function(frame){
        UICollectionReusableView.$super.initWithFrame.call(this, frame);
        this._commonReusableViewInit();
    },

    initWithSpec: function(spec){
        UICollectionReusableView.$super.initWithSpec.call(this, spec);
        this._commonReusableViewInit();
    },

    _commonReusableViewInit: function(){
        this.stylerProperties = {};
        this._contentView = UIView.init();
        this.addSubview(this._contentView);
    },

    prepareForReuse: function(){
    },

    // --------------------------------------------------------------------
    // MARK: - Applying Attributes

    applyAttributes: function(attributes){
        this.untransformedFrame = attributes.frame;
        this.transform = attributes.transform;
        if (!attributes.indexPath.isEqual(this.indexPath)){
            this.indexPath = JSIndexPath(attributes.indexPath);
        }
        if (this.accessibilityRowIndex !== attributes.rowIndex || this.accessibilityColumnIndex !== attributes.columnIndex){
            this.accessibilityRowIndex = attributes.rowIndex;
            this.accessibilityColumnIndex = attributes.columnIndex;
            if (this.isAccessibilityElement){
                this.postAccessibilityElementChangedNotification();
            }
        }
    },

    // --------------------------------------------------------------------
    // MARK: - Accessibility

    getAccessibilityLabel: function(){
        var label = UICollectionReusableView.$super.getAccessibilityLabel.call(this);
        if (label !== null){
            return label;
        }
        var stack = [this.contentView];
        var view;
        var i, l;
        while (stack.length > 0){
            view = stack.shift();
            if (view.isKindOfClass(UILabel)){
                return view.text;
            }
            for (i = 0, l = view.subviews.length; i < l; ++i){
                stack.push(view.subviews[i]);
            }
        }
        return null;
    },

    getAccessibilityElements: function(){
        return this._contentView.accessibilityElements;
    },

    layoutSubviews: function(){
        this.contentView.untransformedFrame = this.bounds;
    }

});