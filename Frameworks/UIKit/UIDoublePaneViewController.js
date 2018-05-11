// #import "UIKit/UIViewController.js"
/* global JSClass, JSRect, JSColor, UICursor, JSReadOnlyProperty, JSDynamicProperty, UIViewController, UIDoublePaneViewController, UIView, _UIDoublePaneView, _UIDoublePaneDividerView, JSConstraintBox, UIViewPropertyAnimator */
'use strict';

JSClass("UIDoublePaneViewController", UIViewController, {

    leftPaneViewController: JSDynamicProperty('_leftPaneViewController', null),
    mainContentViewControlller: JSDynamicProperty('_mainContentViewController', null),
    rightPaneViewController: JSDynamicProperty('_rightPaneViewController', null),

    leftPaneOpen: JSReadOnlyProperty(null, null, 'isLeftPaneOpen'),
    rightPaneOpen: JSReadOnlyProperty(null, null, 'isRightPaneOpen'),

    _doublePaneView: null,

    initWithSpec: function(spec, values){
        UIDoublePaneViewController.$super.initWithSpec.call(this, spec, values);
        if ('leftPaneViewController' in values){
            this._leftPaneViewController = spec.resolvedValue(values.leftPaneViewController);
        }
        if ('rightPaneViewController' in values){
            this._rightPaneViewController = spec.resolvedValue(values.rightPaneViewController);
        }
        if ('mainContentViewController' in values){
            this._mainContentViewController = spec.resolvedValue(values.mainContentViewController);
        }
    },

    loadView: function(){
        var leftView = null;
        var rightView = null;
        var mainView = null;
        if (this._leftPaneViewController !== null){
            leftView = this._leftPaneViewController.view;
        }
        if (this._rightPaneViewController){
            rightView = this._rightPaneViewController.view;
        }
        if (this._mainContentViewController){
            mainView = this._mainContentViewController.view;
        }
        this._doublePaneView = _UIDoublePaneView.initWithViews(leftView, mainView, rightView);
        this._view = this._doublePaneView;
    },

    hideLeftPane: function(animated){
        if (this._doublePaneView.leftViewOpen){
            this.toggleLeftPane(animated);
        }
    },

    showLeftPane: function(animated){
        if (!this._doublePaneView.leftViewOpen){
            this.toggleLeftPane(animated);
        }
    },

    _leftPaneAnimator: null,

    toggleLeftPane: function(animated){
        if (this._leftPaneAnimator !== null){
            this._leftPaneAnimator.stop();
            this._leftPaneAnimator = null;
        }
        if (!animated){
            this._doublePaneView.leftViewOpen = !this._doublePaneView.leftViewOpen;
        }else{
            var animator = UIViewPropertyAnimator.initWithDuration(0.15);
            var self = this;
            this._doublePaneView.leftViewOpen = !this._doublePaneView.leftViewOpen;
            animator.addAnimations(function(){
                self._doublePaneView.layoutIfNeeded();
            });
            animator.addCompletion(function(){
                self._leftPaneAnimator = null;
            });
            this._leftPaneAnimator = animator;
            animator.start();
        }
    },

    isLeftPaneOpen: function(){
        return this._doublePaneView.leftViewOpen;
    },

    isRightPaneOpen: function(){
        return this._doublePaneView.rightViewOpen;
    },

    hideRightPane: function(animated){
        if (this._doublePaneView.rightViewOpen){
            this.toggleRightPane(animated);
        }
    },

    showRightPane: function(animated){
        if (!this._doublePaneView.rightViewOpen){
            this.toggleRightPane(animated);
        }
    },

    _rightPaneAnimator: null,

    toggleRightPane: function(animated){
        if (this._rightPaneAnimator !== null){
            this._rightPaneAnimator.stop();
            this._rightPaneAnimator = null;
        }
        if (!animated){
            this._doublePaneView.rightViewOpen = !this._doublePaneView.rightViewOpen;
            // TODO: viewWillAppear/viewDidAppear
        }else{
            var animator = UIViewPropertyAnimator.initWithDuration(0.15);
            var self = this;
            this._doublePaneView.rightViewOpen = !this._doublePaneView.rightViewOpen;
            animator.addAnimations(function(){
                self._doublePaneView.layoutIfNeeded();
            });
            animator.addCompletion(function(){
                self._rightPaneAnimator = null;
            });
            this._rightPaneAnimator = animator;
            animator.start();
        }
    },

    didTogglePane: function(){
    },

});

