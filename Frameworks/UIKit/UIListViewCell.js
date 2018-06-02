// #import "UIKit/UIView.js"
// #import "UIKit/UILabel.js"
/* global JSClass, UIView, UILabel, JSReadOnlyProperty, JSDynamicProperty, JSLazyInitProperty, UIListViewCell, JSConstraintBox, JSInsets, JSPoint, JSSize, JSRect */
'use strict';

JSClass("UIListViewCell", UIView, {

    listView: null,
    indexPath: null,
    reuseIdentifer: null,
    titleInsets: JSDynamicProperty('_titleInsets', null),
    titleSpacing: JSDynamicProperty('_titleSpacing', 2.0),
    contentView: JSReadOnlyProperty('_contentView', null),
    titleLabel: JSLazyInitProperty('_createTitleLabel', '_titleLabel'),
    detailLabel: JSLazyInitProperty('_createDetailLabel', '_detailLabel'),

    initWithReuseIdentifier: function(identifier){
        this.init();
        this.reuseIdentifer = identifier;
    },

    initWithFrame: function(frame){
        UIListViewCell.$super.initWithFrame.call(this, frame);
        this._commonCellInit();
    },

    initWithSpec: function(spec, values){
        UIListViewCell.$super.initWithSpec.call(this, spec, values);
        this._commonCellInit();
    },

    _commonCellInit: function(){
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
        UIListViewCell.$super.layoutSubviews.call(this);
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

UIListViewCell.State = {
    normal: 0,
    selected: 1 << 0
};