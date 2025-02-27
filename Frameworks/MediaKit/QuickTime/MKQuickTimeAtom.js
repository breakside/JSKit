// #import Foundation
"use strict";

(function(){

var logger = JSLog("medikit", "quicktime");

JSClass("MKQuickTimeAtom", JSObject, {

    type: null,
    atoms: null,
    data: null,
    dataView: null,

    initWithData: function(data){
        if (data.length < 8){
            throw new Error("Expecting at least 8 bytes for every atom");
        }
        this.atoms = [];
        this.data = data;
        this.dataView = data.dataView();
        this.type = this.dataView.getUint32(4);
    },

    readAtoms: function(offset){
        if (offset === undefined){
            offset = 0;
        }
        var i = offset;
        var l = this.data.length;
        var size;
        var type;
        var a, b;
        var atomClass, atom;
        while (i < l - 8){
            size = this.dataView.getUint32(i);
            type = this.dataView.getUint32(i + 4);
            if (size === 0x00000001){
                if (i < l - 16){
                    a = this.dataView.getUint32(i + 8);
                    b = this.dataView.getUint32(i + 12);
                    size = Math.pow(2, 32) * a + b;
                    if (size > Number.MAX_SAFE_INTEGER){
                        throw new Error("cannot retain full precision of 64 bit integer for atom at byte %d".sprintf(i));
                    }
                }
            }else{
                if (size === 0x00000000){
                    size = l - i;
                }
            }
            if (i + size > l){
                throw new Error("invalid size for atom at byte %d, extends beyond file size".sprintf(i));
            }
            atomClass = this.classForAtomType(type);
            atom = atomClass.initWithData(this.data.subdataInRange(JSRange(i, size)));
            this.atoms.push(atom);
            i += size;
        }
        if (i !== l){
            logger.warn("unused bytes at end of atom");
        }
    },

    classesByAtomType: JSLazyInitProperty(function(){ return {};}),

    registerAtomClass: function(atomClass){
        this.classesByAtomType[atomClass.prototype.type] = atomClass;
    },

    classForAtomType: function(type){
        var atomClass = this.classesByAtomType[type];
        if (atomClass === undefined){
            atomClass = MKQuickTimeAtom;
        }
        return atomClass;
    },

    atomOfType: function(type){
        var i, l;
        for (i = 0, l = this.atoms.length; i < l; ++i){
            if (this.atoms[i].type === type){
                return this.atoms[i];
            }
        }
        return null;
    },

    atomsOfType: function(type){
        var i, l;
        var atoms = [];
        for (i = 0, l = this.atoms.length; i < l; ++i){
            if (this.atoms[i].type === type){
                atoms.push(this.atoms[i]);
            }
        }
        return atoms;
    },

    dictionaryRepresentation: function(){
        return {
            type: MKQuickTimeAtom.stringForType(this.type),
        };
    },

    debugRepresentation: function(){
        var dictionary = this.dictionaryRepresentation();
        if (this.atoms.length > 0){
            dictionary.atoms = [];
            var i, l;
            for (i = 0, l = this.atoms.length; i < l; ++i){
                dictionary.atoms.push(this.atoms[i].debugRepresentation());
            }
        }
        return dictionary;
    }

});

MKQuickTimeAtom.Type = {
    ftyp: 0x66747970,
    moov: 0x6d6f6f76,
    mvhd: 0x6d766864,
    trak: 0x7472616b,
    tkhd: 0x746b6864,
    mdia: 0x6d646961,
    mdhd: 0x6d646864,
    hdlr: 0x68646c72,
    minf: 0x6d696e66,
    vmhd: 0x766d6864,
    stbl: 0x7374626c,
    stts: 0x73747473,
    stsd: 0x73747364,
    stsz: 0x7374737a,
    udta: 0x75647461,
    meta: 0x6d657461
};

MKQuickTimeAtom.stringForType = function(type){
    var bytes = [
        (type & 0xFF000000) >>> 24,
        (type & 0x00FF0000) >>> 16,
        (type & 0x0000FF00) >>> 8,
        (type & 0x000000FF)
    ];
    return JSData.initWithArray(bytes).stringByDecodingLatin1();
};

MKQuickTimeAtom.stringsForTypes = function(types){
    var strings = [];
    var i, l;
    for (i = 0, l = types.length; i < l; ++i){
        strings.push(MKQuickTimeAtom.stringForType(types[i]));
    }
    return strings;
};

})();