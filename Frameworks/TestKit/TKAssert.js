'use strict';

function TKAssertion(){
    if (this === undefined){
        return new TKAssertion();
    }
}

function TKAssert(condition){
    if (!condition){
        throw TKAssertion();
    }
}

function TKAssertEquals(a, b){
    if (a != b){
        throw TKAssertion();
    }
}

function TKAssertNotEquals(a, b){
    if (a == b){
        throw TKAssertion();
    }
}

function TKAssertExactEquals(a, b){
    if (a !== b){
        throw TKAssertion();
    }
}

function TKAssertNotExactEquals(a, b){
    if (a === b){
        throw TKAssertion();
    }
}

function TKAssertObjectEquals(a, b){
    if (!a.isEqual(b)){
        throw TKAssertion();
    }
}

function TKAssertObjectNotEquals(a, b){
    if (a.isEqual(b)){
        throw TKAssertion();
    }
}

function TKAssertNotNull(expression){
    if (expression === null){
        throw TKAssertion();
    }
}

function TKAssertNull(expression){
    if (expression !== null){
        throw TKAssertion();
    }
}