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
'use strict';

JSClass("UIStackView", UIView, {

    initWithFrame: function(frame){
        UIStackView.$super.initWithFrame.call(this, frame);
        this._commonStackViewInit();
        this.updateLayoutManager();
    },

    initWithArrangedSubviews: function(arrangedSubviews){
        this.init();
        for (var i = 0, l = arrangedSubviews.length; i < l; ++i){
            this.addArrangedSubview(arrangedSubviews[i]);
        }
        this.arrangeAllSubviews = false;
    },

    initWithSpec: function(spec){
        UIStackView.$super.initWithSpec.call(this, spec);
        this._commonStackViewInit();
        if (spec.containsKey('contentInsets')){
            this._contentInsets = spec.valueForKey("contentInsets", JSInsets);
        }
        if (spec.containsKey('viewSpacing')){
            this._viewSpacing = spec.valueForKey("viewSpacing");
        }
        if (spec.containsKey('axis')){
            this._axis = spec.valueForKey("axis", UIStackView.Axis);
        }
        if (spec.containsKey('distribution')){
            this._distribution = spec.valueForKey("distribution", UIStackView.Distribution);
        }
        if (spec.containsKey('alignment')){
            this._alignment = spec.valueForKey("alignment", UIStackView.Alignment);
        }
        var i, l;
        var subview;
        if (spec.containsKey('arrangedSubviews')){
            this.arrangeAllSubviews = false;
            var arrangedSubviews = spec.valueForKey('arrangedSubviews');
            for (i = 0, l = arrangedSubviews.length; i < l; ++i){
                subview = arrangedSubviews.valueForKey(i, UIView);
                this.addArrangedSubview(subview);
            }
        }else{
            this._arrangedSubviews = JSCopy(this.subviews);
        }
        this.updateLayoutManager();
    },

    _commonStackViewInit: function(){
        this._contentInsets = JSInsets.Zero;
        this._arrangedSubviews = [];
    },

    arrangeAllSubviews: true,
    arrangedSubviews: JSReadOnlyProperty("_arrangedSubviews", null),

    addArrangedSubview: function(subview){
        this.insertArrangedSubviewAtIndex(subview, this._arrangedSubviews.length);
    },

    insertArrangedSubviewAtIndex: function(subview, index){
        if (this.arrangeAllSubviews){
            this.insertSubviewAtIndex(subview, index);
        }else{
            this._arrangedSubviews.splice(index, 0, subview);
            if (subview.superview !== this){
                UIStackView.$super.addSubview.call(this, subview);
            }
        }
    },

    removeArrangedSubview: function(subview){
        if (this.arrangeAllSubviews){
            this.removeSubview(subview);
        }else{
            var index = this._arrangedSubviews.indexOf(subview);
            if (index >= 0){
                this.arrangedSubviews.splice(index, 1);
            }
        }
    },

    addSubview: function(subview){
        UIStackView.$super.addSubview.call(this, subview);
        if (this.arrangeAllSubviews){
            this._arrangedSubviews = JSCopy(this.subviews);
        }
    },

    insertSubviewAtIndex: function(subview, index){
        UIStackView.$super.insertSubviewAtIndex.call(this, subview, index);
        if (this.arrangeAllSubviews){
            this._arrangedSubviews = JSCopy(this.subviews);
        }
    },

    insertSubviewBelowSibling: function(subview, sibling){
        UIStackView.$super.insertSubviewBelowSibling.call(this, subview, sibling);
        if (this.arrangeAllSubviews){
            this._arrangedSubviews = JSCopy(this.subviews);
        }
    },

    insertSubviewAboveSibling: function(subview, sibling){
        UIStackView.$super.insertSubviewAboveSibling.call(this, subview, sibling);
        if (this.arrangeAllSubviews){
            this._arrangedSubviews = JSCopy(this.subviews);
        }
    },

    removeSubview: function(subview){
        UIStackView.$super.removeSubview.call(this, subview);
        if (this.arrangeAllSubviews){
            this._arrangedSubviews = JSCopy(this.subviews);
        }
    },

    axis: JSDynamicProperty('_axis', 0),

    setAxis: function(axis){
        this._axis = axis;
        this.updateLayoutManager();
    },

    distribution: JSDynamicProperty('_distribution', 0),

    setDistribution: function(distribution){
        this._distribution = distribution;
        this.updateLayoutManager();
    },

    alignment: JSDynamicProperty('_alignment', 0),

    setAlignment: function(alignment){
        this._alignment = alignment;
        this.updateLayoutManager();
    },

    contentInsets: JSDynamicProperty('_contentInsets', null),

    setContentInsets: function(contentInsets){
        this._contentInsets = JSInsets(contentInsets);
        this.setNeedsLayout();
    },

    viewSpacing: JSDynamicProperty('_viewSpacing', 0),

    setViewSpacing: function(viewSpacing){
        this._viewSpacing = viewSpacing;
        this.setNeedsLayout();
    },

    updateLayoutManager: function(){
        this.layoutManager = this.createLayoutManager();
        this.setNeedsLayout();
    },

    createLayoutManager: function(){
        switch (this._axis){
            case UIStackView.Axis.vertical:
                switch (this._distribution){
                    case UIStackView.Distribution.none:
                        return UIStackViewVerticalNoDistributionLayoutManager.init();
                    case UIStackView.Distribution.equal:
                        return UIStackViewVerticalEqualDistributionLayoutManager.init();
                }
                break;
            case UIStackView.Axis.horizontal:
                switch (this._distribution){
                    case UIStackView.Distribution.none:
                        return UIStackViewHorizontalNoDistributionLayoutManager.init();
                    case UIStackView.Distribution.equal:
                        return UIStackViewHorizontalEqualDistributionLayoutManager.init();
                }
                break;
        }
        return null;
    },

    sizeToFit: function(){
        if (this._axis === UIStackView.Axis.horizontal){
            this.sizeToFitSize(JSSize(Number.MAX_VALUE, this.bounds.size.height));
        }else{
            this.sizeToFitSize(JSSize(this.bounds.size.width, Number.MAX_VALUE));
        }
    },

    sizeToFitSize: function(size){
        this.layoutManager.sizeStackViewToFitSize(this, size);
        this.setNeedsLayout();
    },

    layoutSubviews: function(){
        this.layoutManager.layoutStackView(this);
    },

    subviewsDidChange: function(){
        this.setNeedsLayout();
    },

    getFirstBaselineOffsetFromTop: function(){
        var top = this._contentInsets.top;
        if (this._arrangedSubviews.length > 0){
            if (this.axis === UIStackView.Axis.horizontal){
                this.layoutIfNeeded();
                top = this._arrangedSubviews[0].untransformedFrame.origin.y;
            }
            top += this._arrangedSubviews[0].firstBaselineOffsetFromTop;
        }
        return top;
    },

    getLastBaselineOffsetFromBottom: function(){
        var bottom = this._contentInsets.bottom;
        if (this._arrangedSubviews.length > 0){
            bottom += this._arrangedSubviews[this._arrangedSubviews.length - 1].lastBaselineOffsetFromBottom;
        }
        return bottom;
    }

});

