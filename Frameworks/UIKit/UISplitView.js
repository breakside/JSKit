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
// #import "UISplitViewDivider.js"
// #import "UIUserInterface.js"
// #import "UIDevice.js"
'use strict';

JSClass("UISplitView", UIView, {

    leadingView: JSDynamicProperty('_leadingView', null),
    mainView: JSDynamicProperty('_mainView', null),
    trailingView: JSDynamicProperty('_trailingView', null),

    leadingViewOpen: JSDynamicProperty('_leadingViewOpen', true, 'isLeadingViewOpen'),
    trailingViewOpen: JSDynamicProperty('_trailingViewOpen', true, 'isTrailingViewOpen'),

    vertical: JSDynamicProperty('_isVertical', false, 'isVertical'),

    minimumLeadingSize: JSDynamicProperty('_minimumLeadingSize', 150),
    minimumTrailingSize: JSDynamicProperty('_minimumTrailingSize', 150),
    minimumMainSize: JSDynamicProperty('_minimumMainSize', 400),
    maximumLeadingSize: JSDynamicProperty('_maximumLeadingSize', 350),
    maximumTrailingSize: JSDynamicProperty('_maximumTrailingSize', 350),

    leadingFloats: JSDynamicProperty('_leadingFloats', false),
    trailingFloats: JSDynamicProperty('_trailingFloats', false),

    leadingCollapses: JSDynamicProperty('_leadingCollapses', false),
    trailingCollapses: JSDynamicProperty('_trailingCollapses', false),

    leadingCollapsedSize: JSDynamicProperty('_leadingCollapsedSize', 0),
    trailingCollapsedSize: JSDynamicProperty('_trailingCollapsedSize', 0),

    leadingSize: JSDynamicProperty('_leadingSize', 200),
    trailingSize: JSDynamicProperty('_trailingSize', 200),

    leadingDividerColor: JSDynamicProperty(),
    trailingDividerColor: JSDynamicProperty(),
    leadingDividerGradient: JSDynamicProperty(),
    trailingDividerGradient: JSDynamicProperty(),

    delegate: null,

    _leadingDividerView: null,
    _trailingDividerView: null,

    initWithMainView: function(mainView, leadingView, trailingView){
        UISplitView.$super.init.call(this);
        this._leadingView = leadingView;
        this._mainView = mainView;
        this._trailingView = trailingView;
        this._commonSplitViewInit();
    },

    initWithSpec: function(spec){
        UISplitView.$super.initWithSpec.call(this, spec);
        if (spec.containsKey('leadingView')){
            this._leadingView = spec.valueForKey("leadingView");
        }
        if (spec.containsKey('trailingView')){
            this._trailingView = spec.valueForKey("trailingView");
        }
        if (spec.containsKey('mainView')){
            this._mainView = spec.valueForKey("mainView");
        }
        if (spec.containsKey('vertical')){
            this._isVertical = spec.valueForKey("vertical");
        }
        if (spec.containsKey('leadingFloats')){
            this._leadingFloats = spec.valueForKey("leadingFloats");
        }
        if (spec.containsKey('trailingFloats')){
            this._trailingFloats = spec.valueForKey("trailingFloats");
        }
        if (spec.containsKey('leadingCollapses')){
            this._leadingCollapses = spec.valueForKey("leadingCollapses");
        }
        if (spec.containsKey('trailingCollapses')){
            this._trailingCollapses = spec.valueForKey("trailingCollapses");
        }
        if (spec.containsKey('leadingCollapsedSize')){
            this._leadingCollapsedSize = spec.valueForKey("leadingCollapsedSize");
        }
        if (spec.containsKey('trailingCollapsedSize')){
            this._trailingCollapsedSize = spec.valueForKey("trailingCollapsedSize");
        }
        if (spec.containsKey('leadingSize')){
            this._leadingSize = spec.valueForKey("leadingSize");
        }
        if (spec.containsKey('trailingSize')){
            this._trailingSize = spec.valueForKey("trailingSize");
        }
        if (spec.containsKey('minimumLeadingSize')){
            this._minimumLeadingSize = spec.valueForKey("minimumLeadingSize");
        }
        if (spec.containsKey('minimumTrailingSize')){
            this._minimumTrailingSize = spec.valueForKey("minimumTrailingSize");
        }
        if (spec.containsKey('minimumMainSize')){
            this._minimumMainSize = spec.valueForKey("minimumMainSize");
        }
        if (spec.containsKey('maximumLeadingSize')){
            this._maximumLeadingSize = spec.valueForKey("maximumLeadingSize");
        }
        if (spec.containsKey('maximumTrailingSize')){
            this._maximumTrailingSize = spec.valueForKey("maximumTrailingSize");
        }
        if (spec.containsKey('leadingViewOpen')){
            this._leadingViewOpen = spec.valueForKey("leadingViewOpen");
        }
        if (spec.containsKey('trailingViewOpen')){
            this._trailingViewOpen = spec.valueForKey("trailingViewOpen");
        }
        this._commonSplitViewInit();

        // after common init because the setters rely on objects that common init creates
        if (spec.containsKey('leadingDividerColor')){
            this.leadingDividerColor = spec.valueForKey("leadingDividerColor", JSColor);
        }
        if (spec.containsKey('trailingDividerColor')){
            this.trailingDividerColor = spec.valueForKey("trailingDividerColor", JSColor);
        }
        if (spec.containsKey('leadingDividerGradient')){
            this.leadingDividerGradient = spec.valueForKey("leadingDividerGradient", JSGradient);
        }
        if (spec.containsKey('trailingDividerGradient')){
            this.trailingDividerGradient = spec.valueForKey("trailingDividerGradient", JSGradient);
        }
        if (spec.containsKey('autosaveName')){
            this.autosaveName = spec.valueForKey("autosaveName");
        }
        if (spec.containsKey('delegate')){
            this.delegate = spec.valueForKey("delegate");
        }
    },

    _commonSplitViewInit: function(){
        this._leadingDividerView = UISplitViewDivider.initWithSizes(1, 5, this._isVertical);
        this._trailingDividerView = UISplitViewDivider.initWithSizes(1, 5, this._isVertical);
        if (this._mainView !== null){
            this.addSubview(this._mainView);
        }
        if (this._leadingView !== null){
            this._leadingView.clipsToBounds = true;
            this.addSubview(this._leadingView);
        }
        if (this._trailingView !== null){
            this._trailingView.clipsToBounds = true;
            this.addSubview(this._trailingView);
        }
        this.addSubview(this._leadingDividerView);
        this.addSubview(this._trailingDividerView);
    },

    setLeadingViewOpen: function(isOpen){
        if (isOpen != this._leadingViewOpen){
            this._leadingViewOpen = isOpen;
            if (this._leadingView !== null){
                this.setNeedsLayout();
                if (this.delegate && this.delegate.splitViewDidToggleView){
                    this.delegate.splitViewDidToggleView(this, this._leadingView);
                }
                this._autosaveToUserDefaults();
            }
        }
    },

    setTrailingViewOpen: function(isOpen){
        if (isOpen != this._trailingViewOpen){
            this._trailingViewOpen = isOpen;
            if (this._trailingView !== null){
                this.setNeedsLayout();
                if (this.delegate && this.delegate.splitViewDidToggleView){
                    this.delegate.splitViewDidToggleView(this, this._trailingView);
                }
                this._autosaveToUserDefaults();
            }
        }
    },

    setVertical: function(isVertical){
        this._isVertical = isVertical;
        this._leadingDividerView.vertical = isVertical;
        this._trailingDividerView.vertical = isVertical;
        this.setNeedsLayout();
    },

    setLeadingSize: function(size){
        this._leadingSize = size;
        this.setNeedsLayout();
    },

    setTrailingSize: function(size){
        this._trailingSize = size;
        this.setNeedsLayout();
    },

    setLeadingFloats: function(floats){
        this._leadingFloats = floats;
        this.setNeedsLayout();
    },

    setTrailingFloats: function(floats){
        this._trailingFloats = floats;
        this.setNeedsLayout();
    },

    setLeadingDividerColor: function(color){
        this._leadingDividerView.color = color;
    },

    getLeadingDividerColor: function(){
        return this._leadingDividerView.color;
    },

    setTrailingDividerColor: function(color){
        this._trailingDividerView.color = color;
    },

    getTrailingDividerColor: function(){
        return this._trailingDividerView.color;
    },

    setLeadingDividerGradient: function(gradient){
        this._leadingDividerView.gradient = gradient;
    },

    getLeadingDividerGradient: function(){
        return this._leadingDividerView.gradient;
    },

    setTrailingDividerGradient: function(gradient){
        this._trailingDividerView.gradient = gradient;
    },

    getTrailingDividerGradient: function(){
        return this._trailingDividerView.gradient;
    },

    setLeadingView: function(leadingView){
        if (leadingView === this._leadingView){
            return;
        }
        if (this._leadingView !== null){
            this._leadingView.removeFromSuperview();
        }
        if (leadingView !== null){
            leadingView.clipsToBounds = true;
            this.insertSubviewBelowSibling(leadingView, this._leadingDividerView);
        }
        this._leadingView = leadingView;
        this.setNeedsLayout();
    },

    setTrailingView: function(trailingView){
        if (trailingView === this._trailingView){
            return;
        }
        if (this._trailingView !== null){
            this._trailingView.removeFromSuperview();
        }
        if (trailingView !== null){
            trailingView.clipsToBounds = true;
            this.insertSubviewBelowSibling(trailingView, this._leadingDividerView);
        }
        this._trailingView = trailingView;
        this.setNeedsLayout();
    },

    setMainView: function(mainView){
        if (mainView === this._mainView){
            return;
        }
        if (this._mainView !== null){
            this._mainView.removeFromSuperview();
        }
        var sibling = this._leadingView;
        if (!sibling){
            sibling = this._trailingView;
        }
        if (!sibling){
            sibling = this._leadingDividerView;
        }
        if (mainView !== null){
            this.insertSubviewBelowSibling(mainView, sibling);
        }
        this._mainView = mainView;
        this.setNeedsLayout();
    },

    layoutSubviews: function(){
        UISplitView.$super.layoutSubviews.call(this);
        if (this._isVertical){
            this._layoutVertical();
        }else{
            if (this.mainHidden){
                this._layoutCompact();
            }else{
                this._layoutHorizontal();
            }
        }
    },

    canHideMain: JSReadOnlyProperty(),
    mainHidden: JSReadOnlyProperty(),

    getCanHideMain: function(){
        return UIDevice.shared !== null && UIDevice.shared.primaryPointerType === UIUserInterface.PointerType.touch;
    },

    getMainHidden: function(){
        return this.canHideMain && this.traitCollection.horizontalSizeClass === UIUserInterface.SizeClass.compact;
    },

    _getBestFitLayout: function(availableSize){
        var leadingFlex = 0;
        var trailingFlex = 0;
        var leadingSize = this._leadingSize;
        var trailingSize = this._trailingSize;
        var mainSize = this._minimumMainSize;
        var size = 0;
        if (!this._leadingFloats){
            if (this._leadingViewOpen && this._leadingView !== null){
                leadingFlex = leadingSize - this._minimumLeadingSize;
                size += this._leadingSize + this._leadingDividerView.layoutSize;
            }else if (this._leadingCollapsedSize > 0){
                size += this._leadingCollapsedSize + this._leadingDividerView.layoutSize;
            }
        }
        if (!this._trailingFloats){
            if (this._trailingViewOpen && this._trailingView !== null){
                trailingFlex = trailingSize - this._minimumTrailingSize;
                size += this._trailingSize + this._trailingDividerView.layoutSize;
            }else if (this._trailingCollapsedSize > 0){
                size += this._trailingCollapsedSize + this._trailingDividerView.layoutSize;
            }
        }
        size += mainSize;
        var over = size - availableSize;
        var totalFlex = leadingFlex + trailingFlex;
        if (over < 0){
            mainSize -= over;
        }else if (totalFlex > 0){
            if (totalFlex < over){
                over = totalFlex;
            }
            var cut = Math.floor(over * leadingFlex / totalFlex);
            leadingSize -= cut;
            over -= cut;
            trailingSize -= over;
        }

        var offset = 0;
        if (!this._leadingViewOpen || this._leadingView === null){
            offset -= leadingSize + this._leadingDividerView.layoutSize;
            if (this._leadingCollapsedSize > 0){
                offset += this._leadingCollapsedSize + this._leadingDividerView.layoutSize;
            }
        }
        var leadingOffset = offset;
        if (this.leadingFloats){
            offset = 0;
        }else{
            offset += leadingSize + this._leadingDividerView.layoutSize;
        }
        var mainOffset = offset;
        if (this.trailingFloats && this._trailingViewOpen && this._trailingView !== null){
            offset -= this._trailingSize;
        }else{
            offset += mainSize + this._trailingDividerView.layoutSize;
        }
        var trailingOffset = offset;

        return {
            leadingOffset: leadingOffset,
            leadingSize: leadingSize,
            mainOffset: mainOffset,
            mainSize: mainSize,
            trailingOffset: trailingOffset,
            trailingSize: trailingSize
        };
    },

    _layoutCompact: function(){
        if (this._leadingView !== null){
            this._leadingView.frame = this.bounds;
            this._leadingDividerView.hidden = true;
            this._trailingDividerView.hidden = true;
            if (this._trailingView !== null){
                this._trailingView.hidden = true;
            }
        }
    },

    _layoutHorizontal: function(){
        var layout = this._getBestFitLayout(this.bounds.size.width);
        var height = this.bounds.size.height;
        var dividerSize = 5;
        this._leadingDividerView.hidden = false;
        this._trailingDividerView.hidden = false;
        if (this._leadingView !== null){
            this._leadingView.frame = JSRect(layout.leadingOffset, 0, layout.leadingSize, height);
        }
        this._leadingDividerView.frame = JSRect(layout.leadingOffset + layout.leadingSize - this._leadingDividerView.layoutAdjustment, 0, this._leadingDividerView.hitSize, height);
        if (this._mainView !== null){
            this._mainView.frame = JSRect(layout.mainOffset, 0, layout.mainSize, height);
        }
        this._trailingDividerView.frame = JSRect(layout.trailingOffset - this._trailingDividerView.layoutAdjustment - this._trailingDividerView.layoutSize, 0, this._trailingDividerView.hitSize, height);
        if (this._trailingView !== null){
            this._trailingView.frame = JSRect(layout.trailingOffset, 0, layout.trailingSize, height);
        }
    },

    _layoutVertical: function(){
        var layout = this._getBestFitLayout(this.bounds.size.height);
        var width = this.bounds.size.width;
        var dividerSize = 5;
        if (this._leadingView !== null){
            this._leadingView.frame = JSRect(0, layout.leadingOffset, width, layout.leadingSize);
        }
        this._leadingDividerView.frame = JSRect(0, layout.leadingOffset + layout.leadingSize - this._leadingDividerView.layoutAdjustment, width, this._leadingDividerView.hitSize);
        if (this._mainView !== null){
            this._mainView.frame = JSRect(0, layout.mainOffset, width, layout.mainSize);
        }
        this._trailingDividerView.frame = JSRect(0, layout.trailingOffset - this._trailingDividerView.layoutAdjustment - this._trailingDividerView.layoutSize, width, this._trailingDividerView.hitSize);
        if (this._trailingView !== null){
            this._trailingView.frame = JSRect(0, layout.trailingOffset, width, layout.trailingSize);
        }
    },

    _startingLocationInDivider: null,

    beginDeviderResize: function(divider, location){
        this._startingLocationInDivider = JSPoint(location);
        if (divider == this._leadingDividerView){
            this._previousLeadingSize = this._leadingSize;
            if (!this._leadingViewOpen){
                this._leadingSize = this._minimumLeadingSize;
            }
        }else{
            this._previousTrailingSize = this._trailingSize;
            if (!this._trailingViewOpen){
                this._trailingSize = this._minimumTrailingSize;
            }
        }
    },

    endDividerResize: function(divider){
        if (divider == this._leadingDividerView){
            if (!this._leadingViewOpen){
                this.leadingSize = this._previousLeadingSize;
            }
        }else{
            if (!this._trailingViewOpen){
                this.trailingSize = this._previousTrailingSize;
            }
        }
        this._autosaveToUserDefaults();
    },

    dividerDragged: function(divider, location){
        var z, dividerSize, boundsSize, dividerZ;
        if (this._isVertical){
            z = location.y;
            dividerZ = this._startingLocationInDivider.y;
            dividerSize = divider.frame.size.height;
            boundsSize = this.bounds.size.height;
        }else{
            z = location.x;
            dividerZ = this._startingLocationInDivider.x;
            dividerSize = divider.frame.size.width;
            boundsSize = this.bounds.size.width;
        }
        if (divider === this._leadingDividerView){
            var maximumLeadingSize = boundsSize - this._minimumMainSize;
            if (this._trailingViewOpen){
                maximumLeadingSize -= this._trailingSize;
            }
            if (this._maximumLeadingSize < maximumLeadingSize){
                maximumLeadingSize = this._maximumLeadingSize;
            }
            var leadingSize = z - dividerZ + divider.layoutAdjustment;
            if (this._leadingCollapses && leadingSize < this._minimumLeadingSize / 2){
                if (this._leadingViewOpen){
                    this.leadingViewOpen = false;
                }
            }else{
                if (!this._leadingViewOpen){
                    this.leadingViewOpen = true;
                }
                if (leadingSize >= this._minimumLeadingSize && leadingSize <= maximumLeadingSize){
                    this._leadingSize = leadingSize;
                    this.setNeedsLayout();
                }
            }
        }else if (divider === this._trailingDividerView){
            var maximumTrailingSize = boundsSize - this._minimumMainSize;
            if (this._leadingViewOpen){
                maximumTrailingSize -= this._leadingSize;
            }
            if (this._maximumTrailingSize < maximumTrailingSize){
                maximumTrailingSize = this._maximumTrailingSize;
            }
            var trailingSize = boundsSize - z + dividerZ - divider.layoutAdjustment;
            if (this._trailingCollapses && trailingSize < this._minimumTrailingSize / 2){
                if (this._trailingViewOpen){
                    this.trailingViewOpen = false;
                }
            }else{
                if (!this._trailingViewOpen){
                    this.trailingViewOpen = true;
                }
                if (trailingSize >= this._minimumTrailingSize && trailingSize <= maximumTrailingSize){
                    this._trailingSize = trailingSize;
                    this.setNeedsLayout();
                }
            }
        }
        this.layoutIfNeeded();
    },

    // -------------------------------------------------------------------------
    // MARK: - Autosaving

    autosaveName: JSDynamicProperty('_autosaveName', null),

    setAutosaveName: function(autosaveName){
        this._autosaveName = autosaveName;
        this._loadAutosavedFromUserDefaults();
    },

    _autosaveToUserDefaults: function(){
        if (this.autosaveName === null){
            return;
        }
        JSUserDefaults.shared.setValueForKey({
            leadingSize: this._leadingSize,
            trailingSize: this._trailingSize,
            leadingOpen: this._leadingViewOpen,
            trailingOpen: this._trailingViewOpen
        }, this._autosaveName);
    },

    _loadAutosavedFromUserDefaults: function(){
        if (this.autosaveName === null){
            return;
        }
        var values = JSUserDefaults.shared.valueForKey(this.autosaveName);
        if (values !== null){
            this._leadingSize = values.leadingSize;
            this._trailingSize = values.trailingSize;
            this._leadingViewOpen = values.leadingOpen;
            this._trailingViewOpen = values.trailingOpen;
        }
    }

});