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

// #import "UIView.js"
// #import "UILabel.js"
'use strict';

JSClass("UIListViewHeaderFooterView", UIView, {

    reuseIdentifier: null,
    kind: 0,
    section: 0,
    titleInsets: JSDynamicProperty('_titleInsets', null),
    contentView: JSReadOnlyProperty('_contentView', null),
    titleLabel: JSLazyInitProperty('_createTitleLabel', '_titleLabel'),
    detailLabel: JSLazyInitProperty('_createDetailLabel', '_detailLabel'),
    stylerProperties: null,

    initWithReuseIdentifier: function(identifier){
        this.init();
        this.reuseIdentifier = identifier;
    },

    initWithFrame: function(frame){
        UIListViewHeaderFooterView.$super.initWithFrame.call(this, frame);
        this._commonHeaderFooterInit();
    },

    initWithSpec: function(spec){
        UIListViewHeaderFooterView.$super.initWithSpec.call(this, spec);
        this._commonHeaderFooterInit();
    },

    _commonHeaderFooterInit: function(){
        this.stylerProperties = {};
        this._titleInsets = JSInsets(0, 10);
        this._contentView = UIView.init();
        this.addSubview(this._contentView);
    },

    _createTitleLabel: function(){
        var label = UILabel.init();
        this.contentView.addSubview(label);
        return label;
    },

    _createDetalLabel: function(){
        var label = UILabel.init();
        this.contentView.addSubview(label);
        return label;
    },

    setTitleInsets: function(titleInsets){
        this._titleInsets = JSInsets(titleInsets);
        this.setNeedsLayout();
    },

    layoutSubviews: function(){
        UIListViewHeaderFooterView.$super.layoutSubviews.call(this);
        this._contentView.frame = this.bounds;
        var size = JSSize(this.bounds.size.width - this._titleInsets.left - this._titleInsets.right, 0);
        var origin = JSPoint(this._titleInsets.left, 0);
        if (this._titleLabel !== null){
            if (this._detailLabel !== null){
                size.height = this._titleLabel.font.displayLineHeight + this._detailLabel.font.displayLineHeight;
                origin.y =  Math.floor((this.bounds.size.height - size.height) / 2.0);
                size.height = this._titleLabel.font.displayLineHeight;
                this._titleLabel.frame = JSRect(origin, size);
                origin.y += size.height;
                size.height = this._detailLabel.font.displayLineHeight;
                this._detailLabel.frame = JSRect(origin, size);
            }else{
                size.height = this._titleLabel.font.displayLineHeight;
                origin.y =  Math.floor((this.bounds.size.height - size.height) / 2.0);
                this._titleLabel.frame = JSRect(origin, size);
            }
        }else if (this._detailLabel !== null){
            size.height = this._detailLabel.font.displayLineHeight;
            this._detailLabel.frame = JSRect(JSPoint(this._titleInsets.left, Math.floor((this.bounds.size.height - size.height) / 2.0)), size);
        }
    }

});

UIListViewHeaderFooterView.Kind = {
    header: 0,
    footer: 1
};