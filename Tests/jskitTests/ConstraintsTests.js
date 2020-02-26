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
'use strict';

JSClass("ConstraintsTests", TKTestSuite, {

    testConstraintsFromEquality: function(){
        var refs = {
            self: "/Root",
            one: "/One",
            two: "/Two",
            n: 10
        };
        var constraint = constraintFromEquality("self.width = 12", refs);
        TKAssertEquals(constraint.constant, 12);
        TKAssertEquals(constraint.firstAttribute, 'width');
        TKAssertEquals(constraint.firstItem, '/Root');
        TKAssertEquals(constraint.relation, 'equal');
        constraint = constraintFromEquality("self.height = n", refs);
        TKAssertEquals(constraint.constant, 10);
        TKAssertEquals(constraint.firstAttribute, 'height');
        TKAssertEquals(constraint.firstItem, '/Root');
        TKAssertEquals(constraint.relation, 'equal');
        constraint = constraintFromEquality("one.top = self.top", refs);
        TKAssertEquals(constraint.firstAttribute, 'top');
        TKAssertEquals(constraint.firstItem, '/One');
        TKAssertEquals(constraint.relation, 'equal');
        TKAssertEquals(constraint.secondAttribute, 'top');
        TKAssertEquals(constraint.secondItem, '/Root');
        constraint = constraintFromEquality("one.top = self.top + 12", refs);
        TKAssertEquals(constraint.constant, 12);
        TKAssertEquals(constraint.firstAttribute, 'top');
        TKAssertEquals(constraint.firstItem, '/One');
        TKAssertEquals(constraint.relation, 'equal');
        TKAssertEquals(constraint.secondAttribute, 'top');
        TKAssertEquals(constraint.secondItem, '/Root');
        constraint = constraintFromEquality("one.top = self.top + n", refs);
        TKAssertEquals(constraint.constant, 10);
        TKAssertEquals(constraint.firstAttribute, 'top');
        TKAssertEquals(constraint.firstItem, '/One');
        TKAssertEquals(constraint.relation, 'equal');
        TKAssertEquals(constraint.secondAttribute, 'top');
        TKAssertEquals(constraint.secondItem, '/Root');
        constraint = constraintFromEquality("one.top = self.top - 12", refs);
        TKAssertEquals(constraint.constant, -12);
        TKAssertEquals(constraint.firstAttribute, 'top');
        TKAssertEquals(constraint.firstItem, '/One');
        TKAssertEquals(constraint.relation, 'equal');
        TKAssertEquals(constraint.secondAttribute, 'top');
        TKAssertEquals(constraint.secondItem, '/Root');
        constraint = constraintFromEquality("one.top = self.top - n", refs);
        TKAssertEquals(constraint.constant, -10);
        TKAssertEquals(constraint.firstAttribute, 'top');
        TKAssertEquals(constraint.firstItem, '/One');
        TKAssertEquals(constraint.relation, 'equal');
        TKAssertEquals(constraint.secondAttribute, 'top');
        TKAssertEquals(constraint.secondItem, '/Root');
        constraint = constraintFromEquality("two.width = one.width * 2", refs);
        TKAssertEquals(constraint.firstAttribute, 'width');
        TKAssertEquals(constraint.firstItem, '/Two');
        TKAssertEquals(constraint.multiplier, 2);
        TKAssertEquals(constraint.relation, 'equal');
        TKAssertEquals(constraint.secondAttribute, 'width');
        TKAssertEquals(constraint.secondItem, '/One');
        constraint = constraintFromEquality("two.width = one.width * 2.5", refs);
        TKAssertEquals(constraint.firstAttribute, 'width');
        TKAssertEquals(constraint.firstItem, '/Two');
        TKAssertEquals(constraint.multiplier, 2.5);
        TKAssertEquals(constraint.relation, 'equal');
        TKAssertEquals(constraint.secondAttribute, 'width');
        TKAssertEquals(constraint.secondItem, '/One');
        constraint = constraintFromEquality("two.width = one.width * 2 + 12", refs);
        TKAssertEquals(constraint.constant, 12);
        TKAssertEquals(constraint.firstAttribute, 'width');
        TKAssertEquals(constraint.firstItem, '/Two');
        TKAssertEquals(constraint.multiplier, 2);
        TKAssertEquals(constraint.relation, 'equal');
        TKAssertEquals(constraint.secondAttribute, 'width');
        TKAssertEquals(constraint.secondItem, '/One');
        constraint = constraintFromEquality("two.width = one.width * 2.5 + 12", refs);
        TKAssertEquals(constraint.constant, 12);
        TKAssertEquals(constraint.firstAttribute, 'width');
        TKAssertEquals(constraint.firstItem, '/Two');
        TKAssertEquals(constraint.multiplier, 2.5);
        TKAssertEquals(constraint.relation, 'equal');
        TKAssertEquals(constraint.secondAttribute, 'width');
        TKAssertEquals(constraint.secondItem, '/One');
        constraint = constraintFromEquality("two.width = one.width * 2 + n", refs);
        TKAssertEquals(constraint.constant, 10);
        TKAssertEquals(constraint.firstAttribute, 'width');
        TKAssertEquals(constraint.firstItem, '/Two');
        TKAssertEquals(constraint.multiplier, 2);
        TKAssertEquals(constraint.relation, 'equal');
        TKAssertEquals(constraint.secondAttribute, 'width');
        TKAssertEquals(constraint.secondItem, '/One');
        constraint = constraintFromEquality("two.width = one.width * 2.5 + n", refs);
        TKAssertEquals(constraint.constant, 10);
        TKAssertEquals(constraint.firstAttribute, 'width');
        TKAssertEquals(constraint.firstItem, '/Two');
        TKAssertEquals(constraint.multiplier, 2.5);
        TKAssertEquals(constraint.relation, 'equal');
        TKAssertEquals(constraint.secondAttribute, 'width');
        TKAssertEquals(constraint.secondItem, '/One');
        constraint = constraintFromEquality("two.width = one.width * 2 - 12", refs);
        TKAssertEquals(constraint.constant, -12);
        TKAssertEquals(constraint.firstAttribute, 'width');
        TKAssertEquals(constraint.firstItem, '/Two');
        TKAssertEquals(constraint.multiplier, 2);
        TKAssertEquals(constraint.relation, 'equal');
        TKAssertEquals(constraint.secondAttribute, 'width');
        TKAssertEquals(constraint.secondItem, '/One');
        constraint = constraintFromEquality("two.width = one.width * 2.5 - 12", refs);
        TKAssertEquals(constraint.constant, -12);
        TKAssertEquals(constraint.firstAttribute, 'width');
        TKAssertEquals(constraint.firstItem, '/Two');
        TKAssertEquals(constraint.multiplier, 2.5);
        TKAssertEquals(constraint.relation, 'equal');
        TKAssertEquals(constraint.secondAttribute, 'width');
        TKAssertEquals(constraint.secondItem, '/One');
        constraint = constraintFromEquality("two.width = one.width * 2 - n", refs);
        TKAssertEquals(constraint.constant, -10);
        TKAssertEquals(constraint.firstAttribute, 'width');
        TKAssertEquals(constraint.firstItem, '/Two');
        TKAssertEquals(constraint.multiplier, 2);
        TKAssertEquals(constraint.relation, 'equal');
        TKAssertEquals(constraint.secondAttribute, 'width');
        TKAssertEquals(constraint.secondItem, '/One');
        constraint = constraintFromEquality("two.width = one.width * 2.5 - n", refs);
        TKAssertEquals(constraint.constant, -10);
        TKAssertEquals(constraint.firstAttribute, 'width');
        TKAssertEquals(constraint.firstItem, '/Two');
        TKAssertEquals(constraint.multiplier, 2.5);
        TKAssertEquals(constraint.relation, 'equal');
        TKAssertEquals(constraint.secondAttribute, 'width');
        TKAssertEquals(constraint.secondItem, '/One');
        constraint = constraintFromEquality("self.width = 12 @ 100", refs);
        TKAssertEquals(constraint.constant, 12);
        TKAssertEquals(constraint.firstAttribute, 'width');
        TKAssertEquals(constraint.firstItem, '/Root');
        TKAssertEquals(constraint.priority, 100);
        TKAssertEquals(constraint.relation, 'equal');
        constraint = constraintFromEquality("self.width = 12 @ defaultLow", refs);
        TKAssertEquals(constraint.constant, 12);
        TKAssertEquals(constraint.firstAttribute, 'width');
        TKAssertEquals(constraint.firstItem, '/Root');
        TKAssertEquals(constraint.priority, 'defaultLow');
        TKAssertEquals(constraint.relation, 'equal');
        constraint = constraintFromEquality("self.width = one.width * 2 + 3 @ 100", refs);
        TKAssertEquals(constraint.constant, 3);
        TKAssertEquals(constraint.firstAttribute, 'width');
        TKAssertEquals(constraint.firstItem, '/Root');
        TKAssertEquals(constraint.multiplier, 2);
        TKAssertEquals(constraint.priority, 100);
        TKAssertEquals(constraint.relation, 'equal');
        TKAssertEquals(constraint.secondAttribute, 'width');
        TKAssertEquals(constraint.secondItem, '/One');
        constraint = constraintFromEquality("self.width = one.width * 2 + 3 @ defaultLow", refs);
        TKAssertEquals(constraint.constant, 3);
        TKAssertEquals(constraint.firstAttribute, 'width');
        TKAssertEquals(constraint.firstItem, '/Root');
        TKAssertEquals(constraint.multiplier, 2);
        TKAssertEquals(constraint.priority, 'defaultLow');
        TKAssertEquals(constraint.relation, 'equal');
        TKAssertEquals(constraint.secondAttribute, 'width');
        TKAssertEquals(constraint.secondItem, '/One');
    }

});