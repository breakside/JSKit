// #import "UIListViewCell.js"
// #import "UIButton.js"
// #import "UIEvent.js"
/* global JSClass, UIListViewCell, UIOutlineViewCell, UIButton, UIButtonImageStyler, JSDynamicProperty, JSReadOnlyProperty, JSLazyInitProperty, JSInsets, JSColor, UIEvent */
'use strict';

JSClass("UIOutlineViewCell", UIListViewCell, {

    outlineView: null,
    indexPath: null,
    level: JSReadOnlyProperty(),
    expandable: JSDynamicProperty('_expandable', false),
    disclosureButton: JSReadOnlyProperty('_disclosureButton', null),

    _commonCellInit: function(){
        UIOutlineViewCell.$super._commonCellInit.call(this);
        var buttonStyler = UIButtonImageStyler.initWithColor(JSColor.blackColor);
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
    expanded: {
        value: UIListViewCell.State.firstUserState
    },
    firstUserState: {
        configurable: true,
        value: UIListViewCell.State.firstUserState << 1
    }
});