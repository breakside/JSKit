// #import "UIListViewCell.js"
// #import "UIButton.js"
/* global JSClass, UIListViewCell, UIOutlineViewCell, UIButton, JSDynamicProperty, JSReadOnlyProperty, JSLazyInitProperty, _UIOutlineViewCellDisclosureButton, JSInsets */
'use strict';

JSClass("UIOutlineViewCell", UIListViewCell, {

    outlineView: null,
    indexPath: null,
    level: JSReadOnlyProperty(),
    expandable: JSDynamicProperty('_expandable', false),
    disclosureButton: JSReadOnlyProperty('_disclosureButton', null),

    _commonCellInit: function(){
        UIOutlineViewCell.$super._commonCellInit.call(this);
        this._disclosureButton = UIButton.initWithStyler(UIButton.Styler.custom);
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