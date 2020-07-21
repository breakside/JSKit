// #import QRKit
// #import TestKit
'use strict';

(function(){

JSClass("QRCodeDrawingTests", TKTestSuite, {

    testSize: function(){
        var drawing = QRCodeDrawing.initWithVersion(1);
        TKAssertEquals(drawing.size - drawing.quietSize - drawing.quietSize, 21);

        drawing = QRCodeDrawing.initWithVersion(2);
        TKAssertEquals(drawing.size - drawing.quietSize - drawing.quietSize, 25);

        drawing = QRCodeDrawing.initWithVersion(3);
        TKAssertEquals(drawing.size - drawing.quietSize - drawing.quietSize, 29);
        
        drawing = QRCodeDrawing.initWithVersion(4);
        TKAssertEquals(drawing.size - drawing.quietSize - drawing.quietSize, 33);
        
        drawing = QRCodeDrawing.initWithVersion(5);
        TKAssertEquals(drawing.size - drawing.quietSize - drawing.quietSize, 37);
        
        drawing = QRCodeDrawing.initWithVersion(6);
        TKAssertEquals(drawing.size - drawing.quietSize - drawing.quietSize, 41);
        
        drawing = QRCodeDrawing.initWithVersion(7);
        TKAssertEquals(drawing.size - drawing.quietSize - drawing.quietSize, 45);
        
        drawing = QRCodeDrawing.initWithVersion(8);
        TKAssertEquals(drawing.size - drawing.quietSize - drawing.quietSize, 49);
        
        drawing = QRCodeDrawing.initWithVersion(9);
        TKAssertEquals(drawing.size - drawing.quietSize - drawing.quietSize, 53);
        
        drawing = QRCodeDrawing.initWithVersion(10);
        TKAssertEquals(drawing.size - drawing.quietSize - drawing.quietSize, 57);
        
        drawing = QRCodeDrawing.initWithVersion(11);
        TKAssertEquals(drawing.size - drawing.quietSize - drawing.quietSize, 61);
        
        drawing = QRCodeDrawing.initWithVersion(12);
        TKAssertEquals(drawing.size - drawing.quietSize - drawing.quietSize, 65);
        
        drawing = QRCodeDrawing.initWithVersion(13);
        TKAssertEquals(drawing.size - drawing.quietSize - drawing.quietSize, 69);
        
        drawing = QRCodeDrawing.initWithVersion(14);
        TKAssertEquals(drawing.size - drawing.quietSize - drawing.quietSize, 73);
        
        drawing = QRCodeDrawing.initWithVersion(15);
        TKAssertEquals(drawing.size - drawing.quietSize - drawing.quietSize, 77);
        
        drawing = QRCodeDrawing.initWithVersion(16);
        TKAssertEquals(drawing.size - drawing.quietSize - drawing.quietSize, 81);
        
        drawing = QRCodeDrawing.initWithVersion(17);
        TKAssertEquals(drawing.size - drawing.quietSize - drawing.quietSize, 85);
        
        drawing = QRCodeDrawing.initWithVersion(18);
        TKAssertEquals(drawing.size - drawing.quietSize - drawing.quietSize, 89);
        
        drawing = QRCodeDrawing.initWithVersion(19);
        TKAssertEquals(drawing.size - drawing.quietSize - drawing.quietSize, 93);
        
        drawing = QRCodeDrawing.initWithVersion(20);
        TKAssertEquals(drawing.size - drawing.quietSize - drawing.quietSize, 97);
        
        drawing = QRCodeDrawing.initWithVersion(21);
        TKAssertEquals(drawing.size - drawing.quietSize - drawing.quietSize, 101);
        
        drawing = QRCodeDrawing.initWithVersion(22);
        TKAssertEquals(drawing.size - drawing.quietSize - drawing.quietSize, 105);
        
        drawing = QRCodeDrawing.initWithVersion(23);
        TKAssertEquals(drawing.size - drawing.quietSize - drawing.quietSize, 109);
        
        drawing = QRCodeDrawing.initWithVersion(24);
        TKAssertEquals(drawing.size - drawing.quietSize - drawing.quietSize, 113);
        
        drawing = QRCodeDrawing.initWithVersion(25);
        TKAssertEquals(drawing.size - drawing.quietSize - drawing.quietSize, 117);
        
        drawing = QRCodeDrawing.initWithVersion(26);
        TKAssertEquals(drawing.size - drawing.quietSize - drawing.quietSize, 121);
        
        drawing = QRCodeDrawing.initWithVersion(27);
        TKAssertEquals(drawing.size - drawing.quietSize - drawing.quietSize, 125);
        
        drawing = QRCodeDrawing.initWithVersion(28);
        TKAssertEquals(drawing.size - drawing.quietSize - drawing.quietSize, 129);
        
        drawing = QRCodeDrawing.initWithVersion(29);
        TKAssertEquals(drawing.size - drawing.quietSize - drawing.quietSize, 133);
        
        drawing = QRCodeDrawing.initWithVersion(30);
        TKAssertEquals(drawing.size - drawing.quietSize - drawing.quietSize, 137);
        
        drawing = QRCodeDrawing.initWithVersion(31);
        TKAssertEquals(drawing.size - drawing.quietSize - drawing.quietSize, 141);
        
        drawing = QRCodeDrawing.initWithVersion(32);
        TKAssertEquals(drawing.size - drawing.quietSize - drawing.quietSize, 145);
        
        drawing = QRCodeDrawing.initWithVersion(33);
        TKAssertEquals(drawing.size - drawing.quietSize - drawing.quietSize, 149);
        
        drawing = QRCodeDrawing.initWithVersion(34);
        TKAssertEquals(drawing.size - drawing.quietSize - drawing.quietSize, 153);
        
        drawing = QRCodeDrawing.initWithVersion(35);
        TKAssertEquals(drawing.size - drawing.quietSize - drawing.quietSize, 157);
        
        drawing = QRCodeDrawing.initWithVersion(36);
        TKAssertEquals(drawing.size - drawing.quietSize - drawing.quietSize, 161);
        
        drawing = QRCodeDrawing.initWithVersion(37);
        TKAssertEquals(drawing.size - drawing.quietSize - drawing.quietSize, 165);
        
        drawing = QRCodeDrawing.initWithVersion(38);
        TKAssertEquals(drawing.size - drawing.quietSize - drawing.quietSize, 169);
        
        drawing = QRCodeDrawing.initWithVersion(39);
        TKAssertEquals(drawing.size - drawing.quietSize - drawing.quietSize, 173);
        
        drawing = QRCodeDrawing.initWithVersion(40);
        TKAssertEquals(drawing.size - drawing.quietSize - drawing.quietSize, 177);
    },

    testQuietArea: function(){
        var drawing = QRCodeDrawing.initWithVersion(1);
        assertFlagsEqual(drawing, QRCodeDrawing.Flag.quiet, -4, -4, 4, 29); // left
        assertFlagsEqual(drawing, QRCodeDrawing.Flag.quiet, -4, -4, 29, 4); // top
        assertFlagsEqual(drawing, QRCodeDrawing.Flag.quiet, 21, -4, 4, 29); // right
        assertFlagsEqual(drawing, QRCodeDrawing.Flag.quiet, -4, 21, 29, 4); // bottom
        assertFlags(drawing, QRCodeDrawing.Flag.quiet, 0, 0, 21, 21, 0); // middle

        drawing = QRCodeDrawing.initWithVersion(7);
        assertFlagsEqual(drawing, QRCodeDrawing.Flag.quiet, -4, -4, 4, 53); // left
        assertFlagsEqual(drawing, QRCodeDrawing.Flag.quiet, -4, -4, 53, 4); // top
        assertFlagsEqual(drawing, QRCodeDrawing.Flag.quiet, 45, -4, 4, 53); // right
        assertFlagsEqual(drawing, QRCodeDrawing.Flag.quiet, -4, 45, 53, 4); // bottom
        assertFlags(drawing, QRCodeDrawing.Flag.quiet, 0, 0, 45, 45, 0); // middle

        drawing = QRCodeDrawing.initWithVersion(35);
        assertFlagsEqual(drawing, QRCodeDrawing.Flag.quiet, -4, -4, 4, 165); // left
        assertFlagsEqual(drawing, QRCodeDrawing.Flag.quiet, -4, -4, 165, 4); // top
        assertFlagsEqual(drawing, QRCodeDrawing.Flag.quiet, 157, -4, 4, 165); // right
        assertFlagsEqual(drawing, QRCodeDrawing.Flag.quiet, -5, 157, 165, 4); // bottom
        assertFlags(drawing, QRCodeDrawing.Flag.quiet, 0, 0, 157, 157, 0); // middle
    },

    testFinders: function(){
        var drawing = QRCodeDrawing.initWithVersion(1);
        // top left
        assertFlags(drawing, QRCodeDrawing.Flag.finder, 0, 0, 8, 8);
        assertFlags(drawing, QRCodeDrawing.Flag.on, 0, 0, 7, 1);
        assertFlags(drawing, QRCodeDrawing.Flag.on, 0, 0, 1, 7);
        assertFlags(drawing, QRCodeDrawing.Flag.on, 6, 0, 1, 7);
        assertFlags(drawing, QRCodeDrawing.Flag.on, 0, 6, 7, 1);
        assertFlags(drawing, QRCodeDrawing.Flag.on, 2, 2, 3, 3);
        // top right
        assertFlags(drawing, QRCodeDrawing.Flag.finder, 13, 0, 8, 8);
        assertFlags(drawing, QRCodeDrawing.Flag.on, 14, 0, 7, 1);
        assertFlags(drawing, QRCodeDrawing.Flag.on, 14, 0, 1, 7);
        assertFlags(drawing, QRCodeDrawing.Flag.on, 20, 0, 1, 7);
        assertFlags(drawing, QRCodeDrawing.Flag.on, 14, 6, 7, 1);
        assertFlags(drawing, QRCodeDrawing.Flag.on, 16, 2, 3, 3);
        // bottom left
        assertFlags(drawing, QRCodeDrawing.Flag.finder, 0, 13, 8, 8);
        assertFlags(drawing, QRCodeDrawing.Flag.on, 0, 14, 7, 1);
        assertFlags(drawing, QRCodeDrawing.Flag.on, 0, 14, 1, 7);
        assertFlags(drawing, QRCodeDrawing.Flag.on, 6, 14, 1, 7);
        assertFlags(drawing, QRCodeDrawing.Flag.on, 0, 20, 7, 1);
        assertFlags(drawing, QRCodeDrawing.Flag.on, 2, 16, 3, 3);


        drawing = QRCodeDrawing.initWithVersion(7);
        // top left
        assertFlags(drawing, QRCodeDrawing.Flag.finder, 0, 0, 8, 8);
        assertFlags(drawing, QRCodeDrawing.Flag.on, 0, 0, 7, 1);
        assertFlags(drawing, QRCodeDrawing.Flag.on, 0, 0, 1, 7);
        assertFlags(drawing, QRCodeDrawing.Flag.on, 6, 0, 1, 7);
        assertFlags(drawing, QRCodeDrawing.Flag.on, 0, 6, 7, 1);
        assertFlags(drawing, QRCodeDrawing.Flag.on, 2, 2, 3, 3);
        // top right
        assertFlags(drawing, QRCodeDrawing.Flag.finder, 37, 0, 8, 8);
        assertFlags(drawing, QRCodeDrawing.Flag.on, 38, 0, 7, 1);
        assertFlags(drawing, QRCodeDrawing.Flag.on, 38, 0, 1, 7);
        assertFlags(drawing, QRCodeDrawing.Flag.on, 44, 0, 1, 7);
        assertFlags(drawing, QRCodeDrawing.Flag.on, 38, 6, 7, 1);
        assertFlags(drawing, QRCodeDrawing.Flag.on, 40, 2, 3, 3);
        // bottom left
        assertFlags(drawing, QRCodeDrawing.Flag.finder, 0, 37, 8, 8);
        assertFlags(drawing, QRCodeDrawing.Flag.on, 0, 38, 7, 1);
        assertFlags(drawing, QRCodeDrawing.Flag.on, 0, 38, 1, 7);
        assertFlags(drawing, QRCodeDrawing.Flag.on, 6, 38, 1, 7);
        assertFlags(drawing, QRCodeDrawing.Flag.on, 0, 44, 7, 1);
        assertFlags(drawing, QRCodeDrawing.Flag.on, 2, 40, 3, 3);


        drawing = QRCodeDrawing.initWithVersion(35);
        // top left
        assertFlags(drawing, QRCodeDrawing.Flag.finder, 0, 0, 8, 8);
        assertFlags(drawing, QRCodeDrawing.Flag.on, 0, 0, 7, 1);
        assertFlags(drawing, QRCodeDrawing.Flag.on, 0, 0, 1, 7);
        assertFlags(drawing, QRCodeDrawing.Flag.on, 6, 0, 1, 7);
        assertFlags(drawing, QRCodeDrawing.Flag.on, 0, 6, 7, 1);
        assertFlags(drawing, QRCodeDrawing.Flag.on, 2, 2, 3, 3);
        // top right
        assertFlags(drawing, QRCodeDrawing.Flag.finder, 149, 0, 8, 8);
        assertFlags(drawing, QRCodeDrawing.Flag.on, 150, 0, 7, 1);
        assertFlags(drawing, QRCodeDrawing.Flag.on, 150, 0, 1, 7);
        assertFlags(drawing, QRCodeDrawing.Flag.on, 156, 0, 1, 7);
        assertFlags(drawing, QRCodeDrawing.Flag.on, 150, 6, 7, 1);
        assertFlags(drawing, QRCodeDrawing.Flag.on, 152, 2, 3, 3);
        // bottom left
        assertFlags(drawing, QRCodeDrawing.Flag.finder, 0, 149, 8, 8);
        assertFlags(drawing, QRCodeDrawing.Flag.on, 0, 150, 7, 1);
        assertFlags(drawing, QRCodeDrawing.Flag.on, 0, 150, 1, 7);
        assertFlags(drawing, QRCodeDrawing.Flag.on, 6, 150, 1, 7);
        assertFlags(drawing, QRCodeDrawing.Flag.on, 0, 156, 7, 1);
        assertFlags(drawing, QRCodeDrawing.Flag.on, 2, 152, 3, 3);
    },

    testTiming: function(){
        var drawing = QRCodeDrawing.initWithVersion(1);
        // vertical
        assertFlags(drawing, QRCodeDrawing.Flag.on, 6, 8, 1, 1);
        assertFlags(drawing, QRCodeDrawing.Flag.on, 6, 10, 1, 1);
        assertFlags(drawing, QRCodeDrawing.Flag.on, 6, 12, 1, 1);
        assertFlags(drawing, QRCodeDrawing.Flag.on, 6, 9, 1, 1, 0);
        assertFlags(drawing, QRCodeDrawing.Flag.on, 6, 11, 1, 1, 0);
        assertFlags(drawing, QRCodeDrawing.Flag.timing, 6, 8, 1, 5);
        // horizontal
        assertFlags(drawing, QRCodeDrawing.Flag.on, 8, 6, 1, 1);
        assertFlags(drawing, QRCodeDrawing.Flag.on, 10, 6, 1, 1);
        assertFlags(drawing, QRCodeDrawing.Flag.on, 12, 6, 1, 1);
        assertFlags(drawing, QRCodeDrawing.Flag.on, 9, 6, 1, 1, 0);
        assertFlags(drawing, QRCodeDrawing.Flag.on, 11, 6, 1, 1, 0);
        assertFlags(drawing, QRCodeDrawing.Flag.timing, 8, 6, 5, 1);

        drawing = QRCodeDrawing.initWithVersion(7);
        // vertical
        assertFlags(drawing, QRCodeDrawing.Flag.on, 6, 8, 1, 1);
        assertFlags(drawing, QRCodeDrawing.Flag.on, 6, 10, 1, 1);
        assertFlags(drawing, QRCodeDrawing.Flag.on, 6, 12, 1, 1);
        assertFlags(drawing, QRCodeDrawing.Flag.on, 6, 14, 1, 1);
        assertFlags(drawing, QRCodeDrawing.Flag.on, 6, 16, 1, 1);
        assertFlags(drawing, QRCodeDrawing.Flag.on, 6, 18, 1, 1);
        assertFlags(drawing, QRCodeDrawing.Flag.on, 6, 20, 1, 1);
        assertFlags(drawing, QRCodeDrawing.Flag.on, 6, 22, 1, 1);
        assertFlags(drawing, QRCodeDrawing.Flag.on, 6, 24, 1, 1);
        assertFlags(drawing, QRCodeDrawing.Flag.on, 6, 26, 1, 1);
        assertFlags(drawing, QRCodeDrawing.Flag.on, 6, 28, 1, 1);
        assertFlags(drawing, QRCodeDrawing.Flag.on, 6, 30, 1, 1);
        assertFlags(drawing, QRCodeDrawing.Flag.on, 6, 32, 1, 1);
        assertFlags(drawing, QRCodeDrawing.Flag.on, 6, 34, 1, 1);
        assertFlags(drawing, QRCodeDrawing.Flag.on, 6, 36, 1, 1);
        assertFlags(drawing, QRCodeDrawing.Flag.on, 6, 9, 1, 1, 0);
        assertFlags(drawing, QRCodeDrawing.Flag.on, 6, 11, 1, 1, 0);
        assertFlags(drawing, QRCodeDrawing.Flag.on, 6, 13, 1, 1, 0);
        assertFlags(drawing, QRCodeDrawing.Flag.on, 6, 15, 1, 1, 0);
        assertFlags(drawing, QRCodeDrawing.Flag.on, 6, 17, 1, 1, 0);
        assertFlags(drawing, QRCodeDrawing.Flag.on, 6, 19, 1, 1, 0);
        assertFlags(drawing, QRCodeDrawing.Flag.on, 6, 21, 1, 1, 0);
        assertFlags(drawing, QRCodeDrawing.Flag.on, 6, 23, 1, 1, 0);
        assertFlags(drawing, QRCodeDrawing.Flag.on, 6, 25, 1, 1, 0);
        assertFlags(drawing, QRCodeDrawing.Flag.on, 6, 27, 1, 1, 0);
        assertFlags(drawing, QRCodeDrawing.Flag.on, 6, 29, 1, 1, 0);
        assertFlags(drawing, QRCodeDrawing.Flag.on, 6, 31, 1, 1, 0);
        assertFlags(drawing, QRCodeDrawing.Flag.on, 6, 33, 1, 1, 0);
        assertFlags(drawing, QRCodeDrawing.Flag.on, 6, 35, 1, 1, 0);
        assertFlags(drawing, QRCodeDrawing.Flag.timing, 6, 8, 1, 29);
        // horizontal
        assertFlags(drawing, QRCodeDrawing.Flag.on, 8, 6, 1, 1);
        assertFlags(drawing, QRCodeDrawing.Flag.on, 10, 6, 1, 1);
        assertFlags(drawing, QRCodeDrawing.Flag.on, 12, 6, 1, 1);
        assertFlags(drawing, QRCodeDrawing.Flag.on, 14, 6, 1, 1);
        assertFlags(drawing, QRCodeDrawing.Flag.on, 16, 6, 1, 1);
        assertFlags(drawing, QRCodeDrawing.Flag.on, 18, 6, 1, 1);
        assertFlags(drawing, QRCodeDrawing.Flag.on, 20, 6, 1, 1);
        assertFlags(drawing, QRCodeDrawing.Flag.on, 22, 6, 1, 1);
        assertFlags(drawing, QRCodeDrawing.Flag.on, 24, 6, 1, 1);
        assertFlags(drawing, QRCodeDrawing.Flag.on, 26, 6, 1, 1);
        assertFlags(drawing, QRCodeDrawing.Flag.on, 28, 6, 1, 1);
        assertFlags(drawing, QRCodeDrawing.Flag.on, 30, 6, 1, 1);
        assertFlags(drawing, QRCodeDrawing.Flag.on, 32, 6, 1, 1);
        assertFlags(drawing, QRCodeDrawing.Flag.on, 34, 6, 1, 1);
        assertFlags(drawing, QRCodeDrawing.Flag.on, 36, 6, 1, 1);
        assertFlags(drawing, QRCodeDrawing.Flag.on, 9, 6, 1, 1, 0);
        assertFlags(drawing, QRCodeDrawing.Flag.on, 11, 6, 1, 1, 0);
        assertFlags(drawing, QRCodeDrawing.Flag.on, 13, 6, 1, 1, 0);
        assertFlags(drawing, QRCodeDrawing.Flag.on, 15, 6, 1, 1, 0);
        assertFlags(drawing, QRCodeDrawing.Flag.on, 17, 6, 1, 1, 0);
        assertFlags(drawing, QRCodeDrawing.Flag.on, 19, 6, 1, 1, 0);
        assertFlags(drawing, QRCodeDrawing.Flag.on, 21, 6, 1, 1, 0);
        assertFlags(drawing, QRCodeDrawing.Flag.on, 23, 6, 1, 1, 0);
        assertFlags(drawing, QRCodeDrawing.Flag.on, 25, 6, 1, 1, 0);
        assertFlags(drawing, QRCodeDrawing.Flag.on, 27, 6, 1, 1, 0);
        assertFlags(drawing, QRCodeDrawing.Flag.on, 29, 6, 1, 1, 0);
        assertFlags(drawing, QRCodeDrawing.Flag.on, 31, 6, 1, 1, 0);
        assertFlags(drawing, QRCodeDrawing.Flag.on, 33, 6, 1, 1, 0);
        assertFlags(drawing, QRCodeDrawing.Flag.on, 25, 6, 1, 1, 0);
        assertFlags(drawing, QRCodeDrawing.Flag.timing, 8, 6, 29, 1);
    },

    testAlignment: function(){
        var drawing = QRCodeDrawing.initWithVersion(1);
        assertFlags(drawing, QRCodeDrawing.Flag.alignment, 0, 0, 21, 21, 0);

        drawing = QRCodeDrawing.initWithVersion(2);
        assertFlags(drawing, QRCodeDrawing.Flag.alignment, 16, 16, 5, 5);

        drawing = QRCodeDrawing.initWithVersion(7);
        assertFlags(drawing, QRCodeDrawing.Flag.alignment, 4, 20, 5, 5);
        assertFlags(drawing, QRCodeDrawing.Flag.alignment, 20, 4, 5, 5);
        assertFlags(drawing, QRCodeDrawing.Flag.alignment, 20, 20, 5, 5);
        assertFlags(drawing, QRCodeDrawing.Flag.alignment, 20, 36, 5, 5);
        assertFlags(drawing, QRCodeDrawing.Flag.alignment, 36, 20, 5, 5);
        assertFlags(drawing, QRCodeDrawing.Flag.alignment, 36, 36, 5, 5);
    },

    testFormatArea: function(){
        var drawing = QRCodeDrawing.initWithVersion(1);
        // top left
        assertFlags(drawing, QRCodeDrawing.Flag.format, 8, 0, 1, 6);
        assertFlags(drawing, QRCodeDrawing.Flag.format, 8, 7, 1, 2);
        assertFlags(drawing, QRCodeDrawing.Flag.format, 0, 8, 6, 1);
        assertFlags(drawing, QRCodeDrawing.Flag.format, 7, 8, 2, 1);
        // // upper right
        assertFlags(drawing, QRCodeDrawing.Flag.format, 13, 8, 8, 1);
        // // lower left
        assertFlags(drawing, QRCodeDrawing.Flag.format, 8, 13, 1, 8);


        drawing = QRCodeDrawing.initWithVersion(7);
        // top left
        assertFlags(drawing, QRCodeDrawing.Flag.format, 8, 0, 1, 6);
        assertFlags(drawing, QRCodeDrawing.Flag.format, 8, 7, 1, 2);
        assertFlags(drawing, QRCodeDrawing.Flag.format, 0, 8, 6, 1);
        assertFlags(drawing, QRCodeDrawing.Flag.format, 7, 8, 2, 1);
        // // upper right
        assertFlags(drawing, QRCodeDrawing.Flag.format, 37, 8, 8, 1);
        // // lower left
        assertFlags(drawing, QRCodeDrawing.Flag.format, 8, 37, 1, 8);


        drawing = QRCodeDrawing.initWithVersion(35);
        // top left
        assertFlags(drawing, QRCodeDrawing.Flag.format, 8, 0, 1, 6);
        assertFlags(drawing, QRCodeDrawing.Flag.format, 8, 7, 1, 2);
        assertFlags(drawing, QRCodeDrawing.Flag.format, 0, 8, 6, 1);
        assertFlags(drawing, QRCodeDrawing.Flag.format, 7, 8, 2, 1);
        // // upper right
        assertFlags(drawing, QRCodeDrawing.Flag.format, 149, 8, 8, 1);
        // // lower left
        assertFlags(drawing, QRCodeDrawing.Flag.format, 8, 149, 1, 8);
    },

    testVersionArea: function(){
        var drawing = QRCodeDrawing.initWithVersion(1);
        assertFlags(drawing, QRCodeDrawing.Flag.version, 0, 0, 21, 21, 0);

        drawing = QRCodeDrawing.initWithVersion(6);
        assertFlags(drawing, QRCodeDrawing.Flag.version, 0, 0, 21, 21, 0);

        drawing = QRCodeDrawing.initWithVersion(7);
        // top right
        assertFlags(drawing, QRCodeDrawing.Flag.version, 34, 0, 3, 6);
        // bottom left
        assertFlags(drawing, QRCodeDrawing.Flag.version, 0, 34, 6, 3);

        drawing = QRCodeDrawing.initWithVersion(35);
        // top right
        assertFlags(drawing, QRCodeDrawing.Flag.version, 146, 0, 3, 6);
        // bottom left
        assertFlags(drawing, QRCodeDrawing.Flag.version, 0, 146, 6, 3);
    },

    testDrawFormat: function(){
        var drawing = QRCodeDrawing.initWithVersion(1);
        drawing.drawFormat(0x55AA);
        assertFlags(drawing, QRCodeDrawing.Flag.on, 0, 8, 1, 1);
        assertFlags(drawing, QRCodeDrawing.Flag.on, 1, 8, 1, 1, 0);
        assertFlags(drawing, QRCodeDrawing.Flag.on, 2, 8, 1, 1);
        assertFlags(drawing, QRCodeDrawing.Flag.on, 3, 8, 1, 1, 0);
        assertFlags(drawing, QRCodeDrawing.Flag.on, 4, 8, 1, 1);
        assertFlags(drawing, QRCodeDrawing.Flag.on, 5, 8, 1, 1, 0);
        assertFlags(drawing, QRCodeDrawing.Flag.on, 7, 8, 1, 1);
        assertFlags(drawing, QRCodeDrawing.Flag.on, 8, 8, 1, 1);
        assertFlags(drawing, QRCodeDrawing.Flag.on, 8, 7, 1, 1, 0);
        assertFlags(drawing, QRCodeDrawing.Flag.on, 8, 5, 1, 1);
        assertFlags(drawing, QRCodeDrawing.Flag.on, 8, 4, 1, 1, 0);
        assertFlags(drawing, QRCodeDrawing.Flag.on, 8, 3, 1, 1);
        assertFlags(drawing, QRCodeDrawing.Flag.on, 8, 2, 1, 1, 0);
        assertFlags(drawing, QRCodeDrawing.Flag.on, 8, 1, 1, 1);
        assertFlags(drawing, QRCodeDrawing.Flag.on, 8, 0, 1, 1, 0);
        assertFlags(drawing, QRCodeDrawing.Flag.on, 13, 8, 1, 1);
        assertFlags(drawing, QRCodeDrawing.Flag.on, 14, 8, 1, 1, 0);
        assertFlags(drawing, QRCodeDrawing.Flag.on, 15, 8, 1, 1);
        assertFlags(drawing, QRCodeDrawing.Flag.on, 16, 8, 1, 1, 0);
        assertFlags(drawing, QRCodeDrawing.Flag.on, 17, 8, 1, 1);
        assertFlags(drawing, QRCodeDrawing.Flag.on, 18, 8, 1, 1, 0);
        assertFlags(drawing, QRCodeDrawing.Flag.on, 19, 8, 1, 1);
        assertFlags(drawing, QRCodeDrawing.Flag.on, 20, 8, 1, 1, 0);
        assertFlags(drawing, QRCodeDrawing.Flag.on, 8, 13, 1, 1);
        assertFlags(drawing, QRCodeDrawing.Flag.on, 8, 14, 1, 1);
        assertFlags(drawing, QRCodeDrawing.Flag.on, 8, 15, 1, 1, 0);
        assertFlags(drawing, QRCodeDrawing.Flag.on, 8, 16, 1, 1);
        assertFlags(drawing, QRCodeDrawing.Flag.on, 8, 17, 1, 1, 0);
        assertFlags(drawing, QRCodeDrawing.Flag.on, 8, 18, 1, 1);
        assertFlags(drawing, QRCodeDrawing.Flag.on, 8, 19, 1, 1, 0);
        assertFlags(drawing, QRCodeDrawing.Flag.on, 8, 20, 1, 1);
        
        drawing = QRCodeDrawing.initWithVersion(7);
        drawing.drawFormat(0x55AA);
        assertFlags(drawing, QRCodeDrawing.Flag.on, 0, 8, 1, 1);
        assertFlags(drawing, QRCodeDrawing.Flag.on, 1, 8, 1, 1, 0);
        assertFlags(drawing, QRCodeDrawing.Flag.on, 2, 8, 1, 1);
        assertFlags(drawing, QRCodeDrawing.Flag.on, 3, 8, 1, 1, 0);
        assertFlags(drawing, QRCodeDrawing.Flag.on, 4, 8, 1, 1);
        assertFlags(drawing, QRCodeDrawing.Flag.on, 5, 8, 1, 1, 0);
        assertFlags(drawing, QRCodeDrawing.Flag.on, 7, 8, 1, 1);
        assertFlags(drawing, QRCodeDrawing.Flag.on, 8, 8, 1, 1);
        assertFlags(drawing, QRCodeDrawing.Flag.on, 8, 7, 1, 1, 0);
        assertFlags(drawing, QRCodeDrawing.Flag.on, 8, 5, 1, 1);
        assertFlags(drawing, QRCodeDrawing.Flag.on, 8, 4, 1, 1, 0);
        assertFlags(drawing, QRCodeDrawing.Flag.on, 8, 3, 1, 1);
        assertFlags(drawing, QRCodeDrawing.Flag.on, 8, 2, 1, 1, 0);
        assertFlags(drawing, QRCodeDrawing.Flag.on, 8, 1, 1, 1);
        assertFlags(drawing, QRCodeDrawing.Flag.on, 8, 0, 1, 1, 0);
        assertFlags(drawing, QRCodeDrawing.Flag.on, 37, 8, 1, 1);
        assertFlags(drawing, QRCodeDrawing.Flag.on, 38, 8, 1, 1, 0);
        assertFlags(drawing, QRCodeDrawing.Flag.on, 39, 8, 1, 1);
        assertFlags(drawing, QRCodeDrawing.Flag.on, 40, 8, 1, 1, 0);
        assertFlags(drawing, QRCodeDrawing.Flag.on, 41, 8, 1, 1);
        assertFlags(drawing, QRCodeDrawing.Flag.on, 42, 8, 1, 1, 0);
        assertFlags(drawing, QRCodeDrawing.Flag.on, 43, 8, 1, 1);
        assertFlags(drawing, QRCodeDrawing.Flag.on, 44, 8, 1, 1, 0);
        assertFlags(drawing, QRCodeDrawing.Flag.on, 8, 37, 1, 1);
        assertFlags(drawing, QRCodeDrawing.Flag.on, 8, 38, 1, 1);
        assertFlags(drawing, QRCodeDrawing.Flag.on, 8, 39, 1, 1, 0);
        assertFlags(drawing, QRCodeDrawing.Flag.on, 8, 40, 1, 1);
        assertFlags(drawing, QRCodeDrawing.Flag.on, 8, 41, 1, 1, 0);
        assertFlags(drawing, QRCodeDrawing.Flag.on, 8, 42, 1, 1);
        assertFlags(drawing, QRCodeDrawing.Flag.on, 8, 43, 1, 1, 0);
        assertFlags(drawing, QRCodeDrawing.Flag.on, 8, 44, 1, 1);
    },

    testDrawVersion: function(){
        var drawing = QRCodeDrawing.initWithVersion(1);
        drawing.drawVersion(0x3FFFF);
        assertFlags(drawing, QRCodeDrawing.Flag.on, 12, 0, 1, 1, 0);

        drawing = QRCodeDrawing.initWithVersion(7);
        drawing.drawVersion(0x3FFFF);
        assertFlags(drawing, QRCodeDrawing.Flag.on, 34, 0, 3, 6);
        assertFlags(drawing, QRCodeDrawing.Flag.on, 0, 34, 6, 3);

        drawing = QRCodeDrawing.initWithVersion(7);
        drawing.drawVersion(0x338F0);
        assertFlags(drawing, QRCodeDrawing.Flag.on, 34, 0, 1, 1, 0);
        assertFlags(drawing, QRCodeDrawing.Flag.on, 35, 0, 1, 1, 0);
        assertFlags(drawing, QRCodeDrawing.Flag.on, 36, 0, 1, 1, 0);
        assertFlags(drawing, QRCodeDrawing.Flag.on, 34, 1, 1, 1, 0);
        assertFlags(drawing, QRCodeDrawing.Flag.on, 35, 1, 1, 1);
        assertFlags(drawing, QRCodeDrawing.Flag.on, 36, 1, 1, 1);
        assertFlags(drawing, QRCodeDrawing.Flag.on, 34, 2, 1, 1);
        assertFlags(drawing, QRCodeDrawing.Flag.on, 35, 2, 1, 1);
        assertFlags(drawing, QRCodeDrawing.Flag.on, 36, 2, 1, 1, 0);
        assertFlags(drawing, QRCodeDrawing.Flag.on, 34, 3, 1, 1, 0);
        assertFlags(drawing, QRCodeDrawing.Flag.on, 35, 3, 1, 1, 0);
        assertFlags(drawing, QRCodeDrawing.Flag.on, 36, 3, 1, 1);
        assertFlags(drawing, QRCodeDrawing.Flag.on, 34, 4, 1, 1);
        assertFlags(drawing, QRCodeDrawing.Flag.on, 35, 4, 1, 1);
        assertFlags(drawing, QRCodeDrawing.Flag.on, 36, 4, 1, 1, 0);
        assertFlags(drawing, QRCodeDrawing.Flag.on, 34, 5, 1, 1, 0);
        assertFlags(drawing, QRCodeDrawing.Flag.on, 35, 5, 1, 1);
        assertFlags(drawing, QRCodeDrawing.Flag.on, 36, 5, 1, 1);
        assertFlags(drawing, QRCodeDrawing.Flag.on, 0, 34, 1, 1, 0);
        assertFlags(drawing, QRCodeDrawing.Flag.on, 0, 35, 1, 1, 0);
        assertFlags(drawing, QRCodeDrawing.Flag.on, 0, 36, 1, 1, 0);
        assertFlags(drawing, QRCodeDrawing.Flag.on, 1, 34, 1, 1, 0);
        assertFlags(drawing, QRCodeDrawing.Flag.on, 1, 35, 1, 1);
        assertFlags(drawing, QRCodeDrawing.Flag.on, 1, 36, 1, 1);
        assertFlags(drawing, QRCodeDrawing.Flag.on, 2, 34, 1, 1);
        assertFlags(drawing, QRCodeDrawing.Flag.on, 2, 35, 1, 1);
        assertFlags(drawing, QRCodeDrawing.Flag.on, 2, 36, 1, 1, 0);
        assertFlags(drawing, QRCodeDrawing.Flag.on, 3, 34, 1, 1, 0);
        assertFlags(drawing, QRCodeDrawing.Flag.on, 3, 35, 1, 1, 0);
        assertFlags(drawing, QRCodeDrawing.Flag.on, 3, 36, 1, 1);
        assertFlags(drawing, QRCodeDrawing.Flag.on, 4, 34, 1, 1);
        assertFlags(drawing, QRCodeDrawing.Flag.on, 4, 35, 1, 1);
        assertFlags(drawing, QRCodeDrawing.Flag.on, 4, 36, 1, 1, 0);
        assertFlags(drawing, QRCodeDrawing.Flag.on, 5, 34, 1, 1, 0);
        assertFlags(drawing, QRCodeDrawing.Flag.on, 5, 35, 1, 1);
        assertFlags(drawing, QRCodeDrawing.Flag.on, 5, 36, 1, 1);

        drawing = QRCodeDrawing.initWithVersion(35);
        drawing.drawVersion(0x3FFFF);
        assertFlags(drawing, QRCodeDrawing.Flag.on, 146, 0, 3, 6);
        assertFlags(drawing, QRCodeDrawing.Flag.on, 0, 146, 6, 3);
    },

    testDrawCodeword: function(){
        var drawing = QRCodeDrawing.initWithVersion(1);
        drawing.drawCodeword(0xFF);
        assertFlags(drawing, QRCodeDrawing.Flag.on, 19, 17, 2, 4);
        drawing.drawCodeword(0x00);
        assertFlags(drawing, QRCodeDrawing.Flag.on, 19, 13, 2, 4, 0);
        drawing.drawCodeword(0xAA);
        assertFlags(drawing, QRCodeDrawing.Flag.on, 20, 12, 1, 1);
        assertFlags(drawing, QRCodeDrawing.Flag.on, 19, 12, 1, 1, 0);
        assertFlags(drawing, QRCodeDrawing.Flag.on, 20, 11, 1, 1);
        assertFlags(drawing, QRCodeDrawing.Flag.on, 19, 11, 1, 1, 0);
        assertFlags(drawing, QRCodeDrawing.Flag.on, 20, 10, 1, 1);
        assertFlags(drawing, QRCodeDrawing.Flag.on, 19, 10, 1, 1, 0);
        assertFlags(drawing, QRCodeDrawing.Flag.on, 20, 9, 1, 1);
        assertFlags(drawing, QRCodeDrawing.Flag.on, 19, 9, 1, 1, 0);
        drawing.drawCodeword(0xE5);
        assertFlags(drawing, QRCodeDrawing.Flag.on, 18, 9, 1, 1);
        assertFlags(drawing, QRCodeDrawing.Flag.on, 17, 9, 1, 1);
        assertFlags(drawing, QRCodeDrawing.Flag.on, 18, 10, 1, 1);
        assertFlags(drawing, QRCodeDrawing.Flag.on, 17, 10, 1, 1, 0);
        assertFlags(drawing, QRCodeDrawing.Flag.on, 18, 11, 1, 1, 0);
        assertFlags(drawing, QRCodeDrawing.Flag.on, 17, 11, 1, 1);
        assertFlags(drawing, QRCodeDrawing.Flag.on, 18, 12, 1, 1, 0);
        assertFlags(drawing, QRCodeDrawing.Flag.on, 17, 12, 1, 1);
        drawing.drawCodeword(0xFF);
        assertFlags(drawing, QRCodeDrawing.Flag.on, 17, 13, 2, 4);
        drawing.drawCodeword(0x00);
        assertFlags(drawing, QRCodeDrawing.Flag.on, 17, 17, 2, 4, 0);
        drawing.drawCodeword(0xFF);
        assertFlags(drawing, QRCodeDrawing.Flag.on, 15, 17, 2, 4);
        drawing.drawCodeword(0x00);
        assertFlags(drawing, QRCodeDrawing.Flag.on, 15, 13, 2, 4, 0);
        drawing.drawCodeword(0xFF);
        assertFlags(drawing, QRCodeDrawing.Flag.on, 15, 9, 2, 4);
        drawing.drawCodeword(0x00);
        assertFlags(drawing, QRCodeDrawing.Flag.on, 13, 9, 2, 4, 0);
        drawing.drawCodeword(0xFF);
        assertFlags(drawing, QRCodeDrawing.Flag.on, 13, 13, 2, 4);
        drawing.drawCodeword(0x00);
        assertFlags(drawing, QRCodeDrawing.Flag.on, 13, 17, 2, 4, 0);
        drawing.drawCodeword(0xFF);
        assertFlags(drawing, QRCodeDrawing.Flag.on, 11, 17, 2, 4);
        drawing.drawCodeword(0x00);
        assertFlags(drawing, QRCodeDrawing.Flag.on, 11, 13, 2, 4, 0);
        drawing.drawCodeword(0xFF);
        assertFlags(drawing, QRCodeDrawing.Flag.on, 11, 9, 2, 4);
        drawing.drawCodeword(0xFF);
        assertFlags(drawing, QRCodeDrawing.Flag.on, 11, 7, 2, 2);
        assertFlags(drawing, QRCodeDrawing.Flag.on, 11, 4, 2, 2);
        drawing.drawCodeword(0x00);
        assertFlags(drawing, QRCodeDrawing.Flag.on, 11, 0, 2, 4, 0);
        drawing.drawCodeword(0xFF);
        assertFlags(drawing, QRCodeDrawing.Flag.on, 9, 0, 2, 4);
        drawing.drawCodeword(0x00);
        assertFlags(drawing, QRCodeDrawing.Flag.on, 9, 4, 2, 2, 0);
        assertFlags(drawing, QRCodeDrawing.Flag.on, 9, 7, 2, 2, 0);
        drawing.drawCodeword(0xFF);
        assertFlags(drawing, QRCodeDrawing.Flag.on, 9, 9, 2, 4);
        drawing.drawCodeword(0xFF);
        assertFlags(drawing, QRCodeDrawing.Flag.on, 9, 13, 2, 4);
        drawing.drawCodeword(0x00);
        assertFlags(drawing, QRCodeDrawing.Flag.on, 9, 17, 2, 4, 0);
        drawing.drawCodeword(0xFF);
        assertFlags(drawing, QRCodeDrawing.Flag.on, 7, 9, 2, 4);
        drawing.drawCodeword(0xE5);
        assertFlags(drawing, QRCodeDrawing.Flag.on, 5, 9, 1, 1);
        assertFlags(drawing, QRCodeDrawing.Flag.on, 4, 9, 1, 1);
        assertFlags(drawing, QRCodeDrawing.Flag.on, 5, 10, 1, 1);
        assertFlags(drawing, QRCodeDrawing.Flag.on, 4, 10, 1, 1, 0);
        assertFlags(drawing, QRCodeDrawing.Flag.on, 5, 11, 1, 1, 0);
        assertFlags(drawing, QRCodeDrawing.Flag.on, 4, 11, 1, 1);
        assertFlags(drawing, QRCodeDrawing.Flag.on, 5, 12, 1, 1, 0);
        assertFlags(drawing, QRCodeDrawing.Flag.on, 4, 12, 1, 1);
        drawing.drawCodeword(0xFF);
        assertFlags(drawing, QRCodeDrawing.Flag.on, 2, 9, 2, 4);
        drawing.drawCodeword(0xE5);
        assertFlags(drawing, QRCodeDrawing.Flag.on, 1, 9, 1, 1);
        assertFlags(drawing, QRCodeDrawing.Flag.on, 0, 9, 1, 1);
        assertFlags(drawing, QRCodeDrawing.Flag.on, 1, 10, 1, 1);
        assertFlags(drawing, QRCodeDrawing.Flag.on, 0, 10, 1, 1, 0);
        assertFlags(drawing, QRCodeDrawing.Flag.on, 1, 11, 1, 1, 0);
        assertFlags(drawing, QRCodeDrawing.Flag.on, 0, 11, 1, 1);
        assertFlags(drawing, QRCodeDrawing.Flag.on, 1, 12, 1, 1, 0);
        assertFlags(drawing, QRCodeDrawing.Flag.on, 0, 12, 1, 1);
        TKAssertThrows(function(){
            drawing.drawCodeword(0x00);
        });

        drawing = QRCodeDrawing.initWithVersion(2);
        drawing.drawCodeword(0xFF);
        drawing.drawCodeword(0x00);
        drawing.drawCodeword(0xFF);
        drawing.drawCodeword(0x00);
        drawing.drawCodeword(0xFF);
        drawing.drawCodeword(0x00);
        drawing.drawCodeword(0xFF);
        drawing.drawCodeword(0x00);
        drawing.drawCodeword(0xFF);
        drawing.drawCodeword(0x00);
        drawing.drawCodeword(0xFF);
        drawing.drawCodeword(0x00);
        drawing.drawCodeword(0xFF);
        drawing.drawCodeword(0x00);
        drawing.drawCodeword(0xFF);
        drawing.drawCodeword(0x00);
        drawing.drawCodeword(0xFF);
        drawing.drawCodeword(0x00);
        drawing.drawCodeword(0xFF);
        drawing.drawCodeword(0x00);
        drawing.drawCodeword(0xFF);
        drawing.drawCodeword(0x00);
        drawing.drawCodeword(0xFF);
        drawing.drawCodeword(0x00);
        drawing.drawCodeword(0xFF);
        drawing.drawCodeword(0x00);
        drawing.drawCodeword(0xFF);
        drawing.drawCodeword(0x00);
        drawing.drawCodeword(0xFF);
        drawing.drawCodeword(0x00);
        drawing.drawCodeword(0xFF);
        drawing.drawCodeword(0x00);
        drawing.drawCodeword(0xFF);
        drawing.drawCodeword(0x00);
        drawing.drawCodeword(0xFF);
        drawing.drawCodeword(0x00);
        drawing.drawCodeword(0xFF);
        drawing.drawCodeword(0x00);
        drawing.drawCodeword(0xFF);
        drawing.drawCodeword(0x00);
        drawing.drawCodeword(0xFF);
        drawing.drawCodeword(0x00);
        drawing.drawCodeword(0xFF);
        drawing.drawCodeword(0x00);
        assertFlags(drawing, QRCodeDrawing.Flag.on, 19, 12, 2, 4, 0);
        assertFlags(drawing, QRCodeDrawing.Flag.on, 19, 9, 2, 3);
        assertFlags(drawing, QRCodeDrawing.Flag.on, 17, 9, 2, 1);
        assertFlags(drawing, QRCodeDrawing.Flag.on, 17, 14, 2, 2);
        assertFlags(drawing, QRCodeDrawing.Flag.on, 17, 21, 2, 2);
        assertFlags(drawing, QRCodeDrawing.Flag.on, 15, 23, 4, 2, 0);
        assertFlags(drawing, QRCodeDrawing.Flag.on, 15, 21, 2, 2);
        assertFlags(drawing, QRCodeDrawing.Flag.on, 15, 17, 1, 4);
        assertFlags(drawing, QRCodeDrawing.Flag.on, 15, 13, 2, 3, 0);
        assertFlags(drawing, QRCodeDrawing.Flag.on, 15, 16, 1, 1, 0);
        assertFlags(drawing, QRCodeDrawing.Flag.on, 16, 12, 1, 1, 0);
        assertFlags(drawing, QRCodeDrawing.Flag.on, 13, 21, 1, 1);
        assertFlags(drawing, QRCodeDrawing.Flag.on, 13, 21, 1, 1);
        assertFlags(drawing, QRCodeDrawing.Flag.on, 12, 24, 1, 1);
        assertFlags(drawing, QRCodeDrawing.Flag.on, 13, 22, 2, 3);
        assertFlags(drawing, QRCodeDrawing.Flag.on, 19, 21, 1, 1);
        assertFlags(drawing, QRCodeDrawing.Flag.on, 18, 16, 1, 1);
        assertFlags(drawing, QRCodeDrawing.Flag.on, 19, 22, 2, 3);
        assertFlags(drawing, QRCodeDrawing.Flag.on, 7, 9, 2, 3);
        assertFlags(drawing, QRCodeDrawing.Flag.on, 7, 12, 1, 1);
        assertFlags(drawing, QRCodeDrawing.Flag.on, 5, 9, 1, 1);
        assertFlags(drawing, QRCodeDrawing.Flag.on, 3, 12, 1, 1, 0);
        assertFlags(drawing, QRCodeDrawing.Flag.on, 2, 16, 1, 1, 0);
        assertFlags(drawing, QRCodeDrawing.Flag.on, 2, 13, 2, 3, 0);
        TKAssertThrows(function(){
            drawing.drawCodeword(0x00);
        });

        var i;
        drawing = QRCodeDrawing.initWithVersion(6);
        for (i = 0; i < 108; ++i){
            drawing.drawCodeword(0xFE);
        }
        for (i = 0; i < 64; ++i){
            drawing.drawCodeword(0x01);
        }
        TKAssertThrows(function(){
            drawing.drawCodeword(0x00);
        });

        drawing = QRCodeDrawing.initWithVersion(7);
        for (i = 0; i < 66; ++i){
            drawing.drawCodeword(0xFE);
        }
        for (i = 0; i < 130; ++i){
            drawing.drawCodeword(0x01);
        }
        TKAssertThrows(function(){
            drawing.drawCodeword(0x00);
        });
    },

    testMask: function(){
        var drawing = QRCodeDrawing.initWithVersion(1);
        var masked = drawing.drawingWithMask(0);
        assertFlags(masked, QRCodeDrawing.Flag.on, 1, 1, 1, 1, 0);
        assertFlags(masked, QRCodeDrawing.Flag.on, 9, 0, 1, 1, 0);
        assertFlags(masked, QRCodeDrawing.Flag.on, 10, 0, 1, 1);
        assertFlags(masked, QRCodeDrawing.Flag.on, 11, 0, 1, 1, 0);
        assertFlags(masked, QRCodeDrawing.Flag.on, 12, 0, 1, 1);
        assertFlags(masked, QRCodeDrawing.Flag.on, 9, 1, 1, 1);
        assertFlags(masked, QRCodeDrawing.Flag.on, 10, 1, 1, 1, 0);
        assertFlags(masked, QRCodeDrawing.Flag.on, 11, 1, 1, 1);
        assertFlags(masked, QRCodeDrawing.Flag.on, 12, 1, 1, 1, 0);

        masked = drawing.drawingWithMask(1);
        assertFlags(masked, QRCodeDrawing.Flag.on, 1, 2, 1, 1, 0);
        assertFlags(masked, QRCodeDrawing.Flag.on, 9, 0, 1, 1);
        assertFlags(masked, QRCodeDrawing.Flag.on, 10, 0, 1, 1);
        assertFlags(masked, QRCodeDrawing.Flag.on, 11, 0, 1, 1);
        assertFlags(masked, QRCodeDrawing.Flag.on, 12, 0, 1, 1);
        assertFlags(masked, QRCodeDrawing.Flag.on, 9, 1, 1, 1, 0);
        assertFlags(masked, QRCodeDrawing.Flag.on, 10, 1, 1, 1, 0);
        assertFlags(masked, QRCodeDrawing.Flag.on, 11, 1, 1, 1, 0);
        assertFlags(masked, QRCodeDrawing.Flag.on, 12, 1, 1, 1, 0);

        masked = drawing.drawingWithMask(2);
        assertFlags(masked, QRCodeDrawing.Flag.on, 15, 1, 1, 1, 0);
        assertFlags(masked, QRCodeDrawing.Flag.on, 9, 0, 1, 1);
        assertFlags(masked, QRCodeDrawing.Flag.on, 10, 0, 1, 1, 0);
        assertFlags(masked, QRCodeDrawing.Flag.on, 11, 0, 1, 1, 0);
        assertFlags(masked, QRCodeDrawing.Flag.on, 12, 0, 1, 1);
        assertFlags(masked, QRCodeDrawing.Flag.on, 9, 1, 1, 1);
        assertFlags(masked, QRCodeDrawing.Flag.on, 10, 1, 1, 1, 0);
        assertFlags(masked, QRCodeDrawing.Flag.on, 11, 1, 1, 1, 0);
        assertFlags(masked, QRCodeDrawing.Flag.on, 12, 1, 1, 1);

        masked = drawing.drawingWithMask(3);
        assertFlags(masked, QRCodeDrawing.Flag.on, 1, 2, 1, 1, 0);
        assertFlags(masked, QRCodeDrawing.Flag.on, 9, 0, 1, 1);
        assertFlags(masked, QRCodeDrawing.Flag.on, 10, 0, 1, 1, 0);
        assertFlags(masked, QRCodeDrawing.Flag.on, 11, 0, 1, 1, 0);
        assertFlags(masked, QRCodeDrawing.Flag.on, 12, 0, 1, 1);
        assertFlags(masked, QRCodeDrawing.Flag.on, 9, 1, 1, 1, 0);
        assertFlags(masked, QRCodeDrawing.Flag.on, 10, 1, 1, 1, 0);
        assertFlags(masked, QRCodeDrawing.Flag.on, 11, 1, 1, 1);
        assertFlags(masked, QRCodeDrawing.Flag.on, 12, 1, 1, 1, 0);

        masked = drawing.drawingWithMask(4);
        assertFlags(masked, QRCodeDrawing.Flag.on, 1, 1, 1, 1, 0);
        assertFlags(masked, QRCodeDrawing.Flag.on, 9, 0, 1, 1, 0);
        assertFlags(masked, QRCodeDrawing.Flag.on, 10, 0, 1, 1, 0);
        assertFlags(masked, QRCodeDrawing.Flag.on, 11, 0, 1, 1, 0);
        assertFlags(masked, QRCodeDrawing.Flag.on, 12, 0, 1, 1);
        assertFlags(masked, QRCodeDrawing.Flag.on, 9, 1, 1, 1, 0);
        assertFlags(masked, QRCodeDrawing.Flag.on, 10, 1, 1, 1, 0);
        assertFlags(masked, QRCodeDrawing.Flag.on, 11, 1, 1, 1, 0);
        assertFlags(masked, QRCodeDrawing.Flag.on, 12, 1, 1, 1);
        assertFlags(masked, QRCodeDrawing.Flag.on, 9, 2, 1, 1);
        assertFlags(masked, QRCodeDrawing.Flag.on, 10, 2, 1, 1);
        assertFlags(masked, QRCodeDrawing.Flag.on, 11, 2, 1, 1);
        assertFlags(masked, QRCodeDrawing.Flag.on, 12, 2, 1, 1, 0);

        masked = drawing.drawingWithMask(5);
        assertFlags(masked, QRCodeDrawing.Flag.on, 18, 1, 1, 1, 0);
        assertFlags(masked, QRCodeDrawing.Flag.on, 8, 0, 1, 1, 0);
        assertFlags(masked, QRCodeDrawing.Flag.on, 9, 0, 1, 1);
        assertFlags(masked, QRCodeDrawing.Flag.on, 10, 0, 1, 1);
        assertFlags(masked, QRCodeDrawing.Flag.on, 11, 0, 1, 1);
        assertFlags(masked, QRCodeDrawing.Flag.on, 12, 0, 1, 1);
        assertFlags(masked, QRCodeDrawing.Flag.on, 9, 1, 1, 1, 0);
        assertFlags(masked, QRCodeDrawing.Flag.on, 10, 1, 1, 1, 0);
        assertFlags(masked, QRCodeDrawing.Flag.on, 11, 1, 1, 1, 0);
        assertFlags(masked, QRCodeDrawing.Flag.on, 12, 1, 1, 1);
        assertFlags(masked, QRCodeDrawing.Flag.on, 9, 2, 1, 1);
        assertFlags(masked, QRCodeDrawing.Flag.on, 10, 2, 1, 1, 0);
        assertFlags(masked, QRCodeDrawing.Flag.on, 11, 2, 1, 1, 0);
        assertFlags(masked, QRCodeDrawing.Flag.on, 12, 2, 1, 1);

        masked = drawing.drawingWithMask(6);
        assertFlags(masked, QRCodeDrawing.Flag.on, 1, 1, 1, 1, 0);
        assertFlags(masked, QRCodeDrawing.Flag.on, 8, 0, 1, 1, 0);
        assertFlags(masked, QRCodeDrawing.Flag.on, 9, 0, 1, 1);
        assertFlags(masked, QRCodeDrawing.Flag.on, 10, 0, 1, 1);
        assertFlags(masked, QRCodeDrawing.Flag.on, 11, 0, 1, 1);
        assertFlags(masked, QRCodeDrawing.Flag.on, 12, 0, 1, 1);
        assertFlags(masked, QRCodeDrawing.Flag.on, 8, 1, 1, 1, 0);
        assertFlags(masked, QRCodeDrawing.Flag.on, 9, 1, 1, 1, 0);
        assertFlags(masked, QRCodeDrawing.Flag.on, 10, 1, 1, 1, 0);
        assertFlags(masked, QRCodeDrawing.Flag.on, 11, 1, 1, 1, 0);
        assertFlags(masked, QRCodeDrawing.Flag.on, 12, 1, 1, 1);
        assertFlags(masked, QRCodeDrawing.Flag.on, 8, 2, 1, 1, 0);
        assertFlags(masked, QRCodeDrawing.Flag.on, 9, 2, 1, 1);
        assertFlags(masked, QRCodeDrawing.Flag.on, 10, 2, 1, 1);
        assertFlags(masked, QRCodeDrawing.Flag.on, 11, 2, 1, 1, 0);
        assertFlags(masked, QRCodeDrawing.Flag.on, 12, 2, 1, 1);
        assertFlags(masked, QRCodeDrawing.Flag.on, 11, 4, 2, 2);

        masked = drawing.drawingWithMask(7);
        assertFlags(masked, QRCodeDrawing.Flag.on, 1, 3, 1, 1, 0);
        assertFlags(masked, QRCodeDrawing.Flag.on, 9, 0, 1, 1, 0);
        assertFlags(masked, QRCodeDrawing.Flag.on, 10, 0, 1, 1);
        assertFlags(masked, QRCodeDrawing.Flag.on, 11, 0, 1, 1, 0);
        assertFlags(masked, QRCodeDrawing.Flag.on, 12, 0, 1, 1);
        assertFlags(masked, QRCodeDrawing.Flag.on, 9, 1, 1, 1);
        assertFlags(masked, QRCodeDrawing.Flag.on, 10, 1, 1, 1);
        assertFlags(masked, QRCodeDrawing.Flag.on, 11, 1, 1, 1);
        assertFlags(masked, QRCodeDrawing.Flag.on, 12, 1, 1, 1, 0);
    },

    print: function(drawing, flag){
        if (flag === undefined){
            flag = QRCodeDrawing.Flag.on;
        }
        var m = 0;
        var a, b;
        var chars = [" ", "\u2584", "\u2580", "\u2588"];
        process.stdout.write("\n\n");
        for (var y = 0; y < drawing.size; y += 2){
            for (var x = 0; x < drawing.size; ++x, ++m){
                a = (drawing.modules[m] & flag) ? 0x2 : 0x0;
                b = (y < drawing.size - 1 && (drawing.modules[m  + drawing.size] & flag)) ? 0x1 : 0x0;
                process.stdout.write(chars[a | b]);
            }
            process.stdout.write("\n");
            m += drawing.size;
        }
        process.stdout.write("\n\n");
    }

});

var clearModule = function(drawing, x, y){
    x += drawing.quietSize;
    y += drawing.quietSize;
    var i = y * drawing.size + x;
    drawing[i] &= ~QRCodeDrawing.Flag.on;
};


var assertFlagsEqual = function(drawing, flags, x, y, width, height){
    x += drawing.quietSize;
    y += drawing.quietSize;
    TKAssert(drawing instanceof QRCodeDrawing);
    for (var row = y; row < y + height; ++row){
        for (var col = x; col < x + width; ++col){
            TKAssertEquals(drawing.modules[row * drawing.size + col], flags, "module %d,%d".sprintf(col - drawing.quietSize, row - drawing.quietSize));
        }
    }
};

var assertFlags = function(drawing, flags, x, y, width, height, mask){
    if (mask === undefined){
        mask = flags;
    }
    x += drawing.quietSize;
    y += drawing.quietSize;
    TKAssert(drawing instanceof QRCodeDrawing);
    for (var row = y; row < y + height; ++row){
        for (var col = x; col < x + width; ++col){
            TKAssertExactEquals(drawing.modules[row * drawing.size + col] & flags, mask, "module %d,%d".sprintf(col - drawing.quietSize, row - drawing.quietSize));
        }
    }
};

})();