JSClass("_UIDoublePaneView", UIView, {

    leftView: JSDynamicProperty('_leftView', null),
    mainView: JSDynamicProperty('_mainView', null),
    rightView: JSDynamicProperty('_rightView', null),

    leftViewOpen: JSDynamicProperty('_leftViewOpen', true, 'isLeftViewOpen'),
    rightViewOpen: JSDynamicProperty('_rightViewOpen', true, 'isRightViewOpen'),

    _minimumLeftWidth: 150,
    _minimumRightWidth: 150,
    _minimumMainWidth: 400,

    _maxiumumLeftWidth: 350,
    _maximumRightWidth: 350,

    leftFloats: JSDynamicProperty('_leftFloats', false),
    rightFloats: JSDynamicProperty('_rightFloats', false),

    leftWidth: JSDynamicProperty('_leftWidth', 200),
    rightWidth: JSDynamicProperty('_rightWidth', 200),

    _leftDividerView: null,
    _rightDividerView: null,

    initWithViews: function(leftView, mainView, rightView){
        _UIDoublePaneView.$super.init.call(this);
        this._leftView = leftView;
        this._mainView = mainView;
        this._rightView = rightView;
        this._leftDividerView = _UIDoublePaneDividerView.initWithFrame(JSRect(0, 0, 5, this.bounds.size.height));
        this._rightDividerView = _UIDoublePaneDividerView.initWithFrame(JSRect(0, 0, 5, this.bounds.size.height));
        this.addSubview(this._mainView);
        this.addSubview(this._leftView);
        this.addSubview(this._rightView);
        this.addSubview(this._leftDividerView);
        this.addSubview(this._rightDividerView);
    },

    setLeftViewOpen: function(isOpen){
        if (isOpen != this._leftViewOpen){
            this._leftViewOpen = isOpen;
            this.setNeedsLayout();
            this.viewController.didTogglePane();
        }
    },

    setRightViewOpen: function(isOpen){
        if (isOpen != this._rightViewOpen){
            this._rightViewOpen = isOpen;
            this.setNeedsLayout();
            this.viewController.didTogglePane();
        }
    },

    setLeftWidth: function(width){
        this._leftWidth = width;
        this.setNeedsLayout();
    },

    setRightWidth: function(width){
        this._rightWidth = width;
        this.setNeedsLayout();
    },

    setLeftFloats: function(floats){
        this._leftFloats = floats;
        this.setNeedsLayout();
    },

    setRightFloats: function(floats){
        this._rightFloats = floats;
        this.setNeedsLayout();
    },

    setLeftView: function(leftView){
        if (leftView === this._leftView){
            return;
        }
        if (this._leftView !== null){
            this._leftView.removeFromSuperview();
        }
        this.insertSubviewBeforeSibling(leftView, this._leftDividerView);
        this._leftView = leftView;
        this.setNeedsLayout();
    },

    setRightView: function(rightView){
        if (rightView === this._rightView){
            return;
        }
        if (this._rightView !== null){
            this._rightView.removeFromSuperview();
        }
        this.insertSubviewBeforeSibling(rightView, this._leftDividerView);
        this._rightView = rightView;
        this.setNeedsLayout();
    },

    setMainView: function(mainView){
        if (mainView === this._mainView){
            return;
        }
        if (this._mainView !== null){
            this._mainView.removeFromSuperview();
        }
        this.insertSubviewBeforeSibling(mainView, this._leftView);
        this._mainView = mainView;
        this.setNeedsLayout();
    },

    layoutSubviews: function(){
        var x = 0;
        var size = this.bounds.size;
        if (!this._leftViewOpen){
            x -= this._leftWidth + this._leftDividerView.layoutWidth;
        }
        this._leftView.frame = JSRect(x, 0, this._leftWidth, size.height);
        x += this._leftWidth;
        this._leftDividerView.frame = JSRect(x - this._leftDividerView.layoutAdjustment, 0, this._leftDividerView.frame.size.width, size.height);
        x += this._leftDividerView.layoutWidth;
        if (this.leftFloats){
            x = 0;
        }
        var mainWidth = size.width - x;
        if (mainWidth < this._minimumMainWidth){
            mainWidth = this._minimumMainWidth;
        }
        if (this._rightViewOpen && !this.rightFloats){
            mainWidth -= this._rightDividerView.layoutWidth + this._rightWidth;
        }
        this._mainView.frame = JSRect(x, 0, mainWidth, size.height);
        x += mainWidth;
        if (this.rightFloats && this._rightViewOpen){
            x -= this._rightWidth + this._rightDividerView.layoutWidth;
        }
        this._rightDividerView.frame = JSRect(x - this._rightDividerView.layoutAdjustment, 0, this._rightDividerView.frame.size.width, size.height);
        x += this._rightDividerView.layoutWidth;
        this._rightView.frame = JSRect(x, 0, this._rightWidth, size.height);
    },

    dividerDragged: function(divider, x){
        if (divider === this._leftDividerView){
            var maximumLeftWidth = this.bounds.size.width - this._minimumMainWidth;
            if (this._rightViewOpen){
                maximumLeftWidth -= this._rightWidth;
            }
            if (this._maxiumumLeftWidth < maximumLeftWidth){
                maximumLeftWidth = this._maxiumumLeftWidth;
            }
            var leftWidth = x - this._leftDividerView.frame.size.width;
            if (x < this._minimumLeftWidth / 2){
                if (this._leftViewOpen){
                    this.leftViewOpen = false;
                }
            }else{
                if (!this._leftViewOpen){
                    this.leftViewOpen = true;
                }
                if (leftWidth >= this._minimumLeftWidth && leftWidth <= maximumLeftWidth){
                    this._leftWidth = leftWidth;
                    this.setNeedsLayout();
                }
            }
        }else if (divider === this._rightDividerView){
            var maximumRightWidth = this.bounds.size.width - this._minimumMainWidth;
            if (this._leftViewOpen){
                maximumRightWidth -= this._leftWidth;
            }
            if (this._maximumRightWidth < maximumRightWidth){
                maximumRightWidth = this._maximumRightWidth;
            }
            var rightWidth = this.bounds.size.width - x - this._leftDividerView.frame.size.width;
            if (x > this.bounds.size.width - this._minimumRightWidth / 2){
                if (this._rightViewOpen){
                    this.rightViewOpen = false;
                }
            }else{
                if (!this._rightViewOpen){
                    this.rightViewOpen = true;
                }
                if (rightWidth >= this._minimumRightWidth && rightWidth <= maximumRightWidth){
                    this._rightWidth = rightWidth;
                    this.setNeedsLayout();
                }
            }
        }
        this.layoutIfNeeded();
    }

});

JSClass("_UIDoublePaneDividerView", UIView, {

    layoutWidth: 1,
    lineView: null,
    layoutAdjustment: JSReadOnlyProperty(),

    initWithFrame: function(frame){
        _UIDoublePaneDividerView.$super.initWithFrame.call(this, frame);
        this.lineView = UIView.initWithConstraintBox(JSConstraintBox({width: this.layoutWidth, top: 0, bottom: 0}));
        this.lineView.backgroundColor = JSColor.blackColor();
        this.addSubview(this.lineView);
        this.cursor = UICursor.resizeLeftRight;
    },

    getLayoutAdjustment: function(){
        return (this.frame.size.width - this.layoutWidth) / 2;
    },

    mouseDown: function(event){
        this.cursor.push();
    },

    mouseUp: function(event){
        this.cursor.pop();
    },

    mouseDragged: function(event){
        this.superview.dividerDragged(this, event.locationInView(this.superview).x);
    }
});