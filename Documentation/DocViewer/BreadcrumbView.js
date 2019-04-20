// #import UIKit
/* global JSClass, UIView, UILabel */
'use strict';

JSClass("BreadcrumbView", UIView, {

    label: null,

    awakeFromSpec: function(){
        this.label = UILabel.init();
        this.addSubview(this.label);
        this.setNeedsLayout();
    },

    layoutSubviews: function(){
        this.label.frame = this.bounds;
    },

    setComponents: function(components){
        var names = [];
        for (var i = 0, l = components.length; i < l; ++i){
            names.push(components[i].name);
        }
        this.label.text = names.join(" ⟩ ");
    }

});