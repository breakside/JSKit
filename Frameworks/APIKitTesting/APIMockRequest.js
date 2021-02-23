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

// #import APIKit
"use strict";

JSClass("APIMockRequest", APIRequest, {

    initWithMethodAndURL: function(method, url, body){
        APIMockRequest.$super.initWithMethodAndURL(method, url);
        if (body !== undefined && body !== null){
            if (body instanceof JSFormFieldMap){
                this.setForm(body);
            }else if (body instanceof JSData){
                this.setData(body);
            }else{
                this.setObject(body);
            }
        }
    },

    setData: function(data){
        this._data = data;
    },

    setObject: function(object){
        this._data = JSON.stringify(object).utf8();
        this.headerMap.add("Content-Type", "application/json; charset=utf-8");
    },

    setForm: function(form){
        this._data = form.urlEncoded();
        this.headerMap.add("Content-Type", "application/x-www-form-urlencoded");
    }

});