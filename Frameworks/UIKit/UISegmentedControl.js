// #import "UIKit/UIControl.js"
// #import "UIKit/UILabel.js"
// #import "UIKit/UIImageView.js"
/* global JSClass, JSObject, JSImage, JSFont, JSColor, JSInsets, JSPoint, JSSize, JSRect, JSLazyInitProperty, JSReadOnlyProperty, JSDynamicProperty, UILayer, UIView, UIControl, UILabel, UIImageView, UIControlStyler, UISegmentedControl, UISegmentedControlStyler, UISegmentedControlDefaultStyler, UISegmentedControlCustomStyler, UISegmentedControlItemView, UISegmentedControlItem */
'use strict';

JSClass("UISegmentedControl", UIControl, {

    // --------------------------------------------------------------------
    // MARK: - Creating a segment control

    initWithSpec: function(spec, values){
        if ('font' in values){
            this._font = spec.resolvedValue(values.font, "JSFont");   
        }
        if ('titleInsets' in values){
            this._titleInsets  = JSInsets.apply(undefined, values.titleInsets.parseNumberArray());
        }
        UISegmentedControl.$super.initWithSpec.call(this, spec, values);
        var i, l;
        if ('items' in values){
            var specItem;
            var item;
            var image;
            for (i = 0, l = values.items.length; i < l; ++i){
                specItem = spec.resolvedValue(values.items[i]);
                item = UISegmentedControlItem.init();
                if (specItem.title){
                    item.title = spec.resolvedValue(specItem.title);
                }
                if (specItem.image){
                    item.image = JSImage.initWithResouceName(specItem.image, spec.bundle);
                }
                if (specItem.selectedImage){
                    item.selectedImage = JSImage.initWithResouceName(specItem.selectedImage, spec.bundle);
                }
                if (specItem.tooltip){
                    item.tooltip = spec.resolvedValue(specItem.tooltip);
                }
                this._insertItemAtIndex(item, i);
            }
        }
    },

    commonUIControlInit: function(){
        UISegmentedControl.$super.commonUIControlInit.call(this);
        this._items = [];
        this._itemViews = [];
        if (this._font === null){
            this._font = JSFont.systemFontOfSize(JSFont.Size.normal).fontWithWeight(JSFont.Weight.regular);
        }
        if (this._titleInsets === null){
            this._titleInsets = JSInsets.Zero;
        }
        if (this._styler === null){
            this._styler = UISegmentedControl.Styler.default;
        }
        this._styler.initializeControl(this);
    },

    // --------------------------------------------------------------------
    // MARK: - Styling

    font: JSDynamicProperty('_font', null),

    setFont: function(font){
        if (font === this._font){
            return;
        }
        this._font = font;
        this.setNeedsLayout();
        this._updateItemViews();
    },

    titleInsets: JSDynamicProperty('_titleInsets', null),

    setTitleInsets: function(titleInsets){
        this._titleInsets = JSInsets(titleInsets);
        this.setNeedsLayout();
        this._updateItemViews();
    },

    // --------------------------------------------------------------------
    // MARK: - Managing Segments

    _items: null,
    _itemViews: null,
    _selectedItemView: null,
    _activeItemView: null,

    insertTextSegmentAtIndex: function(title, index){
        var item = UISegmentedControlItem.init();
        item.title = title;
        this._insertItemAtIndex(item, index);
    },

    insertImageSegmentAtIndex: function(image, index){
        var item = UISegmentedControlItem.init();
        item.image = image;
        this._insertItemAtIndex(item, index);
    },

    setSegmentTooltipAtIndex: function(tooltip, index){
        this._items[index].tooltip = tooltip;
        this._itemViews[index].update();
    },

    setSegmentEnabledAtIndex: function(enabled, index){
        this._items[index].enabled = enabled;
        this._itemViews[index].update();
    },

    setSegmentTagAtIndex: function(tag, index){
        this._items[index].tag = tag;
    },

    _insertItemAtIndex: function(item, index){
        this._items.splice(index, 0, item);
        this._insertItemViewAtIndex(index);
    },

    removeSegmentAtIndex: function(index){
        if (index === this._selectedSegmentIndex){
            this.selectedSegmentIndex = null;
        }
        var item = this._items[index];
        this._items.splice(index, 1);
        this._removeItemViewAtIndex(index);
    },

    removeAllSegments: function(){
        for (var i = this._items.length - 1; i >= 0; --i){
            this.removeSegmentAtIndex(i);
        }
    },

    _insertItemViewAtIndex: function(index){
        var itemView = UISegmentedControlItemView.init();
        this._styler.initializeItemView(itemView);
        itemView.segmentControl = this;
        itemView.index = index;
        this.addSubview(itemView);
        this._itemViews.splice(index, 0, itemView);
        itemView.setItem(this._items[index]);
        for (var i = index + 1, l = this._itemViews.length; i < l; ++i){
            this._itemViews[i].index = i;
        }
        this.setNeedsLayout();
        this._updateItemViews();
    },

    _removeItemViewAtIndex: function(index){
        var itemView = this._itemViews[index];
        itemView.segmentControl = null;
        itemView.removeFromSuperview();
        this._itemViews.splice(index, 1);
        for (var i = index, l = this._itemViews.length; i < l; ++i){
            this._itemViews[i].index = i;
        }
        this.setNeedsLayout();
        this._updateItemViews();
    },

    _updateItemViews: function(){
        for (var i = 0, l = this._itemViews.length; i < l; ++i){
            this._itemViews[i].update();
        }
    },

    // --------------------------------------------------------------------
    // MARK: - Selecting

    selectedSegmentIndex: JSDynamicProperty('_selectedSegmentIndex', null),
    selectedSegmentTag: JSDynamicProperty(),

    setSelectedSegmentIndex: function(segmentIndex){
        this._selectedSegmentIndex = segmentIndex;
        var itemView = segmentIndex !== null ? this._itemViews[segmentIndex] : null;
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

    getSelectedSegmentTag: function(){
        if (this._selectedSegmentIndex === null){
            return null;
        }
        return this._items[this._selectedSegmentIndex].tag;
    },

    setSelectedSegmentTag: function(tag){
        var item;
        for (var i = 0, l = this._items.lengh; i < l; ++i){
            item = this._items[i];
            if (item.tag === tag){
                this.selectedSegmentIndex = i;
                return;
            }
        }
        this.selectedSegmentIndex = null;
    },

    _activateSegmentAtIndex: function(segmentIndex){
        var itemView = segmentIndex !== null ? this._itemViews[segmentIndex] : null;
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

    _selectItemViewAtIndex: function(segmentIndex){
        if (segmentIndex === this._selectedSegmentIndex){
            return;
        }
        this.selectedSegmentIndex = segmentIndex;
        this.sendActionsForEvent(UIControl.Event.primaryAction);
        this.sendActionsForEvent(UIControl.Event.valueChanged);
    },

    // --------------------------------------------------------------------
    // MARK: - Events

    mouseDown: function(event){
        var location = event.locationInView(this);
        var segmentIndex = this._enabledSegmentIndexAtLocation(location);
        this._activateSegmentAtIndex(segmentIndex);
    },

    mouseDragged: function(event){
        var location = event.locationInView(this);
        var segmentIndex = this._enabledSegmentIndexAtLocation(location);
        this._activateSegmentAtIndex(segmentIndex);
    },

    mouseUp: function(event){
        this._activateSegmentAtIndex(null);
        var location = event.locationInView(this);
        var segmentIndex = this._enabledSegmentIndexAtLocation(location);
        if (segmentIndex !== null){
            this._selectItemViewAtIndex(segmentIndex);
        }
    },

    _enabledSegmentIndexAtLocation: function(location){
        var itemView;
        var item;
        for (var i = 0, l = this._itemViews.length; i < l; ++i){
            itemView = this._itemViews[i];
            item = this._items[i];
            if (item.enabled && itemView.hitTest(this.convertPointToView(location, itemView))){
                return i;
            }
        }
        return null;
    },

});

JSClass("UISegmentedControlItem", JSObject, {
    title: null,
    image: null,
    selectedImage: null,
    tooltip: null,
    active: false,
    selected: false,
    enabled: true
});

JSClass("UISegmentedControlItemView", UIView, {

    segmentControl: null,
    index: 0,
    titleLabel: JSLazyInitProperty('_createTitleLabel', '_titleLabel'),
    imageView: JSLazyInitProperty('_createImageView', '_imageView'),
    item: null,
    stylerProperties:  null,

    initWithFrame: function(frame){
        UISegmentedControlItemView.$super.initWithFrame.call(this, frame);
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
            this.titleLabel.font = this.segmentControl.font;
            this.titleLabel.text = this.item.title;
            this._titleLabel.hidden = false;
        }else if (this._titleLabel !== null){
            this._titleLabel.hidden = true;
            this._titleLabel.text = "";
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
        this.tooltip = this.item.tooltip;
        this.segmentControl._styler.updateItemView(this);
        this.setNeedsLayout();
    },

    sizeToFit: function(){
        this.segmentControl._styler.sizeItemViewToFit(this);
    },

    layoutSubviews: function(){
        this.segmentControl._styler.layoutItemView(this);
    },

    getIntrinsicSize: function(){
        return this.segmentControl._styler.intrinsicSizeOfItemView(this);
    },

    isFirst: function(){
        return this.index === 0;
    },

    isLast: function(){
        return this.index === this.segmentControl._items.length - 1;
    }

});

UISegmentedControl.Styler = Object.create({}, {

    default: {
        configurable: true,
        get: function UISegmentedControl_getDefaultStyler(){
            var styler = UISegmentedControlDefaultStyler.init();
            Object.defineProperty(this, 'default', {writable: true, value: styler});
            return styler;
        },
        set: function UISegmentedControl_setDefaultStyler(styler){
            Object.defineProperty(this, 'default', {writable: true, value: styler});
        }
    }

});

JSClass("UISegmentedControlStyler", UIControlStyler, {

    titleInsets: null,

    init: function(){
    },

    initWithSpec: function(spec, values){
        UISegmentedControlStyler.$super.initWithSpec.call(this, spec, values);
        if ('titleInsets' in values){
            this.titleInsets  = JSInsets.apply(undefined, values.titleInsets.parseNumberArray());
        }
    },

    initializeControl: function(control){
        if (this.titleInsets !== null){
            control.titleInsets = this.titleInsets;
        }
    },

    sizeItemViewToFit: function(itemView){
    },

    layoutItemView: function(itemView){
    },

    updateItemView: function(itemView){
    },

});

JSClass("UISegmentedControlDefaultStyler", UISegmentedControlStyler, {

    normalBackgroundColor: null,
    disabledBackgroundColor: null,
    activeBackgroundColor: null,
    selectedBackgroundColor: null,
    selectedActiveBackgroundColor: null,
    normalBackgroundGradient: null,
    disabledBackgroundGradient: null,
    activeBackgroundGradient: null,
    selectedBackgroundGradient: null,
    selectedActiveBackgroundGradient: null,
    normalBorderColor: null,
    disabledBorderColor: null,
    activeBorderColor: null,
    selectedBorderColor: null,
    selectedActiveBorderColor: null,
    normalTitleColor: null,
    disabledTitleColor: null,
    activeTitleColor: null,
    selectedTitleColor: null,
    selectedActiveTitleColor: null,
    shadowColor: null,
    borderWidth: 1,
    imageSpacing: 2,
    cornerRadius: 3,

    init: function(){
        this.normalBackgroundColor = JSColor.initWithRGBA(250/255,250/255,250/255);
        this.activeBackgroundColor = JSColor.initWithRGBA(224/255,224/255,224/255);
        this.disabledBackgroundColor = JSColor.initWithRGBA(240/255,240/255,240/255);
        this.selectedBackgroundColor = JSColor.initWithRGBA(128/255,128/255,128/255);
        this.selectedActiveBackgroundColor = JSColor.initWithRGBA(102/255,102/255,102/255);
        this.normalBorderColor = JSColor.initWithRGBA(204/255,204/255,204/255);
        this.activeBorderColor = JSColor.initWithRGBA(192/255,192/255,192/255);
        this.disabledBorderColor = JSColor.initWithRGBA(224/255,224/255,224/255);
        this.selectedBorderColor = this.selectedBackgroundColor;
        this.selectedActiveBorderColor = this.selectedActiveBackgroundColor;
        this.normalTitleColor = JSColor.initWithRGBA(51/255,51/255,51/255);
        this.activeTitleColor = JSColor.initWithRGBA(51/255,51/255,51/255);
        this.disabledTitleColor = JSColor.initWithRGBA(152/255,152/255,152/255);
        this.selectedTitleColor = JSColor.initWithRGBA(240/255,240/255,240/255);
        this.selectedActiveTitleColor = this.selectedTitleColor;
        this.shadowColor = JSColor.initWithRGBA(0, 0, 0, 0.1);
        this.titleInsets = JSInsets(3, 7);
    },

    initializeControl: function(control){
        UISegmentedControlDefaultStyler.$super.initializeControl.call(this, control);
        control.cornerRadius = this.cornerRadius;
        control.shadowColor = this.shadowColor;
        control.shadowOffset = JSPoint(0, 1);
        control.shadowRadius = 1;
        this.updateControl(control);
    },

    initializeItemView: function(itemView){
        itemView.borderWidth = this.borderWidth;
        itemView.cornerRadius = this.cornerRadius;
        itemView.stylerProperties.rightSeparator = UILayer.init();
        itemView.stylerProperties.rightSeparator.backgroundColor = JSColor.initWithRGBA(0, 0, 0, 0.2);
        itemView.stylerProperties.leftSeparator = UILayer.init();
        itemView.stylerProperties.leftSeparator.backgroundColor = JSColor.initWithRGBA(0, 0, 0, 0.2);
        itemView.layer.addSublayer(itemView.stylerProperties.leftSeparator);
        itemView.layer.addSublayer(itemView.stylerProperties.rightSeparator);
    },

    updateControl: function(control){
    },

    updateItemView: function(itemView){
        var item = itemView.item;
        var backgroundColor;
        var backgroundGradient;
        var titleColor;
        var borderColor;
        if (item.enabled){
            if (item.active){
                if (item.selected){
                    backgroundColor = this.selectedActiveBackgroundColor;
                    backgroundGradient = this.selectedActiveBackgroundGradient;
                    borderColor = this.selectedActiveBorderColor;
                    titleColor = this.selectedActiveTitleColor;
                }else{
                    backgroundColor = this.activeBackgroundColor;
                    backgroundGradient = this.activeBackgroundGradient;
                    borderColor = this.activeBorderColor;
                    titleColor = this.activeTitleColor;
                }
            }else if (item.selected){
                backgroundColor = this.selectedBackgroundColor;
                backgroundGradient = this.selectedBackgroundGradient;
                borderColor = this.selectedBorderColor;
                titleColor = this.selectedTitleColor;
            }else{
                backgroundColor = this.normalBackgroundColor;
                backgroundGradient = this.normalBackgroundGradient;
                borderColor = this.normalBorderColor;
                titleColor = this.normalTitleColor;
            }
        }else{
            backgroundColor = this.disabledBackgroundColor;
            backgroundGradient = this.disabledBackgroundGradient;
            borderColor = this.disabledBorderColor;
            titleColor = this.disabledTitleColor;
        }
        itemView.backgroundGradient = backgroundGradient;
        itemView.backgroundColor = backgroundColor;
        itemView.borderColor = borderColor;
        if (itemView._titleLabel !== null){
            itemView._titleLabel.textColor = titleColor;
        }
        if (itemView._imageView !== null){
            itemView._imageView.renderMode = UIImageView.RenderMode.template;
            itemView._imageView.templateColor = titleColor;
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

    intrinsicSizeOfControl: function(control){
        var itemView;
        var size = JSSize();
        var itemSize;
        for (var i = 0, l = control._itemViews.length; i < l; ++i){
            itemView = control._itemViews[i];
            itemSize = itemView.intrinsicSize;
            size.width += itemSize.width;
            if (itemSize.height > size.height){
                size.height = itemSize.height;
            }
        }
        return size;
    },

    intrinsicSizeOfItemView: function(itemView){
        var font = itemView.segmentControl.font;
        var imageSize = font.displayAscender;
        var size = JSSize(this.titleInsets.left + itemView.segmentControl.titleInsets.right, itemView.segmentControl.titleInsets.top + font.displayLineHeight + itemView.segmentControl.titleInsets.bottom);
        if (itemView._titleLabel !== null && !itemView._titleLabel.hidden){
            size.width += Math.ceil(itemView._titleLabel.intrinsicSize.width);
        }
        if (itemView._imageView !== null && !itemView._imageView.hidden){
            size.width += imageSize;
            if (itemView._titleLabel !== null && !itemView._titleLabel.hidden){
                 size.width += this.imageSpacing;
            }
        }
        return size;
    },

    layoutControl: function(control){
        var itemView;
        var width = 0;
        var widths = [];
        var itemSize;
        var i, l;
        for (i = 0, l = control._itemViews.length; i < l; ++i){
            itemView = control._itemViews[i];
            itemSize = itemView.intrinsicSize;
            width += itemSize.width;
            widths.push(itemSize.width);
        }
        var availableWidth = control.bounds.size.width;
        var scale = availableWidth / width;
        var x = 0;
        var height = control.bounds.size.height;
        var remainder = 0;
        var widthFloor;
        for (i = 0, l = control._itemViews.length; i < l; ++i){
            itemView = control._itemViews[i];
            width = widths[i] * scale;
            widthFloor = Math.floor(width);
            remainder += width - widthFloor;
            while (remainder >= 1){
                remainder -= 1;
                widthFloor += 1;
            }
            itemView.frame = JSRect(x, 0, widthFloor, height);
            x += widthFloor;
        }
    },

    sizeItemViewToFit: function(itemView){
        var size = this.intrinsicSizeOfItemView(itemView);
        itemView.bounds = JSRect(JSPoint.Zero, size);
    },

    layoutItemView: function(itemView){
        var center = itemView.bounds.center;
        var imageSize = 0;
        if (itemView._imageView !== null && !itemView._imageView.hidden){
            imageSize = itemView._imageView.frame.size.width;
            itemView._imageView.position = JSPoint(itemView.segmentControl.titleInsets.left + imageSize / 2, center.y);
        }
        if (itemView._titleLabel !== null && !itemView._titleLabel.hidden){
            itemView._titleLabel.position = JSPoint(center.x + imageSize / 2 + this.imageSpacing, center.y);
        }
        itemView.stylerProperties.leftSeparator.frame = JSRect(0, 0, 0.5, itemView.bounds.size.height);
        itemView.stylerProperties.rightSeparator.frame = JSRect(itemView.bounds.size.width - 0.5, 0, 0.5, itemView.bounds.size.height);
    }

});