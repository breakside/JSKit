// #import SecurityKit
// #import TestKit
'use strict';

JSClass("SECASN1ParserTests", TKTestSuite, {

    testEllipticPublicKey: function(){
        var pem = "-----BEGIN PUBLIC KEY-----\nMFkwEwYHKoZIzj0CAQYIKoZIzj0DAQcDQgAEXl2cAQTJVgx5S8OlXvzoe1vrWQWq\nykHEd6sYquq1Lzn7ZLqTj8JhnLyrgBqnVl5HD8ukpjc2QOZm9tlDZuF9qQ==\n-----END PUBLIC KEY-----";
        var parser = SECASN1Parser.initWithPEM(pem, "PUBLIC KEY");
        var value = parser.parse();
        TKAssert(value instanceof SECASN1Sequence);
        TKAssertEquals(value.values.length, 2);
        TKAssert(value.values[0] instanceof SECASN1Sequence);
        TKAssertEquals(value.values[0].values.length, 2);
        TKAssert(value.values[0].values[0] instanceof SECASN1ObjectIdentifier);
        TKAssertEquals(value.values[0].values[0].stringValue, "1.2.840.10045.2.1");
        TKAssert(value.values[0].values[1] instanceof SECASN1ObjectIdentifier);
        TKAssertEquals(value.values[0].values[1].stringValue, "1.2.840.10045.3.1.7");
        TKAssert(value.values[1] instanceof SECASN1BitString);
        TKAssertEquals(value.values[1].data.length, 65);
        TKAssertEquals(value.values[1].data[0], 0x04);
    },

    testEllipticPrivateKey: function(){
        var pem = "-----BEGIN EC PRIVATE KEY-----\nMHcCAQEEIOTahafUh+BrA59hmO7JNPbsOv1a+jxePRsiSLmENkYqoAoGCCqGSM49\nAwEHoUQDQgAEXl2cAQTJVgx5S8OlXvzoe1vrWQWqykHEd6sYquq1Lzn7ZLqTj8Jh\nnLyrgBqnVl5HD8ukpjc2QOZm9tlDZuF9qQ==\n-----END EC PRIVATE KEY-----";
        var parser = SECASN1Parser.initWithPEM(pem, "EC PRIVATE KEY");
        var value = parser.parse();
        TKAssert(value instanceof SECASN1Sequence);
        TKAssertEquals(value.values.length, 4);
        TKAssert(value.values[0] instanceof SECASN1Integer);
        TKAssertEquals(value.values[0].data.length, 1);
        TKAssertEquals(value.values[0].data[0], 1);
        TKAssert(value.values[1] instanceof SECASN1OctetString);
        TKAssertEquals(value.values[1].data.length, 32);
        TKAssert(value.values[2] instanceof SECASN1Optional);
        TKAssertEquals(value.values[2].classNumber, 0);
        TKAssert(value.values[2].value instanceof SECASN1ObjectIdentifier);
        TKAssertEquals(value.values[2].value.stringValue, "1.2.840.10045.3.1.7");
        TKAssert(value.values[3] instanceof SECASN1Optional);
        TKAssertEquals(value.values[3].classNumber, 1);
        TKAssert(value.values[3].value instanceof SECASN1BitString);
        TKAssertEquals(value.values[3].value.data.length, 65);
        TKAssertEquals(value.values[3].value.data[0], 0x04);
    },

});