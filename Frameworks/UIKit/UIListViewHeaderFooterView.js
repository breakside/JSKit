// #import "UIKit/UIView.js"
// #import "UIKit/UILabel.js"
/* global JSClass, UIView, UILabel, JSReadOnlyProperty, JSDynamicProperty, JSLazyInitProperty, UIListViewHeaderFooterView, JSConstraintBox, JSInsets, JSPoint, JSSize, JSRect, JSColor */
'use strict';

JSClass("UIListViewHeaderFooterView", UIView, {

    reuseIdentifier: null,
    kind: 0,
    section: 0,
    titleInsets: JSDynamicProperty('_titleInsets', null),
    titleSpacing: JSDynamicProperty('_titleSpacing', 2.0),
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

    initWithSpec: function(spec, values){
        UIListViewHeaderFooterView.$super.initWithSpec.call(this, spec, values);
        this._commonHeaderFooterInit();
    },

    _commonHeaderFooterInit: function(){
        this.stylerProperties = {};
        this._titleInsets = JSInsets(0, 10);
        this._contentView = UIView.initWithConstraintBox(JSConstraintBox.Margin(0));
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

    setTitleSpacing: function(titleSpacing){
        this._titleSpacing = titleSpacing;
        this.setNeedsLayout();
    },

    layoutSubviews: function(){
        UIListViewHeaderFooterView.$super.layoutSubviews.call(this);
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