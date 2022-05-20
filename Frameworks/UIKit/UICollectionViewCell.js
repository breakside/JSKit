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

// #import "UICollectionReusableView.js"
// #import "UILabel.js"
// #import "UIImageView.js"
'use strict';

JSClass("UICollectionViewCell", UICollectionReusableView, {

    layoutSubviews: function(){
        UICollectionViewCell.$super.layoutSubviews.call(this);
        var styler = (this._styler || (this.collectionView && this.collectionView._styler));
        if (!styler){
            return;
        }
        styler.layoutCell(this);
    },

    // --------------------------------------------------------------------
    // MARK: - State

    state: JSReadOnlyProperty('_state', null),
    active: JSDynamicProperty(null, null, 'isActive'),
    selected: JSDynamicProperty(null, null, 'isSelected'),
    contextSelected: JSDynamicProperty(null, null, 'isContextSelected'),
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
        var styler = (this._styler || (this.collectionView && this.collectionView._styler));
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
        return (this._state & UICollectionViewCell.State.active) === UICollectionViewCell.State.active;
    },

    setActive: function(isActive){
        this._toggleState(UICollectionViewCell.State.active, isActive);
    },

    isSelected: function(){
        return (this._state & UICollectionViewCell.State.selected) === UICollectionViewCell.State.selected;
    },

    setSelected: function(isSelected){
        this._toggleState(UICollectionViewCell.State.selected, isSelected);
    },

    isContextSelected: function(){
        return (this._state & UICollectionViewCell.State.contextSelected) === UICollectionViewCell.State.contextSelected;
    },

    setContextSelected: function(isContextSelected){
        this._toggleState(UICollectionViewCell.State.contextSelected, isContextSelected);
    },

    isDropTarget: function(){
        return (this._state & UICollectionViewCell.State.dropTarget) === UICollectionViewCell.State.dropTarget;
    },

    setDropTarget: function(isDropTarget){
        this._toggleState(UICollectionViewCell.State.dropTarget, isDropTarget);
    },

    // --------------------------------------------------------------------
    // MARK: - Accessibility

    isAccessibilityElement: true,
    accessibilityRole: UIAccessibility.Role.cell,

    getAccessibilityElements: function(){
        return this._contentView.accessibilityElements;
    },

    accessibilitySelected: JSReadOnlyProperty(),

    getAccessibilitySelected: function(){
        return this.selected;
    },

});

UICollectionViewCell.State = {
    normal:   0,
    active:   1 << 1,
    selected: 1 << 2,
    contextSelected: 1 << 3,
    dropTarget: 1 << 4,
    firstUserState: 1 << 5
};