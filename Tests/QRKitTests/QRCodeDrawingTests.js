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

    testQuiet: function(){
        var drawing = QRCodeDrawing.initWithVersion(1);
        assertFlagsEqual(drawing, QRCodeDrawing.Flag.quiet, -4, -4, 4, 29); // left
        assertFlagsEqual(drawing, QRCodeDrawing.Flag.quiet, -4, -4, 29, 4); // top
        assertFlagsEqual(drawing, QRCodeDrawing.Flag.quiet, 21, -4, 4, 29); // right
        assertFlagsEqual(drawing, QRCodeDrawing.Flag.quiet, -4, 21, 29, 4); // bottom
        assertFlagsDoNotContain(drawing, QRCodeDrawing.Flag.quiet, 0, 0, 21, 21); // middle

        drawing = QRCodeDrawing.initWithVersion(7);
        assertFlagsEqual(drawing, QRCodeDrawing.Flag.quiet, -4, -4, 4, 53); // left
        assertFlagsEqual(drawing, QRCodeDrawing.Flag.quiet, -4, -4, 53, 4); // top
        assertFlagsEqual(drawing, QRCodeDrawing.Flag.quiet, 45, -4, 4, 53); // right
        assertFlagsEqual(drawing, QRCodeDrawing.Flag.quiet, -4, 45, 53, 4); // bottom
        assertFlagsDoNotContain(drawing, QRCodeDrawing.Flag.quiet, 0, 0, 45, 45); // middle

        drawing = QRCodeDrawing.initWithVersion(35);
        assertFlagsEqual(drawing, QRCodeDrawing.Flag.quiet, -4, -4, 4, 165); // left
        assertFlagsEqual(drawing, QRCodeDrawing.Flag.quiet, -4, -4, 165, 4); // top
        assertFlagsEqual(drawing, QRCodeDrawing.Flag.quiet, 157, -4, 4, 165); // right
        assertFlagsEqual(drawing, QRCodeDrawing.Flag.quiet, -5, 157, 165, 4); // bottom
        assertFlagsDoNotContain(drawing, QRCodeDrawing.Flag.quiet, 0, 0, 157, 157); // middle
    },

    testFinders: function(){
        var drawing = QRCodeDrawing.initWithVersion(1);
        // top left
        assertFlagsContain(drawing, QRCodeDrawing.Flag.finder, 0, 0, 8, 8);
        assertFlagsContain(drawing, QRCodeDrawing.Flag.on, 0, 0, 7, 1);
        assertFlagsContain(drawing, QRCodeDrawing.Flag.on, 0, 0, 1, 7);
        assertFlagsContain(drawing, QRCodeDrawing.Flag.on, 6, 0, 1, 7);
        assertFlagsContain(drawing, QRCodeDrawing.Flag.on, 0, 6, 7, 1);
        assertFlagsContain(drawing, QRCodeDrawing.Flag.on, 2, 2, 3, 3);
        // top right
        assertFlagsContain(drawing, QRCodeDrawing.Flag.finder, 13, 0, 8, 8);
        assertFlagsContain(drawing, QRCodeDrawing.Flag.on, 14, 0, 7, 1);
        assertFlagsContain(drawing, QRCodeDrawing.Flag.on, 14, 0, 1, 7);
        assertFlagsContain(drawing, QRCodeDrawing.Flag.on, 20, 0, 1, 7);
        assertFlagsContain(drawing, QRCodeDrawing.Flag.on, 14, 6, 7, 1);
        assertFlagsContain(drawing, QRCodeDrawing.Flag.on, 16, 2, 3, 3);
        // bottom left
        assertFlagsContain(drawing, QRCodeDrawing.Flag.finder, 0, 13, 8, 8);
        assertFlagsContain(drawing, QRCodeDrawing.Flag.on, 0, 14, 7, 1);
        assertFlagsContain(drawing, QRCodeDrawing.Flag.on, 0, 14, 1, 7);
        assertFlagsContain(drawing, QRCodeDrawing.Flag.on, 6, 14, 1, 7);
        assertFlagsContain(drawing, QRCodeDrawing.Flag.on, 0, 20, 7, 1);
        assertFlagsContain(drawing, QRCodeDrawing.Flag.on, 2, 16, 3, 3);


        drawing = QRCodeDrawing.initWithVersion(7);
        // top left
        assertFlagsContain(drawing, QRCodeDrawing.Flag.finder, 0, 0, 8, 8);
        assertFlagsContain(drawing, QRCodeDrawing.Flag.on, 0, 0, 7, 1);
        assertFlagsContain(drawing, QRCodeDrawing.Flag.on, 0, 0, 1, 7);
        assertFlagsContain(drawing, QRCodeDrawing.Flag.on, 6, 0, 1, 7);
        assertFlagsContain(drawing, QRCodeDrawing.Flag.on, 0, 6, 7, 1);
        assertFlagsContain(drawing, QRCodeDrawing.Flag.on, 2, 2, 3, 3);
        // top right
        assertFlagsContain(drawing, QRCodeDrawing.Flag.finder, 37, 0, 8, 8);
        assertFlagsContain(drawing, QRCodeDrawing.Flag.on, 38, 0, 7, 1);
        assertFlagsContain(drawing, QRCodeDrawing.Flag.on, 38, 0, 1, 7);
        assertFlagsContain(drawing, QRCodeDrawing.Flag.on, 44, 0, 1, 7);
        assertFlagsContain(drawing, QRCodeDrawing.Flag.on, 38, 6, 7, 1);
        assertFlagsContain(drawing, QRCodeDrawing.Flag.on, 40, 2, 3, 3);
        // bottom left
        assertFlagsContain(drawing, QRCodeDrawing.Flag.finder, 0, 37, 8, 8);
        assertFlagsContain(drawing, QRCodeDrawing.Flag.on, 0, 38, 7, 1);
        assertFlagsContain(drawing, QRCodeDrawing.Flag.on, 0, 38, 1, 7);
        assertFlagsContain(drawing, QRCodeDrawing.Flag.on, 6, 38, 1, 7);
        assertFlagsContain(drawing, QRCodeDrawing.Flag.on, 0, 44, 7, 1);
        assertFlagsContain(drawing, QRCodeDrawing.Flag.on, 2, 40, 3, 3);


        drawing = QRCodeDrawing.initWithVersion(35);
        // top left
        assertFlagsContain(drawing, QRCodeDrawing.Flag.finder, 0, 0, 8, 8);
        assertFlagsContain(drawing, QRCodeDrawing.Flag.on, 0, 0, 7, 1);
        assertFlagsContain(drawing, QRCodeDrawing.Flag.on, 0, 0, 1, 7);
        assertFlagsContain(drawing, QRCodeDrawing.Flag.on, 6, 0, 1, 7);
        assertFlagsContain(drawing, QRCodeDrawing.Flag.on, 0, 6, 7, 1);
        assertFlagsContain(drawing, QRCodeDrawing.Flag.on, 2, 2, 3, 3);
        // top right
        assertFlagsContain(drawing, QRCodeDrawing.Flag.finder, 149, 0, 8, 8);
        assertFlagsContain(drawing, QRCodeDrawing.Flag.on, 150, 0, 7, 1);
        assertFlagsContain(drawing, QRCodeDrawing.Flag.on, 150, 0, 1, 7);
        assertFlagsContain(drawing, QRCodeDrawing.Flag.on, 156, 0, 1, 7);
        assertFlagsContain(drawing, QRCodeDrawing.Flag.on, 150, 6, 7, 1);
        assertFlagsContain(drawing, QRCodeDrawing.Flag.on, 152, 2, 3, 3);
        // bottom left
        assertFlagsContain(drawing, QRCodeDrawing.Flag.finder, 0, 149, 8, 8);
        assertFlagsContain(drawing, QRCodeDrawing.Flag.on, 0, 150, 7, 1);
        assertFlagsContain(drawing, QRCodeDrawing.Flag.on, 0, 150, 1, 7);
        assertFlagsContain(drawing, QRCodeDrawing.Flag.on, 6, 150, 1, 7);
        assertFlagsContain(drawing, QRCodeDrawing.Flag.on, 0, 156, 7, 1);
        assertFlagsContain(drawing, QRCodeDrawing.Flag.on, 2, 152, 3, 3);
    },

    testTiming: function(){
        var drawing = QRCodeDrawing.initWithVersion(1);
        // vertical
        assertFlagsContain(drawing, QRCodeDrawing.Flag.on, 6, 8, 1, 1);
        assertFlagsContain(drawing, QRCodeDrawing.Flag.on, 6, 10, 1, 1);
        assertFlagsContain(drawing, QRCodeDrawing.Flag.on, 6, 12, 1, 1);
        assertFlagsDoNotContain(drawing, QRCodeDrawing.Flag.on, 6, 9, 1, 1);
        assertFlagsDoNotContain(drawing, QRCodeDrawing.Flag.on, 6, 11, 1, 1);
        assertFlagsContain(drawing, QRCodeDrawing.Flag.timing, 6, 8, 1, 5);
        // horizontal
        assertFlagsContain(drawing, QRCodeDrawing.Flag.on, 8, 6, 1, 1);
        assertFlagsContain(drawing, QRCodeDrawing.Flag.on, 10, 6, 1, 1);
        assertFlagsContain(drawing, QRCodeDrawing.Flag.on, 12, 6, 1, 1);
        assertFlagsDoNotContain(drawing, QRCodeDrawing.Flag.on, 9, 6, 1, 1);
        assertFlagsDoNotContain(drawing, QRCodeDrawing.Flag.on, 11, 6, 1, 1);
        assertFlagsContain(drawing, QRCodeDrawing.Flag.timing, 8, 6, 5, 1);

        drawing = QRCodeDrawing.initWithVersion(7);
        // vertical
        assertFlagsContain(drawing, QRCodeDrawing.Flag.on, 6, 8, 1, 1);
        assertFlagsContain(drawing, QRCodeDrawing.Flag.on, 6, 10, 1, 1);
        assertFlagsContain(drawing, QRCodeDrawing.Flag.on, 6, 12, 1, 1);
        assertFlagsContain(drawing, QRCodeDrawing.Flag.on, 6, 14, 1, 1);
        assertFlagsContain(drawing, QRCodeDrawing.Flag.on, 6, 16, 1, 1);
        assertFlagsContain(drawing, QRCodeDrawing.Flag.on, 6, 18, 1, 1);
        assertFlagsContain(drawing, QRCodeDrawing.Flag.on, 6, 20, 1, 1);
        assertFlagsContain(drawing, QRCodeDrawing.Flag.on, 6, 22, 1, 1);
        assertFlagsContain(drawing, QRCodeDrawing.Flag.on, 6, 24, 1, 1);
        assertFlagsContain(drawing, QRCodeDrawing.Flag.on, 6, 26, 1, 1);
        assertFlagsContain(drawing, QRCodeDrawing.Flag.on, 6, 28, 1, 1);
        assertFlagsContain(drawing, QRCodeDrawing.Flag.on, 6, 30, 1, 1);
        assertFlagsContain(drawing, QRCodeDrawing.Flag.on, 6, 32, 1, 1);
        assertFlagsContain(drawing, QRCodeDrawing.Flag.on, 6, 34, 1, 1);
        assertFlagsContain(drawing, QRCodeDrawing.Flag.on, 6, 36, 1, 1);
        assertFlagsDoNotContain(drawing, QRCodeDrawing.Flag.on, 6, 9, 1, 1);
        assertFlagsDoNotContain(drawing, QRCodeDrawing.Flag.on, 6, 11, 1, 1);
        assertFlagsDoNotContain(drawing, QRCodeDrawing.Flag.on, 6, 13, 1, 1);
        assertFlagsDoNotContain(drawing, QRCodeDrawing.Flag.on, 6, 15, 1, 1);
        assertFlagsDoNotContain(drawing, QRCodeDrawing.Flag.on, 6, 17, 1, 1);
        assertFlagsDoNotContain(drawing, QRCodeDrawing.Flag.on, 6, 19, 1, 1);
        assertFlagsDoNotContain(drawing, QRCodeDrawing.Flag.on, 6, 21, 1, 1);
        assertFlagsDoNotContain(drawing, QRCodeDrawing.Flag.on, 6, 23, 1, 1);
        assertFlagsDoNotContain(drawing, QRCodeDrawing.Flag.on, 6, 25, 1, 1);
        assertFlagsDoNotContain(drawing, QRCodeDrawing.Flag.on, 6, 27, 1, 1);
        assertFlagsDoNotContain(drawing, QRCodeDrawing.Flag.on, 6, 29, 1, 1);
        assertFlagsDoNotContain(drawing, QRCodeDrawing.Flag.on, 6, 31, 1, 1);
        assertFlagsDoNotContain(drawing, QRCodeDrawing.Flag.on, 6, 33, 1, 1);
        assertFlagsDoNotContain(drawing, QRCodeDrawing.Flag.on, 6, 35, 1, 1);
        assertFlagsContain(drawing, QRCodeDrawing.Flag.timing, 6, 8, 1, 29);
        // horizontal
        assertFlagsContain(drawing, QRCodeDrawing.Flag.on, 8, 6, 1, 1);
        assertFlagsContain(drawing, QRCodeDrawing.Flag.on, 10, 6, 1, 1);
        assertFlagsContain(drawing, QRCodeDrawing.Flag.on, 12, 6, 1, 1);
        assertFlagsContain(drawing, QRCodeDrawing.Flag.on, 14, 6, 1, 1);
        assertFlagsContain(drawing, QRCodeDrawing.Flag.on, 16, 6, 1, 1);
        assertFlagsContain(drawing, QRCodeDrawing.Flag.on, 18, 6, 1, 1);
        assertFlagsContain(drawing, QRCodeDrawing.Flag.on, 20, 6, 1, 1);
        assertFlagsContain(drawing, QRCodeDrawing.Flag.on, 22, 6, 1, 1);
        assertFlagsContain(drawing, QRCodeDrawing.Flag.on, 24, 6, 1, 1);
        assertFlagsContain(drawing, QRCodeDrawing.Flag.on, 26, 6, 1, 1);
        assertFlagsContain(drawing, QRCodeDrawing.Flag.on, 28, 6, 1, 1);
        assertFlagsContain(drawing, QRCodeDrawing.Flag.on, 30, 6, 1, 1);
        assertFlagsContain(drawing, QRCodeDrawing.Flag.on, 32, 6, 1, 1);
        assertFlagsContain(drawing, QRCodeDrawing.Flag.on, 34, 6, 1, 1);
        assertFlagsContain(drawing, QRCodeDrawing.Flag.on, 36, 6, 1, 1);
        assertFlagsDoNotContain(drawing, QRCodeDrawing.Flag.on, 9, 6, 1, 1);
        assertFlagsDoNotContain(drawing, QRCodeDrawing.Flag.on, 11, 6, 1, 1);
        assertFlagsDoNotContain(drawing, QRCodeDrawing.Flag.on, 13, 6, 1, 1);
        assertFlagsDoNotContain(drawing, QRCodeDrawing.Flag.on, 15, 6, 1, 1);
        assertFlagsDoNotContain(drawing, QRCodeDrawing.Flag.on, 17, 6, 1, 1);
        assertFlagsDoNotContain(drawing, QRCodeDrawing.Flag.on, 19, 6, 1, 1);
        assertFlagsDoNotContain(drawing, QRCodeDrawing.Flag.on, 21, 6, 1, 1);
        assertFlagsDoNotContain(drawing, QRCodeDrawing.Flag.on, 23, 6, 1, 1);
        assertFlagsDoNotContain(drawing, QRCodeDrawing.Flag.on, 25, 6, 1, 1);
        assertFlagsDoNotContain(drawing, QRCodeDrawing.Flag.on, 27, 6, 1, 1);
        assertFlagsDoNotContain(drawing, QRCodeDrawing.Flag.on, 29, 6, 1, 1);
        assertFlagsDoNotContain(drawing, QRCodeDrawing.Flag.on, 31, 6, 1, 1);
        assertFlagsDoNotContain(drawing, QRCodeDrawing.Flag.on, 33, 6, 1, 1);
        assertFlagsDoNotContain(drawing, QRCodeDrawing.Flag.on, 25, 6, 1, 1);
        assertFlagsContain(drawing, QRCodeDrawing.Flag.timing, 8, 6, 29, 1);
    },

    testAlignment: function(){
        var drawing = QRCodeDrawing.initWithVersion(1);
        assertFlagsDoNotContain(drawing, QRCodeDrawing.Flag.alignment, 0, 0, 21, 21);

        drawing = QRCodeDrawing.initWithVersion(2);
        assertFlagsContain(drawing, QRCodeDrawing.Flag.alignment, 16, 16, 5, 5);

        drawing = QRCodeDrawing.initWithVersion(7);
        assertFlagsContain(drawing, QRCodeDrawing.Flag.alignment, 4, 20, 5, 5);
        assertFlagsContain(drawing, QRCodeDrawing.Flag.alignment, 20, 4, 5, 5);
        assertFlagsContain(drawing, QRCodeDrawing.Flag.alignment, 20, 20, 5, 5);
        assertFlagsContain(drawing, QRCodeDrawing.Flag.alignment, 20, 36, 5, 5);
        assertFlagsContain(drawing, QRCodeDrawing.Flag.alignment, 36, 20, 5, 5);
        assertFlagsContain(drawing, QRCodeDrawing.Flag.alignment, 36, 36, 5, 5);
    },

    testFormat: function(){
        var drawing = QRCodeDrawing.initWithVersion(1);
        // top left
        assertFlagsContain(drawing, QRCodeDrawing.Flag.format, 8, 0, 1, 6);
        assertFlagsContain(drawing, QRCodeDrawing.Flag.format, 8, 7, 1, 2);
        assertFlagsContain(drawing, QRCodeDrawing.Flag.format, 0, 8, 6, 1);
        assertFlagsContain(drawing, QRCodeDrawing.Flag.format, 7, 8, 2, 1);
        // // upper right
        assertFlagsContain(drawing, QRCodeDrawing.Flag.format, 13, 8, 8, 1);
        // // lower left
        assertFlagsContain(drawing, QRCodeDrawing.Flag.format, 8, 13, 1, 8);


        drawing = QRCodeDrawing.initWithVersion(7);
        // top left
        assertFlagsContain(drawing, QRCodeDrawing.Flag.format, 8, 0, 1, 6);
        assertFlagsContain(drawing, QRCodeDrawing.Flag.format, 8, 7, 1, 2);
        assertFlagsContain(drawing, QRCodeDrawing.Flag.format, 0, 8, 6, 1);
        assertFlagsContain(drawing, QRCodeDrawing.Flag.format, 7, 8, 2, 1);
        // // upper right
        assertFlagsContain(drawing, QRCodeDrawing.Flag.format, 37, 8, 8, 1);
        // // lower left
        assertFlagsContain(drawing, QRCodeDrawing.Flag.format, 8, 37, 1, 8);


        drawing = QRCodeDrawing.initWithVersion(35);
        // top left
        assertFlagsContain(drawing, QRCodeDrawing.Flag.format, 8, 0, 1, 6);
        assertFlagsContain(drawing, QRCodeDrawing.Flag.format, 8, 7, 1, 2);
        assertFlagsContain(drawing, QRCodeDrawing.Flag.format, 0, 8, 6, 1);
        assertFlagsContain(drawing, QRCodeDrawing.Flag.format, 7, 8, 2, 1);
        // // upper right
        assertFlagsContain(drawing, QRCodeDrawing.Flag.format, 149, 8, 8, 1);
        // // lower left
        assertFlagsContain(drawing, QRCodeDrawing.Flag.format, 8, 149, 1, 8);
    },

    testVersion: function(){
        var drawing = QRCodeDrawing.initWithVersion(1);
        assertFlagsDoNotContain(drawing, QRCodeDrawing.Flag.version, 0, 0, 21, 21);

        drawing = QRCodeDrawing.initWithVersion(6);
        assertFlagsDoNotContain(drawing, QRCodeDrawing.Flag.version, 0, 0, 21, 21);

        drawing = QRCodeDrawing.initWithVersion(7);
        // top right
        assertFlagsContain(drawing, QRCodeDrawing.Flag.version, 34, 0, 3, 6);
        // bottom left
        assertFlagsContain(drawing, QRCodeDrawing.Flag.version, 0, 34, 6, 3);

        drawing = QRCodeDrawing.initWithVersion(35);
        // top right
        assertFlagsContain(drawing, QRCodeDrawing.Flag.version, 146, 0, 3, 6);
        // bottom left
        assertFlagsContain(drawing, QRCodeDrawing.Flag.version, 0, 146, 6, 3);
    },

    print: function(drawing, flag){
        if (flag === undefined){
            flag = QRCodeDrawing.Flag.on;
        }
        var m = 0;
        process.stdout.write("\n\n");
        for (var y = 0; y < drawing.size; ++y){
            for (var x = 0; x < drawing.size; ++x, ++m){
                process.stdout.write((drawing.modules[m] & flag) ? "\u2588" : " ");
            }
            process.stdout.write("\n");
        }
        process.stdout.write("\n\n");
    }

});


var assertFlagsEqual = function(drawing, flags, x, y, width, height){
    x += drawing.quietSize;
    y += drawing.quietSize;
    TKAssert(drawing instanceof QRCodeDrawing);
    for (var row = y; row < y + height; ++row){
        for (var col = x; col < x + width; ++col){
            TKAssertEquals(drawing.modules[row * drawing.size + col], flags, "module %d,%d".sprintf(row, col));
        }
    }
};

var assertFlagsContain = function(drawing, flags, x, y, width, height){
    x += drawing.quietSize;
    y += drawing.quietSize;
    TKAssert(drawing instanceof QRCodeDrawing);
    for (var row = y; row < y + height; ++row){
        for (var col = x; col < x + width; ++col){
            TKAssertEquals(drawing.modules[row * drawing.size + col] & flags, flags, "module %d,%d".sprintf(row, col));
        }
    }
};

var assertFlagsDoNotContain = function(drawing, flags, x, y, width, height){
    x += drawing.quietSize;
    y += drawing.quietSize;
    for (var row = y; row < y + height; ++row){
        for (var col = x; col < x + width; ++col){
            TKAssertExactEquals(drawing.modules[row * drawing.size + col] & flags, 0, "module %d,%d".sprintf(row, col));
        }
    }
};

})();