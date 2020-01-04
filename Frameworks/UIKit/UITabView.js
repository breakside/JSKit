// #import "UIView.js"
// #import "UILabel.js"
/* global JSClass, JSObject, JSFont, JSCopy, JSProtocol, JSSize, JSRect, JSInsets, JSColor, JSImage, JSPoint, JSReadOnlyProperty, JSDynamicProperty, UIView, UITabView, UILabel, JSLazyInitProperty, UILayer, UITabViewItemsView, UITabViewItemView, UITabViewStyler, UITabViewItem, UIImageView, UITabViewDefaultStyler, UITabViewContentContainer, UITabViewImagesStyler, UITabViewTablessStyler */
'use strict';

(function(){

JSProtocol("UITabViewDelegate", JSProtocol, {

    tabViewWillSelectItemAtIndex: function(tabView, index){},
    tabViewDidSelectItemAtIndex: function(tabView, index){}

});

JSClass("UITabView", UIView, {

    items: JSDynamicProperty('_items', null),
    selectedIndex: JSDynamicProperty('_selectedIndex', 0),
    selectedItem: JSDynamicProperty(),
    styler: JSReadOnlyProperty('_styler', null),
    stylerProperties: null,
    delegate: null,
    font: null,
    _itemsView: null,
    _contentViewContainer: null,

    initWithFrame: function(frame){
        UITabView.$super.initWithFrame.call(this, frame);
        this._commonTabViewInit();
    },

    initWithSpec: function(spec, values){
        UITabView.$super.initWithSpec.call(this, spec, values);
        if ('styler' in values){
            this._styler = spec.resolvedValue(values.styler);
        }else{
            this._styler = UITabView.Styler.default;
        }
        this._commonTabViewInit();
        if ('delegate' in values){
            this.delegate = spec.resolvedValue(values.delegate);
        }
        if ('items' in values){
            var items = [];
            for (var i = 0, l = values.items.length; i < l; ++i){
                items.push(spec.resolvedValue(values.items[i]));
            }
            this.items = items;
        }
        if ("font" in values){
            this.font = JSFont.initWithSpec(spec, values.font);
        }
    },

    _commonTabViewInit: function(){
        this._items = [];
        this.stylerProperties = {};
        this.font = JSFont.systemFontOfSize(JSFont.Size.normal);
        this._itemsView = UITabViewItemsView.init();
        this._itemsView.tabView = this;
        this._contentViewContainer = UITabViewContentContainer.init();
        this.addSubview(this._itemsView);
        this.addSubview(this._contentViewContainer);
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
            this._contentViewContainer.addSubview(item.view);
            if (this.delegate && this.delegate.tabViewDidSelectItemAtIndex){
                this.delegate.tabViewDidSelectItemAtIndex(this, index);
            }
        }else if (index <= this._selectedIndex){
            this._selectedIndex += 1;
        }
        this._items.splice(index, 0, item);
        this._itemsView.insertItemViewAtIndex(index);
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
                    this.delegate.tabViewWillSelectItemAtIndex(this, 0);
                }
            }
        }
        var item = this._items[index];
        this._items.splice(index, 1);
        this._itemsView.removeItemAtIndex(index);
        if (isRemovingOnlyItem){
            item.selected = false;
            item.view.removeFromSuperview();
            if (this.delegate && this.delegate.tabViewDidSelectItemAtIndex){
                this.delegate.tabViewDidSelectItemAtIndex(this, 0);
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
            item.view.removeFromSuperview();
        }
        this._selectedIndex = selectedIndex;
        item = this.selectedItem;
        if (item !== null){
            item.selected = true;
            this._contentViewContainer.addSubview(item.view);
        }
        this._itemsView.selectedItemDidChange();
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
        if (this._selectedIndex < this._items.length){
            return this._items[this._selectedIndex];
        }
        return null;
    },

    setItems: function(items){
        if (this._selectedIndex !== 0){
            this.selectedIndex = 0;
        }
        var i, l;
        for (i = this._items.length - 1; i >= 0; --i){
            this.removeItemAtIndex(i);
        }
        for (i = 0, l = items.length; i < l; ++i){
            this.addItem(items[i]);
        }
    },

    layoutSubviews: function(){
        UITabView.$super.layoutSubviews.call(this);
        this.styler.layoutTabView(this);
    }

});

