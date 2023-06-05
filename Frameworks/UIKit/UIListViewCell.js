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
// #import "UIImageView.js"
'use strict';

JSClass("UIListViewCell", UIView, {

    listView: null,
    indexPath: null,
    reuseIdentifier: null,
    titleInsets: JSDynamicProperty('_titleInsets', null),
    contentView: JSReadOnlyProperty('_contentView', null),
    titleLabel: JSLazyInitProperty('_createTitleLabel', '_titleLabel'),
    detailLabel: JSLazyInitProperty('_createDetailLabel', '_detailLabel'),
    imageView: JSLazyInitProperty('_createImageView', '_imageView'),
    accessoryImage: JSDynamicProperty(),
    accessoryView: JSDynamicProperty('_accessoryView', null),
    accessoryInsets: JSDynamicProperty('_accessoryInsets', null),
    separatorInsets: JSDynamicProperty('_separatorInsets', null),
    numberOfDetailLines: JSDynamicProperty('_numberOfDetailLines', 1),
    stylerProperties: null,
    _styler: null,

    initWithReuseIdentifier: function(identifier, styler){
        this.init();
        this.reuseIdentifier = identifier;
        this._styler = styler;
    },

    initWithFrame: function(frame){
        UIListViewCell.$super.initWithFrame.call(this, frame);
        this._commonCellInit();
    },

    initWithSpec: function(spec){
        UIListViewCell.$super.initWithSpec.call(this, spec);
        this._commonCellInit();
    },

    _commonCellInit: function(){
        this.stylerProperties = {};
        this._accessoryInsets = JSInsets.Zero;
        this._titleInsets = JSInsets(0, 10);
        this._contentView = UIView.init();
        this.accessbilityColumnIndex = 0;
        this.addSubview(this._contentView);
    },

    _createTitleLabel: function(){
        var label = UILabel.init();
        label.accessibilityHidden = false;
        this.contentView.addSubview(label);
        return label;
    },

    _createDetailLabel: function(){
        var label = UILabel.init();
        label.accessibilityHidden = false;
        label.maximumNumberOfLines = this._numberOfDetailLines;
        label.font = label.font.fontWithPointSize(JSFont.Size.detail);
        this.contentView.addSubview(label);
        return label;
    },

    _createImageView: function(){
        var imageView = UIImageView.init();
        imageView.scaleMode = UIImageView.ScaleMode.aspectFit;
        this.contentView.addSubview(imageView);
        return imageView;
    },

    setTitleInsets: function(titleInsets){
        this._titleInsets = JSInsets(titleInsets);
        this.setNeedsLayout();
    },

    layoutSubviews: function(){
        UIListViewCell.$super.layoutSubviews.call(this);
        var styler = (this._styler || (this.listView && this.listView._styler));
        if (!styler){
            return;
        }
        styler.layoutCell(this);
    },

    setNumberOfDetailLines: function(lines){
        if (lines != this._numberOfDetailLines){
            this._numberOfDetailLines = lines;
            if (this._detailLabel !== null){
                this._detailLabel.maximumNumberOfLines = this._numberOfDetailLines;
            }
            this.setNeedsLayout();
        }
    },

    // --------------------------------------------------------------------
    // MARK: - Accessory

    getAccessoryImage: function(){
        if (this._accessoryView !== null && this._accessoryView.isKindOfClass(UIImageView)){
            return this._accessoryView.image;
        }
        return null;
    },

    setAccessoryImage: function(accessoryImage){
        if (accessoryImage !== null){
            if (!this._accessoryView || !this._accessoryView.isKindOfClass(UIImageView)){
                this.accessoryView = UIImageView.init();
            }
            this._accessoryView.image = accessoryImage;
        }else{
            this.accessoryView = null;
        }
    },

    setAccessoryView: function(accessoryView){
        if (this._accessoryView && this._accessoryView !== accessoryView){
            this._accessoryView.removeFromSuperview();
        }
        this._accessoryView = accessoryView;
        if (this._accessoryView && this._accessoryView.superview !== this._contentView){
            this._contentView.addSubview(this._accessoryView);
        }
        this.setNeedsLayout();
    },

    // --------------------------------------------------------------------
    // MARK: - State

    state: JSReadOnlyProperty('_state', null),
    active: JSDynamicProperty(null, null, 'isActive'),
    selected: JSDynamicProperty(null, null, 'isSelected'),
    contextSelected: JSDynamicProperty(null, null, 'isContextSelected'),
    over: JSDynamicProperty(null, null, 'isOver'),
    dropTarget: JSDynamicProperty(null, null, 'isDropTarget'),

    _updateState: function(newState){
        if (newState != this._state){
            this._state = newState;
            if (this._didChangeState){
                this._didChangeState();
            }else{
                this.update();
            }
        }
    },

    update: function(){
        var styler = (this._styler || (this.listView && this.listView._styler));
        if (!styler){
            return;
        }
        styler.updateCell(this, this.indexPath);
    },

    _toggleState: function(flag, on){
        var newState = this._state;
        if (on){
            newState |= flag;
        }else{
            newState &= ~flag;
        }
        this._updateState(newState);
    },

    toggleStates: function(flag, on){
        this._toggleState(flag, on);
    },

    isActive: function(){
        return (this._state & UIListViewCell.State.active) === UIListViewCell.State.active;
    },

    setActive: function(isActive){
        this._toggleState(UIListViewCell.State.active, isActive);
    },

    isSelected: function(){
        return (this._state & UIListViewCell.State.selected) === UIListViewCell.State.selected;
    },

    setSelected: function(isSelected){
        this._toggleState(UIListViewCell.State.selected, isSelected);
    },

    isContextSelected: function(){
        return (this._state & UIListViewCell.State.contextSelected) === UIListViewCell.State.contextSelected;
    },

    setContextSelected: function(isContextSelected){
        this._toggleState(UIListViewCell.State.contextSelected, isContextSelected);
    },

    isOver: function(){
        return (this._state & UIListViewCell.State.over) === UIListViewCell.State.over;
    },

    setOver: function(isOver){
        this._toggleState(UIListViewCell.State.over, isOver);
    },

    isDropTarget: function(){
        return (this._state & UIListViewCell.State.dropTarget) === UIListViewCell.State.dropTarget;
    },

    setDropTarget: function(isDropTarget){
        this._toggleState(UIListViewCell.State.dropTarget, isDropTarget);
    },

    // --------------------------------------------------------------------
    // MARK: - Over State

    hasOverState: JSDynamicProperty("_hasOverState", false),

    setHasOverState: function(hasOverState){
        this._hasOverState = hasOverState;
        if (hasOverState){
            this.contentView.startMouseTracking(UIView.MouseTracking.enterAndExit);
        }else{
            this.contentView.stopMouseTracking();
        }
    },

    mouseEntered: function(event){
        var shouldSelect = (!this.listView || !this.listView.delegate || !this.listView.delegate.listViewShouldSelectCellAtIndexPath || this.listView.delegate.listViewShouldSelectCellAtIndexPath(this.listView, this.listView.indexPathOfCell(this)));
        if (shouldSelect){
            this.over = true;
        }
    },

    mouseExited: function(event){
        this.over = false;
    },

    // --------------------------------------------------------------------
    // MARK: - Accessibility

    isAccessibilityElement: true,
    accessibilityRole: UIAccessibility.Role.cell,

    getAccessibilityLabel: function(){
        var label = UIListViewCell.$super.getAccessibilityLabel.call(this);
        if (label !== null){
            return label;
        }
        if (this._titleLabel !== null){
            return this._titleLabel.text;
        }
        return null;
    },

    getAccessibilityElements: function(){
        return this._contentView.accessibilityElements;
    },

    accessibilitySelected: JSReadOnlyProperty(),

    getAccessibilitySelected: function(){
        return this.selected;
    },

});

UIListViewCell.State = {
    normal:   0,
    active:   1 << 1,
    selected: 1 << 2,
    contextSelected: 1 << 3,
    over: 1 << 4,
    dropTarget: 1 << 5,
    firstUserState: 1 << 6
};