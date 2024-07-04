// #import Foundation
// #import TestKit
"use strict";

JSClass("JSParagraphStyleTests", TKTestSuite, {

    testMarkerTextForListItemNumber: function(){
        var style = JSParagraphStyle.init();
        var markerText = style.markerTextForListItemNumber(1);
        TKAssertEquals(markerText, "•");
        markerText = style.markerTextForListItemNumber(2);
        TKAssertEquals(markerText, "•");
        markerText = style.markerTextForListItemNumber(30);
        TKAssertEquals(markerText, "•");
        markerText = style.markerTextForListItemNumber(400);
        TKAssertEquals(markerText, "•");
        markerText = style.markerTextForListItemNumber(5000);
        TKAssertEquals(markerText, "•");

        style.listMarker = "◦";
        markerText = style.markerTextForListItemNumber(1);
        TKAssertEquals(markerText, "◦");
        markerText = style.markerTextForListItemNumber(2);
        TKAssertEquals(markerText, "◦");
        markerText = style.markerTextForListItemNumber(30);
        TKAssertEquals(markerText, "◦");
        markerText = style.markerTextForListItemNumber(400);
        TKAssertEquals(markerText, "◦");
        markerText = style.markerTextForListItemNumber(5000);
        TKAssertEquals(markerText, "◦");

        style.listMarker = "-";
        markerText = style.markerTextForListItemNumber(1);
        TKAssertEquals(markerText, "-");
        markerText = style.markerTextForListItemNumber(2);
        TKAssertEquals(markerText, "-");
        markerText = style.markerTextForListItemNumber(30);
        TKAssertEquals(markerText, "-");
        markerText = style.markerTextForListItemNumber(400);
        TKAssertEquals(markerText, "-");
        markerText = style.markerTextForListItemNumber(5000);
        TKAssertEquals(markerText, "-");

        style.listMarker = "1";
        markerText = style.markerTextForListItemNumber(1);
        TKAssertEquals(markerText, "1.");
        markerText = style.markerTextForListItemNumber(2);
        TKAssertEquals(markerText, "2.");
        markerText = style.markerTextForListItemNumber(30);
        TKAssertEquals(markerText, "30.");
        markerText = style.markerTextForListItemNumber(400);
        TKAssertEquals(markerText, "400.");
        markerText = style.markerTextForListItemNumber(5000);
        TKAssertEquals(markerText, "5000.");

        style.listMarker = "1.";
        markerText = style.markerTextForListItemNumber(1);
        TKAssertEquals(markerText, "1.");
        markerText = style.markerTextForListItemNumber(2);
        TKAssertEquals(markerText, "2.");
        markerText = style.markerTextForListItemNumber(30);
        TKAssertEquals(markerText, "30.");
        markerText = style.markerTextForListItemNumber(400);
        TKAssertEquals(markerText, "400.");
        markerText = style.markerTextForListItemNumber(5000);
        TKAssertEquals(markerText, "5000.");

        style.listMarker = "1)";
        markerText = style.markerTextForListItemNumber(1);
        TKAssertEquals(markerText, "1)");
        markerText = style.markerTextForListItemNumber(2);
        TKAssertEquals(markerText, "2)");
        markerText = style.markerTextForListItemNumber(30);
        TKAssertEquals(markerText, "30)");
        markerText = style.markerTextForListItemNumber(400);
        TKAssertEquals(markerText, "400)");
        markerText = style.markerTextForListItemNumber(5000);
        TKAssertEquals(markerText, "5000)");

        style.listMarker = "(1)";
        markerText = style.markerTextForListItemNumber(1);
        TKAssertEquals(markerText, "(1)");
        markerText = style.markerTextForListItemNumber(2);
        TKAssertEquals(markerText, "(2)");
        markerText = style.markerTextForListItemNumber(30);
        TKAssertEquals(markerText, "(30)");
        markerText = style.markerTextForListItemNumber(400);
        TKAssertEquals(markerText, "(400)");
        markerText = style.markerTextForListItemNumber(5000);
        TKAssertEquals(markerText, "(5000)");

        style.listMarker = "a";
        markerText = style.markerTextForListItemNumber(1);
        TKAssertEquals(markerText, "a.");
        markerText = style.markerTextForListItemNumber(2);
        TKAssertEquals(markerText, "b.");
        markerText = style.markerTextForListItemNumber(30);
        TKAssertEquals(markerText, "dd.");
        markerText = style.markerTextForListItemNumber(60);
        TKAssertEquals(markerText, "hhh.");
        markerText = style.markerTextForListItemNumber(90);
        TKAssertEquals(markerText, "llll.");

        style.listMarker = "a.";
        markerText = style.markerTextForListItemNumber(1);
        TKAssertEquals(markerText, "a.");
        markerText = style.markerTextForListItemNumber(2);
        TKAssertEquals(markerText, "b.");
        markerText = style.markerTextForListItemNumber(30);
        TKAssertEquals(markerText, "dd.");
        markerText = style.markerTextForListItemNumber(60);
        TKAssertEquals(markerText, "hhh.");
        markerText = style.markerTextForListItemNumber(90);
        TKAssertEquals(markerText, "llll.");

        style.listMarker = "a)";
        markerText = style.markerTextForListItemNumber(1);
        TKAssertEquals(markerText, "a)");
        markerText = style.markerTextForListItemNumber(2);
        TKAssertEquals(markerText, "b)");
        markerText = style.markerTextForListItemNumber(30);
        TKAssertEquals(markerText, "dd)");
        markerText = style.markerTextForListItemNumber(60);
        TKAssertEquals(markerText, "hhh)");
        markerText = style.markerTextForListItemNumber(90);
        TKAssertEquals(markerText, "llll)");

        style.listMarker = "(a)";
        markerText = style.markerTextForListItemNumber(1);
        TKAssertEquals(markerText, "(a)");
        markerText = style.markerTextForListItemNumber(2);
        TKAssertEquals(markerText, "(b)");
        markerText = style.markerTextForListItemNumber(30);
        TKAssertEquals(markerText, "(dd)");
        markerText = style.markerTextForListItemNumber(60);
        TKAssertEquals(markerText, "(hhh)");
        markerText = style.markerTextForListItemNumber(90);
        TKAssertEquals(markerText, "(llll)");

        style.listMarker = "A";
        markerText = style.markerTextForListItemNumber(1);
        TKAssertEquals(markerText, "A.");
        markerText = style.markerTextForListItemNumber(2);
        TKAssertEquals(markerText, "B.");
        markerText = style.markerTextForListItemNumber(30);
        TKAssertEquals(markerText, "DD.");
        markerText = style.markerTextForListItemNumber(60);
        TKAssertEquals(markerText, "HHH.");
        markerText = style.markerTextForListItemNumber(90);
        TKAssertEquals(markerText, "LLLL.");

        style.listMarker = "A.";
        markerText = style.markerTextForListItemNumber(1);
        TKAssertEquals(markerText, "A.");
        markerText = style.markerTextForListItemNumber(2);
        TKAssertEquals(markerText, "B.");
        markerText = style.markerTextForListItemNumber(30);
        TKAssertEquals(markerText, "DD.");
        markerText = style.markerTextForListItemNumber(60);
        TKAssertEquals(markerText, "HHH.");
        markerText = style.markerTextForListItemNumber(90);
        TKAssertEquals(markerText, "LLLL.");

        style.listMarker = "A)";
        markerText = style.markerTextForListItemNumber(1);
        TKAssertEquals(markerText, "A)");
        markerText = style.markerTextForListItemNumber(2);
        TKAssertEquals(markerText, "B)");
        markerText = style.markerTextForListItemNumber(30);
        TKAssertEquals(markerText, "DD)");
        markerText = style.markerTextForListItemNumber(60);
        TKAssertEquals(markerText, "HHH)");
        markerText = style.markerTextForListItemNumber(90);
        TKAssertEquals(markerText, "LLLL)");

        style.listMarker = "(A)";
        markerText = style.markerTextForListItemNumber(1);
        TKAssertEquals(markerText, "(A)");
        markerText = style.markerTextForListItemNumber(2);
        TKAssertEquals(markerText, "(B)");
        markerText = style.markerTextForListItemNumber(30);
        TKAssertEquals(markerText, "(DD)");
        markerText = style.markerTextForListItemNumber(60);
        TKAssertEquals(markerText, "(HHH)");
        markerText = style.markerTextForListItemNumber(90);
        TKAssertEquals(markerText, "(LLLL)");
    }

});