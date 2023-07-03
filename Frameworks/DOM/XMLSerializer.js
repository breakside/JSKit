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

// #import "DOMNode.js"
'use strict';

JSGlobalObject.XMLSerializer = function XMLSerializer(){
};

XMLSerializer.prototype = {

    serializeToString: function(node){
        return this._serializeToString(node, false);
    },

    _serializeToString: function(node, childrenOnly){
        var document = node.ownerDocument || node;
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
                value = node.value;
                if (value === null || value === undefined){
                    value = "";
                }else{
                    value = value.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;");
                    value = '="%s"'.sprintf(value);
                }
                if (node.namespaceURI){
                    if (node.prefix){
                        if (!(node.prefix in namespaces)){
                            str += ' xmlns:%s="%s"'.sprintf(node.prefix, node.namespaceURI);
                        }
                        str += ' %s:%s%s'.sprintf(node.prefix, node.localName, value);
                    }else{
                        str += ' %s%s'.sprintf(node.localName, value);
                    }
                }else{
                    str += ' %s%s'.sprintf(node.localName, value);
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
                    value = node.publicId.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;");
                    str += ' PUBLIC "%s"'.sprintf(value);
                    if (node.systemId.length > 0){
                        value = node.systemId.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;");
                        str += ' "%s"'.sprintf(value);
                    }
                }else if (node.systemId.length > 0){
                    value = node.systemId.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;");
                    str += ' SYSTEM "%s"'.sprintf(value);
                }
                str += ">\n";
            }
        };

        if (!isHTML && !childrenOnly){
            str += '<?xml version="1.0" encoding="utf-8"?>\n';
        }
        if (childrenOnly){
            var namespaces = {':global:': null};
            if (node.nodeType === DOM.Node.ELEMENT_NODE){
                if (node.namespaceURI !== null){
                    if (node.prefix !== null){
                        if (namespaces[node.prefix] != node.namespaceURI){
                            namespaces[node.prefix] =  node.namespaceURI;
                        }
                    }else{
                        if (namespaces[':global:'] !== node.namespaceURI){
                            namespaces[':global:'] = node.namespaceURI;
                        }
                    }
                }
            }
            var i, l;
            for (i = 0, l = node.childNodes.length; i < l; ++i){
                writeNode(node.childNodes[i], namespaces);
            }
        }else{
            writeNode(node, {':global:': null});
        }

        return str;
    }

};

var htmlElements = {
    voids: new Set(['area', 'base', 'br', 'col', 'command', 'embed', 'hr', 'img', 'input', 'keygen', 'link', 'meta', 'param', 'source', 'track', 'wbr']),
    closed: new Set(['script', 'style', 'title', 'body']),
    raw: new Set(['script', 'style'])
};