JSClass("UITabViewItem", JSObject, {

    title: JSDynamicProperty("_title", null),
    image: JSDynamicProperty("_image", null),
    selectedImage: JSDynamicProperty("_selectedImage", null),
    state: JSReadOnlyProperty("_state", 0),
    view: JSDynamicProperty("_view", null),
    active: JSDynamicProperty(),
    selected: JSDynamicProperty(),
    over: JSDynamicProperty(),

    initWithSpec: function(spec, values){
        if ('title' in values){
            this.title = spec.resolvedValue(values.title);
        }
        if ('image' in values){
            this.image = spec.resolvedValue(values.image, "JSImage");
        }
        if ('selectedImage' in values){
            this.selectedImage = spec.resolvedValue(values.selectedImage, "JSImage");
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

});

UITabViewItem.State = {
    normal:         0,
    over:           1 << 0,
    active:         1 << 1,
    selected:       1 << 2
};

JSClass("UITabViewItemView", UIView, {

    itemsView: null,
    index: 0,
    titleLabel: JSLazyInitProperty('_createTitleLabel', '_titleLabel'),
    imageView: JSLazyInitProperty('_createImageView', '_imageView'),
    item: null,
    stylerProperties:  null,

    initWithFrame: function(frame){
        UITabViewItemView.$super.initWithFrame.call(this, frame);
        this.stylerProperties = {};
    },

    _createTitleLabel: function(){
        var label = UILabel.init();
        this.addSubview(label);
        return label;
    },

    _createImageView: function(){
        var imageView = UIImageView.init();
        this.addSubview(imageView);
        return imageView;
    },

    setItem: function(item){
        this.item = item;
        this.update();
    },

    update: function(){
        if (this.item.title){
            this.titleLabel.font = this.itemsView.tabView.font;
            this.titleLabel.text = this.item.title;
            this._titleLabel.hidden = false;
        }else if (this._titleLabel !== null){
            this._titleLabel.hidden = true;
        }
        if (this.item.image){
            if (this.item.selectedImage && (this.item.selected || this.item.active)){
                this.imageView.image = this.item.selectedImage;
            }else{
                this.imageView.image = this.item.image;
            }
            this.imageView.hidden = false;
        }else if (this._imageView !== null){
            this._imageView.hidden = true;
        }
        this.itemsView.tabView.styler.updateItemView(this);
        this.setNeedsLayout();
    },

    sizeToFit: function(){
        this.itemsView.tabView.styler.sizeItemViewToFit(this);
    },

    layoutSubviews: function(){
        this.itemsView.tabView.styler.layoutItemView(this);
    },

    isFirst: function(){
        return this.index === 0;
    },

    isLast: function(){
        return this.index === this.itemsView.tabView._items.length - 1;
    }

});

JSClass("UITabViewItemsView", UIView, {

    tabView: null,
    itemViews: null,
    _selectedItemView: null,
    _activeItemView: null,

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
        this._activeItemView = null;
        this._selectedItemView = null;
        var item;
        for (var i = 0, l = this.tabView.items.length; i < l; ++i){
            item = this.tabView.items[i];
            if (i < this.itemViews.length){
                this.itemViews[i].setItem(item);
            }else{
                this.insertItemViewAtIndex(i);
            }
            if (item.selected){
                this._selectedItemView = this.itemViews[i];
            }
        }
        for (var j = this.itemViews.length - 1; j >= i; --i){
            this.removeItemViewAtIndex(j);
        }
        this.tabView.setNeedsLayout();
        this.setNeedsLayout();
    },

    insertItemViewAtIndex: function(index){
        var itemView = UITabViewItemView.init();
        this.tabView.styler.initializeItemView(itemView);
        itemView.itemsView = this;
        itemView.index = index;
        this.addSubview(itemView);
        this.itemViews.splice(index, 0, itemView);
        itemView.setItem(this.tabView.items[index]);
        for (var i = index + 1, l = this.itemViews.length; i < l; ++i){
            this.itemViews[i].index = i;
        }
        this.update();
    },

    removeItemViewAtIndex: function(index){
        var itemView = this.itemViews[index];
        itemView.itemsView = null;
        itemView.removeFromSuperview();
        this.itemViews.splice(index, 1);
        for (var i = index, l = this.itemViews.length; i < l; ++i){
            this.itemViews[i].index = i;
        }
        this.update();
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

    activateItemView: function(itemView){
        if (this._activeItemView){
            this._activeItemView.item.active = false;
            this._activeItemView.update();
        }
        this._activeItemView = itemView;
        if (this._activeItemView){
            this._activeItemView.item.active = true;
            this._activeItemView.update();
        }
    },

    selectItemView: function(itemView){
        this.tabView.selectedIndex = itemView.index;
    },

    selectedItemDidChange: function(){
        var itemView = this.itemViews[this.tabView.selectedIndex];
        if (this._selectedItemView){
            this._selectedItemView.item.selected = false;
            this._selectedItemView.update();
        }
        this._selectedItemView = itemView;
        if (this._selectedItemView){
            this._selectedItemView.item.selected = true;
            this._selectedItemView.update();
        }
    },

    sizeToFit: function(){
        this.tabView.styler.sizeItemsViewToFit(this);
    },

    layoutSubviews: function(){
        this.tabView.styler.layoutItemsView(this);
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

    initializeTabView: function(tabView){
    },

    initializeItemView: function(itemView){
    },

    layoutTabView: function(tabView){
        var size = tabView.bounds.size;
        tabView._itemsView.sizeToFit();
        tabView._itemsView.position = JSPoint(size.width / 2.0, tabView._itemsView.frame.size.height / 2.0);
        var y = tabView._itemsView.frame.size.height;
        tabView._contentViewContainer.frame = JSRect(0, y, size.width, size.height - y);
    },

    sizeItemsViewToFit: function(itemsView){
        var itemView;
        var size = JSSize.Zero;
        for (var i = 0, l = itemsView.itemViews.length; i < l; ++i){
            itemView = itemsView.itemViews[i];
            itemView.sizeToFit();
            size.width += itemView.frame.size.width;
            if (itemView.frame.size.height > size.height){
                size.height = itemView.frame.size.height;
            }
        }
        itemsView.bounds = JSRect(JSPoint.Zero, size);
    },

    layoutItemsView: function(itemsView){
        var itemView;
        var x = 0;
        for (var i = 0, l = itemsView.itemViews.length; i < l; ++i){
            itemView = itemsView.itemViews[i];
            itemView.frame = JSRect(JSPoint(x, 0), itemView.frame.size);
            x += itemView.frame.size.width;
        }
    },

    sizeItemViewToFit: function(itemView){
    },

    layoutItemView: function(itemView){
    },

    updateItemView: function(itemView){
    },

});

JSClass("UITabViewDefaultStyler", UITabViewStyler, {

    cornerRadius: 3,
    itemPadding: null,
    itemsPadding: null,
    imageSpacing: 3,

    init: function(){
        this.itemPadding = JSInsets(3, 10);
        this.itemsPadding = JSInsets(4);
    },

    initializeTabView: function(tabView){
        tabView._itemsView.shadowColor = JSColor.initWithRGBA(0, 0, 0, 0.1);
        tabView._itemsView.shadowOffset = JSPoint(0, 1);
        tabView._itemsView.shadowRadius = 1;
        tabView._itemsView.cornerRadius = this.cornerRadius;
        tabView.stylerProperties.divider = UIView.init();
        tabView.stylerProperties.divider.backgroundColor = defaultStateBorderColors[0];
        tabView.insertSubviewBelowSibling(tabView.stylerProperties.divider, tabView._itemsView);
    },

    layoutTabView: function(tabView){
        var size = tabView.bounds.size;
        tabView._itemsView.sizeToFit();
        var y = this.itemsPadding.top;
        tabView._itemsView.position = JSPoint(size.width / 2.0, y + tabView._itemsView.frame.size.height / 2.0);
        tabView.stylerProperties.divider.frame = JSRect(0, tabView._itemsView.position.y, tabView.bounds.size.width, 1);
        y += tabView._itemsView.frame.size.height + this.itemsPadding.bottom;
        tabView._contentViewContainer.frame = JSRect(0, y, size.width, size.height - y);
    },

    initializeItemView: function(itemView){
        itemView.borderWidth = 1.0;
        itemView.cornerRadius = this.cornerRadius;
        itemView.stylerProperties.rightSeparator = UILayer.init();
        itemView.stylerProperties.rightSeparator.backgroundColor = JSColor.initWithRGBA(0, 0, 0, 0.2);
        itemView.stylerProperties.leftSeparator = UILayer.init();
        itemView.stylerProperties.leftSeparator.backgroundColor = JSColor.initWithRGBA(0, 0, 0, 0.2);
        itemView.layer.addSublayer(itemView.stylerProperties.leftSeparator);
        itemView.layer.addSublayer(itemView.stylerProperties.rightSeparator);
    },

    sizeItemViewToFit: function(itemView){
        var font = itemView.itemsView.tabView.font;
        var imageSize = font.displayAscender;
        var size = JSSize(this.itemPadding.left + this.itemPadding.right, this.itemPadding.top + font.displayLineHeight + this.itemPadding.bottom);
        if (itemView._titleLabel !== null && !itemView._titleLabel.hidden){
            itemView._titleLabel.sizeToFit();
            size.width += Math.ceil(itemView._titleLabel.frame.size.width);
        }
        if (itemView._imageView !== null && !itemView._imageView.hidden){
            itemView._imageView.frame = JSRect(itemView._imageView.frame.origin, JSSize(imageSize, imageSize));
            size.width += imageSize;
            if (itemView._titleLabel !== null && !itemView._titleLabel.hidden){
                 size.width += this.imageSpacing;
            }
        }
        itemView.bounds = JSRect(JSPoint.Zero, size);
    },

    layoutItemView: function(itemView){
        var center = itemView.bounds.center;
        var imageSize = 0;
        if (itemView._imageView !== null && !itemView._imageView.hidden){
            imageSize = itemView._imageView.frame.size.width;
            itemView._imageView.position = JSPoint(this.itemPadding.left + imageSize / 2, center.y);
        }
        if (itemView._titleLabel !== null && !itemView._titleLabel.hidden){
            itemView._titleLabel.position = JSPoint(center.x + imageSize / 2 + this.imageSpacing, center.y);
        }
        itemView.stylerProperties.leftSeparator.frame = JSRect(0, 0, 0.5, itemView.bounds.size.height);
        itemView.stylerProperties.rightSeparator.frame = JSRect(itemView.bounds.size.width - 0.5, 0, 0.5, itemView.bounds.size.height);
    },

    updateItemView: function(itemView){
        var item = itemView.item;
        itemView.backgroundColor = defaultStateBackgroundColors[item.state];
        itemView.borderColor = defaultStateBorderColors[item.state];
        if (itemView._titleLabel !== null){
            itemView._titleLabel.textColor = defaultStateTitleColors[item.state];
        }
        if (itemView._imageView !== null){
            itemView._imageView.templateColor = defaultStateTitleColors[item.state];
        }
        if (itemView.isFirst()){
            itemView.maskedCorners = UILayer.Corners.minX;
            itemView.maskedBorders = UILayer.Sides.minY | UILayer.Sides.maxY | UILayer.Sides.minX;
            itemView.stylerProperties.leftSeparator.hidden = true;
            itemView.stylerProperties.rightSeparator.hidden = false;
        }else if (itemView.isLast()){
            itemView.maskedCorners = UILayer.Corners.maxX;
            itemView.maskedBorders = UILayer.Sides.minY | UILayer.Sides.maxY | UILayer.Sides.maxX;
            itemView.stylerProperties.leftSeparator.hidden = false;
            itemView.stylerProperties.rightSeparator.hidden = true;
        }else{
            itemView.maskedCorners = UILayer.Corners.none;
            itemView.maskedBorders = UILayer.Sides.minY | UILayer.Sides.maxY;
            itemView.stylerProperties.leftSeparator.hidden = false;
            itemView.stylerProperties.rightSeparator.hidden = false;
        }
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
    }
});

JSClass("UITabViewTablessStyler", UITabViewStyler, {

    initializeTabView: function(tabView){
        tabView._itemsView.hidden = true;
    },

    layoutTabView: function(tabView){
        tabView._contentViewContainer.frame = tabView.bounds;
    }

});

JSClass("UITabViewImagesStyler", UITabViewStyler, {

    itemSize: 30,
    imageSize: 15,
    borderColor: null,
    _stateColors: null,

    init: function(){
        this._stateColors = JSCopy(defaultStateImageColors);
        this._commonStylerInit();
    },

    initWithSpec: function(spec, values){
        UITabViewImagesStyler.$super.initWithSpec.call(this, spec, values);
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
        if ('itemSize' in values){
            this.itemSize = spec.resolvedValue(values.itemSize);
        }
        if ('imageSize' in values){
            this.imageSize = spec.resolvedValue(values.imageSize);
        }
        if ('normalColor' in values){
            this._stateColors[UITabViewItem.State.normal] = spec.resolvedValue(values.normalColor, "JSColor");
        }
        if ('activeColor' in values){
            this._stateColors[UITabViewItem.State.active] = spec.resolvedValue(values.activeColor, "JSColor");
        }
        if ('selectedColor' in values){
            this._stateColors[UITabViewItem.State.selected] = spec.resolvedValue(values.selectedColor, "JSColor");
        }
        if ('selectedActiveColor' in values){
            this._stateColors[UITabViewItem.State.selected | UITabViewItem.State.active] = spec.resolvedValue(values.selectedActiveColor, "JSColor");
        }
        if ('borderColor' in values){
            this.borderColor = spec.resolvedValue(values.borderColor, "JSColor");
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
        if (this.borderColor === null){
            var backgroundColor = tabView.backgroundColor || JSColor.whiteColor;
            this.borderColor = backgroundColor.colorDarkenedByPercentage(0.2);
        }
        tabView._contentViewContainer.borderColor = this.borderColor;
        tabView._contentViewContainer.borderWidth = 1;
        tabView._contentViewContainer.maskedBorders = UILayer.Sides.minY;
    },

    initializeItemView: function(itemView){
    },

    sizeItemViewToFit: function(itemView){
        itemView.bounds = JSRect(0, 0, this.itemSize, this.itemSize);
    },

    layoutItemView: function(itemView){
        var offset = (this.itemSize - this.imageSize) / 2;
        itemView.imageView.frame = JSRect(offset, offset, this.imageSize, this.imageSize);
        if (itemView._titleLabel !== null){
            itemView._titleLabel.hidden = true;
        }
    },

    updateItemView: function(itemView){
        var item = itemView.item;
        itemView.imageView.templateColor = this._stateColors[item.state];
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