UIStackView.Axis = {
    vertical: 0,
    horizontal: 1
};

UIStackView.Distribution = {
    none: 0,
    equal: 1,
};

UIStackView.Alignment = {
    full: 0,
    leading: 1,
    center: 2,
    trailing: 3,
    firstBaseline: 4,
    lastBaseline: 5
};

JSClass("UIStackViewLayoutManager", JSObject, {

    numberOfVisibleSubviewsInStackView: function(stackView){
        var numberOfVisibleSubviews = 0;
        var view;
        for (var i = 0, l = stackView._arrangedSubviews.length; i < l; ++i){
            view = stackView._arrangedSubviews[i];
            if (!view.hidden){
                ++numberOfVisibleSubviews;
            }
        }
        return numberOfVisibleSubviews;
    },

    layoutStackView: function(stackView){
    },

    sizeStackViewToFitSize: function(stackView, maxSize){
    }

});

JSClass("UIStackViewVerticalLayoutManager", UIStackViewLayoutManager, {

    sizeView: function(view, maxSize, shrinkToIntrinsicWidth){
        view.sizeToFitSize(maxSize);
        if (shrinkToIntrinsicWidth){
            var intrinsicSize = view.intrinsicSize;
            if (intrinsicSize.width !== UIView.noIntrinsicSize){
                if (intrinsicSize.width < maxSize.width){
                    return JSSize(intrinsicSize.width, view.bounds.size.height);
                }
            }
            return JSSize(view.bounds.size.width, view.bounds.size.height);
        }
        return JSSize(maxSize.width, view.bounds.size.height);
    },

    alignStackView: function(stackView){
        var i, l;
        var view;
        var frame;
        var leadingX = stackView._contentInsets.left;
        var trailingX = stackView.bounds.size.width - stackView._contentInsets.right;
        if (stackView._alignment === UIStackView.Alignment.center){
            for (i = 0, l = stackView._arrangedSubviews.length; i < l; ++i){
                view = stackView._arrangedSubviews[i];
                frame = JSRect(view.frame);
                frame.origin.x = leadingX + ((trailingX - leadingX) - frame.size.width) / 2;
                view.frame = frame;
            }
        }else if (stackView._alignment === UIStackView.Alignment.trailing){
            for (i = 0, l = stackView._arrangedSubviews.length; i < l; ++i){
                view = stackView._arrangedSubviews[i];
                frame = JSRect(view.frame);
                frame.origin.x = trailingX - frame.size.width;
                view.frame = frame;
            }
        }
    }

});

