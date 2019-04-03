// #import UIKit
// #import Testkit
/* global JSClass, TKTestSuite, UIAnimationTransaction, UIBasicAnimation, UILayer, TKAssert, TKAssertEquals, TKAssertNotExactEquals, TKAssertExactEquals, TKAssertNull, TKAssertNotNull, JSColor */
'use strict';

JSClass("UIAnimationTransactionTests", TKTestSuite, {

    testBeginCommit: function(){
        TKAssertNull(UIAnimationTransaction.currentTransaction);
        UIAnimationTransaction.begin();
        TKAssertNotNull(UIAnimationTransaction.currentTransaction);
        UIAnimationTransaction.commit();
        TKAssertNull(UIAnimationTransaction.currentTransaction);
    },

    testTransactionNesting: function(){
        TKAssertNull(UIAnimationTransaction.currentTransaction);
        UIAnimationTransaction.begin();
        var transaction1 = UIAnimationTransaction.currentTransaction;
        TKAssertNotNull(transaction1);
        UIAnimationTransaction.begin();
        var transaction2 = UIAnimationTransaction.currentTransaction;
        TKAssertNotNull(transaction2);
        TKAssertNotExactEquals(transaction1, transaction2);
        UIAnimationTransaction.commit();
        TKAssertExactEquals(UIAnimationTransaction.currentTransaction, transaction1);
        UIAnimationTransaction.commit();
        TKAssertNull(UIAnimationTransaction.currentTransaction);
    },

    testCompletionFunction: function(){
        var layer = UILayer.init();
        UIAnimationTransaction.begin();
        var transaction = UIAnimationTransaction.currentTransaction;
        var animation1 = UIBasicAnimation.initWithKeyPath('frame.origin.x');
        animation1.fromValue = 0;
        layer.model.frame.origin.x = 100;
        animation1.duration = transaction.duration;
        animation1.layer = layer;
        transaction.addAnimation(animation1);
        var animation2 = UIBasicAnimation.initWithKeyPath('backgroundColor');
        animation2.fromValue = JSColor.whiteColor;
        layer.model.backgroundColor = JSColor.blackColor;
        animation2.duration = transaction.duration;
        animation2.layer = layer;
        transaction.addAnimation(animation2);
        var transactionCompleteCalled = false;
        transaction.completionFunction = function(){
            transactionCompleteCalled = true;
        };
        UIAnimationTransaction.commit();
        TKAssert(!transactionCompleteCalled);
        animation1.completionFunction(animation1);
        TKAssert(!transactionCompleteCalled);
        animation2.completionFunction(animation2);
        TKAssert(transactionCompleteCalled);
    }

});