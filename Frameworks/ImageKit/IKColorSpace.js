// #import Foundation
'use strict';

(function(){

JSClass("IKColorSpace", JSObject, {

    profileData: JSReadOnlyProperty('_profileData', null),
    _header: null,
    _tags: null,

    initWithProfileData: function(profileData){
        if (profileData.length < 132){
            return null;
        }
        var dataView = profileData.dataView();
        this._profileData = profileData;
        this._header = IKColorSpaceHeader(dataView);
        var tagCount = dataView.getUint32(128);
        if (profileData.length < 132 + tagCount * 12){
            return null;
        }
        var offset = 132;
        this._tags = {};
        var tag;
        for (var i = 0; i < tagCount; ++i){
            tag = {
                offset: dataView.getUint32(offset + 4),
                size: dataView.getUint32(offset + 8)
            };
            if (tag.offset + tag.size > profileData.length){
                return null;
            }
            this._tags[Uint32ToString(dataView.getUint32(offset))] = tag;
            offset += 12;
        }
    }

});

var Uint32ToString = function(u){
    return String.fromCharCode([(u >> 24) & 0xFF, (u >> 16) & 0xFF, (u >> 8) & 0xFF, u & 0xFF]);
};

var IKColorSpaceHeader = function(dataView){
    return {
        size:           dataView.getUint32(0),
        preferred_cmm:  dataView.getUint32(4),
        version:        dataView.getUint32(8),
        profile_class:  Uint32ToString(dataView.getUint32(12)),
        color_space:    Uint32ToString(dataView.getUint32(16)),
        pcs:            Uint32ToString(dataView.getUint32(20)),
        year:           dataView.getUint16(24),
        month:          dataView.getUint16(26),
        day:            dataView.getUint16(28),
        hour:           dataView.getUint16(30),
        minute:         dataView.getUint16(32),
        second:         dataView.getUint16(34),
        signature:      Uint32ToString(dataView.getUint32(36)),
        platform:       Uint32ToString(dataView.getUint32(40)),
        flags:          dataView.getUint32(44),
        manufacturer:   dataView.getUint32(48),
        model:          dataView.getUint32(52),
        attributes1:    dataView.getUint32(56),
        attributes2:    dataView.getUint32(60),
        intent:         dataView.getUint32(64),
        illuminant_X:   dataView.getUint32(68),
        illuminant_Y:   dataView.getUint32(72),
        illuminant_Z:   dataView.getUint32(76),
        creator:        dataView.getUint32(80),
        id1:            dataView.getUint32(84),
        id2:            dataView.getUint32(88),
        id3:            dataView.getUint32(92),
        id4:            dataView.getUint32(96)
    };
};

})();