JSClass("UIStackViewVerticalNoDistributionLayoutManager", UIStackViewVerticalLayoutManager, {

    layoutStackView: function(stackView){
        var origin = JSPoint(stackView._contentInsets.left, stackView._contentInsets.top);
        var size;
        var i, l;
        var view;
        var maxViewSize = JSSize(stackView.bounds.size.width - stackView._contentInsets.width, Number.MAX_VALUE);
        for (i = 0, l = stackView._arrangedSubviews.length; i < l; ++i){
            view = stackView._arrangedSubviews[i];
            size = this.sizeView(view, maxViewSize, stackView._alignment !== UIStackView.Alignment.full);
            view.frame = JSRect(origin, size);
            if (!view.hidden){
                origin.y += size.height + stackView._viewSpacing;
            }
        }
        this.alignStackView(stackView);
    },

    sizeStackViewToFitSize: function(stackView, maxSize){
        var stackSize = JSSize(0, stackView._contentInsets.height);
        var maxViewSize = JSSize(maxSize.width, Number.MAX_VALUE);
        if (maxSize.width < Number.MAX_VALUE){
            maxViewSize.width = maxSize.width - stackView._contentInsets.width;
        }
        var view;
        var size;
        var visibleViewCount = 0;
        for (var i = 0, l = stackView._arrangedSubviews.length; i < l; ++i){
            view = stackView._arrangedSubviews[i];
            size = this.sizeView(view, maxViewSize, true);
            if (!view.hidden){
                stackSize.height += view.bounds.size.height;
                ++visibleViewCount;
                if (size.width > stackSize.width){
                    stackSize.width = size.width;
                }
            }
        }
        if (visibleViewCount > 1){
            stackSize.height += (visibleViewCount - 1) * stackView._viewSpacing;
        }
        stackSize.width += stackView._contentInsets.width;
        if (stackSize.width > maxSize.width){
            stackSize.width = maxSize.width;
        }
        if (stackSize.height > maxSize.height){
            stackSize.height = maxSize.height;
        }
        stackView.bounds = JSRect(JSPoint.Zero, stackSize);
    }
});

