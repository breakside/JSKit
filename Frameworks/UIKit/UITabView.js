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
// #import "UIEvent.js"
'use strict';

(function(){

JSProtocol("UITabViewDelegate", JSProtocol, {

    tabViewWillSelectItemAtIndex: function(tabView, index){},
    tabViewDidSelectItemAtIndex: function(tabView, index){}

});

JSClass("UITabView", UIView, {

    items: JSDynamicProperty('_items', null),
    selectedIndex: JSDynamicProperty('_selectedIndex', -1),
    selectedItem: JSDynamicProperty(),
    styler: JSReadOnlyProperty('_styler', null),
    stylerProperties: null,
    delegate: null,
    font: null,

    initWithFrame: function(frame){
        UITabView.$super.initWithFrame.call(this, frame);
        this._commonTabViewInit();
    },

    initWithSpec: function(spec){
        UITabView.$super.initWithSpec.call(this, spec);
        if (spec.containsKey('styler')){
            this._styler = spec.valueForKey("styler", UITabView.Styler);
        }else{
            this._styler = UITabView.Styler.default;
        }
        this._commonTabViewInit();
        if (spec.containsKey('delegate')){
            this.delegate = spec.valueForKey("delegate");
        }
        if (spec.containsKey('items')){
            var items = spec.valueForKey('items');
            for (var i = 0, l = items.length; i < l; ++i){
                items.push(items.valueForKey(i, UITabViewItem));
            }
            this.items = items;
        }
        if (spec.containsKey("font")){
            this.font = spec.valueForKey("font", JSFont);
        }
    },

    _commonTabViewInit: function(){
        this._items = [];
        this.stylerProperties = {};
        if (this._styler === null){
            this._styler = UITabView.Styler.default;
        }
        this._styler.initializeTabView(this);
        this.setNeedsLayout();
    },

    addItemWithTitle: function(title){
        this.insertItemWithTitleAtIndex(title, this._items.length);
    },

    addItem: function(item){
        this.insertItemAtIndex(item, this._items.length);
    },

    insertItemAtIndex: function(item, index){
        if (this._items.length === 0){
            // The first item inserted is selected, so we need to notify delegate,
            // update the item state, and add the item's content view.  These are the
            // critical steps from setSelectedIndex, but done in a way that doesn't depend
            // on this._items changing in the middle.
            if (this.delegate && this.delegate.tabViewWillSelectItemAtIndex){
                this.delegate.tabViewWillSelectItemAtIndex(this, index);
            }
            item.selected = true;
            this._styler.showContentViewInTabView(item.view, this);
            this._selectedIndex = 0;
            if (this.delegate && this.delegate.tabViewDidSelectItemAtIndex){
                this.delegate.tabViewDidSelectItemAtIndex(this, index);
            }
        }else if (index <= this._selectedIndex){
            this._selectedIndex += 1;
        }
        item._tabView = this;
        item.index = index;
        this._items.splice(index, 0, item);
        for (var i = index + 1, l = this._items.length; i < l; ++i){
            this._items[i].index = i;
        }
        this._styler.updateTabView(this);
    },

    insertItemWithTitleAtIndex: function(title, index){
        var item = UITabViewItem.initWithTitle(title);
        this.insertItemAtIndex(item, index);
    },

    removeItemAtIndex: function(index){
        var isRemovingOnlyItem = false;
        if (index == this._selectedIndex){
            if (index < this._items.length - 1){
                // If we're removing the selected item, select the next item if available
                // NOTE: doing so by setting the selected index causes setSelectedIndex to run
                // its normal steps, taking care of any delegate notifications and UI updates.
                // Basically, it's a way of keeping the remaining remove logic simple so it
                // only has to be concerned with removing deselected items.
                this.selectedIndex = index + 1;
            }else if (index > 0){
                // If the next item isn't available, select the previous item
                this.selectedIndex = index - 1;
            }else{
                // If we're removing the only item, there's no other item we can switch to first,
                // so we need to notify delegate, update the item state, and remove the item's content view.
                // These are the critical steps from setSelectedIndex, but done in a way that doesn't depend
                // on this._items changing in the middle.
                isRemovingOnlyItem = true;
                if (this.delegate && this.delegate.tabViewWillSelectItemAtIndex){
                    this.delegate.tabViewWillSelectItemAtIndex(this, -1);
                }
                this._selectedIndex = -1;
            }
        }
        var item = this._items[index];
        item._tabView = null;
        this._items.splice(index, 1);
        for (var i = index, l = this._items.length; i < l; ++i){
            this._items[i].index = i;
        }
        this._styler.updateTabView(this);
        if (isRemovingOnlyItem){
            item.selected = false;
            item.view.removeFromSuperview();
            if (this.delegate && this.delegate.tabViewDidSelectItemAtIndex){
                this.delegate.tabViewDidSelectItemAtIndex(this, -1);
            }
        }else{
            if (index <= this._selectedIndex){
                this._selectedIndex -= 1;
            }
        }
    },

    setSelectedIndex: function(selectedIndex){
        if (selectedIndex === this._selectedIndex){
            return;
        }
        if (this.delegate && this.delegate.tabViewWillSelectItemAtIndex){
            this.delegate.tabViewWillSelectItemAtIndex(this, selectedIndex);
        }
        var item = this.selectedItem;
        if (item !== null){
            item.selected = false;
            this._styler.removeContentViewFromTabView(item.view, this);
            this._styler.updateTabViewItemAtIndex(this, this._selectedIndex);
        }
        this._selectedIndex = selectedIndex;
        item = this.selectedItem;
        if (item !== null){
            item.selected = true;
            this._styler.updateTabViewItemAtIndex(this, this._selectedIndex);
            this._styler.showContentViewInTabView(item.view, this);
        }
        this.postAccessibilityNotification(UIAccessibility.Notification.selectedChildrenChanged);
        if (this.delegate && this.delegate.tabViewDidSelectItemAtIndex){
            this.delegate.tabViewDidSelectItemAtIndex(this, selectedIndex);
        }
    },

    setSelectedItem: function(item){
        var index = this._items.indexOf(item);
        if (index >= 0){
            this.selectedIndex = index;
        }
    },

    getSelectedItem: function(){
        if (this._selectedIndex >= 0 && this._selectedIndex < this._items.length){
            return this._items[this._selectedIndex];
        }
        return null;
    },

    setItems: function(items){
        // FIXME: delegate calls
        if (this._selectedIndex !== 0){
            this.selectedIndex = 0;
        }
        this._items = JSCopy(items);
        this._styler.updateTabView(this);
    },

    layoutSubviews: function(){
        UITabView.$super.layoutSubviews.call(this);
        this.styler.layoutTabView(this);
    },

    viewForItem: function(item){
        return this.styler.viewForItemAtIndex(this, item.index);
    },

    // --------------------------------------------------------------------
    // MARK: - Responder

    setNextKeyView: function(nextKeyView){
        if (this._items.length > 0){
            var view = this.styler.viewForItemAtIndex(this, this._items.length - 1);
            view.nextKeyView = nextKeyView;
        }else{
            UITabView.$super.setNextKeyView.call(this, nextKeyView);
        }
    },

    // --------------------------------------------------------------------
    // MARK: - Accessibility

    isAccessibilityElement: true,

    accessibilityRole: UIAccessibility.Role.tabGroup,

    getAccessibilityElements: function(){
        return this._items;
    },

});

JSClass("UITabViewItem", JSObject, {

    index: -1,
    title: JSDynamicProperty("_title", null),
    image: JSDynamicProperty("_image", null),
    selectedImage: JSDynamicProperty("_selectedImage", null),
    state: JSReadOnlyProperty("_state", 0),
    view: JSDynamicProperty("_view", null),
    active: JSDynamicProperty(),
    selected: JSDynamicProperty(),
    over: JSDynamicProperty(),
    _tabView: null,

    initWithSpec: function(spec){
        if (spec.containsKey('title')){
            this.title = spec.valueForKey("title");
        }
        if (spec.containsKey('image')){
            this.image = spec.valueForKey("image", JSImage);
        }
        if (spec.containsKey('selectedImage')){
            this.selectedImage = spec.valueForKey("selectedImage", JSImage);
        }
        if (spec.containsKey("view")){
            this._view = spec.valueForKey("view", UIView);
        }
        if (spec.containsKey("accessibilityIdentifier")){
            this.accessibilityIdentifier = spec.valueForKey("accessibilityIdentifier");
        }
        if (spec.containsKey("accessibilityLabel")){
            this._accessibilityLabel = spec.valueForKey("accessibilityLabel");
        }
        if (spec.containsKey("accessibilityHint")){
            this.accessibilityHint = spec.valueForKey("accessibilityHint");
        }
    },

    initWithTitle: function(title){
        this._title = title;
    },

    initWithImage: function(image){
        this._image = image;
    },

    _updateState: function(newState){
        if (newState != this._state){
            this._state = newState;
        }
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

    isOver: function(){
        return (this._state & UITabViewItem.State.over) === UITabViewItem.State.over;
    },

    setOver: function(isOver){
        this._toggleState(UITabViewItem.State.over, isOver);
    },

    isActive: function(){
        return (this._state & UITabViewItem.State.active) === UITabViewItem.State.active;
    },

    setActive: function(isActive){
        this._toggleState(UITabViewItem.State.active, isActive);
    },

    isSelected: function(){
        return (this._state & UITabViewItem.State.selected) ===  UITabViewItem.State.selected;
    },

    setSelected: function(isSelected){  
        this._toggleState(UITabViewItem.State.selected, isSelected);
    },

    // Visibility
    isAccessibilityElement: true,
    accessibilityHidden: false,
    accessibilityLayer: JSReadOnlyProperty(),
    accessibilityFrame: JSReadOnlyProperty(),

    // Role
    accessibilityRole: UIAccessibility.Role.button,
    accessibilitySubrole: UIAccessibility.Subrole.tab,

    // Label
    accessibilityIdentifier: null,
    accessibilityLabel: JSDynamicProperty("_accessibilityLabel", null),
    accessibilityHint: null,

    // Value
    accessibilityValue: null,
    accessibilityValueRange: null,
    accessibilityChecked: null,

    // Properties
    accessibilityTextualContext: null,
    accessibilityMenu: null,
    accessibilityRowIndex: null,
    accessibilitySelected: JSReadOnlyProperty(),
    accessibilityExpanded: null,
    accessibilityOrientation: null,

    // Children
    accessibilityParent: JSReadOnlyProperty(),
    accessibilityElements: [],

    getAccessibilityFrame: function(){
        if (this._tabView !== null){
            var view = this._tabView.viewForItem(this);
            if (view !== null){
                return view.convertRectToScreen(view.bounds);
            }
        }
        return null;
    },

    getAccessibilityLayer: function(){
        if (this._tabView !== null){
            var view = this._tabView.viewForItem(this);
            if (view !== null){
                return view.layer;
            }
        }
        return null;
    },

    getAccessibilityParent: function(){
        return this._tabView;
    },

    getAccesssibilityLabel: function(){
        if (this._accessibilityLabel !== null){
            return this._accessibilityLabel;
        }
        return this.title;
    },

    getAccessibilitySelected: function(){
        return this.selected;
    }

});

UITabViewItem.State = {
    normal:         0,
    over:           1 << 0,
    active:         1 << 1,
    selected:       1 << 2
};

JSClass("UITabViewItemView", UIView, {

    index: 0,
    stylerProperties:  null,

    initWithFrame: function(frame){
        UITabViewItemView.$super.initWithFrame.call(this, frame);
        this.stylerProperties = {};
    },

    canBecomeFirstResponder: function(){
        return this.fullKeyboardAccessEnabled;
    }

});

JSClass("UITabViewItemsView", UIView, {

    tabView: null,
    itemViews: null,
    _activeItemIndex: -1,

    initWithFrame: function(frame){
        UITabViewItemsView.$super.initWithFrame.call(this, frame);
        this.itemViews = [];
    },

    _tabItemViewAtLocation: function(location){
        var itemView;
        for (var i = 0, l = this.itemViews.length; i < l; ++i){
            itemView = this.itemViews[i];
            if (itemView.hitTest(this.convertPointToView(location, itemView))){
                return itemView;
            }
        }
        return null;
    },

    update: function(){
        this._activeItemIndex = -1;
        var item;
        var itemView;
        var previousKeyView = this.tabView;
        var nextKeyView = this.itemViews.length > 0 ? this.itemViews[this.itemViews.length - 1].nextKeyView : this.tabView.nextKeyView;
        var i, l;
        for (i = 0, l = this.tabView.items.length; i < l; ++i){
            item = this.tabView.items[i];
            if (i < this.itemViews.length){
                itemView = this.itemViews[i];
            }else{
                itemView = UITabViewItemView.init();
                this.addSubview(itemView);
                this.itemViews.push(itemView);
            }
            itemView.index = i;
        }
        for (i = 0, l = this.itemViews.length; i < l; ++i){
            previousKeyView.nextKeyView = itemView;
            previousKeyView = itemView;
        }
        for (var j = this.itemViews.length - 1; j >= i; --i){
            itemView = this.itemViews.pop();
            itemView.tabView = null;
            itemView.removeFromSuperview();
            itemView.index = -1;
        }
        this.tabView.nextKeyView = nextKeyView;
        this.setNeedsLayout();
    },

    mouseDown: function(event){
        var location = event.locationInView(this);
        var tabItemView = this._tabItemViewAtLocation(location);
        this.activateItemView(tabItemView);
    },

    mouseDragged: function(event){
        var location = event.locationInView(this);
        var tabItemView = this._tabItemViewAtLocation(location);
        this.activateItemView(tabItemView);
    },

    mouseUp: function(event){
        this.activateItemView(null);
        var location = event.locationInView(this);
        var tabItemView = this._tabItemViewAtLocation(location);
        if (tabItemView){
            this.selectItemView(tabItemView);
        }
    },

    touchesBegan: function(touches, event){
        var touch = touches[0];
        var location = touch.locationInView(this);
        var tabItemView = this._tabItemViewAtLocation(location);
        this.activateItemView(tabItemView);
    },

    touchesMoved: function(touches, event){
        var touch = touches[0];
        var location = touch.locationInView(this);
        var tabItemView = this._tabItemViewAtLocation(location);
        this.activateItemView(tabItemView);
    },

    touchesEnded: function(touches, event){
        this.activateItemView(null);
        var touch = touches[0];
        var location = touch.locationInView(this);
        var tabItemView = this._tabItemViewAtLocation(location);
        if (tabItemView){
            this.selectItemView(tabItemView);
        }
    },

    touchesCanceled: function(touches, event){
        this.activateItemView(null);
    },

    keyDown: function(event){
        if (event.key === UIEvent.Key.space){
            var itemView = this.keyItemView();
            this.activateItemView(itemView);
            return;
        }
        UITabViewItemView.$super.keyDown.call(this, event);
    },

    keyUp: function(event){
        if (event.key === UIEvent.Key.space){
            var itemView = this.keyItemView();
            this.activateItemView(null);
            if (itemView){
                this.selectItemView(itemView);
            }
            return;
        }
        UITabViewItemView.$super.keyUp.call(this, event);
    },

    keyItemView: function(){
        var itemView;
        for (var i = 0, l = this.itemViews.length; i < l; ++i){
            itemView = this.itemViews[i];
            if (itemView.isFirstResponder()){
                return itemView;
            }
        }
        return null;
    },

    activateItemView: function(itemView){
        if (this._activeItemIndex >= 0){
            this.tabView.items[this._activeItemIndex].active = false;
            this.tabView.styler.updateTabViewItemAtIndex(this.tabView, this._activeItemIndex);
        }
        this._activeItemIndex = itemView !== null ? itemView.index : -1;
        if (this._activeItemIndex >= 0){
            this.tabView.items[this._activeItemIndex].active = true;
            this.tabView.styler.updateTabViewItemAtIndex(this.tabView, this._activeItemIndex);
        }
    },

    selectItemView: function(itemView){
        this.tabView.selectedIndex = itemView.index;
    },

    sizeToFit: function(){
        var itemView;
        var size = JSSize.Zero;
        for (var i = 0, l = this.itemViews.length; i < l; ++i){
            itemView = this.itemViews[i];
            size.width += itemView.frame.size.width;
            if (itemView.frame.size.height > size.height){
                size.height = itemView.frame.size.height;
            }
        }
        this.bounds = JSRect(JSPoint.Zero, size);
    },

    layoutSubviews: function(){
        var itemView;
        var x = 0;
        for (var i = 0, l = this.itemViews.length; i < l; ++i){
            itemView = this.itemViews[i];
            itemView.frame = JSRect(JSPoint(x, 0), itemView.frame.size);
            x += itemView.frame.size.width;
        }
    }

});

JSClass("UITabViewContentContainer", UIView, {

    _insertSubviewAtIndex: function(subview, index, layerIndex){
        UITabViewContentContainer.$super._insertSubviewAtIndex.call(this, subview, index, layerIndex);
        this.setNeedsLayout();
    },
 
    layoutSubviews: function(){
        var subview;
        for (var i = 0, l = this.subviews.length; i < l; ++i){
            subview = this.subviews[i];
            subview.frame = this.bounds;
        }
    }

});


JSClass("UITabViewStyler", JSObject, {

    font: null,

    init: function(){
        this.font = JSFont.systemFontOfSize(JSFont.Size.normal);
    },

    initWithSpec: function(spec){
        this.font = spec.valueForKey("font", JSFont);
        if (this.font === null){
            this.font = JSFont.systemFontOfSize(JSFont.Size.normal);
        }
    },

    initializeTabView: function(tabView){
        tabView.font = this.font;
    },

    updateTabView: function(tabView){
    },

    showContentViewInTabView: function(contentView, tabView){
    },

    removeContentViewFromTabView: function(contentView, tabView){
        contentView.removeFromSuperview();
    },

    layoutTabView: function(tabView){
    },

    updateTabViewItemAtIndex: function(tabView, index){
    },

    viewForItemAtIndex: function(tabView, index){
        return null;
    },

});

JSClass("UITabViewDefaultStyler", UITabViewStyler, {

    cornerRadius: 3,
    itemContentInsets: null,
    itemsInsets: null,
    imageSpacing: 3,

    init: function(){
        UITabViewDefaultStyler.$super.init.call(this);
        this.itemContentInsets = JSInsets(3, 10);
        this.itemsInsets = JSInsets(4);
    },

    initializeTabView: function(tabView){
        UITabViewDefaultStyler.$super.initializeTabView.call(this, tabView);
        var props = tabView.stylerProperties;
        props.contentViewContainer = UITabViewContentContainer.init();
        tabView.addSubview(props.contentViewContainer);
        props.itemsView = UITabViewItemsView.init();
        props.itemsView.tabView = tabView;
        props.itemsView.shadowColor = JSColor.initWithRGBA(0, 0, 0, 0.1);
        props.itemsView.shadowOffset = JSPoint(0, 1);
        props.itemsView.shadowRadius = 1;
        props.itemsView.cornerRadius = this.cornerRadius;
        tabView.addSubview(props.itemsView);
        props.divider = UIView.init();
        props.divider.backgroundColor = defaultStateBorderColors[0];
        tabView.insertSubviewBelowSibling(props.divider, props.itemsView);
    },

    showContentViewInTabView: function(contentView, tabView){
        tabView.stylerProperties.contentViewContainer.addSubview(contentView);
    },

    updateTabView: function(tabView){
        var props = tabView.stylerProperties;
        props.itemsView.update();
        var itemView;
        var item;
        var itemProps;
        for (var i = 0, l = tabView.items.length; i < l; ++i){
            item = tabView.items[i];
            itemView = props.itemsView.itemViews[i];
            itemProps = itemView.stylerProperties;
            if (!itemProps.initialized){
                itemProps.initialized = true;
                itemView.borderWidth = 1.0;
                itemView.cornerRadius = this.cornerRadius;
                itemProps.titleLabel = UILabel.init();
                itemProps.titleLabel.text = tabView.font;
                itemProps.titleLabel.text = tabView.font;
                itemProps.imageView = UIImageView.init();
                itemProps.imageView.automaticRenderMode = JSImage.RenderMode.template;
                itemProps.rightSeparator = UILayer.init();
                itemProps.rightSeparator.backgroundColor = JSColor.initWithRGBA(0, 0, 0, 0.2);
                itemProps.leftSeparator = UILayer.init();
                itemProps.leftSeparator.backgroundColor = JSColor.initWithRGBA(0, 0, 0, 0.2);
                itemView.addSubview(itemProps.imageView);
                itemView.addSubview(itemProps.titleLabel);
                itemView.layer.addSublayer(itemProps.leftSeparator);
                itemView.layer.addSublayer(itemProps.rightSeparator);
            }
            if (item.title){
                itemProps.titleLabel.text = item.title;
                itemProps.titleLabel.hidden = false;
            }else{
                itemProps.titleLabel.hidden = true;
            }
            if (item.image){
                itemProps.imageView.image = item.image;
                itemProps.hidden = false;
            }else{
                itemProps.hidden = true;
            }
            this.updateTabViewItemAtIndex(tabView, i);
        }
        tabView.setNeedsLayout();
    },

    layoutTabView: function(tabView){
        var props = tabView.stylerProperties;
        var size = tabView.bounds.size;
        var itemView;
        for (var i = 0, l = props.itemsView.itemViews.length; i < l; ++i){
            itemView = props.itemsView.itemViews[i];
            this._sizeItemViewToFit(tabView, itemView);
            this._layoutItemView(tabView, itemView);
        }
        props.itemsView.sizeToFit();
        var y = this.itemsInsets.top;
        props.itemsView.position = JSPoint(size.width / 2.0, y + props.itemsView.frame.size.height / 2.0);
        tabView.stylerProperties.divider.frame = JSRect(0, props.itemsView.position.y, tabView.bounds.size.width, 1);
        y += props.itemsView.frame.size.height + this.itemsInsets.bottom;
        props.contentViewContainer.frame = JSRect(0, y, size.width, size.height - y);
    },

    _sizeItemViewToFit: function(tabView, itemView){
        var font = tabView.font;
        var imageSize = font.displayAscender;
        var itemProps = itemView.stylerProperties;
        var size = JSSize(this.itemContentInsets.width, this.itemContentInsets.height);
        if (itemProps.titleLabel !== null && !itemProps.titleLabel.hidden){
            itemProps.titleLabel.sizeToFit();
            size.width += Math.ceil(itemProps.titleLabel.frame.size.width);
        }
        if (itemProps.imageView !== null && !itemProps.imageView.hidden){
            itemProps.imageView.frame = JSRect(itemProps.imageView.frame.origin, JSSize(imageSize, imageSize));
            size.width += imageSize;
            if (itemProps.titleLabel !== null && !itemProps.titleLabel.hidden){
                 size.width += this.imageSpacing;
            }
        }
        itemView.bounds = JSRect(JSPoint.Zero, size);
    },

    _layoutItemView: function(tabView, itemView){
        var center = itemView.bounds.center;
        var imageSize = 0;
        var itemProps = itemView.stylerProperties;
        if (itemProps.imageView !== null && !itemProps.imageView.hidden){
            imageSize = itemProps.imageView.frame.size.width;
            itemProps.imageView.position = JSPoint(this.contentInsets.left + imageSize / 2, center.y);
        }
        if (itemProps.titleLabel !== null && !itemProps.titleLabel.hidden){
            itemProps.titleLabel.position = JSPoint(center.x + imageSize / 2 + this.imageSpacing, center.y);
        }
        itemProps.leftSeparator.frame = JSRect(0, 0, 0.5, itemView.bounds.size.height);
        itemProps.rightSeparator.frame = JSRect(itemView.bounds.size.width - 0.5, 0, 0.5, itemView.bounds.size.height);
    },

    updateTabViewItemAtIndex: function(tabView, itemIndex){
        var item = tabView.items[itemIndex];
        var itemView = tabView.stylerProperties.itemsView.itemViews[itemIndex];
        var itemProps = itemView.stylerProperties;
        itemView.backgroundColor = defaultStateBackgroundColors[item.state];
        itemView.borderColor = defaultStateBorderColors[item.state];
        if (itemProps.titleLabel !== null){
            itemProps.titleLabel.textColor = defaultStateTitleColors[item.state];
        }
        if (itemProps.imageView !== null){
            itemProps.imageView.templateColor = defaultStateTitleColors[item.state];
        }
        if (itemView.index === 0){
            itemView.maskedCorners = UILayer.Corners.minX;
            itemView.maskedBorders = UILayer.Sides.minY | UILayer.Sides.maxY | UILayer.Sides.minX;
            itemProps.leftSeparator.hidden = true;
            itemProps.rightSeparator.hidden = false;
        }else if (itemView.index === tabView.items.length - 1){
            itemView.maskedCorners = UILayer.Corners.maxX;
            itemView.maskedBorders = UILayer.Sides.minY | UILayer.Sides.maxY | UILayer.Sides.maxX;
            itemProps.leftSeparator.hidden = false;
            itemProps.rightSeparator.hidden = true;
        }else{
            itemView.maskedCorners = UILayer.Corners.none;
            itemView.maskedBorders = UILayer.Sides.minY | UILayer.Sides.maxY;
            itemProps.leftSeparator.hidden = false;
            itemProps.rightSeparator.hidden = false;
        }
        if (item.selectedImage){
            if ((item.selected || item.active)){
                itemProps.image = item.selectedImage;
            }else{
                itemProps.image = item.image;
            }
        }
    },

    viewForItemAtIndex: function(tabView, index){
        return tabView.stylerProperties.itemsView.itemViews[index];
    },

});

var defaultStateBackgroundColors = [
    JSColor.initWithRGBA(250/255,250/255,250/255), // 0 normal
    JSColor.initWithRGBA(250/255,250/255,250/255), // 1 over
    JSColor.initWithRGBA(224/255,224/255,224/255), // 2 active
    JSColor.initWithRGBA(224/255,224/255,224/255), // 3 active + over
    JSColor.initWithRGBA(70/255,153/255,254/255),  // 4 selected
    JSColor.initWithRGBA(70/255,153/255,254/255),  // 5 selected + over
    JSColor.initWithRGBA(63/255,138/255,230/255),  // 6 selected + active
    JSColor.initWithRGBA(63/255,138/255,230/255),  // 7 selected + active + over
];

var defaultStateBorderColors = [
    JSColor.initWithRGBA(204/255,204/255,204/255), // 0 normal
    JSColor.initWithRGBA(204/255,204/255,204/255), // 1 over
    JSColor.initWithRGBA(192/255,192/255,192/255), // 2 active
    JSColor.initWithRGBA(192/255,192/255,192/255), // 3 active + over
    JSColor.initWithRGBA(63/255,138/255,230/255),  // 4 selected
    JSColor.initWithRGBA(63/255,138/255,230/255),  // 5 selected + over
    JSColor.initWithRGBA(54/255,123/255,205/255),  // 6 selected + active
    JSColor.initWithRGBA(54/255,123/255,205/255),  // 7 selected + active + over
];

var defaultStateTitleColors = [
    JSColor.initWithRGBA(51/255,51/255,51/255),    // 0 normal
    JSColor.initWithRGBA(51/255,51/255,51/255),    // 1 over
    JSColor.initWithRGBA(51/255,51/255,51/255),    // 2 active
    JSColor.initWithRGBA(51/255,51/255,51/255),    // 3 active + over
    JSColor.initWithRGBA(255/255,255/255,255/255), // 4 selected
    JSColor.initWithRGBA(255/255,255/255,255/255), // 5 selected + over
    JSColor.initWithRGBA(255/255,255/255,255/255), // 6 selected + active
    JSColor.initWithRGBA(255/255,255/255,255/255), // 7 selected + active + over
];

UITabView.Styler = Object.defineProperties({}, {
    default: {
        configurable: true,
        get: function UITabView_getDefaultStyler(){
            var styler = UITabViewDefaultStyler.init();
            Object.defineProperty(this, 'default', {writable: true, value: styler});
            return styler;
        },
        set: function UITabView_setDefaultStyler(styler){
            Object.defineProperty(this, 'default', {writable: true, value: styler});
        }
    },

    tabless: {
        get: function UITabView_getTablessStyler(){
            var styler = UITabViewTablessStyler.init();
            Object.defineProperty(this, 'tabless', {writable: true, value: styler});
            return styler;
        }
    },

    images: {
        get: function UITabView_getImagesStyler(){
            var styler = UITabViewImagesStyler.init();
            Object.defineProperty(this, 'images', {writable: true, value: styler});
            return styler;
        }
    }
});

JSClass("UITabViewTablessStyler", UITabViewStyler, {

    initializeTabView: function(tabView){
        UITabViewDefaultStyler.$super.initializeTabView.call(this, tabView);
        tabView.stylerProperties.contentView = null;
    },

    showContentViewInTabView: function(contentView, tabView){
        tabView.addSubview(contentView);
        tabView.stylerProperties.contentView = contentView;
    },

    removeContentViewFromTabView: function(contentView, tabView){
        var props = tabView.stylerProperties;
        contentView.removeFromSuperview();
        props.contentView = null;
    },

    layoutTabView: function(tabView){
        if (tabView.stylerProperties.contentView !== null){
            tabView.stylerProperties.contentView.frame = tabView.bounds;
        }
    }

});

JSClass("UITabViewImagesStyler", UITabViewStyler, {

    itemSize: 30,
    imageSize: 15,
    borderColor: null,
    _stateColors: null,

    init: function(){
        UITabViewImagesStyler.$super.init.call(this);
        this._stateColors = JSCopy(defaultStateImageColors);
        this._commonStylerInit();
    },

    initWithSpec: function(spec){
        UITabViewImagesStyler.$super.initWithSpec.call(this, spec);
        this._stateColors = [
            null,
            null,
            null,
            null,
            null,
            null,
            null,
            null
        ];
        if (spec.containsKey('itemSize')){
            this.itemSize = spec.valueForKey("itemSize");
        }
        if (spec.containsKey('imageSize')){
            this.imageSize = spec.valueForKey("imageSize");
        }
        if (spec.containsKey('normalColor')){
            this._stateColors[UITabViewItem.State.normal] = spec.valueForKey("normalColor", JSColor);
        }
        if (spec.containsKey('activeColor')){
            this._stateColors[UITabViewItem.State.active] = spec.valueForKey("activeColor", JSColor);
        }
        if (spec.containsKey('selectedColor')){
            this._stateColors[UITabViewItem.State.selected] = spec.valueForKey("selectedColor", JSColor);
        }
        if (spec.containsKey('selectedActiveColor')){
            this._stateColors[UITabViewItem.State.selected | UITabViewItem.State.active] = spec.valueForKey("selectedActiveColor", JSColor);
        }
        if (spec.containsKey('borderColor')){
            this.borderColor = spec.valueForKey("borderColor", JSColor);
        }
        this._commonStylerInit();
    },

    _commonStylerInit: function(){
        if (this._stateColors[UITabViewItem.State.normal] === null){
            this._stateColors[UITabViewItem.State.normal] = defaultStateImageColors[UITabViewItem.State.normal];
        }
        if (this._stateColors[UITabViewItem.State.over] === null){
            this._stateColors[UITabViewItem.State.over] = this._stateColors[UITabViewItem.State.normal];
        }
        if (this._stateColors[UITabViewItem.State.active] === null){
            this._stateColors[UITabViewItem.State.active] = this._stateColors[UITabViewItem.State.normal].colorDarkenedByPercentage(0.2);
        }
        if (this._stateColors[UITabViewItem.State.active | UITabViewItem.State.over] === null){
            this._stateColors[UITabViewItem.State.active | UITabViewItem.State.over] = this._stateColors[UITabViewItem.State.active];
        }
        if (this._stateColors[UITabViewItem.State.selected] === null){
            this._stateColors[UITabViewItem.State.selected] = defaultStateImageColors[UITabViewItem.State.selected];
        }
        if (this._stateColors[UITabViewItem.State.selected | UITabViewItem.State.over] === null){
            this._stateColors[UITabViewItem.State.selected | UITabViewItem.State.over] = this._stateColors[UITabViewItem.State.selected];
        }
        if (this._stateColors[UITabViewItem.State.selected | UITabViewItem.State.active] === null){
            this._stateColors[UITabViewItem.State.selected | UITabViewItem.State.active] = this._stateColors[UITabViewItem.State.selected].colorDarkenedByPercentage(0.2);
        }
        if (this._stateColors[UITabViewItem.State.selected | UITabViewItem.State.over | UITabViewItem.State.active] === null){
            this._stateColors[UITabViewItem.State.selected | UITabViewItem.State.over | UITabViewItem.State.active] = this._stateColors[UITabViewItem.State.selected | UITabViewItem.State.active];
        }
    },

    setColorForState: function(color, state){
        this._stateColors[state] = color;
    },

    initializeTabView: function(tabView){
        UITabViewDefaultStyler.$super.initializeTabView.call(this, tabView);
        if (this.borderColor === null){
            var backgroundColor = tabView.backgroundColor || JSColor.white;
            this.borderColor = backgroundColor.colorDarkenedByPercentage(0.2);
        }
        var props = tabView.stylerProperties;
        props.contentViewContainer = UITabViewContentContainer.init();
        props.contentViewContainer.borderColor = this.borderColor;
        props.contentViewContainer.borderWidth = 1;
        props.contentViewContainer.maskedBorders = UILayer.Sides.minY;
        tabView.addSubview(props.contentViewContainer);
        props.itemsView = UITabViewItemsView.init();
        props.itemsView.tabView = tabView;
        tabView.addSubview(props.itemsView);
    },

    showContentViewInTabView: function(contentView, tabView){
        tabView.stylerProperties.contentViewContainer.addSubview(contentView);
    },

    layoutTabView: function(tabView){
        var props = tabView.stylerProperties;
        var size = tabView.bounds.size;
        var itemView;
        var itemBounds = JSRect(0, 0, this.itemSize, this.itemSize);
        var imageFrame = itemBounds.rectWithInsets((this.itemSize - this.imageSize) / 2);
        for (var i = 0, l = props.itemsView.itemViews.length; i < l; ++i){
            itemView = props.itemsView.itemViews[i];
            itemView.bounds = itemBounds;
            itemView.stylerProperties.imageView.frame = imageFrame;
        }
        props.itemsView.sizeToFit();
        props.itemsView.position = JSPoint(size.width / 2.0, props.itemsView.frame.size.height / 2.0);
        var y = props.itemsView.frame.size.height;
        props.contentViewContainer.frame = JSRect(0, y, size.width, size.height - y);
    },

    updateTabView: function(tabView){
        var props = tabView.stylerProperties;
        props.itemsView.update();
        var itemView;
        var item;
        var itemProps;
        for (var i = 0, l = tabView.items.length; i < l; ++i){
            item = tabView.items[i];
            itemView = props.itemsView.itemViews[i];
            itemProps = itemView.stylerProperties;
            if (!itemProps.initialized){
                itemProps.initialized = true;
                itemProps.imageView = UIImageView.init();
                itemProps.imageView.automaticRenderMode = JSImage.RenderMode.template;
                itemView.addSubview(itemProps.imageView);
            }
            itemProps.imageView.image = item.image;
            this.updateTabViewItemAtIndex(tabView, i);
        }
        tabView.setNeedsLayout();
    },

    updateTabViewItemAtIndex: function(tabView, itemIndex){
        var item = tabView.items[itemIndex];
        var itemView = tabView.stylerProperties.itemsView.itemViews[itemIndex];
        var itemProps = itemView.stylerProperties;
        itemProps.imageView.templateColor = this._stateColors[item.state];
    },

    viewForItemAtIndex: function(tabView, index){
        return tabView.stylerProperties.itemsView.itemViews[index];
    },

});

var defaultStateImageColors = [
    JSColor.initWithRGBA(0,0,0,0.2), // 0 normal
    JSColor.initWithRGBA(0,0,0,0.2), // 1 over
    JSColor.initWithRGBA(0,0,0,0.5), // 2 active
    JSColor.initWithRGBA(0,0,0,0.5), // 3 active + over
    JSColor.initWithRGBA(70/255,153/255,254/255),  // 4 selected
    JSColor.initWithRGBA(70/255,153/255,254/255),  // 5 selected + over
    JSColor.initWithRGBA(54/255,123/255,205/255),  // 6 selected + active
    JSColor.initWithRGBA(54/255,123/255,205/255),  // 7 selected + active + over
];

})();