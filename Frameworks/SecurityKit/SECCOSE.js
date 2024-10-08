// #import Foundation
// #import "SECCBOR.js"
// #import "SECJSONWebAlgorithms.js"
"use strict";

(function(){

JSClass("SECCOSE", JSObject, {

    dictionary: null,

    initWithData: function(data){
        var parser = SECCBORParser.initWithData(data);
        this.dictionary = parser.readNext();
    },

    attribute: function(attr){
        return this.dictionary[attr] || null;
    },

    derRepresentation: function(){
        return JSData.init();
    },

    jwkRepresentation: function(){
        var jwk = {};
        switch (this.attribute(SECCOSE.Attribute.kty)){
            case SECCOSE.KeyType.ellipticCurve:
                jwk.kty = SECJSONWebAlgorithms.KeyType.ellipticCurve;
                switch (this.attribute(SECCOSE.Attribute.alg)){
                    case SECCOSE.Algorithm.ellipticCurveSHA256:
                        jwk.alg = SECJSONWebAlgorithms.Algorithm.ellipticCurveSHA256;
                        break;
                    case SECCOSE.Algorithm.ellipticCurveSHA384:
                        jwk.alg = SECJSONWebAlgorithms.Algorithm.ellipticCurveSHA384;
                        break;
                    case SECCOSE.Algorithm.ellipticCurveSHA512:
                        jwk.alg = SECJSONWebAlgorithms.Algorithm.ellipticCurveSHA512;
                        break;
                    default:
                        return null;
                }
                switch (this.attribute(SECCOSE.Attribute.ellipticCurve_crv)){
                    case SECCOSE.EllipticCurve.p256:
                        jwk.crv = SECJSONWebAlgorithms.EllipticCurve.p256;
                        break;
                    case SECCOSE.EllipticCurve.p384:
                        jwk.crv = SECJSONWebAlgorithms.EllipticCurve.p384;
                        break;
                    case SECCOSE.EllipticCurve.p521:
                        jwk.crv = SECJSONWebAlgorithms.EllipticCurve.p521;
                        break;
                    default:
                        return null;
                }
                jwk.x = this.attribute(SECCOSE.Attribute.ellipticCurve_x).base64URLStringRepresentation();
                jwk.y = this.attribute(SECCOSE.Attribute.ellipticCurve_y).base64URLStringRepresentation();
                break;
            case SECCOSE.KeyType.rsa:
                jwk.kty = SECJSONWebAlgorithms.KeyType.rsa;
                switch (this.attribute(SECCOSE.Attribute.alg)){
                    case SECCOSE.Algorithm.rsaSHA256:
                        jwk.alg = SECJSONWebAlgorithms.Algorithm.rsaSHA256;
                        break;
                    case SECCOSE.Algorithm.rsaSHA384:
                        jwk.alg = SECJSONWebAlgorithms.Algorithm.rsaSHA384;
                        break;
                    case SECCOSE.Algorithm.rsaSHA512:
                        jwk.alg = SECJSONWebAlgorithms.Algorithm.rsaSHA512;
                        break;
                    default:
                        return null;
                }
                jwk.n = this.attribute(SECCOSE.Attribute.rsa_n).base64URLStringRepresentation();
                jwk.e = this.attribute(SECCOSE.Attribute.rsa_e).base64URLStringRepresentation();
                break;
            default:
                return null;
        }
        return jwk;
    }

});

SECCOSE.KeyType = {
    ellipticCurve: 2,
    rsa: 3,
    symmetric: 4,
};

SECCOSE.Algorithm = {
    rsaSHA256: -257,
    rsaSHA384: -258,
    rsaSHA512: -259,
    ellipticCurveSHA256: -7,
    ellipticCurveSHA384: -35,
    ellipticCurveSHA512: -36,
};

SECCOSE.EllipticCurve = {
    p256: 1,
    p384: 2,
    p521: 3
};

SECCOSE.Attribute = {
    kty: 1,
    kid: 2,
    alg: 3,
    key_ops: 4,

    ellipticCurve_crv: -1,
    ellipticCurve_x: -2,
    ellipticCurve_y: -3,
    ellipticCurve_d: -4,

    rsa_n: -1,
    rsa_e: -2,
    rsa_d: -3,
    rsa_p: -4,
    rsa_q: -5,
    rsa_dP: -6,
    rsa_dQ: -7,
    rsa_qInv: -8,
    rsa_other: -9,
    rsa_r_i: -10,
    rsa_d_i: -11,
    rsa_t_i: -12,

    symmetric_k: -1

};


})();