JSClass("UIStackViewVerticalEqualDistributionLayoutManager", UIStackViewVerticalLayoutManager, {

    layoutStackView: function(stackView){
        var origin = JSPoint(stackView._contentInsets.left, stackView._contentInsets.top);
        var size;
        var i, l;
        var view;
        var viewCount = this.numberOfVisibleSubviewsInStackView(stackView);
        var maxViewSize = JSSize(stackView.bounds.size.width - stackView._contentInsets.width, stackView.bounds.size.height - stackView._contentInsets.height);
        if (viewCount > 1){
            maxViewSize.height = Math.floor(Math.max(0, maxViewSize.height - (viewCount - 1) * stackView._viewSpacing) / viewCount);
        }
        for (i = 0, l = stackView._arrangedSubviews.length; i < l; ++i){
            view = stackView._arrangedSubviews[i];
            size = this.sizeView(view, maxViewSize, stackView._alignment !== UIStackView.Alignment.full);
            size.height = maxViewSize.height;
            view.frame = JSRect(origin, size);
            if (!view.hidden){
                origin.y += size.height + stackView._viewSpacing;
            }
        }
        this.alignStackView(stackView);
    },

    sizeStackViewToFitSize: function(stackView, maxSize){
        var stackSize = JSSize(0, stackView.bounds.size.height);
        var maxViewSize = JSSize(maxSize.width, Number.MAX_VALUE);
        if (maxSize.width < Number.MAX_VALUE){
            maxViewSize.width = maxSize.width - stackView._contentInsets.width;
        }
        var view;
        var size;
        for (var i = 0, l = stackView._arrangedSubviews.length; i < l; ++i){
            view = stackView._arrangedSubviews[i];
            size = this.sizeView(view, maxViewSize, true);
            if (!view.hidden){
                if (size.width > stackSize.width){
                    stackSize.width = size.width;
                }
            }
        }
        stackSize.width += stackView._contentInsets.width;
        if (stackSize.width > maxSize.width){
            stackSize.width = maxSize.width;
        }
        if (maxSize.height < Number.MAX_VALUE){
            stackSize.height = maxSize.height;
        }
        stackView.bounds = JSRect(JSPoint.Zero, stackSize);
    }

});

JSClass("UIStackViewHorizontalLayoutManager", UIStackViewLayoutManager, {

    sizeView: function(view, maxSize, shrinkToIntrinsicHeight){
        view.sizeToFitSize(maxSize);
        if (shrinkToIntrinsicHeight){
            var intrinsicSize = view.intrinsicSize;
            if (intrinsicSize.height !== UIView.noIntrinsicSize){
                if (intrinsicSize.height < maxSize.height){
                    return JSSize(view.bounds.size.width, intrinsicSize.height);
                }
            }
            return JSSize(view.bounds.size.width, view.bounds.size.height);
        }
        return JSSize(view.bounds.size.width, maxSize.height);
    },

    alignStackView: function(stackView){
        var i, l;
        var view;
        var frame;
        var leadingY = stackView._contentInsets.top;
        var trailingY = stackView.bounds.size.height - stackView._contentInsets.bottom;
        var commonBaseline = 0;
        var baseline;
        if (stackView._alignment === UIStackView.Alignment.center){
            for (i = 0, l = stackView._arrangedSubviews.length; i < l; ++i){
                view = stackView._arrangedSubviews[i];
                frame = JSRect(view.frame);
                frame.origin.y = leadingY + ((trailingY - leadingY) - frame.size.height) / 2;
                view.frame = frame;
            }
        }else if (stackView._alignment === UIStackView.Alignment.trailing){
            for (i = 0, l = stackView._arrangedSubviews.length; i < l; ++i){
                view = stackView._arrangedSubviews[i];
                frame = JSRect(view.frame);
                frame.origin.y = trailingY - frame.size.height;
                view.frame = frame;
            }
        }else if (stackView._alignment === UIStackView.Alignment.firstBaseline){
            for (i = 0, l = stackView._arrangedSubviews.length; i < l; ++i){
                view = stackView._arrangedSubviews[i];
                baseline = view.firstBaselineOffsetFromTop;
                if (baseline > commonBaseline){
                    commonBaseline = baseline;
                }
            }
            for (i = 0, l = stackView._arrangedSubviews.length; i < l; ++i){
                view = stackView._arrangedSubviews[i];
                baseline = view.firstBaselineOffsetFromTop;
                frame = JSRect(view.frame);
                frame.origin.y = leadingY + commonBaseline - baseline;
                view.frame = frame;
            }
        }else if (stackView._alignment === UIStackView.Alignment.lastBaseline){
            for (i = 0, l = stackView._arrangedSubviews.length; i < l; ++i){
                view = stackView._arrangedSubviews[i];
                baseline = view.bounds.size.height - view.lastBaselineOffsetFromBottom;
                if (baseline > commonBaseline){
                    commonBaseline = baseline;
                }
            }
            for (i = 0, l = stackView._arrangedSubviews.length; i < l; ++i){
                view = stackView._arrangedSubviews[i];
                baseline = view.bounds.size.height - view.lastBaselineOffsetFromBottom;
                frame = JSRect(view.frame);
                frame.origin.y = leadingY + commonBaseline - baseline;
                view.frame = frame;
            }
        }
    }

});

