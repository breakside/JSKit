// Copyright 2023 Breakside Inc.
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
// #import "UIVisualEffect.js"
"use strict";

UIVisualEffect.definePropertiesFromExtensions({

    cssFilterString: function(){
        return null;
    }

});

UIBlurEffect.definePropertiesFromExtensions({

    cssFilterString: function(){
        return "blur(%fpx)".sprintf(this.radius);
    }

});

UIGrayscaleEffect.definePropertiesFromExtensions({

    cssFilterString: function(){
        return "grayscale(%f)".sprintf(this.percentage);
    }

});

UISepiaEffect.definePropertiesFromExtensions({

    cssFilterString: function(){
        return "sepia(%f)".sprintf(this.percentage);
    }

});

UIDesaturateEffect.definePropertiesFromExtensions({

    cssFilterString: function(){
        return "saturate(%f)".sprintf(1 - this.percentage);
    }

});

UIDarkenEffect.definePropertiesFromExtensions({

    cssFilterString: function(){
        return "brightness(%f)".sprintf(1 - this.percentage);
    }

});