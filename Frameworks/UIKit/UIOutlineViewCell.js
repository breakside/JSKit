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

// #import "UIListViewCell.js"
// #import "UIButton.js"
// #import "UIEvent.js"
'use strict';

JSClass("UIOutlineViewCell", UIListViewCell, {

    outlineView: null,
    indexPath: null,
    level: JSReadOnlyProperty(),
    expandable: JSDynamicProperty('_expandable', false),
    disclosureButton: JSReadOnlyProperty('_disclosureButton', null),

    _commonCellInit: function(){
        UIOutlineViewCell.$super._commonCellInit.call(this);
        var buttonStyler = UIButtonImageStyler.initWithColor(JSColor.black);
        this._disclosureButton = UIButton.initWithStyler(buttonStyler);
        this._disclosureButton.addAction("_toggleExpanded", this);
        this._contentView.addSubview(this._disclosureButton);
        this._titleInsets = JSInsets(0, 5, 0, 10);
    },

    getLevel: function(){
        return this.indexPath.length - 2;
    },

    // --------------------------------------------------------------------
    // MARK: - State

    expanded: JSDynamicProperty(null, null, 'isExpanded'),

    isExpanded: function(){
        return (this._state & UIOutlineViewCell.State.expanded) === UIOutlineViewCell.State.expanded;
    },

    setExpanded: function(isExpanded){
        this._toggleState(UIOutlineViewCell.State.expanded, isExpanded && this._expandable);
    },

    _toggleExpanded: function(button, event){
        if (!this.outlineView){
            return;
        }
        var recursive = event.hasModifier(UIEvent.Modifier.option);
        if (this.expanded){
            this.outlineView._collapseCell(this, recursive);
        }else{
            this.outlineView._expandCell(this, recursive);
        }
    }

});

UIOutlineViewCell.State = Object.create(UIListViewCell.State, {
    expanded: {value: UIListViewCell.State.firstUserState},
    firstUserState: {value: UIListViewCell.State.firstUserState << 1, configurable: true}
});