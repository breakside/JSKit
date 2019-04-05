// #import "DOMNode.js"
/* global JSGlobalObject, XMLSerializer, DOM */
'use strict';

JSGlobalObject.XMLSerializer = function XMLSerializer(){
};

XMLSerializer.prototype = {

    serializeToString: function(document){
        var doctype = document.doctype;
        var isHTML = doctype && doctype.name == "html";
        var str = "";

        var writeNode = function(node, namespaces){
            var i, l;
            var value;
            if (node.nodeType == DOM.Node.ELEMENT_NODE){
                namespaces = Object.create(namespaces);
                if (node.namespaceURI !== null){
                    if (node.prefix !== null){
                        str += '<%s:%s'.sprintf(node.prefix, node.localName);
                        if (namespaces[node.prefix] != node.namespaceURI){
                            str += ' xmlns:%s="%s"'.sprintf(node.prefix, node.namespaceURI);
                            namespaces[node.prefix] =  node.namespaceURI;
                        }
                    }else{
                        str += '<%s'.sprintf(node.localName);
                        if (namespaces[':global:'] !== node.namespaceURI){
                            str += ' xmlns="%s"'.sprintf(node.namespaceURI);
                            namespaces[':global:'] = node.namespaceURI;
                        }
                    }
                }else{
                    str += '<%s'.sprintf(node.localName);
                }
                for (i = 0, l = node.attributes.length; i < l; ++i){
                    writeNode(node.attributes[i], namespaces);
                }
                if (!isHTML && node.childNodes.length === 0){
                    str += "/>";
                }else{
                    str += ">";
                    if (!isHTML || !htmlElements.voids.has(node.localName)){
                        for (i = 0, l = node.childNodes.length; i < l; ++i){
                            writeNode(node.childNodes[i], namespaces);
                        }
                        if (node.prefix !== null){
                            str += '</%s:%s>'.sprintf(node.prefix, node.localName);
                        }else{
                            str += '</%s>'.sprintf(node.localName);
                        }
                    }
                }
            }else if (node.nodeType == DOM.Node.ATTRIBUTE_NODE){
                value = node.value.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;");
                if (node.namespaceURI){
                    if (node.prefix){
                        if (!(node.prefix in namespaces)){
                            str += ' xmlns:%s="%s"'.sprintf(node.prefix, node.namespaceURI);
                        }
                        str += ' %s:%s="%s"'.sprintf(node.prefix, node.localName, value);
                    }else{
                        str += ' %s="%s"'.sprintf(node.localName, value);
                    }
                }else{
                    str += ' %s="%s"'.sprintf(node.localName, value);
                }
            }else if (node.nodeType == DOM.Node.TEXT_NODE){
                if (isHTML && htmlElements.raw.has(node.parentNode.localName)){
                    str += node.data;
                }else{
                    str += node.data.replace(/&/g, "&amp;").replace(/</g, "&lt;");
                }
            }else if (node.nodeType == DOM.Node.CDATA_SECTION_NODE){
                str += "<![CDATA[";
                str += node.data;
                str += "]]>";
            }else if (node.nodeType == DOM.Node.PROCESSING_INSTRUCTION_NODE){
                str += "<?%s %s?>\n".sprintf(node.target, node.data);
            }else if (node.nodeType == DOM.Node.COMMENT_NODE){
                str += "<!--%s-->".sprintf(node.data);
                if (node.parentNode === document){
                    str += "\n";
                }
            }else if (node.nodeType == DOM.Node.DOCUMENT_NODE){
                for (i = 0, l = node.childNodes.length; i < l; ++i){
                    writeNode(node.childNodes[i], namespaces);
                }
            }else if (node.nodeType == DOM.Node.DOCUMENT_TYPE_NODE){
                str += "<!DOCTYPE";
                if (node.name.length > 0){
                    str += " " + node.name;
                }
                if (node.publicId.length > 0){
                    str += " " + node.publicId;
                }
                if (node.systemId.length > 0){
                    str += " " + node.systemId;
                }
                str += ">\n";
            }
        };

        if (!isHTML){
            str += '<?xml version="1.0" encoding="utf-8"?>\n';
        }
        writeNode(document, {':global:': null});

        return str;
    }

};

var htmlElements = {
    voids: new Set(['area', 'base', 'br', 'col', 'command', 'embed', 'hr', 'img', 'input', 'keygen', 'link', 'meta', 'param', 'source', 'track', 'wbr']),
    closed: new Set(['script', 'style', 'title', 'body']),
    raw: new Set(['script', 'style'])
};