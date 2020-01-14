// #import UIKit
/* global JSClass, UIWindowController, JSInsets, JSSize, JSPoint, JSRect, JSBundle, JSAttributedString, UICursor, JSURL, AboutWindowController */
'use strict';

JSClass("AboutWindowController", UIWindowController, {

    iconView: null,
    titleLabel: null,
    versionLabel: null,
    copyrightLabel: null,
    creditLabel: null,

    viewDidLoad: function(){
        AboutWindowController.$super.viewDidLoad.call(this);
        this.titleLabel.text = JSBundle.mainBundle.localizedStringForInfoKey("UIApplicationTitle");
        this.versionLabel.text = JSBundle.mainBundle.info.JSBundleVersion;
        this.copyrightLabel.text = JSBundle.mainBundle.localizedStringForInfoKey("JSCopyright");
        this.creditLabel.attributedText = this.attributedCredit();
    },

    attributedCredit: function(){
        var localizedCredit = JSBundle.mainBundle.localizedString("credit", "AboutWindowController");
        var attributedCredit = JSAttributedString.initWithString(localizedCredit);
        var url = JSURL.initWithString("https://jskit.dev");
        attributedCredit.replaceFormat("JSKit", {link: url, bold: true, cursor: UICursor.pointingHand});
        return attributedCredit;
    }

});