JSClass("UIStackViewHorizontalNoDistributionLayoutManager", UIStackViewHorizontalLayoutManager, {

    layoutStackView: function(stackView){
        var origin = JSPoint(stackView._contentInsets.left, stackView._contentInsets.top);
        var size;
        var i, l;
        var view;
        var maxViewSize = JSSize(Number.MAX_VALUE, stackView.bounds.size.height - stackView._contentInsets.height);
        for (i = 0, l = stackView._arrangedSubviews.length; i < l; ++i){
            view = stackView._arrangedSubviews[i];
            size = this.sizeView(view, maxViewSize, stackView._alignment !== UIStackView.Alignment.full);
            view.frame = JSRect(origin, size);
            if (!view.hidden){
                origin.x += size.width + stackView._viewSpacing;
            }
        }
        this.alignStackView(stackView);
    },

    sizeStackViewToFitSize: function(stackView, maxSize){
        var stackSize = JSSize(stackView._contentInsets.width, 0);
        var maxViewSize = JSSize(Number.MAX_VALUE, maxSize.height);
        if (maxSize.height < Number.MAX_VALUE){
            maxViewSize.height = maxSize.height - stackView._contentInsets.height;
        }
        var view;
        var size;
        var visibleViewCount = 0;
        for (var i = 0, l = stackView._arrangedSubviews.length; i < l; ++i){
            view = stackView._arrangedSubviews[i];
            size = this.sizeView(view, maxViewSize, true);
            if (!view.hidden){
                stackSize.width += view.bounds.size.width;
                ++visibleViewCount;
                if (size.height > stackSize.height){
                    stackSize.height = size.height;
                }
            }
        }
        if (visibleViewCount > 1){
            stackSize.width += (visibleViewCount - 1) * stackView._viewSpacing;
        }
        stackSize.height += stackView._contentInsets.height;
        if (stackSize.height > maxSize.height){
            stackSize.height = maxSize.height;
        }
        if (stackSize.width > maxSize.width){
            stackSize.width = maxSize.width;
        }
        stackView.bounds = JSRect(JSPoint.Zero, stackSize);
    }
});

JSClass("UIStackViewHorizontalEqualDistributionLayoutManager", UIStackViewHorizontalLayoutManager, {

    layoutStackView: function(stackView){
        var origin = JSPoint(stackView._contentInsets.left, stackView._contentInsets.top);
        var size;
        var i, l;
        var view;
        var viewCount = this.numberOfVisibleSubviewsInStackView(stackView);
        var maxViewSize = JSSize(stackView.bounds.size.width - stackView._contentInsets.width, stackView.bounds.size.height - stackView._contentInsets.height);
        if (viewCount > 1){
            maxViewSize.width = Math.floor(Math.max(0, maxViewSize.width - (viewCount - 1) * stackView._viewSpacing) / viewCount);
        }
        for (i = 0, l = stackView._arrangedSubviews.length; i < l; ++i){
            view = stackView._arrangedSubviews[i];
            size = this.sizeView(view, maxViewSize, stackView._alignment !== UIStackView.Alignment.full);
            size.width = maxViewSize.width;
            view.frame = JSRect(origin, size);
            if (!view.hidden){
                origin.x += size.width + stackView._viewSpacing;
            }
        }
        this.alignStackView(stackView);
    },

    sizeStackViewToFitSize: function(stackView, maxSize){
        var stackSize = JSSize(stackView.bounds.size.width, 0);
        var maxViewSize = JSSize(Number.MAX_VALUE, maxSize.height);
        if (maxSize.height < Number.MAX_VALUE){
            maxViewSize.height = maxSize.height - stackView._contentInsets.height;
        }
        var view;
        var size;
        for (var i = 0, l = stackView._arrangedSubviews.length; i < l; ++i){
            view = stackView._arrangedSubviews[i];
            size = this.sizeView(view, maxViewSize, true);
            if (!view.hidden){
                if (size.height > stackSize.height){
                    stackSize.height = size.height;
                }
            }
        }
        stackSize.height += stackView._contentInsets.height;
        if (stackSize.height > maxSize.height){
            stackSize.height = maxSize.height;
        }
        if (maxSize.width < Number.MAX_VALUE){
            stackSize.width = maxSize.width;
        }
        stackView.bounds = JSRect(JSPoint.Zero, stackSize);
    }

});