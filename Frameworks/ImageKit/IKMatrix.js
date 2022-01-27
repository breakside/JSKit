// Copyright 2022 Breakside Inc.
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
'use strict';

JSGlobalObject.IKMatrix = function(m){
    Object.defineProperties(m, {
        rows: {
            configurable: true,
            enumerable: false,
            value: m.length
        },
        columns: {
            configurable: true,
            enumerable: false,
            value: m.length > 0 ? m[0].length : 0
        },
        determinant: {
            configurable: true,
            enumerable: false,
            value: function(){
                if (m.rows === 2 && m.columns === 2){
                    return m[0][0] * m[1][1] - m[0][1] * m[1][0];
                }
                if (m.rows === 3 && m.columns === 3){
                    return m[0][0] * m[1][1] * m[2][2] -
                        m[0][0] * m[1][2] * m[2][1] -
                        m[0][1] * m[1][0] * m[2][2] +
                        m[0][1] * m[1][2] * m[2][0] +
                        m[0][2] * m[1][0] * m[2][1] -
                        m[0][2] * m[1][1] * m[2][0];
                }
                throw new Error("Unable to compute %dx%d determinant".sprintf(m.rows, m.columns));
            }
        },
        inverse: {
            configurable: true,
            enumerable: false,
            value: function(){
                if (m.rows === 2 && m.columns === 2){
                    return IKMatrix([
                        [m[1][1], -m[0][1]],
                        [-m[1][0], m[0][0]]
                    ]).multiplied(1.0 / m.determinant());
                }
                if (m.rows === 3 && m.columns === 3){
                    return IKMatrix([
                        [
                            IKMatrix([
                                [m[1][1], m[1][2]],
                                [m[2][1], m[2][2]]
                            ]).determinant(),
                            IKMatrix([
                                [m[0][2], m[0][1]],
                                [m[2][2], m[2][1]]
                            ]).determinant(),
                            IKMatrix([
                                [m[0][1], m[0][2]],
                                [m[1][1], m[1][2]]
                            ]).determinant()
                        ],
                        [
                            IKMatrix([
                                [m[1][2], m[1][0]],
                                [m[2][2], m[2][0]]
                            ]).determinant(),
                            IKMatrix([
                                [m[0][0], m[0][2]],
                                [m[2][0], m[2][2]]
                            ]).determinant(),
                            IKMatrix([
                                [m[0][2], m[0][0]],
                                [m[1][2], m[1][0]]
                            ]).determinant()
                        ],
                        [
                            IKMatrix([
                                [m[1][0], m[1][1]],
                                [m[2][0], m[2][1]]
                            ]).determinant(),
                            IKMatrix([
                                [m[0][1], m[0][0]],
                                [m[2][1], m[2][0]]
                            ]).determinant(),
                            IKMatrix([
                                [m[0][0], m[0][1]],
                                [m[1][0], m[1][1]]
                            ]).determinant()
                        ]
                    ]).multiplied(1.0 / m.determinant());
                }
                throw new Error("Unable to compute %dx%d inverse".sprintf(m.rows, m.columns));
            }
        },
        multiplied: {
            configurable: true,
            enumerable: false,
            value: function(x){
                var result = IKMatrix(JSDeepCopy(m));
                var row, col;
                for (row = 0; row < result.rows; ++row){
                    for (col = 0; col < result.columns; ++col){
                        result[row][col] *= x;
                    }
                }
                return result;
            }
        }
    });
    return m;
};