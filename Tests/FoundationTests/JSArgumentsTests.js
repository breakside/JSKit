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

// #import Foundation
// #import TestKit
'use strict';

JSClass("JSArgumentsTests", TKTestSuite, {

    testFlag: function(){
        var args = JSArguments.initWithOptions({
            test: {kind: "flag"}
        });
        TKAssertNotUndefined(args.test);
        TKAssert(!args.test);
        args.parse(['cmd', '--test']);
        TKAssert(args.test);

        args = JSArguments.initWithOptions({
            test: {kind: "flag"}
        });
        TKAssertThrows(function(){
            args.parse(['cmd', '--test', 'abc']);
        });
    },

    testValue: function(){
        var args = JSArguments.initWithOptions({
            test: {}
        });
        TKAssertUndefined(args.test);
        args.parse(['cmd', '--test', 'abc']);
        TKAssertEquals(args.test, 'abc');

        args = JSArguments.initWithOptions({
            test: {}
        });
        TKAssertThrows(function(){
            args.parse(['cmd', '--test']);
        });
    },

    testMultiple: function(){
        var args = JSArguments.initWithOptions({
            test: {multiple: true}
        });
        TKAssertNotUndefined(args.test);
        TKAssertExactEquals(args.test.length, 0);
        args.parse(['cmd', '--test', 'abc']);
        TKAssertEquals(args.test.length, 1);
        TKAssertEquals(args.test[0], 'abc');

        args = JSArguments.initWithOptions({
            test: {multiple: true}
        });
        TKAssertNotUndefined(args.test);
        TKAssertExactEquals(args.test.length, 0);
        args.parse(['cmd', '--test', 'abc', '--test', '123', '--test', 'hi']);
        TKAssertEquals(args.test.length, 3);
        TKAssertEquals(args.test[0], 'abc');
        TKAssertEquals(args.test[1], '123');
        TKAssertEquals(args.test[2], 'hi');

        args = JSArguments.initWithOptions({
            test: {multiple: true}
        });
        TKAssertThrows(function(){
            args.parse(['cmd', '--test']);
        });

        args = JSArguments.initWithOptions({
            test: {multiple: true, kind: "flag"}
        });
        TKAssertNotUndefined(args.test);
        TKAssertExactEquals(args.test.length, 0);
        args.parse(['cmd', '--test', '--test']);
        TKAssertEquals(args.test.length, 2);
        TKAssertExactEquals(args.test[0], true);
        TKAssertExactEquals(args.test[1], true);
    },

    testInteger: function(){
        var args = JSArguments.initWithOptions({
            test: {valueType: "integer"}
        });
        TKAssertUndefined(args.test);
        args.parse(['cmd', '--test', '123']);
        TKAssertExactEquals(args.test, 123);

        args = JSArguments.initWithOptions({
            test: {multiple: true, valueType: "integer"}
        });
        TKAssertNotUndefined(args.test);
        TKAssertExactEquals(args.test.length, 0);
        args.parse(['cmd', '--test', '123', '--test', '456']);
        TKAssertEquals(args.test.length, 2);
        TKAssertExactEquals(args.test[0], 123);
        TKAssertExactEquals(args.test[1], 456);

        args = JSArguments.initWithOptions({
            test: {valueType: "integer"}
        });
        TKAssertThrows(function(){
            args.parse(['cmd', '--test']);
        });

        args = JSArguments.initWithOptions({
            test: {valueType: "integer"}
        });
        TKAssertThrows(function(){
            args.parse(['cmd', '--test', 'abc']);
        });
    },

    testPositional: function(){
        var args = JSArguments.initWithOptions({
            test: {kind: "positional"}
        });
        TKAssertUndefined(args.test);
        args.parse(['cmd', '123']);
        TKAssertExactEquals(args.test, '123');

        args = JSArguments.initWithOptions({
            test: {kind: "positional", valueType: "integer"}
        });
        TKAssertUndefined(args.test);
        args.parse(['cmd', '123']);
        TKAssertExactEquals(args.test, 123);

        args = JSArguments.initWithOptions({
            test: {kind: "positional", multiple: true}
        });
        TKAssertNotUndefined(args.test);
        TKAssertExactEquals(args.test.length, 0);
        args.parse(['cmd', '123', '456', '789']);
        TKAssertExactEquals(args.test.length, 3);
        TKAssertExactEquals(args.test[0], '123');
        TKAssertExactEquals(args.test[1], '456');
        TKAssertExactEquals(args.test[2], '789');

        args = JSArguments.initWithOptions({
            test1: {kind: "positional"},
            test2: {kind: "positional"},
            test3: {kind: "positional", multiple: true}
        });
        args.parse(['cmd', '123', '456', '789', 'abc']);
        TKAssertExactEquals(args.test1, '123');
        TKAssertExactEquals(args.test2, '456');
        TKAssertExactEquals(args.test3.length, 2);
        TKAssertExactEquals(args.test3[0], '789');
        TKAssertExactEquals(args.test3[1], 'abc');

        args = JSArguments.initWithOptions({
            test1: {kind: "positional"},
            test2: {kind: "positional", multiple: true},
            test3: {kind: "positional", multiple: true}
        });
        TKAssertThrows(function(){
            args.parse(['cmd', '123', '456', '789', 'abc']);
        });

        args = JSArguments.initWithOptions({
            test: {kind: "positional"}
        });
        TKAssertThrows(function(){
            args.parse(['cmd', 'abc', '123']);
        });
    },

    testUnknown: function(){
        var args = JSArguments.initWithOptions({
            test: {kind: "flag"},
            unknown: {kind: "unknown"}
        });
        TKAssertNotUndefined(args.unknown);
        TKAssertExactEquals(args.unknown.length, 0);
        args.parse(['cmd', '--test', '-v', 'abc']);
        TKAssert(args.test);
        TKAssertEquals(args.unknown.length, 2);
        TKAssertEquals(args.unknown[0], '-v');
        TKAssertEquals(args.unknown[1], 'abc');

        args = JSArguments.initWithOptions({
            test: {kind: "flag"},
            unknown: {kind: "unknown"},
        });
        TKAssert(!args.test);

        args = JSArguments.initWithOptions({
            test: {kind: "flag"},
            unknown: {kind: "unknown"},
            unknown2: {kind: "unknown"}
        });
        TKAssertThrows(function(){
            args.parse(['cmd', 'abc', '123']);
        });
    },

    testShortcut: function(){
        var args = JSArguments.initWithOptions({
            test: {kind: "flag", shortcut: 't'}
        });
        args.parse(['cmd', '-t']);
        TKAssert(args.test);

        args = JSArguments.initWithOptions({
            test: {shortcut: 't'}
        });
        TKAssertUndefined(args.test);
        args.parse(['cmd', '-t', 'abc']);
        TKAssertEquals(args.test, 'abc');
    },

    testRequired: function(){
        var args = JSArguments.initWithOptions({
            test: {}
        });
        TKAssertUndefined(args.test);
        args.parse(['cmd', '--test', '123']);
        TKAssertEquals(args.test, '123');

        args = JSArguments.initWithOptions({
            test: {}
        });
        TKAssertUndefined(args.test);
        TKAssertThrows(function(){
            args.parse(['cmd']);
        });
    },

    testDefault: function(){
        var args = JSArguments.initWithOptions({
            test: {default: "abc"}
        });
        TKAssertEquals(args.test, 'abc');
        args.parse(['cmd', '--test', '123']);
        TKAssertEquals(args.test, '123');

        args = JSArguments.initWithOptions({
            test: {default: "abc"}
        });
        TKAssertEquals(args.test, 'abc');
        args.parse(['cmd']);
        TKAssertEquals(args.test, 'abc');
    },

    testNegativeNumbers: function(){
        var args = JSArguments.initWithOptions({
            test1: {valueType: "integer"},
            test2: {kind: "flag", shortcut: 't'}
        });

        args.parse(['cmd', '--test1', '-5', '-t']);
        TKAssertExactEquals(args.test1, -5);
        TKAssert(args.test2);
    },

    testDash: function(){
        var args = JSArguments.initWithOptions({
            test1: {},
            test2: {kind: "flag", shortcut: 't'},
            test3: {kind: "positional", multiple: true}
        });

        args.parse(['cmd', '--test1', 'abc', 'one', '-', '-t']);
        TKAssertEquals(args.test1, 'abc');
        TKAssert(args.test2);
        TKAssertEquals(args.test3.length, 2);
        TKAssertEquals(args.test3[0], 'one');
        TKAssertEquals(args.test3[1], '-');
    },

    testDashDash: function(){
        var args = JSArguments.initWithOptions({
            test1: {},
            test2: {kind: "flag", shortcut: 't'},
            test3: {kind: "positional", multiple: true}
        });

        args.parse(['cmd', '--test1', 'abc', '-t', 'one', '--', 'two', '-three', '--test1', '-5', '-t']);
        TKAssertEquals(args.test1, 'abc');
        TKAssert(args.test2);
        TKAssertEquals(args.test3.length, 6);
        TKAssertEquals(args.test3[0], 'one');
        TKAssertEquals(args.test3[1], 'two');
        TKAssertEquals(args.test3[2], '-three');
        TKAssertEquals(args.test3[3], '--test1');
        TKAssertEquals(args.test3[4], '-5');
        TKAssertEquals(args.test3[5], '-t');
    },

    testAllowed: function(){
        var args = JSArguments.initWithOptions({
            test1: {kind: "positional", allowed: ["abc", "123"]}
        });
        args.parse(["cmd", "abc"]);
        TKAssertEquals(args.test1, 'abc');

        args = JSArguments.initWithOptions({
            test1: {kind: "positional", allowed: ["abc", "123"]}
        });
        args.parse(["cmd", "123"]);
        TKAssertEquals(args.test1, '123');

        args = JSArguments.initWithOptions({
            test1: {kind: "positional", allowed: ["abc", "123"]}
        });
        TKAssertThrows(function(){
            args.parse(["cmd", "hello"]);
        });
    },

    testCombinations: function(){
        var args = JSArguments.initWithOptions({
            base: {default: "~"},
            verbose: {kind: "flag", shortcut: "v", multiple: true},
            count: {valueType: "integer"},
            subcommand: {kind: "positional"},
            unknown: {kind: "unknown"},
        });

        args.parse(["cmd", "--count", "-5", "-v", "sub", "-v", "-d", "in.txt", "--output", "out.txt", "in2.txt", "-", "--", "-test1", "--test2"]);

        TKAssertEquals(args.base, "~");
        TKAssertEquals(args.verbose.length, 2);
        TKAssertExactEquals(args.count, -5);
        TKAssertEquals(args.subcommand, "sub");
        TKAssertEquals(args.unknown.length, 9);
        TKAssertEquals(args.unknown[0], "-d");
        TKAssertEquals(args.unknown[1], "in.txt");
        TKAssertEquals(args.unknown[2], "--output");
        TKAssertEquals(args.unknown[3], "out.txt");
        TKAssertEquals(args.unknown[4], "in2.txt");
        TKAssertEquals(args.unknown[5], "-");
        TKAssertEquals(args.unknown[6], "--");
        TKAssertEquals(args.unknown[7], "-test1");
        TKAssertEquals(args.unknown[8], "--test2");

        var subargs = JSArguments.initWithOptions({
            output: {},
            decode: {shortcut: "d", kind: "flag"},
            input: {kind: "positional", multiple: true}
        });

        var subcmd = [args.subcommand].concat(args.unknown);
        subargs.parse(subcmd);
        TKAssert(subargs.decode);
        TKAssertEquals(subargs.output, "out.txt");
        TKAssertEquals(subargs.input.length, 5);
        TKAssertEquals(subargs.input[0], "in.txt");
        TKAssertEquals(subargs.input[1], "in2.txt");
        TKAssertEquals(subargs.input[2], "-");
        TKAssertEquals(subargs.input[3], "-test1");
        TKAssertEquals(subargs.input[4], "--test2");
    },

    testHelpString: function(){
        var args = JSArguments.initWithOptions({
            base: {default: "~", help: "Base path for utility. Long help description that should wrap to a second line."},
            verbose: {kind: "flag", shortcut: "v", multiple: true, help: "Verbosity level.  Use multiple times for more output."},
            count: {valueType: "integer", help: "The count to use."},
            subcommand: {kind: "positional", help: "The subcommand to run."},
            unknown: {kind: "unknown", help: "Subcommand arguments"},
        });
        args.parse(["cmd", "--count", "-5", "-v", "sub", "-v", "-d", "in.txt", "--output", "out.txt", "in2.txt", "-", "--", "-test1", "--test2"]);
        var str = args.helpString();
        var lines = [
            "Usage: cmd [--base base] [-v] --count count subcommand ...",
            "",
            "  --base           Base path for utility. Long help description that should\n                   wrap to a second line.\n                   (default: ~)",
            "  -v, --verbose    Verbosity level.  Use multiple times for more output.",
            "  --count          The count to use.",
            "  subcommand       The subcommand to run.",
            "  ...              Subcommand arguments",
            ""
        ];
        var expected = lines.join("\n");
        TKAssertEquals(str, expected);

        var subargs = JSArguments.initWithOptions({
            output: {help: "The output file.  This is a really long like that will wrap to three lines and doesn't have breaks exactly at spaces, making it a good test for the line wrapping function."},
            decode: {shortcut: "d", kind: "flag", help: "Decode the input."},
            input: {kind: "positional", multiple: true, help: "Input file"}
        });

        var subcmd = [args.subcommand].concat(args.unknown);
        subargs.parse(subcmd);
        str = subargs.helpString();
        lines = [
            "Usage: sub --output output [-d] input1 [input2 ...]",
            "",
            "  --output        The output file.  This is a really long like that will wrap\n                  to three lines and doesn't have breaks exactly at spaces,\n                  making it a good test for the line wrapping function.",
            "  -d, --decode    Decode the input.",
            "  input           Input file",
            ""
        ];
        expected = lines.join("\n");
        TKAssertEquals(str, expected);

        args = JSArguments.initWithOptions({
            test1: {kind: "positional", allowed: ["abc", "123"], help: "Testing"}
        });
        args.parse(["cmd", "abc"]);
        str = args.helpString();
        lines = [
            "Usage: cmd test1",
            "",
            "  test1    Testing",
            "           one of:",
            "             abc",
            "             123",
            ""
        ];
        expected = lines.join("\n");
        TKAssertEquals(str, expected);
    }

});