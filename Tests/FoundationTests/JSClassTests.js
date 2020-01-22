// #import Foundation
// #import TestKit
'use strict';

(function(){

var BaseObjectClass = function BaseObjectClass(){
    throw new Error("Cannot be used as a construtor or function");
};

Object.setPrototypeOf(BaseObjectClass, JSClass.prototype);

Object.defineProperties(BaseObjectClass, {
    ID: {
        configurable: false,
        enumerable: false,
        writable: true,
        value: 0
    },
    className: {
        configurable: false,
        enumerable: false,
        writable: true,
        value: 'BaseObjectClass'
    },
    constructor: BaseObjectClass
});

BaseObjectClass.staticMethod = function(){

};

BaseObjectClass.prototype = Object.create(Object.prototype, {
    '$class': {
        configurable: false,
        enumerable: false,
        writable: false,
        value: BaseObjectClass
    }
});

JSClass('JSClassTests', TKTestSuite, {

    testBasicExtend: function(){
        var cls = BaseObjectClass.$extend({}, "Test1");
        TKAssertNotNull(cls);
        TKAssertEquals(cls.className, 'Test1');
        TKAssertExactEquals(cls.$super, BaseObjectClass.prototype);
        TKAssertExactEquals(cls.prototype.$class, cls);
        TKAssertNotUndefined(cls.staticMethod);

        TKAssertThrows(function(){
            var cls = BaseObjectClass.$extend({});
        });
    },

    testClassDebuggerName: function(){
        var cls = BaseObjectClass.$extend({}, "Test1");
        TKAssertNotUndefined(cls.prototype.constructor);
        TKAssertEquals(cls.prototype.constructor.name, "Test1");
    },

    testDeclaration: function(){
        var cls = JSClass('Test1', BaseObjectClass, {});
        TKAssertNotNull(cls);
        TKAssertEquals(cls.className, 'Test1');
        TKAssertExactEquals(JSGlobalObject.Test1, cls);
        TKAssertExactEquals(cls.$super, BaseObjectClass.prototype);
        TKAssertExactEquals(cls.prototype.$class, cls);
    },

    testNonJSClassDeclaration: function(){
        TKAssertThrows(function(){
            var cls = JSClass('Test2', {}, {});
        });
    },

    testUnnamedDeclaration: function(){
        TKAssertThrows(function(){
            var cls = JSClass('', BaseObjectClass, {});
        });
    },

    testBasicInheritance: function(){
        var cls = JSClass('Test1', BaseObjectClass, {});
        TKAssertNotNull(cls);
        TKAssertEquals(cls.className, 'Test1');
        TKAssertExactEquals(JSGlobalObject.Test1, cls);
        TKAssertExactEquals(cls.$super, BaseObjectClass.prototype);
        TKAssertExactEquals(cls.prototype.$class, cls);
        var cls2 = JSClass('Test2', cls, {});
        TKAssertNotNull(cls2);
        TKAssertEquals(cls2.className, 'Test2');
        TKAssertExactEquals(JSGlobalObject.Test2, cls2);
        TKAssertExactEquals(cls2.$super, cls.prototype);
        TKAssertExactEquals(cls2.prototype.$class, cls2);
    },

    testIsSubclassOfClass: function(){
        var cls = JSClass('Test1', BaseObjectClass, {});
        var cls2 = JSClass('Test2', cls, {});
        TKAssert(cls.isSubclassOfClass(BaseObjectClass));
        TKAssert(cls2.isSubclassOfClass(cls));
    },

    testExtendOverride: function(){
        var cls = JSClass('Test1', BaseObjectClass, {});
        var extendCount = 0;
        cls.$extend = function(extensions, className){
            extendCount++;
        };
        var cls2 = JSClass('Test2', cls, {});
        TKAssertEquals(extendCount, 1);
    },

    testNameOfSetMethodForKey: function(){
        var key = "testing";
        var name = JSClass.prototype.nameOfSetMethodForKey(key);
        TKAssertEquals(name, "setTesting");
    },

    testNameOfGetMethodForKey: function(){
        var key = "testing";
        var name = JSClass.prototype.nameOfGetMethodForKey(key);
        TKAssertEquals(name, "getTesting");
    },

    testNameOfBooleanGetMethodForKey: function(){
        var key = "testing";
        var name = JSClass.prototype.nameOfBooleanGetMethodForKey(key);
        TKAssertEquals(name, "isTesting");
    },

    testNameOfSilentSetMethodForKey: function(){
        var key = "testing";
        var name = JSClass.prototype.nameOfSilentSetMethodForKey(key);
        TKAssertEquals(name, "_setTesting");
    },

    testNameOfInsertMethodForKey: function(){
        var key = "testing";
        var name = JSClass.prototype.nameOfInsertMethodForKey(key);
        TKAssertEquals(name, "insertObjectInTestingAtIndex");
    },

    testNameOfSilentInsertMethodForKey: function(){
        var key = "testing";
        var name = JSClass.prototype.nameOfSilentInsertMethodForKey(key);
        TKAssertEquals(name, "_insertObjectInTestingAtIndex");
    },

    testNameOfRemoveMethodForKey: function(){
        var key = "testing";
        var name = JSClass.prototype.nameOfRemoveMethodForKey(key);
        TKAssertEquals(name, "removeObjectFromTestingAtIndex");
    },

    testNameOfSilentRemoveMethodForKey: function(){
        var key = "testing";
        var name = JSClass.prototype.nameOfSilentRemoveMethodForKey(key);
        TKAssertEquals(name, "_removeObjectFromTestingAtIndex");
    },

    testNameOfReplaceMethodForKey: function(){
        var key = "testing";
        var name = JSClass.prototype.nameOfReplaceMethodForKey(key);
        TKAssertEquals(name, "replaceObjectInTestingAtIndexWithObject");
    },

    testNameOfSilentReplaceMethodForKey: function(){
        var key = "testing";
        var name = JSClass.prototype.nameOfSilentReplaceMethodForKey(key);
        TKAssertEquals(name, "_replaceObjectInTestingAtIndexWithObject");
    },

    testNameOfSilentPropertyForKey: function(){
        var key = "testing";
        var name = JSClass.prototype.nameOfSilentPropertyForKey(key);
        TKAssertEquals(name, "_testing");
    },

    testPropertiesExtend: function(){
        var extensions = {
            x: 0,
            y: 1,

            init: function(x, y){
                this.x = x;
                this.y = y;
            },

            f: function(){
                return this.x + this.y;
            }
        };
        var cls = BaseObjectClass.$extend(extensions, "Test1");
        TKAssertEquals(cls.prototype.x, 0);
        TKAssertEquals(cls.prototype.y, 1);
        TKAssert(cls.prototype.f instanceof Function);

        var obj = cls.init(2,4);
        TKAssertEquals(cls.prototype.x, 0);
        TKAssertEquals(cls.prototype.y, 1);
        TKAssertEquals(obj.x, 2);
        TKAssertEquals(obj.y, 4);
        TKAssertEquals(obj.f(), 6);

        var extensions2 = {
            x: 3,
            y: 5
        };
        var cls2 = cls.$extend(extensions2, "Test2");
        TKAssertEquals(cls2.prototype.x, 3);
        TKAssertEquals(cls2.prototype.y, 5);
        TKAssert(cls.prototype.f instanceof Function);
    },

    testDefinePropertiesFromExtensions: function(){
        var cls = JSClass('Test1', BaseObjectClass, {
            x: 0,

            init: function(x){
                this.x = x;
            }

        });
        var extensions = {
            y: 1,

            f: function(){
                return this.x + this.y;
            }
        };
        cls.definePropertiesFromExtensions(extensions);
        TKAssertEquals(cls.prototype.x, 0);
        TKAssertEquals(cls.prototype.y, 1);
        TKAssert(cls.prototype.f instanceof Function);
    },

    testInitFunctionDeclaration: function(){
        var customReturnObj = {};
        var cls = JSClass('Test1', BaseObjectClass, {
            x: 0,

            init: function(){
                this.x = -1;
            },

            initWithNumber: function(x){
                this.x = x;
            },

            initCustomReturn: function(){
                return customReturnObj;
            }
        });
        TKAssertNotNull(cls);

        var obj = cls.init();
        TKAssertExactEquals(obj.$class, cls);
        TKAssertEquals(obj.x, -1);

        obj = cls.initWithNumber(5);
        TKAssertExactEquals(obj.$class, cls);
        TKAssertEquals(obj.x, 5);

        obj = cls.initCustomReturn();
        TKAssertExactEquals(obj, customReturnObj);
    },

    testDymanicProperty: function(){
        var cls = JSClass('Test1', BaseObjectClass, {
            x: JSDynamicProperty(),
            y: JSDynamicProperty('_y', 10),
            z: JSDynamicProperty('_z', 12, 'testGetZ'),
            a: JSDynamicProperty('_a', 50, 'testGetA', 'testSetA'),

            _setCallCount: 0,

            init: function(){
            },

            getX: function(){
                return this._setCallCount * 2;
            },

            setX: function(){
                this._setCallCount++;
            },

            testGetZ: function(){
                return this._z;
            },

            testGetA: function(){
                return this._a;
            },

            testSetA: function(a){
                if (a < 0){
                    a = 0;
                }
                this._a = a;
            },

        });

        var obj = cls.init();
        TKAssertEquals(obj._setCallCount, 0);
        TKAssertEquals(obj.x, 0);
        obj.x = 5;
        TKAssertEquals(obj._setCallCount, 1);
        TKAssertEquals(obj.x, 2);

        TKAssertEquals(obj.y, 10);
        obj.y = 5;
        TKAssertEquals(obj.y, 5);

        TKAssertEquals(obj.z, 12);
        obj.z = 13;
        TKAssertEquals(obj.z, 13);

        TKAssertEquals(obj.a, 50);
        obj.a = 7;
        TKAssertEquals(obj.a, 7);
        obj.a = -3;
        TKAssertEquals(obj.a, 0);
    },

    testReadOnlyProperty: function(){
        var cls = JSClass('Test1', BaseObjectClass, {
            x: JSReadOnlyProperty(),
            y: JSReadOnlyProperty('_y', 10),
            z: JSReadOnlyProperty('_z', 12, 'testGetZ'),

            init: function(){
            },

            incrementY: function(){
                this._y++;
            },

            getX: function(){
                return 5;
            },

            testGetZ: function(){
                return this._z;
            }

        });

        var obj = cls.init();
        TKAssertEquals(obj.x, 5);
        TKAssertThrows(function(){ obj.x = 10; });
        TKAssertEquals(obj.y, 10);
        TKAssertThrows(function(){ obj.y = 8; });
        obj.incrementY();
        TKAssertEquals(obj.y, 11);
        TKAssertEquals(obj.z, 12);
        TKAssertThrows(function(){ obj.z = 10; });
    },

    testLazyInitProperty: function(){
        var cls = JSClass('Test1', BaseObjectClass, {
            x: JSLazyInitProperty('_lazyInitX'),

            xInitCount: 0,

            init: function(){
            },

            _lazyInitX: function(){
                this.xInitCount++;
                return 5;
            }

        });

        var obj = cls.init();
        TKAssertEquals(obj.xInitCount, 0);
        TKAssertEquals(obj.x, 5);
        TKAssertEquals(obj.xInitCount, 1);
        TKAssertEquals(obj.x, 5);
        TKAssertEquals(obj.xInitCount, 1);
    },

    testReadOnlyPropertyOverride: function(){

        var cls = JSClass('Test1', BaseObjectClass, {
            x: JSReadOnlyProperty(),
            y: JSReadOnlyProperty('_y', 0),
            z: JSReadOnlyProperty('_z', 1, 'testGetZ'),

            init: function(){
            },

            getX: function(){
                return 5;
            },

            testGetZ: function(){
                return 10;
            }

        });

        var cls2 = JSClass('Test2', cls, {

            getX: function(){
                return 6;
            },

            getY: function(){
                return 1;
            },

            testGetZ: function(){
                return 11;
            }

        });

        var obj = cls.init();
        TKAssertEquals(obj.x, 5);
        TKAssertEquals(obj.y, 0);
        TKAssertEquals(obj.z, 10);
        var obj2 = cls2.init();
        TKAssertEquals(obj2.x, 6);
        TKAssertEquals(obj2.y, 1);
        TKAssertEquals(obj2.z, 11);
    },

    testDynamicPropertyOverride: function(){
        var cls = JSClass('Test1', BaseObjectClass, {
            x: JSDynamicProperty(),
            y: JSDynamicProperty('_y', 10),
            z: JSDynamicProperty('_z', 12, 'testGetZ'),
            a: JSDynamicProperty('_a', 50, 'testGetA', 'testSetA'),

            _setCallCount: 0,

            init: function(){
            },

            getX: function(){
                return this._setCallCount * 2;
            },

            setX: function(){
                this._setCallCount++;
            },

            testGetZ: function(){
                return this._z;
            },

            testGetA: function(){
                return this._a;
            },

            testSetA: function(a){
                if (a < 0){
                    a = 0;
                }
                this._a = a;
            },

        });

        var cls2 = JSClass('Test2', cls, {

            _setCallCount2: 0,

            getX: function(){
                return this._setCallCount2 * 3;
            },

            setX: function(){
                this._setCallCount2++;
            },

            getY: function(){
                return this._y * 2;
            },

            setY: function(y){
                this._y = y - 1;
            },

            testGetZ: function(){
                return 11;
            },

            setZ: function(z){
                this._z = z + 1;
            },

            testGetA: function(){
                return this._a * 2;
            },

            testSetA: function(a){
                if (a > 0){
                    a = 0;
                }
                this._a = a;
            }

        });

        var obj = cls.init();
        TKAssertEquals(obj._setCallCount, 0);
        TKAssertEquals(obj.x, 0);
        obj.x = 5;
        TKAssertEquals(obj._setCallCount, 1);
        TKAssertEquals(obj.x, 2);

        TKAssertEquals(obj.y, 10);
        obj.y = 5;
        TKAssertEquals(obj.y, 5);

        TKAssertEquals(obj.z, 12);
        obj.z = 13;
        TKAssertEquals(obj.z, 13);

        TKAssertEquals(obj.a, 50);
        obj.a = 7;
        TKAssertEquals(obj.a, 7);
        obj.a = -3;
        TKAssertEquals(obj.a, 0);

        var obj2 = cls2.init();
        TKAssertEquals(obj2._setCallCount, 0);
        TKAssertEquals(obj2._setCallCount2, 0);
        TKAssertEquals(obj2.x, 0);
        obj2.x = 5;
        TKAssertEquals(obj2._setCallCount, 0);
        TKAssertEquals(obj2._setCallCount2, 1);
        TKAssertEquals(obj2.x, 3);

        TKAssertEquals(obj2.y, 20);
        obj2.y = 5;
        TKAssertEquals(obj2.y, 8);

        TKAssertEquals(obj2.z, 11);
        obj2.z = 13;
        TKAssertEquals(obj2._z, 14);

        TKAssertEquals(obj2.a, 100);
        obj2.a = 7;
        TKAssertEquals(obj2.a, 0);
        obj2.a = -3;
        TKAssertEquals(obj2.a, -6);
    }

});

})();