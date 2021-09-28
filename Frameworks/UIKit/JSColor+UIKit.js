// Copyright 2021 Breakside Inc.
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
//
// #import Foundation
// #import "UIColorSpace.js"
"use strict";

JSColor.definePropertiesFromExtensions({

    initWithUIStyles: function(lightColor, darkColor, lightContrastColor, darkContrastColor){
        var space = UIColorSpace.initWithStyles(lightColor, darkColor, lightContrastColor, darkContrastColor);
        var components = [1, -1];
        this.initWithSpaceAndComponents(space, components);
    },

});

JSColor.defineInitMethod("initWithUIStyles");

// Common Colors
JSColorSpace.ui.setStylesForName("background", JSColor.white, JSColor.initWithWhite(0.15));
JSColorSpace.ui.setStylesForName("text", JSColor.black.colorWithAlpha(0.9), JSColor.white.colorWithAlpha(0.9));
JSColorSpace.ui.setStylesForName("secondaryText", JSColor.black.colorWithAlpha(0.6), JSColor.white.colorWithAlpha(0.6));
JSColorSpace.ui.setStylesForName("highlight", JSColor.initWithRGBA(0, 0.5, 1), JSColor.initWithRGBA(0, 0.5, 1));
JSColorSpace.ui.setStylesForName("mutedHighlight", JSColor.black.colorWithAlpha(0.15), JSColor.white.colorWithAlpha(0.1));
JSColorSpace.ui.setStylesForName("highlightedText", JSColor.white, JSColor.white);
JSColorSpace.ui.setColorForName("placeholderText", JSColor.text.colorWithAlpha(0.3));
JSColorSpace.ui.setStylesForName("destructive", JSColor.initWithRGBA(0.8,0,0), JSColor.initWithRGBA(1,0.5,0.5));

// Control Colors
JSColorSpace.ui.setStylesForName("controlBackground", JSColor.initWithWhite(0.98), JSColor.initWithWhite(0.35));
JSColorSpace.ui.setStylesForName("controlBorder", JSColor.black.colorWithAlpha(0.2), JSColor.black.colorWithAlpha(0.8));
JSColorSpace.ui.setStylesForName("controlTitle", JSColor.initWithWhite(0.2), JSColor.white);
JSColorSpace.ui.setStylesForName("activeControlBackground", JSColor.initWithWhite(0.875), JSColor.initWithWhite(0.2));
JSColorSpace.ui.setStylesForName("activeControlBorder", JSColor.black.colorWithAlpha(0.2), JSColor.black.colorWithAlpha(0.8));
JSColorSpace.ui.setStylesForName("activeControlTitle", JSColor.initWithWhite(0.2), JSColor.initWithWhite(0.8));
JSColorSpace.ui.setStylesForName("selectedControlBackground", JSColor.initWithWhite(0.5), JSColor.initWithWhite(0.1));
JSColorSpace.ui.setStylesForName("selectedControlBorder", JSColor.black.colorWithAlpha(0.2), JSColor.black.colorWithAlpha(0.8));
JSColorSpace.ui.setStylesForName("selectedControlTitle", JSColor.initWithWhite(0.94), JSColor.initWithWhite(0.94));
JSColorSpace.ui.setStylesForName("activeSelectedControlBackground", JSColor.initWithWhite(0.4), JSColor.black);
JSColorSpace.ui.setStylesForName("activeSelectedControlBorder", JSColor.black.colorWithAlpha(0.2), JSColor.black.colorWithAlpha(0.8));
JSColorSpace.ui.setStylesForName("activeSelectedControlTitle", JSColor.initWithWhite(0.94), JSColor.initWithWhite(1.0));
JSColorSpace.ui.setStylesForName("disabledControlBackground", JSColor.initWithWhite(0.94), JSColor.initWithWhite(0.1));
JSColorSpace.ui.setStylesForName("disabledControlBorder", JSColor.black.colorWithAlpha(0.2), JSColor.black.colorWithAlpha(0.8));
JSColorSpace.ui.setStylesForName("disabledControlTitle", JSColor.initWithWhite(0.6), JSColor.initWithWhite(0.4));
JSColorSpace.ui.setColorForName("controlShadow", JSColor.black.colorWithAlpha(0.1));

// Window Colors
JSColorSpace.ui.setStylesForName("window", JSColor.initWithWhite(0.94), JSColor.initWithWhite(0.2));
JSColorSpace.ui.setColorForName("windowShadow", JSColor.black.colorWithAlpha(0.4));
JSColorSpace.ui.setColorForName("toolbarTitle", JSColor.text.colorWithAlpha(0.6));

// Tooltip Colors
JSColorSpace.ui.setColorForName("tooltip", JSColor.window);
JSColorSpace.ui.setColorForName("tooltipText", JSColor.text);
JSColorSpace.ui.setStylesForName("tooltipBorder", JSColor.initWithWhite(0.7), JSColor.black);
JSColorSpace.ui.setColorForName("tooltipShadow", JSColor.black.colorWithAlpha(0.2));

// Menu Colors
JSColorSpace.ui.setStylesForName("menuBar", JSColor.initWithWhite(0.94), JSColor.initWithWhite(0.1));
JSColorSpace.ui.setStylesForName("menuBarText", JSColor.black, JSColor.white);
JSColorSpace.ui.setColorForName("menu", JSColor.window);
JSColorSpace.ui.setColorForName("menuShadow", JSColor.black.colorWithAlpha(0.2));
