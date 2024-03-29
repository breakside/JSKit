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

// #import "JSObject.js"
// #import "JSLocale.js"
// #import "JSFile.js"
// #import "JSLog.js"
'use strict';

(function(){

var logger = JSLog("foundation", "bundle");

JSClass('JSBundle', JSObject, {

    _dict: null,
    _preferredLanguagesVersion: -1,
    _supportedPreferredLanguages: null,
    info: JSLazyInitProperty('_getInfo'),

    initWithIdentifier: function(identifier){
        this.identifier = identifier;
        var dict = JSBundle.bundles[this.identifier];
        if (dict === undefined){
            throw new Error("Bundle not found: %s".sprintf(this.identifier));
        }
        this.initWithDictionary(dict);
    },

    initWithDictionary: function(dict){
        this._dict = dict;
        this._updateSupportedUserLanguagesIfNeeded();
    },

    _getInfo: function(){
        return this._dict.Info;
    },

    _updateSupportedUserLanguagesIfNeeded: function(){
        if (this._preferredLanguagesVersion !== JSLocale.preferredLanguagesVersion){
            this._preferredLanguagesVersion = JSLocale.preferredLanguagesVersion;
            this._supportedPreferredLanguages = this._getSupportedLanguagesForLocaleIdentifiers(JSLocale.preferredLanguages);
        }
    },

    _getSupportedLanguagesForLocaleIdentifiers: function(preferredLanguages){
        var localizationIdentifiers = this.info[JSBundle.InfoKeys.localizations] || [];
        var locale;
        var locales = {};
        var i, l;
        var localeKey;
        var supportedPreferredLanguages = [];
        // Make a map of supported locales
        //
        // Fill in missing generic language codes and language+script codes
        // based on the least-speicific entry matching that langauge code or
        // languge+script code.  A tie in specificity goes to the first entry found.
        // 
        // ['en-US', 'en-GB', 'en', 'de-DE', 'fr', 'zh-Hans-CN', 'zh-Hans']
        // --->
        // {
        //    'en':         'en',
        //    'en-US':      'en-US',
        //    'en-GB':      'en-GB',
        //    'de':         'de-DE',
        //    'de-DE':      'de-DE',
        //    'fr':         'fr',
        //    'zh':         'zh-Hans',
        //    'zh-Hans':    'zh-Hans',
        //    'zh-Hans-CN': 'zh-Hans-CN'
        // }
        for (i = 0, l = localizationIdentifiers.length; i < l; ++i){
            locale = JSLocale.initWithIdentifier(localizationIdentifiers[i]);
            localeKey = locale.languageCode;
            if (!(localeKey in locales) || locale.isLessSpecificThan(locales[localeKey])){
                locales[localeKey] = locale;
            }
            if (locale.scriptCode !== null){
                localeKey = locale.languageCode + '-' + locale.scriptCode;
                if (!(localeKey in locales) || locale.isLessSpecificThan(locales[localeKey])){
                    locales[localeKey] = locale;
                }
                if (locale.regionCode !== null){
                    localeKey += '-' + locale.regionCode;
                    if (!(localeKey in locales) || locale.isLessSpecificThan(locales[localeKey])){
                        locales[localeKey] = locale;
                    }
                }
            }else if (locale.regionCode !== null){
                localeKey += '-' + locale.regionCode;
                if (!(localeKey in locales) || locale.isLessSpecificThan(locales[localeKey])){
                    locales[localeKey] = locale;
                }
            }
        }

        // Make a sorted list of uer preferred languages (or fallbacks) that we have in the bundle
        for (i = 0, l = preferredLanguages.length; i < l; ++i){
            locale = JSLocale.initWithIdentifier(preferredLanguages[i]);
            if (locale === null){
                continue;
            }
            localeKey = locale.identifierWithoutExtensions;
            if (localeKey in locales){
                // We have a direct match in the bundle, which may either be an
                // exact hit, or an upgrade based on the fill-ins we added above,
                // when an exact match isn't available.
                // en-US -> en-US
                // en -> en-US
                // 
                // NOTE: This means a fill in may take precedence over a lower priority exact match
                // bundle: ('en-US', 'de-DE')
                // user: ('en', 'de-DE')
                // Will match en to en-US even though it is not exact.
                // This kind of ambiguity is removed if the user preferences always include a region
                supportedPreferredLanguages.push(locales[localeKey].identifier);
            }else if (locale.regionCode !== null){
                // If we don't have an exact match, the user preference may be specific to a script
                // or region we don't support, but there may be an alternative script or region we
                // do support in the same language.  In this case, we'll try to match the language
                // as best we can.
                // en-GB -> en
                // en-GB -> en-US
                if (locale.scriptCode !== null){
                    // We have langauge + script + region, but no exact match, so try just language + script
                    localeKey = locale.languageCode + '-' + locale.scriptCode;
                    if (localeKey in locales){
                        supportedPreferredLanguages.push(locales[localeKey].identifier);
                    }else{
                        // language + script didn't find a match, so try language + region
                        localeKey = locale.languageCode + '-' + locale.region;
                        if (localeKey in locales){
                            supportedPreferredLanguages.push(locales[localeKey].identifier);
                        }else{
                            // language + region didn't find a match, so try just language
                            localeKey = locale.languageCode;
                            if (localeKey in locales){
                                supportedPreferredLanguages.push(locales[localeKey].identifier);
                            }
                        }
                    }
                }else{
                    // We have langauge + region, but no exact match, so try just language
                    localeKey = locale.languageCode;
                    if (localeKey in locales){
                        supportedPreferredLanguages.push(locales[localeKey].identifier);
                    }
                }
            }else if (locale.scriptCode !== null){
                // we have language + script, but no exact match, so try just language
                localeKey = locale.languageCode;
                if (localeKey in locales){
                    supportedPreferredLanguages.push(locales[localeKey].identifier);
                }
            }
        }
        // Add the dev language as the final fallback, because we know it exists
        // NOTE: this may be a duplicate entry, but duplicates cause no problems because
        // they'll never be reached.
        var devlang = this.info[JSBundle.InfoKeys.developmentLanguage];
        if (devlang !== undefined){
            supportedPreferredLanguages.push(devlang);
        }
        return supportedPreferredLanguages;
    },

    metadataForResourceName: function(name, ext, subdirectory){
        var lookupKey = name;
        if (ext !== undefined && ext !== null){
            if (!ext.startsWith('.')){
                ext = '.' + ext;
            }
            lookupKey += ext;
        }
        if (subdirectory !== undefined && subdirectory !== null){
            lookupKey = subdirectory + '/' + lookupKey;
        }
        if (this._dict.ResourceLookup === undefined){
            return null;
        }
        var lookup = this._dict.ResourceLookup.global;
        var hits = lookup[lookupKey];
        if (hits !== undefined){
            return this._dict.Resources[hits[0]];
        }
        return this._localizedMetadataForLookupKey(lookupKey);
    },

    _localizedMetadataForLookupKey: function(lookupKey, locale, filter){
        var lookup;
        var hits;
        var langs;
        if (locale){
            langs = this._getSupportedLanguagesForLocaleIdentifiers([locale.identifier]);
        }else{
            this._updateSupportedUserLanguagesIfNeeded();
            langs = this._supportedPreferredLanguages;
        }
        var metadata;
        for (var i = 0, l = langs.length; i < l; ++i){
            lookup = this._dict.ResourceLookup[langs[i]];
            if (lookup !== undefined){
                hits = lookup[lookupKey];
                if (hits !== undefined){
                    metadata = this._dict.Resources[hits[0]];
                    if (!filter || filter(metadata)){
                        return metadata;
                    }
                }
            }
        }
        return null;
    },

    getResourceData: function(metadata, completion, target){
    },

    fileForResourceName: function(name, ext, subdirectory){
        var metadata = this.metadataForResourceName(name, ext, subdirectory);
        if (metadata !== null){
            return JSBundleResourceFile.initWithMetadata(metadata, this);
        }
        return null;
    },

    fonts: function(){
        var fonts = [];
        if (this._dict.Fonts !== undefined && this._dict.Fonts !== null){
            for (var i = 0, l = this._dict.Fonts.length; i < l; ++i){
                fonts.push(this._dict.Resources[this._dict.Fonts[i]]);
            }
        }
        return fonts;
    },

    localizedString: function(key, table, locale){
        if (table === undefined){
            table = "Localizable.strings";
        }else if (table.substr(-8, 8) != ".strings"){
            table += ".strings";
        }
        var metadata = this._localizedMetadataForLookupKey(table, locale, function(m){
            return key in m.strings;
        });
        if (metadata !== null){
            return metadata.strings[key];
        }
        var langs;
        if (locale){
            langs = this._getSupportedLanguagesForLocaleIdentifiers([locale.identifier]);
        }else{
            this._updateSupportedUserLanguagesIfNeeded();
            langs = this._supportedPreferredLanguages;
        }
        logger.warn("Missing localization key '%{public}' in %{public} for %{public}", key, table, langs.join(","));
        return key;
    },

    localizedStringForInfoKey: function(infoKey){
        var infoValue = this.info[infoKey];
        if (infoValue && infoValue.length > 0 && infoValue.charAt(0) === '.'){
            return this.localizedString(infoValue.substr(1), "Info.strings");
        }
        return infoValue;
    }

});

JSClass("JSBundleResourceFile", JSFile, {

    metadata: null,
    bundle: null,

    initWithMetadata: function(metadata, bundle){
        this.metadata = metadata;
        this.bundle = bundle;
        this._name = metadata.path;
        this._contentType = metadata.mimeType;
        this._size = metadata.byte_size;
    },

    readData: function(completion, target){
        return this.bundle.getResourceData(this.metadata, completion, target);
    }

});

JSBundle.bundles = {};
JSBundle.mainBundleIdentifier = null;

JSBundle.Type = {
    object: 'object',
    image: 'image',
    font: 'font'
};

JSBundle.InfoKeys = {
    bundleType: "JSBundleType",
    bundleIdentifier: "JSBundleIdentifier",
    localizations: "JSLocalizations",
    developmentLanguage: "JSDevelopmentLanguage"
};

Object.defineProperty(JSBundle, 'mainBundle', {
    configurable: true,
    enumerable: false,
    get: function JSBundle_getMainBundle(){
        var bundle = JSBundle.mainBundleIdentifier !== null ? JSBundle.initWithIdentifier(JSBundle.mainBundleIdentifier) : null;
        Object.defineProperty(JSBundle, 'mainBundle', {
            configurable: false,
            enumerable: false,
            value: bundle
        });
        return bundle;
    }
});

})();