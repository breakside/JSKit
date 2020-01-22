// #import "DOMNode.js"
'use strict';

DOM.Element.prototype = Object.create(DOM.Node.prototype, {
    
    constructor: {
        value: DOM.Element
    },

    attributes: {
        value: null
    },
    _attributeMap: {
        value: null
    },

    namespaceURI: { value: null, configurable: true},
    prefix: { value: null, configurable: true},
    localName: { value: null, configurable: true},
    tagName: {
        get: function(){
            return this.nodeName;
        }
    },

    setAttribute: {
        value: function DOMElement_setAttribute(name, value){
            var attr = this._attributeMap[':global:'][name];
            if (!attr){
                attr = this.ownerDocument.createAttribute(name);
                this.attributes.push(attr);
                this._attributeMap[':global:'][name] = attr;
            }
            attr.value = value;
        },
    },

    getAttribute: {
        value: function DOMElement_getAttribute(name){
            var attr = this._attributeMap[':global:'][name];
            if (attr){
                return attr.value;
            }
            return null;
        }
    },

    setAttributeNS: {
        value: function DOMElement_setAttribute(namespace, qualifiedName, value){
            var map = this._attributeMap[namespace];
            if (!map){
                this._attributeMap[namespace] = {};
            }
            var name = DOM._parseQualifiedName(qualifiedName);
            var attr = this._attributeMap[namespace][name.localName];
            if (!attr){
                attr = this.ownerDocument.createAttributeNS(namespace, qualifiedName);
                this.attributes.push(attr);
                this._attributeMap[namespace][name] = value;
            }
            attr.value = value;
        },
    },

    getAttributeNS: {
        value: function DOMElement_getAttribute(namespace, localName){
            var map = this._attributeMap[namespace];
            if (!map){
                return null;
            }
            var attr = this._attributeMap[namespace][localName];
            if (attr){
                return attr.value;
            }
            return null;
        }
    },

    hasAttribute: {
        value: function DOMElement_hasAttribute(name){
            var attr = this._attributeMap[':global:'][name];
            return attr !== undefined;
        }
    },

    removeAttribute: {
        value: function DOMElement_removeAttribute(name){
            var attr = this._attributeMap[':global:'][name];
            if (attr){
                var index = this.attributes.indexOf(attr);
                this.attributes.splice(index, 1);
                delete this._attributeMap[':global:'][name];
            }
        }
    }

});
