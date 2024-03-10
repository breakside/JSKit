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
'use strict';

(function(){

JSClass("QRCodeDrawing", JSObject, {

    size: null,
    modules: null,
    version: null,
    quietSize: 4,
    bitColumn: 0,
    bitIndex: 0,
    bitDirection: -1,

    initWithVersion: function(version){
        if (version < 1 || version > 40){
            return null;
        }
        this.version = version;
        var size = 21 + 4 * (version - 1);
        this.size = size + this.quietSize + this.quietSize;

        // Create module grid
        this.modules = JSData.initWithLength(this.size * this.size);

        // Draw finders
        this.drawFinderPatternAt(0, 0);
        this.drawFinderPatternAt(0, size - 7);
        this.drawFinderPatternAt(size - 7, 0);

        // Draw timing patterns
        this.drawVerticalTiming();
        this.drawHorizontalTiming();

        // Draw alignment patterns
        var locations = alignmentPatternLocationsByVersion[this.version];
        for (var x = 0, l = locations.length; x < l; ++x){
            for (var y = 0; y < l; ++y){
                if (x === 0 && y === 0){
                    continue;
                }
                if (x === 0 && y === l - 1){
                    continue;
                }
                if (y === 0 && x === l - 1){
                    continue;
                }
                this.drawAlignmentPatternCenteredAt(locations[x], locations[y]);       
            }
        }

        // Upper left format information area
        this.flag(this.quietSize, this.quietSize + 8, 6, 1, QRCodeDrawing.Flag.format);
        this.flag(this.quietSize + 7, this.quietSize + 8, 2, 1, QRCodeDrawing.Flag.format);
        this.flag(this.quietSize + 8, this.quietSize, 1, 6, QRCodeDrawing.Flag.format);
        this.flag(this.quietSize + 8, this.quietSize + 7, 1, 2, QRCodeDrawing.Flag.format);

        // Upper right format information area
        this.flag(this.size - this.quietSize - 8, this.quietSize + 8, 8, 1, QRCodeDrawing.Flag.format);

        // Lower left format information area
        this.flag(this.quietSize + 8, this.size - this.quietSize - 8, 1, 8, QRCodeDrawing.Flag.format);

        if (version >= 7){
            // Upper right version information area
            this.flag(this.size - this.quietSize - 11, this.quietSize, 3, 6, QRCodeDrawing.Flag.version);
            
            // Lower left version information
            this.flag(this.quietSize, this.size - this.quietSize - 11, 6, 3, QRCodeDrawing.Flag.version);
        }

        // Flag quiet zones (clear out overwites)
        this.unflag(0, 0, this.quietSize, this.size, ~QRCodeDrawing.Flag.quiet); // left
        this.unflag(0, 0, this.size, this.quietSize, ~QRCodeDrawing.Flag.quiet); // top
        this.unflag(this.size - this.quietSize, 0, this.quietSize, this.size, ~QRCodeDrawing.Flag.quiet); // right
        this.unflag(0, this.size - this.quietSize, this.size, this.quietSize, ~QRCodeDrawing.Flag.quiet); // bottom
        this.flag(0, 0, this.quietSize, this.size, QRCodeDrawing.Flag.quiet);
        this.flag(0, 0, this.size, this.quietSize, QRCodeDrawing.Flag.quiet);
        this.flag(this.size - this.quietSize, 0, this.quietSize, this.size, QRCodeDrawing.Flag.quiet);
        this.flag(0, this.size - this.quietSize, this.size, this.quietSize, QRCodeDrawing.Flag.quiet);

        // Starting point for writing bits
        this.bitIndex = (this.size - this.quietSize - 1) * this.size + this.size - this.quietSize - 1;
        this.bitDirection = BitDirection.up;
    },

    drawFinderPatternAt: function(x, y){
        x += this.quietSize;
        y += this.quietSize;

        this.flag(x, y, 7, 7, QRCodeDrawing.Flag.on | QRCodeDrawing.Flag.finder);
        this.unflag(x + 1, y + 1, 5, 5, QRCodeDrawing.Flag.on);
        this.flag(x + 2, y + 2, 3, 3, QRCodeDrawing.Flag.on);
        this.flag(x - 1, y - 1, 9, 9, QRCodeDrawing.Flag.finder);
    },

    drawAlignmentPatternCenteredAt: function(x, y){
        x += this.quietSize;
        y += this.quietSize;
        x -= 2;
        y -= 2;
        this.flag(x, y, 5, 5, QRCodeDrawing.Flag.on | QRCodeDrawing.Flag.alignment | QRCodeDrawing.Flag.finder);
        this.unflag(x + 1, y + 1, 3, 3, QRCodeDrawing.Flag.on);
        this.flag(x + 2, y + 2, 1, 1, QRCodeDrawing.Flag.on);

    },

    flag: function(x, y, width, height, flag){
        var m = y * this.size + x;
        for (var i = 0; i < height; ++i){
            for (var j = 0; j < width; ++j){
                this.modules[m + j] |= flag;
            }
            m += this.size;
        }
    },

    unflag: function(x, y, width, height, flag){
        var m = y * this.size + x;
        for (var i = 0; i < height; ++i){
            for (var j = 0; j < width; ++j){
                this.modules[m + j] &= ~flag;
            }
            m += this.size;
        }
    },

    drawVerticalTiming: function(){
        var x = this.quietSize + 6;
        var y0 = this.quietSize + 8;
        var y1 = this.size - this.quietSize - 8;
        var m = y0 * this.size + x;
        var step = this.size + this.size;
        this.flag(x, y0, 1, y1 - y0, QRCodeDrawing.Flag.timing);
        for (var y = y0; y < y1; y += 2, m += step){
            this.modules[m] |= QRCodeDrawing.Flag.on;
        }
    },

    drawHorizontalTiming: function(){
        var y = this.quietSize + 6;
        var x0 = this.quietSize + 8;
        var x1 = this.size - this.quietSize - 8;
        var m = y * this.size + x0;
        this.flag(x0, y, x1 - x0, 1, QRCodeDrawing.Flag.timing);
        for (var x = x0; x < x1; x += 2, m += 2){
            this.modules[m] |= QRCodeDrawing.Flag.on;
        }
    },

    drawFormat: function(format){
        // Upper left
        var i = this.quietSize * this.size + this.quietSize + 8;
        this.modules[i] |= (format & (0x01 << 0)) >> 0;
        i += this.size;
        this.modules[i] |= (format & (0x01 << 1)) >> 1;
        i += this.size;
        this.modules[i] |= (format & (0x01 << 2)) >> 2;
        i += this.size;
        this.modules[i] |= (format & (0x01 << 3)) >> 3;
        i += this.size;
        this.modules[i] |= (format & (0x01 << 4)) >> 4;
        i += this.size;
        this.modules[i] |= (format & (0x01 << 5)) >> 5;
        i += this.size;
        i += this.size; // skipping over timing row
        this.modules[i] |= (format & (0x01 << 6)) >> 6;
        i += this.size;
        this.modules[i] |= (format & (0x01 << 7)) >> 7;
        i -= 1;
        this.modules[i] |= (format & (0x01 << 8)) >> 8;
        i -= 1;
        i -= 1; // Skipping over timing column
        this.modules[i] |= (format & (0x01 << 9)) >> 9;
        i -= 1;
        this.modules[i] |= (format & (0x01 << 10)) >> 10;
        i -= 1;
        this.modules[i] |= (format & (0x01 << 11)) >> 11;
        i -= 1;
        this.modules[i] |= (format & (0x01 << 12)) >> 12;
        i -= 1;
        this.modules[i] |= (format & (0x01 << 13)) >> 13;
        i -= 1;
        this.modules[i] |= (format & (0x01 << 14)) >> 14;


        // Upper right
        i = (this.quietSize + 8) * this.size + this.size - this.quietSize - 1;
        this.modules[i] |= (format & (0x01 << 0)) >> 0;
        i -= 1;
        this.modules[i] |= (format & (0x01 << 1)) >> 1;
        i -= 1;
        this.modules[i] |= (format & (0x01 << 2)) >> 2;
        i -= 1;
        this.modules[i] |= (format & (0x01 << 3)) >> 3;
        i -= 1;
        this.modules[i] |= (format & (0x01 << 4)) >> 4;
        i -= 1;
        this.modules[i] |= (format & (0x01 << 5)) >> 5;
        i -= 1;
        this.modules[i] |= (format & (0x01 << 6)) >> 6;
        i -= 1;
        this.modules[i] |= (format & (0x01 << 7)) >> 7;

        // Lower left
        i = (this.size - this.quietSize - 1) * this.size + this.quietSize + 8;
        this.modules[i] |= (format & (0x01 << 14)) >> 14;
        i -= this.size;
        this.modules[i] |= (format & (0x01 << 13)) >> 13;
        i -= this.size;
        this.modules[i] |= (format & (0x01 << 12)) >> 12;
        i -= this.size;
        this.modules[i] |= (format & (0x01 << 11)) >> 11;
        i -= this.size;
        this.modules[i] |= (format & (0x01 << 10)) >> 10;
        i -= this.size;
        this.modules[i] |= (format & (0x01 << 9)) >> 9;
        i -= this.size;
        this.modules[i] |= (format & (0x01 << 8)) >> 8;
        i -= this.size;
        this.modules[i] |= QRCodeDrawing.Flag.on;
    },

    drawVersion: function(version){
        if (this.version < 7){
            return;
        }
        // upper right
        var i = this.quietSize * this.size + this.size - this.quietSize - 11;
        this.modules[i] |= (version & (0x1 << 0)) >> 0;
        i += 1;
        this.modules[i] |= (version & (0x1 << 1)) >> 1;
        i += 1;
        this.modules[i] |= (version & (0x1 << 2)) >> 2;
        i += this.size - 2;
        this.modules[i] |= (version & (0x1 << 3)) >> 3;
        i += 1;
        this.modules[i] |= (version & (0x1 << 4)) >> 4;
        i += 1;
        this.modules[i] |= (version & (0x1 << 5)) >> 5;
        i += this.size - 2;
        this.modules[i] |= (version & (0x1 << 6)) >> 6;
        i += 1;
        this.modules[i] |= (version & (0x1 << 7)) >> 7;
        i += 1;
        this.modules[i] |= (version & (0x1 << 8)) >> 8;
        i += this.size - 2;
        this.modules[i] |= (version & (0x1 << 9)) >> 9;
        i += 1;
        this.modules[i] |= (version & (0x1 << 10)) >> 10;
        i += 1;
        this.modules[i] |= (version & (0x1 << 11)) >> 11;
        i += this.size - 2;
        this.modules[i] |= (version & (0x1 << 12)) >> 12;
        i += 1;
        this.modules[i] |= (version & (0x1 << 13)) >> 13;
        i += 1;
        this.modules[i] |= (version & (0x1 << 14)) >> 14;
        i += this.size - 2;
        this.modules[i] |= (version & (0x1 << 15)) >> 15;
        i += 1;
        this.modules[i] |= (version & (0x1 << 16)) >> 16;
        i += 1;
        this.modules[i] |= (version & (0x1 << 17)) >> 17;

        // lower left
        i = (this.size - this.quietSize - 11) * this.size + this.quietSize;
        this.modules[i] |= (version & (0x1 << 0)) >> 0;
        i += 1;
        this.modules[i] |= (version & (0x1 << 3)) >> 3;
        i += 1;
        this.modules[i] |= (version & (0x1 << 6)) >> 6;
        i += 1;
        this.modules[i] |= (version & (0x1 << 9)) >> 9;
        i += 1;
        this.modules[i] |= (version & (0x1 << 12)) >> 12;
        i += 1;
        this.modules[i] |= (version & (0x1 << 15)) >> 15;
        i += this.size - 5;
        this.modules[i] |= (version & (0x1 << 1)) >> 1;
        i += 1;
        this.modules[i] |= (version & (0x1 << 4)) >> 4;
        i += 1;
        this.modules[i] |= (version & (0x1 << 7)) >> 7;
        i += 1;
        this.modules[i] |= (version & (0x1 << 10)) >> 10;
        i += 1;
        this.modules[i] |= (version & (0x1 << 13)) >> 13;
        i += 1;
        this.modules[i] |= (version & (0x1 << 16)) >> 16;
        i += this.size - 5;
        this.modules[i] |= (version & (0x1 << 2)) >> 2;
        i += 1;
        this.modules[i] |= (version & (0x1 << 5)) >> 5;
        i += 1;
        this.modules[i] |= (version & (0x1 << 8)) >> 8;
        i += 1;
        this.modules[i] |= (version & (0x1 << 11)) >> 11;
        i += 1;
        this.modules[i] |= (version & (0x1 << 14)) >> 14;
        i += 1;
        this.modules[i] |= (version & (0x1 << 17)) >> 17;
    },

    drawCodeword: function(byte){
        var mask = 0x80;
        var shift = 7;
        while (mask > 0){
            this.drawBit((byte & mask) >> shift);
            mask >>= 1;
            --shift;
        }
    },

    drawBit: function(on){
        var index = this.bitIndex;
        if (on){
            this.modules[index] |= QRCodeDrawing.Flag.on;
        }
        if (this.bitIndex < 0){
            throw new Error("Cannot write more data");
        }
        if (this.bitColumn === 0){
            // if we just wrote to the right side of the column,
            // we can safely assume the left side of the column is open
            this.bitIndex = index - 1;
            this.bitColumn = 1;
            if (this.modules[this.bitIndex] !== 0){
                throw new Error("Next module already written");
            }
            return;
        }
        // Up
        if (this.bitDirection == BitDirection.up){
            // if we just wrote to the left side of the column,
            // see if the space is open one up and one to the right
            // if not, see if the space is open one up
            // if not, continue checking until we have to turn around
            index -= this.size - 1;
            while (index >= 0){
                // up and over
                if ((this.modules[index] & QRCodeDrawing.Flag.reserved) === 0){
                    this.bitColumn = 0;
                    this.bitIndex = index;
                    return;
                }
                index -= 1;
                if ((this.modules[index] & QRCodeDrawing.Flag.reserved) === 0){
                    this.bitColumn = 1;
                    this.bitIndex = index;
                    return;
                }
                index -= this.size - 1;
            }
            // turn around and move left
            this.bitDirection = BitDirection.down;
            index = this.bitIndex - 1;
            // back up to the top row
            while (index > this.size){
                index -= this.size;
            }
            while (index < this.modules.length){
                if ((this.modules[index] & QRCodeDrawing.Flag.reserved) === 0){
                    this.bitIndex = index;
                    this.bitColumn = 0;
                    return;
                }
                // taken, move left
                index -= 1;
                if ((this.modules[index] & QRCodeDrawing.Flag.reserved) === 0){
                    this.bitIndex = index;
                    if ((this.modules[index + 1] & QRCodeDrawing.Flag.timing) !== 0){
                        this.bitColumn = 0;
                    }else{
                        this.bitColumn = 1;
                    }
                    return;
                }
                index += this.size + 1;
            }
            // end
            this.bitIndex = -1;
            this.bitColumn = 0;
            return;
        }
        // Down
        // if we just wrote to the left side of the column,
        // see if the space is open one down and over to the right
        // if not, see if the space is open one down
        // if not, continue checking until we have to turn around
        index += this.size + 1;
        while (index < this.modules.length){
            // down and over
            if ((this.modules[index] & QRCodeDrawing.Flag.reserved) === 0){
                this.bitColumn = 0;
                this.bitIndex = index;
                return;
            }
            index -= 1;
            if ((this.modules[index] & QRCodeDrawing.Flag.reserved) === 0){
                this.bitColumn = 1;
                this.bitIndex = index;
                return;
            }
            index += this.size + 1;
        }
        // turn around and move left
        this.bitDirection = BitDirection.up;
        index = this.bitIndex - 1;
        while (index >= 0){
            if ((this.modules[index] & QRCodeDrawing.Flag.reserved) === 0){
                this.bitIndex = index;
                this.bitColumn = 0;
                return;
            }
            // taken, move left
            index -= 1;
            if ((this.modules[index] & QRCodeDrawing.Flag.reserved) === 0){
                this.bitIndex = index;
                if ((this.modules[index + 1] & QRCodeDrawing.Flag.timing) !== 0){
                    this.bitColumn = 0;
                }else{
                    this.bitColumn = 1;
                }
                return;
            }
            index -= this.size - 1;
        }
        // end
        this.bitIndex = -1;
        this.bitColumn = 0;
    },

    copy: function(){
        var drawing = QRCodeDrawing.init();
        drawing.size = this.size;
        drawing.modules = JSData.initWithCopyOfData(this.modules);
        drawing.version = this.version;
        drawing.quietSize = this.quietSize;
        drawing.bitColumn = this.bitColumn;
        drawing.bitIndex = this.bitIndex;
        drawing.bitDirection = this.bitDirection;
        return drawing;
    },

    drawingWithMask: function(mask){
        var drawing = this.copy();
        drawing._applyMask(mask);
        return drawing;
    },

    maskScore: function(){
        var quietSize = this.quietSize;
        var size = this.size;
        var modules = this.modules;
        var score = 0;
        var x, y;
        var m0 = quietSize * size + quietSize;
        var m = m0;
        var n;
        var totalCount = 0;
        var onCount = 0;
        var n1 = 3;
        var n2 = 3;
        var n3 = 40;
        var n4 = 10;
        var on = 0;
        var size2 = size + size;
        var size3 = size2 + size;
        var size4 = size3 + size;
        var size5 = size4 + size;
        var size6 = size5 + size;
        var size7 = size6 + size;
        var size8 = size7 + size;
        var size9 = size8 + size;
        var size10 = size9 + size;
        var c;
        for (y = quietSize; y < size - quietSize; ++y){
            for (x = quietSize; x < size - quietSize; ++x, ++m){
                ++totalCount;
                on = modules[m] & QRCodeDrawing.Flag.on;
                if (on){
                    ++onCount;
                }

                // N1 - runs of same color, without double counting (horizontal)
                if (x > quietSize){
                    c = 0;
                    n = 0;
                    // Check for prior whenever the color changes
                    if ((modules[m - 1] & QRCodeDrawing.Flag.on === on) !== on){
                        n = m - 2;
                        c = 1;
                        while (n >= m - x && (modules[n] & QRCodeDrawing.Flag.on) !== on){
                            --n;
                            ++c;
                        }
                    // ... and don't forget to check at the end of a row
                    }else if (x == size - quietSize - 1){
                        n = m - 1;
                        c = 1;
                        while (n >= m - x && (modules[n] & QRCodeDrawing.Flag.on) === on){
                            --n;
                            ++c;
                        }
                    }
                    if (c >= 5){
                        score += n1 + (c - 5);
                    }
                }

                // N1 - runs of same color, without double counting (vertical)
                if (y > quietSize){
                    c = 0;
                    // Check for prior whenever the color changes
                    if ((modules[m - size] & QRCodeDrawing.Flag.on === on) !== on){
                        n = m - size - size;
                        c = 1;
                        while (n >= m0 && (modules[n] & QRCodeDrawing.Flag.on) !== on){
                            n -= size;
                            ++c;
                        }
                    // ... and don't forget to check at the end of a row
                    }else if (y == size - quietSize - 1){
                        n = m - size;
                        c = 1;
                        while (n >= m0 && (modules[n] & QRCodeDrawing.Flag.on) === on){
                            n -= size;
                            ++c;
                        }
                    }
                    if (c >= 5){
                        score += n1 + (c - 5);
                    }
                }

                // N2 - blocks of same color, 3 points for each 2x2 including overlapping
                if (x > quietSize && y > quietSize){
                    if ((modules[m - 1] & QRCodeDrawing.Flag.on === on) && (modules[m - size] & QRCodeDrawing.Flag.on === on) && (modules[m - size - 1] & QRCodeDrawing.Flag.on === on)){
                        score += n2;
                    }
                }
            }
            m += quietSize + quietSize;
        }

        // N3 (horizontal)
        m = m0;
        for (y = quietSize; y < size - quietSize; ++y){
            for (x = quietSize; x < size - quietSize - 6; ++x, ++m){
                if (
                    ((modules[m] & QRCodeDrawing.Flag.on) === QRCodeDrawing.Flag.on) &&
                    ((modules[m + 1] & QRCodeDrawing.Flag.on) === 0) &&
                    ((modules[m + 2] & QRCodeDrawing.Flag.on) === QRCodeDrawing.Flag.on) &&
                    ((modules[m + 3] & QRCodeDrawing.Flag.on) === QRCodeDrawing.Flag.on) &&
                    ((modules[m + 4] & QRCodeDrawing.Flag.on) === QRCodeDrawing.Flag.on) &&
                    ((modules[m + 5] & QRCodeDrawing.Flag.on) === 0) &&
                    ((modules[m + 6] & QRCodeDrawing.Flag.on) === QRCodeDrawing.Flag.on)
                ){
                    if (
                        (
                            (x >= quietSize + 4) &&
                            ((modules[m - 1] & QRCodeDrawing.Flag.on) === 0) &&
                            ((modules[m - 2] & QRCodeDrawing.Flag.on) === 0) &&
                            ((modules[m - 3] & QRCodeDrawing.Flag.on) === 0) &&
                            ((modules[m - 4] & QRCodeDrawing.Flag.on) === 0)
                        ) ||
                        (
                            (x < size - quietSize - 10) &&
                            ((modules[m + 7] & QRCodeDrawing.Flag.on) === 0) &&
                            ((modules[m + 8] & QRCodeDrawing.Flag.on) === 0) &&
                            ((modules[m + 9] & QRCodeDrawing.Flag.on) === 0) &&
                            ((modules[m + 10] & QRCodeDrawing.Flag.on) === 0)
                        )
                    ){
                        score += n3;
                    }
                }
            }
        }

        // N3 (vertical)
        m = m0;
        for (y = quietSize; y < size - quietSize - 6; ++y){
            for (x = quietSize; x < size - quietSize; ++x, ++m){
                if (
                    ((modules[m] & QRCodeDrawing.Flag.on) === QRCodeDrawing.Flag.on) &&
                    ((modules[m + size] & QRCodeDrawing.Flag.on) === 0) &&
                    ((modules[m + size2] & QRCodeDrawing.Flag.on) === QRCodeDrawing.Flag.on) &&
                    ((modules[m + size3] & QRCodeDrawing.Flag.on) === QRCodeDrawing.Flag.on) &&
                    ((modules[m + size4] & QRCodeDrawing.Flag.on) === QRCodeDrawing.Flag.on) &&
                    ((modules[m + size5] & QRCodeDrawing.Flag.on) === 0) &&
                    ((modules[m + size6] & QRCodeDrawing.Flag.on) === QRCodeDrawing.Flag.on)
                ){
                    if (
                        (
                            (y >= quietSize + 4) &&
                            ((modules[m - size] & QRCodeDrawing.Flag.on) === 0) &&
                            ((modules[m - size2] & QRCodeDrawing.Flag.on) === 0) &&
                            ((modules[m - size3] & QRCodeDrawing.Flag.on) === 0) &&
                            ((modules[m - size4] & QRCodeDrawing.Flag.on) === 0)
                        ) ||
                        (
                            (y < size - quietSize - 10) &&
                            ((modules[m + size7] & QRCodeDrawing.Flag.on) === 0) &&
                            ((modules[m + size8] & QRCodeDrawing.Flag.on) === 0) &&
                            ((modules[m + size9] & QRCodeDrawing.Flag.on) === 0) &&
                            ((modules[m + size10] & QRCodeDrawing.Flag.on) === 0)
                        )
                    ){
                        score += n3;
                    }
                }
            }
        }

        // N4 - Proportion of dark, 10 points for every 5% deviation from 50%
        var k = Math.floor(Math.abs(50 - Math.round(onCount / totalCount * 100)) / 5);
        score += n4 * k;

        return score;
    },

    applyOptimalMask: function(){
        var lowScoreMask = -1;
        var lowScore = Infinity;
        var lowScoreDrawing = this;
        var score;
        var drawing;
        for (var i = 0, l = maskFunctions.length; i < l; ++i){
            drawing = this.drawingWithMask(i);
            score = drawing.maskScore();
            if (score < lowScore){
                lowScore = score;
                lowScoreDrawing = drawing;
                lowScoreMask = i;
            }
        }
        this.modules = lowScoreDrawing.modules;
        return lowScoreMask;
    },

    _applyMask: function(mask){
        var fn = maskFunctions[mask];
        var m = this.quietSize * this.size + this.quietSize;
        var result;
        for (var y = this.quietSize; y < this.size - this.quietSize; ++y){
            for (var x = this.quietSize; x < this.size - this.quietSize; ++x, ++m){
                if ((this.modules[m] & QRCodeDrawing.Flag.reserved) === 0){
                    result = fn(y - this.quietSize, x - this.quietSize);
                    if (result){
                        this.modules[m] = this.modules[m] ^ QRCodeDrawing.Flag.on;
                    }
                }
            }
            m += this.quietSize + this.quietSize;
        }
    },

});

var maskFunctions = [
    function(i, j){ return (i + j) % 2 === 0; },
    function(i, j){ return i % 2 === 0; },
    function(i, j){ return j % 3 === 0; },
    function(i, j){ return (i + j) % 3 === 0; },
    function(i, j){ return (Math.floor(i / 2) + Math.floor(j / 3)) % 2 === 0; },
    function(i, j){ return ((i * j) % 2) + ((i * j) % 3) === 0; },
    function(i, j){ return (((i * j) % 2) + ((i * j) % 3)) % 2 === 0; },
    function(i, j){ return (((i + j) % 2) + ((i * j) % 3)) % 2 === 0; }
];

var BitDirection = {
    up: -1,
    down: 1
};

QRCodeDrawing.Flag = {
    on:         0x01 << 0,
    quiet:      0x01 << 1,
    finder:     0x01 << 2,
    alignment:  0x01 << 3,
    timing:     0x01 << 4,
    format:     0x01 << 5,
    version:    0x01 << 6,
};

QRCodeDrawing.Flag.function = QRCodeDrawing.Flag.finder | QRCodeDrawing.Flag.alignment | QRCodeDrawing.Flag.timing | QRCodeDrawing.Flag.format | QRCodeDrawing.Flag.version;
QRCodeDrawing.Flag.reserved = QRCodeDrawing.Flag.function | QRCodeDrawing.Flag.quiet;

var alignmentPatternLocationsByVersion = [
    [],
    [],
    [6,18],
    [6,22],
    [6,26],
    [6,30],
    [6,34],
    [6,22,38],
    [6,24,42],
    [6,26,46],
    [6,28,50],
    [6,30,54],
    [6,32,58],
    [6,34,62],
    [6,26,46,66],
    [6,26,48,70],
    [6,26,50,74],
    [6,30,54,78],
    [6,30,56,82],
    [6,30,58,86],
    [6,34,62,90],
    [6,28,50,72,94],
    [6,26,50,74,98],
    [6,30,54,78,102],
    [6,28,54,80,106],
    [6,32,58,84,110],
    [6,30,58,86,114],
    [6,34,62,90,118],
    [6,26,50,74,98,122],
    [6,30,54,78,102,126],
    [6,26,52,78,104,130],
    [6,30,56,82,108,134],
    [6,34,60,86,112,138],
    [6,30,58,86,114,142],
    [6,34,62,90,118,146],
    [6,30,54,78,102,126,150],
    [6,24,50,76,102,128,154],
    [6,28,54,80,106,132,158],
    [6,32,58,84,110,136,162],
    [6,26,54,82,110,138,166],
    [6,30,58,86,114,142,170]
];

})();