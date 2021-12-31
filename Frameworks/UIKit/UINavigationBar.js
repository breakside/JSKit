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
// #import "UINavigationBarItem.js"
// #import "UIViewPropertyAnimator.js"
// #import "JSColor+UIKit.js"
'use strict';

(function(){

JSClass("UINavigationBar", UIView, {

    styler: JSReadOnlyProperty('_styler', null),
    stylerProperties: null,
    coveredContentTopInset: JSReadOnlyProperty(),

    initWithRootItem: function(item, styler){
        UINavigationBar.$super.init.call(this);
        if (styler === undefined){
            styler = null;
        }
        this._styler = styler;
        this._items = [item];
        item._navigationBar = this;
        this._commonNavigationBarInit();
    },

    initWithSpec: function(spec){
        UINavigationBar.$super.initWithSpec.call(this, spec);
        this._items = [];

        if (spec.containsKey("styler")){
            this._styler = spec.valueForKey("styler", UINavigationBar.Styler);
        }
        this._commonNavigationBarInit();
    },

    _commonNavigationBarInit: function(){
        this.stylerProperties = {};
        if (this._styler === null){
            this._styler = UINavigationBar.Styler.default;
        }
        this._styler.initializeBar(this);
    },

    items: JSDynamicProperty('_items', null),

    topItem: JSReadOnlyProperty(),

    getTopItem: function(){
        return this._items[this._items.length - 1];
    },

    backItem: JSReadOnlyProperty(),

    getBackItem: function(){
        if (this._items.length > 1){
            return this._items[this._items.length - 2];
        }
        return null;
    },

    setItems: function(items){
        var i, l;
        for (i = 0, l = this._items.length; i < l; ++i){
            this._items[i]._navigationBar = null;
        }
        this._items = JSCopy(items);
        this._styler.updateBar(this);
        for (i = 0, l = this._items.length; i < l; ++i){
            this._items[i]._navigationBar = this;
        }
    },

    popAnimator: null,
    pushAnimator: null,

    createPushAnimator: function(){
        return UIViewPropertyAnimator.initWithDuration(UIAnimation.Duration.transition, UIAnimation.Timing.easeInOut);
    },

    createPopAnimator: function(){
        return UIViewPropertyAnimator.initWithDuration(UIAnimation.Duration.transition, UIAnimation.Timing.easeInOut);
    },

    pushItem: function(item, animated){
        if (this.popAnimator !== null || this.pushAnimator !== null){
            return;
        }
        this._items.push(item);
        item._navigationBar = this;
        if (!animated){
            this._styler.updateBar(this);
        }else{
            var bar = this;
            var animator = null;
            var shouldStartAnimator = false;
            if (this._navigationController){
                animator = this._navigationController.pushAnimator;
            }
            if (animator === null){
                animator = this.createPushAnimator();
                shouldStartAnimator = true;
            }
            this._styler.pushItem(this, item, animator);
            animator.addCompletion(function(){
                bar.pushAnimator = null;
            });
            if (shouldStartAnimator){
                animator.start();
            }
        }
    },

    _navigationController: null,

    _popNavigation: function(sender){
        if (this._navigationController){
            this._navigationController.popViewController(true);
        }else{
            this.popItem(true);
        }
    },

    popItem: function(animated){
        this.popToItem(this.backItem);
    },

    popToItem: function(item, animated){
        if (this.popAnimator !== null || this.pushAnimator !== null){
            return;
        }
        if (item === null){
            return;
        }
        var index = this._indexOfItem(item);
        if (index < 0){
            return;
        }
        if (index === this._items.length - 1){
            return;
        }
        var removedItems = this._items.splice(index + 1, this._items.length - index);
        for (var i = 0, l = removedItems.length; i < l; ++i){
            removedItems[i]._navigationBar = null;
        }
        if (!animated){
            this._styler.updateBar(this);
        }else{
            var animator = null;
            var shouldStartAnimator = false;
            if (this._navigationController){
                animator = this._navigationController.popAnimator;
            }
            if (animator === null){
                animator = this.createPopAnimator();
                shouldStartAnimator = true;
            }
            this._styler.popToItem(this, item, animator);
            animator.addCompletion((function(){
                this.popAnimator = null;
            }).bind(this));
            if (shouldStartAnimator){
                animator.start();
            }
        }
    },

    popToRootItem: function(animated){
        this.popToItem(this._items[0], animated);
    },

    _indexOfItem: function(item){
        for (var i = this._items.length - 1; i >= 0; --i){
            if (this._items[i] === item){
                return i;
            }
        }
        return -1;
    },

    coversContent: JSReadOnlyProperty(),

    getCoversContent: function(){
        return this._styler.coversContent;
    },

    getIntrinsicSize: function(){
        return JSSize(UIView.noIntrinsicSize, this._styler.height);
    },

    getCoveredContentTopInset: function(){
        if (this.coversContent){
            return this.intrinsicSize.height;
        }
        return 0;
    },

    layoutSubviews: function(){
        this._styler.layoutBar(this);
    },

    update: function(){
        this._styler.updateBar(this);
    }

});

UINavigationBar.Styler = Object.create({}, {

    default: {
        configurable: true,
        get: function UINavigationBar_getDefaultStyler(){
            var styler = UINavigationBarDefaultStyler.init();
            Object.defineProperty(this, 'default', {writable: true, value: styler});
            return styler;
        },
        set: function(styler){
            Object.defineProperty(this, 'default', {writable: true, value: styler});
        }
    }

});

JSClass("UINavigationBarStyler", JSObject, {

    coversContent: false,
    titleFont: null,
    itemFont: null,
    height: 0,

    init: function(){
        this._fillInStyles();
    },

    initWithSpec: function(spec){
        UINavigationBarStyler.$super.initWithSpec.call(this, spec);
        if (spec.containsKey("coversContent")){
            this.coversContent = spec.valueForKey("coversContent");
        }else{
            this.coversContent = false;
        }
        if (spec.containsKey("titleFont")){
            this.titleFont = spec.valueForKey("titleFont", JSFont);
        }
        if (spec.containsKey("itemFont")){
            this.itemFont = spec.valueForKey("itemFont", JSFont);
        }
        if (spec.containsKey("height")){
            this.height = spec.valueForKey("height");
        }
        this._fillInStyles();
    },

    _fillInStyles: function(){
        if (this.titleFont === null){
            this.titleFont = JSFont.systemFontOfSize(Math.round(JSFont.Size.normal * 1.3)).fontWithWeight(JSFont.Weight.semibold);
        }
        if (this.itemFont === null){
            this.itemFont = JSFont.systemFontOfSize(JSFont.Size.normal);
        }
        if (this.height === 0){
            this.height = this.titleFont.pointSize * 2;
        }
    },

    initializeBar: function(navigationBar){
    },

    updateBar: function(navigationBar){
    },

    pushItem: function(navigationBar, item, animator){
    },

    popToItem: function(navigationBar, item, animator){
    },

    layoutBar: function(navigationBar){
    }

});

JSClass("UINavigationBarDefaultStyler", UINavigationBarStyler, {

    backgroundColor: null,
    backgroundGradient: null,
    contentSeparatorColor: null,
    contentSeparatorSize: 0,
    titleColor: null,
    titleTextAlignment: JSTextAlignment.center,
    itemColor: null,
    activeItemColor: null,
    disabledItemColor: null,
    itemInsets: null,
    itemTitleInsets: null,
    backButtonTitleInsets: null,
    backButtonImage: null,
    backButtonColor: null,
    backButtonActiveColor: null,
    _backButtonStyler: null,
    _buttonStyler: null,

    init: function(){
        UINavigationBarDefaultStyler.$super.init.call(this);
        this.coversContent = true;
        this.backgroundColor = JSColor.background;
        this.contentSeparatorSize = 1;
        this.contentSeparatorColor = JSColor.initWithUIStyles(JSColor.black.colorWithAlpha(0.1), JSColor.white.colorWithAlpha(0.1));
        this.titleColor = JSColor.text;
        this.itemColor = JSColor.highlight;
        this.itemInsets = JSInsets.Zero;
        this._fillInDefaultStyles();
    },

    initWithSpec: function(spec){
        UINavigationBarDefaultStyler.$super.initWithSpec.call(this, spec);
        if (spec.containsKey("backgroundColor")){
            this.backgroundColor = spec.valueForKey("backgroundColor", JSColor);
        }
        if (spec.containsKey("backgroundGradient")){
            this.backgroundGradient = spec.valueForKey("backgroundGradient", JSGradient);
        }
        if (spec.containsKey("contentSeparatorColor")){
            this.contentSeparatorColor = spec.valueForKey("contentSeparatorColor", JSColor);
        }
        if (spec.containsKey("contentSeparatorSize")){
            this.contentSeparatorSize = spec.valueForKey("contentSeparatorSize");
        }
        if (spec.containsKey("titleColor")){
            this.titleColor = spec.valueForKey("titleColor", JSColor);
        }
        if (spec.containsKey("titleTextAlignment")){
            this.titleTextAlignment = spec.valueForKey("titleTextAlignment", JSTextAlignment);
        }
        if (spec.containsKey("itemColor")){
            this.itemColor = spec.valueForKey("itemColor", JSColor);
        }
        if (spec.containsKey("activeItemColor")){
            this.activeItemColor = spec.valueForKey("activeItemColor", JSColor);
        }
        if (spec.containsKey("disabledItemColor")){
            this.disabledItemColor = spec.valueForKey("disabledItemColor", JSColor);
        }
        if (spec.containsKey("backButtonColor")){
            this.backButtonColor = spec.valueForKey("backButtonColor", JSColor);
        }
        if (spec.containsKey("backButtonActiveColor")){
            this.backButtonActiveColor = spec.valueForKey("backButtonActiveColor", JSColor);
        }
        if (spec.containsKey("backButtonImage")){
            this.backButtonImage = spec.valueForKey("backButtonImage", JSImage);
        }
        if (spec.containsKey("itemInsets")){
            this.itemInsets = spec.valueForKey("itemInsets", JSInsets);
        }else{
            this.itemInsets = JSInsets.Zero;
        }
        if (spec.containsKey("itemTitleInsets")){
            this.itemTitleInsets = spec.valueForKey("itemTitleInsets", JSInsets);
        }
        if (spec.containsKey("backButtonTitleInsets")){
            this.backButtonTitleInsets = spec.valueForKey("backButtonTitleInsets", JSInsets);
        }
        this._fillInDefaultStyles();
    },

    _fillInDefaultStyles: function(){
        if (this.titleColor === null){
            this.titleColor = JSColor.black;
        }
        if (this.itemColor === null){
            this.itemColor = this.titleColor;
        }
        if (this.activeItemColor === null){
            this.activeItemColor = this.itemColor.colorWithAlpha(0.6);
        }
        if (this.disabledItemColor === null){
            this.disabledItemColor = this.itemColor.colorWithAlpha(0.4);
        }
        if (this.backButtonImage === null){
            this.backButtonImage = images.back;
        }

        if (this.backButtonColor === null){
            this.backButtonColor = this.itemColor;
            if (this.backButtonActiveColor === null){
                this.backButtonActiveColor = this.activeItemColor;
            }
        }

        if (this.backButtonActiveColor === null){
            this.backButtonActiveColor = this.backButtonColor.colorWithAlpha(0.6);
        }

        if (this.itemTitleInsets === null){
            this.itemTitleInsets = JSInsets(10);
        }

        if (this.backButtonTitleInsets === null){
            this.backButtonTitleInsets = JSInsets(this.itemTitleInsets);
        }
    },

    initializeBar: function(navigationBar){
        navigationBar.backgroundColor = this.backgroundColor;
        navigationBar.backgroundGradient = this.backgroundGradient;
        navigationBar.borderWidth = this.contentSeparatorSize;
        navigationBar.borderColor = this.contentSeparatorColor;
        navigationBar.maskedBorders = UIView.Sides.maxY;

        var props = navigationBar.stylerProperties;
        props.titleLabel = this.createTitleLabel();
        props.customView = null;
        navigationBar.addSubview(props.titleLabel);
        props.backBarItemView = this.createBackButton(navigationBar);
        navigationBar.insertSubviewBelowSibling(props.backBarItemView, props.titleLabel);
        props.leftBarItemViews = [];
        props.rightBarItemViews = [];
        this.updateBar(navigationBar);
    },

    createTitleLabel: function(){
        var label = UILabel.init();
        label.accessibilityHidden = false;
        label.accessibilityRole = UIAccessibility.Role.header;
        label.font = this.titleFont;
        label.textColor = this.titleColor;
        return label;
    },

    createBackButton: function(navigationBar){
        if (this._backButtonStyler === null){
            this._backButtonStyler = UIButtonCustomStyler.init();
            this._backButtonStyler.font = this.itemFont;
            this._backButtonStyler.normalTitleColor = this.backButtonColor;
            this._backButtonStyler.activeTitleColor = this.backButtonActiveColor;
            this._backButtonStyler.titleInsets = this.backButtonTitleInsets;
        }
        var button = UIButton.initWithStyler(this._backButtonStyler);
        button.addAction("_popNavigation", navigationBar);
        return button;
    },

    pushItem: function(navigationBar, item, animator){
        var styler = this;
        var props = navigationBar.stylerProperties;
        var removingBackBarItemView = props.backBarItemView;
        var removingLeftBarItemViews = props.leftBarItemViews;
        var removingRightBarItemViews = props.rightBarItemViews;
        var removingTitleLabel = props.titleLabel;
        var removingCustomView = props.customView;
        var backToTitleScale = this.titleFont.displayLineHeight / this.itemFont.displayLineHeight;
        props.titleLabel = this.createTitleLabel();
        navigationBar.addSubview(props.titleLabel);
        props.backBarItemView = this.createBackButton(navigationBar);
        navigationBar.addSubview(props.backBarItemView);
        props.customView = null;
        props.leftBarItemViews = [];
        props.rightBarItemViews = [];
        this.updateBar(navigationBar);
        navigationBar.layoutIfNeeded();
        var i, l;
        for (i = 0, l = props.leftBarItemViews.length; i < l; ++i){
            props.leftBarItemViews[i].alpha = 0;
        }
        for (i = 0, l = props.rightBarItemViews.length; i < l; ++i){
            props.rightBarItemViews[i].alpha = 0;
        }
        props.titleLabel.alpha = 0;
        props.titleLabel.transform = JSAffineTransform.Translated(navigationBar.bounds.size.width, 0);
        if (props.customView){
            props.customView.alpha = 0;
            props.customView.transform = JSAffineTransform.Translated(navigationBar.bounds.size.width, 0);
        }
        props.backBarItemView.alpha = 0;
        var backTitleFrame = props.backBarItemView.titleLabel.convertRectToView(props.backBarItemView.titleLabel.bounds, props.backBarItemView.superview);
        if (removingCustomView){
            props.backBarItemView.titleLabel.transform = JSAffineTransform.Translated(Math.max(0, removingCustomView.frame.origin.x - backTitleFrame.origin.x), 0).scaledBy(backToTitleScale);
        }else{
            props.backBarItemView.titleLabel.transform = JSAffineTransform.Translated(Math.max(0, removingTitleLabel.frame.origin.x - backTitleFrame.origin.x), 0).scaledBy(backToTitleScale);
        }
        animator.addAnimations(function(){
            var i, l;
            for (i = 0, l = removingLeftBarItemViews.length; i < l; ++i){
                removingLeftBarItemViews[i].alpha = 0;
            }
            for (i = 0, l = removingRightBarItemViews.length; i < l; ++i){
                removingRightBarItemViews[i].alpha = 0;
            }
            for (i = 0, l = props.leftBarItemViews.length; i < l; ++i){
                props.leftBarItemViews[i].alpha = 1;
            }
            for (i = 0, l = props.rightBarItemViews.length; i < l; ++i){
                props.rightBarItemViews[i].alpha = 1;
            }
            removingBackBarItemView.alpha = 0;
            removingTitleLabel.alpha = 0;
            removingTitleLabel.transform = JSAffineTransform.Translated(Math.min(0, backTitleFrame.origin.x - removingTitleLabel.frame.origin.x), 0).scaledBy(1 / backToTitleScale);
            if (removingCustomView){
                removingCustomView.alpha = 0;
                removingCustomView.transform = JSAffineTransform.Translated(Math.min(0, backTitleFrame.origin.x - removingCustomView.frame.origin.x), 0).scaledBy(1 / backToTitleScale);
            }
            props.titleLabel.alpha = 1;
            props.titleLabel.transform = JSAffineTransform.Identity;
            if (props.customView){
                props.customView.alpha = 1;
                props.customView.transform = JSAffineTransform.Identity;
            }
            props.backBarItemView.alpha = 1;
            props.backBarItemView.titleLabel.transform = JSAffineTransform.Identity;
        });
        animator.addCompletion(function(){
            var i, l;
            for (i = 0, l = removingLeftBarItemViews.length; i < l; ++i){
                removingLeftBarItemViews[i].removeFromSuperview();
            }
            for (i = 0, l = removingRightBarItemViews.length; i < l; ++i){
                removingRightBarItemViews[i].removeFromSuperview();
            }
            removingTitleLabel.removeFromSuperview();
            removingBackBarItemView.removeFromSuperview();
            if (removingCustomView !== null){
                removingCustomView.removeFromSuperview();
                removingCustomView.transform = JSAffineTransform.Identity;
            }
        });
    },

    popToItem: function(navigationBar, item, animator){
        var styler = this;
        var props = navigationBar.stylerProperties;
        var removingBackBarItemView = props.backBarItemView;
        var removingLeftBarItemViews = props.leftBarItemViews;
        var removingRightBarItemViews = props.rightBarItemViews;
        var removingTitleLabel = props.titleLabel;
        var removingCustomView = props.customView;
        var backToTitleScale = this.titleFont.displayLineHeight / this.itemFont.displayLineHeight;
        props.titleLabel = this.createTitleLabel();
        navigationBar.addSubview(props.titleLabel);
        props.backBarItemView = this.createBackButton(navigationBar);
        navigationBar.addSubview(props.backBarItemView);
        props.customView = null;
        props.leftBarItemViews = [];
        props.rightBarItemViews = [];
        this.updateBar(navigationBar);
        navigationBar.layoutIfNeeded();
        var i, l;
        for (i = 0, l = props.leftBarItemViews.length; i < l; ++i){
            props.leftBarItemViews[i].alpha = 0;
        }
        for (i = 0, l = props.rightBarItemViews.length; i < l; ++i){
            props.rightBarItemViews[i].alpha = 0;
        }
        props.titleLabel.alpha = 0;
        props.backBarItemView.alpha = 0;
        var backTitleFrame = removingBackBarItemView.titleLabel.convertRectToView(removingBackBarItemView.titleLabel.bounds, props.backBarItemView.superview);
        if (props.customView){
            props.customView.transform = JSAffineTransform.Translated(Math.min(0, backTitleFrame.origin.x - props.customView.frame.origin.x), 0).scaledBy(1 / backToTitleScale);
            props.customView.alpha = 0;
        }else{
            props.titleLabel.transform = JSAffineTransform.Translated(Math.min(0, backTitleFrame.origin.x - props.titleLabel.frame.origin.x), 0).scaledBy(1 / backToTitleScale);
        }
        animator.addAnimations(function(){
            var i, l;
            for (i = 0, l = removingLeftBarItemViews.length; i < l; ++i){
                removingLeftBarItemViews[i].alpha = 0;
            }
            for (i = 0, l = removingRightBarItemViews.length; i < l; ++i){
                removingRightBarItemViews[i].alpha = 0;
            }
            for (i = 0, l = props.leftBarItemViews.length; i < l; ++i){
                props.leftBarItemViews[i].alpha = 1;
            }
            for (i = 0, l = props.rightBarItemViews.length; i < l; ++i){
                props.rightBarItemViews[i].alpha = 1;
            }
            removingBackBarItemView.alpha = 0;
            removingTitleLabel.alpha = 0;
            removingTitleLabel.transform = JSAffineTransform.Translated(navigationBar.bounds.size.width, 0);
            if (removingCustomView){
                removingCustomView.alpha = 0;
                removingCustomView.transform = JSAffineTransform.Translated(navigationBar.bounds.size.width, 0);
            }
            props.titleLabel.alpha = 1;
            props.titleLabel.transform = JSAffineTransform.Identity;
            props.backBarItemView.alpha = 1;
            props.backBarItemView.titleLabel.transform = JSAffineTransform.Identity;
            if (props.customView){
                props.customView.alpha = 1;
                props.customView.transform = JSAffineTransform.Identity;
            }
        });
        animator.addCompletion(function(){
            var i, l;
            for (i = 0, l = removingLeftBarItemViews.length; i < l; ++i){
                removingLeftBarItemViews[i].removeFromSuperview();
            }
            for (i = 0, l = removingRightBarItemViews.length; i < l; ++i){
                removingRightBarItemViews[i].removeFromSuperview();
            }
            removingTitleLabel.removeFromSuperview();
            removingBackBarItemView.removeFromSuperview();
            if (removingCustomView !== null){
                removingCustomView.removeFromSuperview();
                removingCustomView.transform = JSAffineTransform.Identity;
            }
        });
    },

    updateBar: function(navigationBar){
        var item = navigationBar.topItem;
        var props = navigationBar.stylerProperties;

        var i, l;
        for (i = 0, l = props.leftBarItemViews.length; i < l; ++i){
            props.leftBarItemViews[i].removeFromSuperview();
        }
        for (i = 0, l = props.rightBarItemViews.length; i < l; ++i){
            props.rightBarItemViews[i].removeFromSuperview();
        }
        props.leftBarItemViews = [];
        props.rightBarItemViews = [];

        if (props.customView){
            props.customView.removeFromSuperview();
            props.customView = null;
        }

        props.titleLabel.text = null;

        if (item){
            props.titleLabel.text = item.title;

            var backItem = navigationBar.backItem;
            var backBarItem = null;
            if (backItem !== null){
                if (backItem.backBarButtonItem !== null){
                    backItem = backItem.backBarButtonItem;
                }
                backBarItem = UINavigationBarItem.initWithImage(this.backButtonImage);
                backBarItem.title = backItem.title;
            }

            props.backBarItemView.setImageForState(this.backButtonImage, UIControl.State.normal);

            if (backBarItem !== null){
                props.backBarItemView.titleLabel.text = backBarItem.title;
                props.backBarItemView.hidden = item.hidesBackButton;
            }else{
                props.backBarItemView.hidden = true;
            }

            var barItem;
            var barItemView;
            for (i = 0, l = item.leftBarItems.length; i < l; ++i){
                barItem = item.leftBarItems[i];
                barItemView = this.viewForBarItem(barItem);
                props.leftBarItemViews.push(barItemView);
                navigationBar.insertSubviewBelowSibling(barItemView, props.titleLabel);
            }
            for (i = 0, l = item.rightBarItems.length; i < l; ++i){
                barItem = item.rightBarItems[i];
                barItemView = this.viewForBarItem(barItem);
                props.rightBarItemViews.push(barItemView);
                navigationBar.insertSubviewBelowSibling(barItemView, props.titleLabel);
            }

            if (item.view){
                props.customView = item.view;
                navigationBar.insertSubviewBelowSibling(props.customView, props.titleLabel);
            }
        }else{
            if (props.backBarItemView){
                props.backBarItemView.hidden = true;
            }
        }
        navigationBar.setNeedsLayout();
    },

    layoutBar: function(navigationBar){
        var item = navigationBar.topItem;
        var size = navigationBar.bounds.size;
        var props = navigationBar.stylerProperties;
        var xLeft = this.itemInsets.left;
        var xRight = size.width - this.itemInsets.right;
        var i, l;
        var itemHeight = size.height - this.itemInsets.height;
        var y = this.itemInsets.top;
        var barItemView = props.backBarItemView;
        barItemView.sizeToFitSize(JSSize(xRight - xLeft, itemHeight));
        barItemView.frame = JSRect(JSPoint(xLeft, y + (itemHeight - barItemView.bounds.size.height) / 2), barItemView.bounds.size);
        if (!barItemView.hidden){
            xLeft += barItemView.bounds.size.width;
        }
        for (i = 0, l = props.leftBarItemViews.length; i < l; ++i){
            barItemView = props.leftBarItemViews[i];
            barItemView.sizeToFitSize(JSSize(xRight - xLeft, itemHeight));
            barItemView.frame = JSRect(JSPoint(xLeft, y + (itemHeight - barItemView.bounds.size.height) / 2), barItemView.bounds.size);
            xLeft += barItemView.bounds.size.width;
        }
        for (i = props.rightBarItemViews.length - 1; i >= 0; --i){
            barItemView = props.rightBarItemViews[i];
            barItemView.sizeToFitSize(JSSize(xRight - xLeft, itemHeight));
            xRight -= barItemView.bounds.size.width;
            barItemView.frame = JSRect(JSPoint(xRight, y + (itemHeight - barItemView.bounds.size.height) / 2), barItemView.bounds.size);
            barItemView.hidden = xRight < xLeft;
        }

        var availableTitleWidth = xRight - xLeft;
        var titleView;
        if (availableTitleWidth > 0){
            if (props.customView){
                props.titleLabel.hidden = true;
                props.customView.hidden = false;
                titleView = props.customView;
            }else{
                props.titleLabel.hidden = false;
                titleView = props.titleLabel;
            }
            titleView.sizeToFitSize(JSSize(availableTitleWidth, size.height));
            var viewSize = titleView.bounds.size;
            var minX = xLeft;
            var maxX = xRight - viewSize.width;
            var centeredX = (size.width - viewSize.width) / 2;
            var centeredY = (size.height - viewSize.height) / 2;
            var titleTextAlignment = item ? item.titleTextAlignment || this.titleTextAlignment : this.titleTextAlignment;
            if (titleTextAlignment === JSTextAlignment.center){
                titleView.frame = JSRect(JSPoint(Math.min(Math.max(minX, centeredX), maxX), centeredY), viewSize);
            }else if (titleTextAlignment === JSTextAlignment.right){
                titleView.frame = JSRect(JSPoint(maxX - viewSize.width, centeredY), viewSize);
            }else{
                titleView.frame = JSRect(JSPoint(minX, centeredY), viewSize);
            }
        }else{
            props.titleLabel.hidden = true;
            if (props.customView){
                props.customView.hidden = true;
            }
        }
    },

    viewForBarItem: function(barItem){
        if (barItem.view){
            return barItem.view;
        }
        if (this._buttonStyler === null){
            this._buttonStyler = UIButtonCustomStyler.init();
            this._buttonStyler.font = this.itemFont;
            this._buttonStyler.normalTitleColor = this.itemColor;
            this._buttonStyler.activeTitleColor = this.activeItemColor;
            this._buttonStyler.disabledTitleColor = this.disabledItemColor;
            this._buttonStyler.titleInsets = this.itemTitleInsets;
        }
        var button = UIButton.initWithStyler(this._buttonStyler);
        if (barItem.title){
            button.titleLabel.text = barItem.title;
        }
        button.accessibilityLabel = barItem.accessibilityTitle;
        if (barItem.image){
            button.setImageForState(barItem.image, UIControl.State.normal);
            button._imageView.automaticRenderMode = JSImage.RenderMode.template;
        }
        button.addAction(barItem.action, barItem.target);
        button.enabled = barItem.enabled;
        barItem._barButton = button;
        return button;
    }

});


var images = Object.create({}, {

    bundle: {
        configurable: true,
        get: function(){
            Object.defineProperty(this, 'bundle', {value: JSBundle.initWithIdentifier("io.breakside.JSKit.UIKit") });
            return this.bundle;
        }
    },

    back: {
        configurable: true,
        get: function(){
            var image = JSImage.initWithResourceName("UINavigationBarBack", this.bundle);
            Object.defineProperty(this, 'back', {value: image.imageWithRenderMode(JSImage.RenderMode.template) });
            return this.back;
        }
    }

});

})();