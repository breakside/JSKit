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

// #import "UIUserInterface.js"
'use strict';

JSClass("UITraitCollection", JSObject, {

    initWithSize: function(size){
        this.horizontalSizeClass = UIUserInterface.SizeClass.fromLength(size.width);
        this.verticalSizeClass = UIUserInterface.SizeClass.fromLength(size.height);
    },

    traitsWithContrast: function(contrast){
        var traits = UITraitCollection.init();
        traits.horizontalSizeClass = this.horizontalSizeClass;
        traits.verticalSizeClass = this.verticalSizeClass;
        traits.userInterfaceStyle = this.userInterfaceStyle;
        traits.accessibilityContrast = contrast;
        return traits;
    },

    traitsWithUserInterfaceStyle: function(style){
        var traits = UITraitCollection.init();
        traits.horizontalSizeClass = this.horizontalSizeClass;
        traits.verticalSizeClass = this.verticalSizeClass;
        traits.userInterfaceStyle = style;
        traits.accessibilityContrast = this.accessibilityContrast;
        return traits;
    },

    traitsWithSize: function(size){
        var traits = UITraitCollection.initWithSize(size);
        traits.accessibilityContrast = this.accessibilityContrast;
        traits.userInterfaceStyle = this.userInterfaceStyle;
        return traits;
    },

    horizontalSizeClass: UIUserInterface.SizeClass.unspecified,
    verticalSizeClass: UIUserInterface.SizeClass.unspecified,
    userInterfaceStyle: UIUserInterface.Style.unspecified,
    accessibilityContrast: UIUserInterface.Contrast.unspecified,

    isEqual: function(other){
        if (this.horizontalSizeClass !== other.horizontalSizeClass){
            return false;
        }
        if (this.verticalSizeClass !== other.verticalSizeClass){
            return false;
        }
        if (this.accessibilityContrast !== other.accessibilityContrast){
            return false;
        }
        if (this.userInterfaceStyle !== other.userInterfaceStyle){
            return false;
        }
        return true;
    }

});