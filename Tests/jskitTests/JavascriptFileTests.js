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

// #import jskit
// #import TestKit
// #import DOM

'use strict';

JSClass("JavascriptFileTests", TKTestSuite, {

    testNext: function(){
        var js = [
            "var x = 1;",
            "",
            "var y = 2;",
            "if (x > y){",
            "  y = x;",
            "}",
            ""
        ].join('\n').utf8();
        var file = JavascriptFile.initWithData(js);
        var scan = file.next();
        TKAssertNotNull(scan);
        TKAssertEquals(scan.code, "var x = 1;");
        TKAssertExactEquals(scan.lineNumber, 0);
        TKAssertExactEquals(scan.columnNumber, 0);
        scan = file.next();
        TKAssertNotNull(scan);
        TKAssertEquals(scan.code, "var y = 2;");
        TKAssertExactEquals(scan.lineNumber, 2);
        TKAssertExactEquals(scan.columnNumber, 0);
        scan = file.next();
        TKAssertNotNull(scan);
        TKAssertEquals(scan.code, "if (x > y){");
        TKAssertExactEquals(scan.lineNumber, 3);
        TKAssertExactEquals(scan.columnNumber, 0);
        scan = file.next();
        TKAssertNotNull(scan);
        TKAssertEquals(scan.code, "y = x;");
        TKAssertExactEquals(scan.lineNumber, 4);
        TKAssertExactEquals(scan.columnNumber, 2);
        scan = file.next();
        TKAssertNotNull(scan);
        TKAssertEquals(scan.code, "}");
        TKAssertExactEquals(scan.lineNumber, 5);
        TKAssertExactEquals(scan.columnNumber, 0);
        scan = file.next();
        TKAssertNull(scan);


        js = [
            "// #import Foundation",
            "var x = 1;",
            "",
            "var y = 2; // skip me",
            "if /* nothing here */ (x > y){",
            "  y = x;",
            "  /*",
            "   * This is nothing",
            "  */",
            "  // Skip me too",
            "// and me",
            "}",
            ""
        ].join('\n').utf8();
        file = JavascriptFile.initWithData(js);
        scan = file.next();
        TKAssertNotNull(scan);
        TKAssertEquals(scan.command, "import");
        TKAssertEquals(scan.args, "Foundation");
        TKAssertEquals(scan.framework, "Foundation");
        TKAssertExactEquals(scan.lineNumber, 0);
        TKAssertExactEquals(scan.columnNumber, 2);
        scan = file.next();
        TKAssertNotNull(scan);
        TKAssertEquals(scan.code, "var x = 1;");
        TKAssertExactEquals(scan.lineNumber, 1);
        TKAssertExactEquals(scan.columnNumber, 0);
        scan = file.next();
        TKAssertNotNull(scan);
        TKAssertEquals(scan.code, "var y = 2; ");
        TKAssertExactEquals(scan.lineNumber, 3);
        TKAssertExactEquals(scan.columnNumber, 0);
        scan = file.next();
        TKAssertNotNull(scan);
        TKAssertEquals(scan.code, "if ");
        TKAssertExactEquals(scan.lineNumber, 4);
        TKAssertExactEquals(scan.columnNumber, 0);
        scan = file.next();
        TKAssertNotNull(scan);
        TKAssertEquals(scan.code, "(x > y){");
        TKAssertExactEquals(scan.lineNumber, 4);
        TKAssertExactEquals(scan.columnNumber, 22);
        scan = file.next();
        TKAssertNotNull(scan);
        TKAssertEquals(scan.code, "y = x;");
        TKAssertExactEquals(scan.lineNumber, 5);
        TKAssertExactEquals(scan.columnNumber, 2);
        scan = file.next();
        TKAssertNotNull(scan);
        TKAssertEquals(scan.code, "}");
        TKAssertExactEquals(scan.lineNumber, 11);
        TKAssertExactEquals(scan.columnNumber, 0);
        scan = file.next();
        TKAssertNull(scan);


        js = [
            "var x = 1;",
            "",
            "var y = 2;",
            "if (x > y){",
            "  y = x;",
            "}",
            "var str = 'This is a test\\",
            "  contuing string \\",
            " and it ends here';",
            ""
        ].join('\n').utf8();
        file = JavascriptFile.initWithData(js);
        scan = file.next();
        TKAssertNotNull(scan);
        TKAssertEquals(scan.code, "var x = 1;");
        TKAssertExactEquals(scan.lineNumber, 0);
        TKAssertExactEquals(scan.columnNumber, 0);
        scan = file.next();
        TKAssertNotNull(scan);
        TKAssertEquals(scan.code, "var y = 2;");
        TKAssertExactEquals(scan.lineNumber, 2);
        TKAssertExactEquals(scan.columnNumber, 0);
        scan = file.next();
        TKAssertNotNull(scan);
        TKAssertEquals(scan.code, "if (x > y){");
        TKAssertExactEquals(scan.lineNumber, 3);
        TKAssertExactEquals(scan.columnNumber, 0);
        scan = file.next();
        TKAssertNotNull(scan);
        TKAssertEquals(scan.code, "y = x;");
        TKAssertExactEquals(scan.lineNumber, 4);
        TKAssertExactEquals(scan.columnNumber, 2);
        scan = file.next();
        TKAssertNotNull(scan);
        TKAssertEquals(scan.code, "}");
        TKAssertExactEquals(scan.lineNumber, 5);
        TKAssertExactEquals(scan.columnNumber, 0);
        scan = file.next();
        TKAssertNotNull(scan);
        TKAssertEquals(scan.code, "var str = 'This is a test\\\n");
        TKAssertExactEquals(scan.lineNumber, 6);
        TKAssertExactEquals(scan.columnNumber, 0);
        scan = file.next();
        TKAssertNotNull(scan);
        TKAssertEquals(scan.code, "  contuing string \\\n");
        TKAssertExactEquals(scan.lineNumber, 7);
        TKAssertExactEquals(scan.columnNumber, 0);
        scan = file.next();
        TKAssertNotNull(scan);
        TKAssertEquals(scan.code, " and it ends here';");
        TKAssertExactEquals(scan.lineNumber, 8);
        TKAssertExactEquals(scan.columnNumber, 0);
        scan = file.next();
        TKAssertNull(scan);

        js = [
            "var x = 1;",
            "",
            "var y = 2;",
            "if (x > y){",
            "  y = x;",
            "}",
            "// #import Foundation"
        ].join('\n').utf8();
        file = JavascriptFile.initWithData(js);
        scan = file.next();
        TKAssertNotNull(scan);
        TKAssertEquals(scan.code, "var x = 1;");
        TKAssertExactEquals(scan.lineNumber, 0);
        TKAssertExactEquals(scan.columnNumber, 0);
        scan = file.next();
        TKAssertNotNull(scan);
        TKAssertEquals(scan.code, "var y = 2;");
        TKAssertExactEquals(scan.lineNumber, 2);
        TKAssertExactEquals(scan.columnNumber, 0);
        scan = file.next();
        TKAssertNotNull(scan);
        TKAssertEquals(scan.code, "if (x > y){");
        TKAssertExactEquals(scan.lineNumber, 3);
        TKAssertExactEquals(scan.columnNumber, 0);
        scan = file.next();
        TKAssertNotNull(scan);
        TKAssertEquals(scan.code, "y = x;");
        TKAssertExactEquals(scan.lineNumber, 4);
        TKAssertExactEquals(scan.columnNumber, 2);
        scan = file.next();
        TKAssertNotNull(scan);
        TKAssertEquals(scan.code, "}");
        TKAssertExactEquals(scan.lineNumber, 5);
        TKAssertExactEquals(scan.columnNumber, 0);
        scan = file.next();
        TKAssertNotNull(scan);
        TKAssertEquals(scan.command, "import");
        TKAssertEquals(scan.args, "Foundation");
        TKAssertEquals(scan.framework, "Foundation");
        TKAssertExactEquals(scan.lineNumber, 6);
        TKAssertExactEquals(scan.columnNumber, 2);
        scan = file.next();
        TKAssertNull(scan);

        js = [
            "'use strict';",
            "var x = 1;",
            "",
            "var y = 2;",
            "if (x > y){",
            "  y = x;",
            "}",
        ].join('\n').utf8();
        file = JavascriptFile.initWithData(js);
        scan = file.next();
        TKAssertNotNull(scan);
        TKAssertExactEquals(scan.strict, true);
        TKAssertExactEquals(scan.lineNumber, 0);
        TKAssertExactEquals(scan.columnNumber, 0);
        scan = file.next();
        TKAssertNotNull(scan);
        TKAssertEquals(scan.code, "var x = 1;");
        TKAssertExactEquals(scan.lineNumber, 1);
        TKAssertExactEquals(scan.columnNumber, 0);
        scan = file.next();
        TKAssertNotNull(scan);
        TKAssertEquals(scan.code, "var y = 2;");
        TKAssertExactEquals(scan.lineNumber, 3);
        TKAssertExactEquals(scan.columnNumber, 0);
        scan = file.next();
        TKAssertNotNull(scan);
        TKAssertEquals(scan.code, "if (x > y){");
        TKAssertExactEquals(scan.lineNumber, 4);
        TKAssertExactEquals(scan.columnNumber, 0);
        scan = file.next();
        TKAssertNotNull(scan);
        TKAssertEquals(scan.code, "y = x;");
        TKAssertExactEquals(scan.lineNumber, 5);
        TKAssertExactEquals(scan.columnNumber, 2);
        scan = file.next();
        TKAssertNotNull(scan);
        TKAssertEquals(scan.code, "}");
        TKAssertExactEquals(scan.lineNumber, 6);
        TKAssertExactEquals(scan.columnNumber, 0);
        scan = file.next();
        TKAssertNull(scan);


        js = [
            "var x = 1;",
            "",
            "var y = 2;",
            "if (x !== '\\\\'){",
            "  y = x;",
            "}",
            ""
        ].join('\n').utf8();
        file = JavascriptFile.initWithData(js);
        scan = file.next();
        TKAssertNotNull(scan);
        TKAssertEquals(scan.code, "var x = 1;");
        TKAssertExactEquals(scan.lineNumber, 0);
        TKAssertExactEquals(scan.columnNumber, 0);
        scan = file.next();
        TKAssertNotNull(scan);
        TKAssertEquals(scan.code, "var y = 2;");
        TKAssertExactEquals(scan.lineNumber, 2);
        TKAssertExactEquals(scan.columnNumber, 0);
        scan = file.next();
        TKAssertNotNull(scan);
        TKAssertEquals(scan.code, "if (x !== '\\\\'){");
        TKAssertExactEquals(scan.lineNumber, 3);
        TKAssertExactEquals(scan.columnNumber, 0);
        scan = file.next();
        TKAssertNotNull(scan);
        TKAssertEquals(scan.code, "y = x;");
        TKAssertExactEquals(scan.lineNumber, 4);
        TKAssertExactEquals(scan.columnNumber, 2);
        scan = file.next();
        TKAssertNotNull(scan);
        TKAssertEquals(scan.code, "}");
        TKAssertExactEquals(scan.lineNumber, 5);
        TKAssertExactEquals(scan.columnNumber, 0);
        scan = file.next();
        TKAssertNull(scan);
    },

    testStrings: function(){
        var js = [
            'var x = "I\\"t\'s\\" a test!";',
            '// nothing'
        ].join("\n").utf8();

        var file = JavascriptFile.initWithData(js);
        var scan = file.next();
        TKAssertNotNull(scan);
        TKAssertEquals(scan.code, 'var x = "I\\"t\'s\\" a test!";');
    }
});