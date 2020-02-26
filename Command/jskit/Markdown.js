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

// #import Foundation
// #import DOM
'use strict';

JSProtocol("MarkdownDelegate", JSProtocol, {

    urlForMarkdownCode: function(markdown, code){
    },

    urlForMarkdownLink: function(markdown, link){
    },

    urlForMarkdownImage: function(markdown, image){
    }

});

JSClass("Markdown", JSObject, {

    source: null,
    delegate: null,

    initWithString: function(string){
        this.source = string;
        this.htmlOptions = MarkdownHTMLOptions.init();
    },

    htmlOptions: null,

    htmlElementsForDocument: function(document){
        var lines = this.source.split("\n");
        var elements = [];
        var textLines = [];
        var inCodeBlock = false;
        var inOrderedList = false;
        var inUnorderedList = false;
        var inBlockquote = false;
        var blockElement = null;
        var listElement = null;
        var options = this.htmlOptions;
        var markdown = this;
        var addText = function(element, escapedText){
            var i = 0;
            var l = escapedText.length;
            var text = '';
            while (i < l){
                let c = escapedText[i];
                if (c == '\\'){
                    ++i;
                }else if (c == '`'){
                    let code = '';
                    ++i;
                    let checkpoint = i;
                    while (i < l && escapedText[i] != '`'){
                        code += escapedText[i];
                        ++i;
                    }
                    if (i < l){
                        ++i;
                        if (text !== ''){
                            element.appendChild(document.createTextNode(text));
                            text = '';
                        }
                        let codeElement = document.createElement('code');
                        let url = null;
                        let src = code;
                        if (i < l && escapedText[i] == '('){
                            ++i;
                            src = '';
                            while (i < l && escapedText[i] != ')'){
                                src += escapedText[i];
                                ++i;
                            }
                            ++i;
                        }
                        if (markdown.delegate && markdown.delegate.urlForMarkdownCode){
                            url = markdown.delegate.urlForMarkdownCode(markdown, src); 
                        }
                        if (url){
                            let a = codeElement.appendChild(document.createElement('a'));
                            a.appendChild(document.createTextNode(code));
                            a.setAttribute("href", url.encodedString);
                            if (url.isAbsolute){
                                a.setAttribute("target", "_blank");
                                a.setAttribute("rel", "noopener noreferrer");
                            }
                        }else{
                            codeElement.appendChild(document.createTextNode(code));
                        }
                        element.appendChild(codeElement);
                    }else{
                        text += c;
                        i = checkpoint;
                    }
                }else if (c == '['){
                    ++i;
                    let hrefStart = escapedText.indexOf('](', i);
                    let hrefEnd = escapedText.indexOf(')', hrefStart + 2);
                    if (hrefStart >= 0 && hrefEnd >= 0){
                        if (text !== ''){
                            element.appendChild(document.createTextNode(text));
                            text = '';
                        }
                        let href = escapedText.substr(hrefStart + 2, hrefEnd - hrefStart - 2);
                        let url;
                        if (markdown.delegate && markdown.delegate.urlForMarkdownLink){
                            url = markdown.delegate.urlForMarkdownLink(markdown, href);
                        }else{
                            url = JSURL.initWithString(href);
                        }
                        let linktext = escapedText.substr(i, hrefStart - i);
                        let a = element.appendChild(document.createElement('a'));
                        if (url !== null){
                            a.setAttribute("href", url.encodedString);
                            if (url.isAbsolute){
                                a.setAttribute("target", "_blank");
                                a.setAttribute("rel", "noopener noreferrer");
                            }
                        }else{
                            a.setAttribute("href", href);
                        }
                        a.appendChild(document.createTextNode(linktext));
                        i = hrefEnd + 1;
                    }else{
                        text += c;
                    }
                }else if (c == '!'){
                    ++i;
                    if (i < l && escapedText[i] == '['){
                        ++i;
                        let srcStart = escapedText.indexOf('](', i);
                        let srcEnd = escapedText.indexOf(')', srcStart + 2);
                        if (srcStart >= 0 && srcEnd >= 0){
                            if (text !== ''){
                                element.appendChild(document.createTextNode(text));
                                text = '';
                            }
                            let src = escapedText.substr(srcStart + 2, srcEnd - srcStart - 2);
                            let srcset = [];
                            if (markdown.delegate && markdown.delegate.urlForMarkdownImage){
                                src = markdown.delegate.urlForMarkdownImage(markdown, src);
                                if (src){
                                    var basename = src.lastPathComponent.removingFileExtension();
                                    src = src.encodedString;
                                    if (basename.endsWith("@2x")){
                                        srcset.push("%s 2x".sprintf(src));
                                    }
                                }
                            }
                            let alttext = escapedText.substr(i, srcStart - i);
                            let img = element.appendChild(document.createElement('img'));
                            img.setAttribute("src", src);
                            img.setAttribute("alt", alttext);
                            if (srcset.length > 0){
                                img.setAttribute("srcset", srcset.join(','));
                            }
                            i = srcEnd + 1;
                        }else{
                            text += c + '[';
                        }
                    }else{
                        text += c;
                    }
                }else if (c == '*'){
                    ++i;
                    let next = i < l ? escapedText[i] : '';
                    if (next == c){
                        ++i;
                        next = i < l ? escapedText[i] : '';
                        if (next == '' || next == ' '){
                            text += c + c;
                        }else{
                            let end = escapedText.indexOf(c + c, i);
                            if (end >= 0){
                                if (text !== ''){
                                    element.appendChild(document.createTextNode(text));
                                    text = '';
                                }
                                let strong = document.createElement(options.doubleEmphasisTagName);
                                element.appendChild(strong);
                                addText(strong, escapedText.substr(i, end - i));
                                i = end + 2;
                            }else{
                                text += c + c;
                            }
                        }
                    }else if (next == '' || next == ' '){
                        text += c;   
                    }else{
                        let end = escapedText.indexOf(c, i);
                        if (end >= 0){
                            if (text !== ''){
                                element.appendChild(document.createTextNode(text));
                                text = '';
                            }
                            let em = document.createElement(options.singleEmphasisTagName);
                            element.appendChild(em);
                            addText(em, escapedText.substr(i, end - i));
                            i = end + 1;
                        }else{
                            text += c;
                        }
                    }
                }else{
                    text += c;
                    ++i;
                }
            }
            if (text !== ''){
                element.appendChild(document.createTextNode(text));
            }
        };
        var finishBlock = function(){
            if (textLines.length === 0){
                return;
            }
            var parent = blockElement;
            if (!parent){
                parent = document.createElement(options.paragraphTagName);
                elements.push(parent);
            }
            var text = textLines.join(' ');
            addText(parent, text);
            textLines = [];
            blockElement = null;
        };
        var addHeader = function(tagName){
            inOrderedList = false;
            inUnorderedList = false;
            inBlockquote = false;
            if (textLines.length > 0){
                let headerLine = textLines.pop();
                finishBlock();
                let header = document.createElement(tagName);
                header.appendChild(document.createTextNode(headerLine));
                elements.push(header);
            }
        };
        var addATXHeader = function(line){
            var match = line.match(/^(#+)/);
            var level = match[1].length;
            var headerLine = line.substr(level + 1);
            if (headerLine.endsWith(match[1])){
                headerLine = headerLine.substr(0, headerLine.length - level - 1);
            }
            textLines.push(headerLine.trim());
            addHeader(options.tagNameForHeaderLevel(level));
        };
        for (let i = 0, l = lines.length; i < l; ++i){
            let line = lines[i];
            var trimmed = line.trim();
            if (inCodeBlock){
                if (line.match(/^````+$/)){
                    inCodeBlock = false;
                    let code = document.createElement(options.codeBlockTagName);
                    code.setAttribute("class", options.codeBlockClassName);
                    for (let j = 0, k = textLines.length; j < k; ++j){
                        let codeline = textLines[j];
                        let lineElement = document.createElement(options.codeLineTagName);
                        lineElement.setAttribute("class", options.codeLineClassName);
                        if (codeline === ''){
                            lineElement.appendChild(document.createTextNode("\n"));
                        }else{
                            lineElement.appendChild(document.createTextNode(codeline));
                        }
                        code.appendChild(lineElement);
                    }
                    elements.push(code);
                    textLines = [];
                }else{
                    textLines.push(line);
                }
            }else if (line.match(/^=+$/)){
                addHeader(options.firstLevelHeaderTagName);
            }else if (line.match(/^-+$/)){
                addHeader(options.secondLevelHeaderTagName);
            }else if (line.match(/^#{1,2}\s/)){
                addATXHeader(line);
            }else if (line.match(/^````+$/)){
                finishBlock();
                inOrderedList = false;
                inUnorderedList = false;
                inBlockquote = false;
                inCodeBlock = true;
            }else if (line.startsWith("> ")){
                if (!inBlockquote){
                    finishBlock();
                    inBlockquote = true;
                    inUnorderedList = false;
                    inOrderedList = false;
                    blockElement = document.createElement('blockquote');
                    elements.push(blockElement);
                }
                trimmed = line.substr(2).trim();
                textLines.push(trimmed);
            }else if (line.match(/^\s*[\*\-]\s/)){
                finishBlock();
                inOrderedList = false;
                inBlockquote = false;
                if (!inUnorderedList){
                    inUnorderedList = true;
                    listElement = document.createElement('ul');
                    elements.push(listElement);
                }
                blockElement = document.createElement('li');
                listElement.appendChild(blockElement);
                let match = line.match(/^(\s*[\*\-])/);
                trimmed = line.substr(match[1].length).trim();
                textLines.push(trimmed);
            }else if (line.match(/^\s*\d+\.\s/)){
                finishBlock();
                inUnorderedList = false;
                inBlockquote = false;
                if (!inOrderedList){
                    inOrderedList = true;
                    listElement = document.createElement('ol');
                    elements.push(listElement);
                }
                blockElement = document.createElement('li');
                listElement.appendChild(blockElement);
                let match = line.match(/^(\s*\d+\.)/);
                trimmed = line.substr(match[1].length).trim();
                textLines.push(trimmed);
            }else if (trimmed === ''){
                finishBlock();
                inOrderedList = false;
                inUnorderedList = false;
                inBlockquote = false;
            }else{
                textLines.push(trimmed);
            }
        }
        finishBlock();
        return elements;
    }

});

JSClass("MarkdownHTMLOptions", JSObject, {

    firstLevelHeaderTagName: 'h1',
    secondLevelHeaderTagName: 'h2',
    paragraphTagName: 'p',
    blockquoteTagName: 'blockquote',
    codeBlockTagName: 'div',
    codeBlockClassName: 'code',
    codeLineTagName: 'div',
    codeLineClassName: 'line',
    codeTagName: 'code',
    singleEmphasisTagName: 'em',
    doubleEmphasisTagName: 'strong',

    tagNameForHeaderLevel: function(level){
        switch (level){
            case 1:
                return this.firstLevelHeaderTagName;
            case 2:
                return this.secondLevelHeaderTagName;
            default:
                return this.paragraphTagName;
        }
    }

});