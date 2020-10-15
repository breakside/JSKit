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

// #import UIKit
// #import "UIMockDisplayServer.js"
// #import "UIMockTextInputManager.js"
"use strict";

JSClass("UIMockWindowServer", UIWindowServer, {

    init: function(){
        UIMockWindowServer.$super.init.call(this);
        this.displayServer = UIMockDisplayServer.init();
        this.textInputManager = UIMockTextInputManager.init();
        this.textInputManager.windowServer = this;
        this.screen = UIScreen.initWithFrame(JSRect(0, 0, 1500, 1000));
        this.device = UIDevice.init();
    },

});