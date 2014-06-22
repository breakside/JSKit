#!/usr/bin/python

import os
import sys
import hashlib
import datetime
import xml.dom
import plistlib
import shutil
import json
import argparse


class HTMLBuilder(object):
    buildDate = None
    buildID = ""
    buildLabel = ""
    outputRootPath = ""
    outputProductPath = ""
    indexFile = None
    javascriptFile = None
    sourceRootPath = ""
    includePaths = None
    debug = False
    importedScripts = None

    def __init__(self, debug=False):
        super(HTMLBuilder, self).__init__()
        self.debug = debug
        self.buildDate = datetime.datetime.now()
        self.buildID = str(hashlib.md5(self.buildDate.strftime("%Y-%m-%d-%H-%M-%S")).hexdigest())
        self.buildLabel = self.buildDate.strftime("%Y-%m-%d-%H-%M-%S")
        self.outputRootPath = os.path.join('build', 'builds', self.buildLabel if not debug else 'debug')
        self.outputProductPath = os.path.join(self.outputRootPath, self.buildID)
        self.sourceRootPath = os.getcwd()
        self.includePaths = ('Frameworks', 'Classes', '.')
        self.importedScripts = {}
        self.watchFiles = []

    def build(self):
        self.watchFiles = []
        self.importedScripts = {}
        self.setup()
        self.buildJavascript()
        self.buildPlists()
        self.buildImages()
        self.buildIndex()
        self.finish()

    def setup(self):
        if os.path.exists(self.outputRootPath):
            if self.debug:
                shutil.rmtree(self.outputRootPath)
            else:
                raise Exception("Output path already exists: %s" % self.outputRootPath)
        os.makedirs(self.outputProductPath)
        self.infoName = 'Info.plist'
        infoPath = os.path.join(self.sourceRootPath, self.infoName)
        if not os.path.exists(infoPath):
            self.infoName = 'Info.json'
            infoPath = os.path.join(self.sourceRootPath, self.infoName)
        self.info = PlistWrapper(infoPath)

    def buildJavascript(self):
        self.javascriptFile = open(os.path.join(self.outputProductPath, 'app.js'), 'w')
        self.javascriptFile.write("var JSGlobalObject = window;\n")
        self.javascriptFile.write("var UIViewRenderingEnvironment = 'HTML';\n")
        if self.debug:
            self.javascriptFile.write("""(function(head){\n  var includejs = function(src){\n    var s = document.createElement('script');\n    s.type = 'text/javascript';\n    s.src = src;\n    s.async = false;\n    head.appendChild(s);\n  };\n""")
        self._includeJavascript("main.js")

    def _includeJavascript(self, sourcePath):
        includedSourcePath = None
        for includePath in self.includePaths:
            possiblePath = os.path.join(self.sourceRootPath, includePath, sourcePath)
            if os.path.exists(possiblePath):
                includedSourcePath = possiblePath
                break

        if includedSourcePath:
            if includedSourcePath not in self.importedScripts:
                self.watchFiles.append(includedSourcePath)
                self.importedScripts[includedSourcePath] = True
                scanner = JSScanner(includedSourcePath)
                delayedStack = []
                startedOutput = False
                for line in scanner:
                    if isinstance(line, JSImport):
                        if line.delay:
                            delayedStack.append(line)
                        else:
                            try:
                                if startedOutput:
                                    self.javascriptFile.write("\n")
                                self._includeJavascript(line.path)
                                startedOutput = False
                            except IncludeNotFoundException:
                                print "ERROR: %s, line %d: include not found '%s'.  (include path is '%s')" % (sourcePath, line.sourceLine, line.path, ":".join(self.includePaths))
                                sys.exit(1)
                    elif not self.debug:
                        self.javascriptFile.write(line)
                        startedOutput = True
                if self.debug:
                    relativePath = _webpath(os.path.relpath(includedSourcePath, self.outputRootPath))
                    self.javascriptFile.write("  includejs('%s');" % relativePath)
                    startedOutput = True
                for include in delayedStack:
                    try:
                        if startedOutput:
                            self.javascriptFile.write("\n")
                        self._includeJavascript(include.path)
                        startedOutput = False
                    except IncludeNotFoundException:
                        print "ERROR: %s, line %d: include not found '%s'.  (include path is '%s')" % (sourcePath, include.sourceLine, include.path, ":".join(self.includePaths))
                        sys.exit(1)
                if startedOutput:
                    self.javascriptFile.write("\n")
        else:
            raise IncludeNotFoundException("Include not found: %s; include paths: %s" % (sourcePath, ", ".join(self.includePaths)))

    def buildPlists(self):
        resources = [self.infoName]
        self.javascriptFile.write("JSGlobalObject['_JSBundles'] = {};\n")
        self.javascriptFile.write("JSGlobalObject['_JSBundles']['%s'] = JSGlobalObject['_JSBundles']['__main__'] = {};\n" % self.info['JSApplicationIdentifier'])
        mainUIFile = self.info['JSMainUIDefinitionFile']
        if mainUIFile:
            resources.append(mainUIFile)
        for resourcePath in resources:
            fullPath = os.path.join(self.sourceRootPath, resourcePath)
            if not os.path.exists(fullPath):
                fullPath = os.path.join(self.sourceRootPath, 'Resources', resourcePath)
            if not os.path.exists(fullPath):
                raise Exception("Cannot find resource: %s" % resourcePath)
            self.watchFiles.append(fullPath)
            if fullPath[-5:] == '.json':
                resource = json.load(open(fullPath))
            elif fullPath[-6:] == '.plist':
                resource = plistlib.readPlist(fullPath)
            else:
                raise Exception("Unknown resource type: %s" % resourcePath)
            for k in resource:
                if isinstance(resource[k], dict) and 'JSInclude' in resource[k]:
                    self._includeJavascript(resource[k]['JSInclude'])
            includes = resource['JSIncludes']
            if includes is not None:
                for include in includes:
                    self._includeJavascript(include)
            self.javascriptFile.write("JSGlobalObject['_JSBundles']['__main__']['%s'] = %s;\n" % (resourcePath, json.dumps(resource, indent=self.debug)))
        if self.debug:
            self.javascriptFile.write("})(document.getElementsByTagName('head')[0]);\n")

    def buildImages(self):
        pass

    def buildIndex(self):
        self.indexFile = open(os.path.join(self.outputRootPath, 'index.html'), 'w')
        dom = xml.dom.getDOMImplementation()
        doctype = dom.createDocumentType("html", None, None)
        document = dom.createDocument(None, "html", doctype)
        head = document.documentElement.appendChild(document.createElement('head'))
        body = document.documentElement.appendChild(document.createElement('body'))
        title = head.appendChild(document.createElement('title'))
        title.appendChild(document.createTextNode(self.info['JSApplicationTitle'] or ""))
        meta = head.appendChild(document.createElement('meta'))
        meta.setAttribute('http-equiv', 'Content-Type')
        meta.setAttribute('content', 'text/html; charset=utf-8')
        if self.javascriptFile:
            relativeJavascriptPath = _webpath(os.path.relpath(self.javascriptFile.name, os.path.dirname(self.indexFile.name)))
            script = head.appendChild(document.createElement('script'))
            script.setAttribute('type', 'text/javascript')
            script.setAttribute('src', relativeJavascriptPath)
            body.setAttribute('onload', 'main()')
        HTML5DocumentSerializer(document).serializeToFile(self.indexFile)

    def finish(self):
        if not self.debug:
            buildsPath = os.path.dirname(self.outputRootPath)
            linkPath = os.path.join(buildsPath, 'latest')
            if os.path.lexists(linkPath):
                os.unlink(linkPath)
            os.symlink(os.path.relpath(self.outputRootPath, os.path.dirname(linkPath)), linkPath)
        self.javascriptFile.close()
        self.javascriptFile = None
        self.indexFile.close()
        self.indexFile = None
        self.info = None


class PlistWrapper(object):

    def __init__(self, path):
        self.plist = plistlib.readPlist(path)

    def __getitem__(self, i):
        try:
            return self.plist[i]
        except KeyError:
            return None


class IncludeNotFoundException(Exception):
    pass


def _webpath(ospath):
    if os.sep != '/':
        return ospath.replace(os.sep, '/')
    return ospath


class JSScanner(object):
    file = None
    context = ""
    sourceLine = 0

    CONTEXT_JS = 'js'
    CONTEXT_COMMENT = 'comment'

    def __init__(self, path):
        super(JSScanner, self).__init__()
        self.file = open(path, 'r')
        self.context = self.CONTEXT_JS

    def __iter__(self):
        return self

    def next(self):
        return self.__next__()

    def __next__(self):
        code = ""
        while code == "":
            line = self.file.next()
            self.sourceLine += 1
            if self.context == self.CONTEXT_JS:
                if line[0:10] == "// #import":
                    i = line.find('"')
                    if i >= 0:
                        j = line.find('"', i + 1)
                        if j >= 0:
                            path = line[i + 1:j]
                            delay = line.strip()[-6:] == "/delay"
                            return JSImport(path, delay=delay, sourceLine=self.sourceLine)
            while line != "":
                if self.context == self.CONTEXT_JS:
                    i = line.find('//')
                    j = line.find('/*')
                    if i >= 0 and j >= 0:
                        if i < j:
                            code += line[0:i].strip()
                            line = ""
                        else:
                            code += line[0:j].strip()
                            line = line[j + 2:]
                            self.context = self.CONTEXT_COMMENT
                    elif i >= 0:
                        code += line[0:i].strip()
                        line = ""
                    elif j >= 0:
                        code += line[0:j].strip()
                        line = line[j + 2:]
                        self.context = self.CONTEXT_COMMENT
                    else:
                        code += line.strip()
                        line = ""
                elif self.context == self.CONTEXT_COMMENT:
                    i = line.find('*/')
                    if i >= 0:
                        line = line[i + 2:]
                        self.context = self.CONTEXT_JS
                    else:
                        line = ""
        return code


class JSImport(object):
    delay = False
    path = ""
    sourceLine = 0

    def __init__(self, path, delay=False, sourceLine=0):
        super(JSImport, self).__init__()
        self.path = path
        self.delay = delay
        self.sourceLine = sourceLine


class HTML5DocumentSerializer(object):

    document = None

    VOID_ELEMENTS = ('area', 'base', 'br', 'col', 'command', 'embed', 'hr', 'img', 'input', 'keygen', 'link', 'meta', 'param', 'source', 'track', 'wbr')
    CLOSED_ELEMENTS = ('script', 'style', 'title', 'body')
    RAW_ELEMENTS = ('script', 'style')

    def __init__(self, document):
        super(HTML5DocumentSerializer, self).__init__()
        self.document = document

    def serializeToFile(self, writer):
        self.indent = ""
        self.indentString = "  "
        self.onlyTextChildren = [False]

        def _node(node):
            if node.nodeType == xml.dom.Node.ELEMENT_NODE:
                writer.write("%s<%s" % (self.indent, node.tagName))
                i = 0
                while i < node.attributes.length:
                    _node(node.attributes.item(i))
                    i += 1
                if node.tagName in self.VOID_ELEMENTS:
                    writer.write(">\n")
                else:
                    self.onlyTextChildren.append(True)
                    if node.childNodes.length:
                        writer.write(">")
                        for child in node.childNodes:
                            if child.nodeType not in (xml.dom.Node.TEXT_NODE, xml.dom.Node.ENTITY_NODE):
                                self.onlyTextChildren[-1] = False
                                break
                        if not self.onlyTextChildren[-1]:
                            writer.write("\n")
                            self.indent += self.indentString
                        for child in node.childNodes:
                            _node(child)
                        if not self.onlyTextChildren[-1]:
                            self.indent = self.indent[0:-len(self.indentString)]
                            writer.write("%s</%s>" % (self.indent, node.tagName))
                        else:
                            writer.write("</%s>" % node.tagName)
                    elif node.tagName in self.CLOSED_ELEMENTS:
                        writer.write("></%s>" % node.tagName)
                    else:
                        writer.write("/>")
                    writer.write("\n")
                    self.onlyTextChildren.pop()
            elif node.nodeType == xml.dom.Node.ATTRIBUTE_NODE:
                writer.write(' %s="%s"' % (node.name, node.value.replace("&", "&amp;").replace('"', "&quot;").replace("<", "&lt;").encode('utf-8')))
            elif node.nodeType == xml.dom.Node.TEXT_NODE:
                if not self.onlyTextChildren[-1] and (not node.previousSibling or node.previousSibling.nodeType == xml.dom.Node.ELEMENT_NODE):
                    writer.write(self.indent)
                if node.parentNode.tagName in self.RAW_ELEMENTS:
                    writer.write(node.nodeValue.encode('utf-8'))
                else:
                    writer.write(node.nodeValue.replace("&", "&amp;").replace("<", "&lt;").encode('utf-8'))
                if not self.onlyTextChildren[-1] and (not node.nextSibling or node.nextSibling.nodeType == xml.dom.Node.ELEMENT_NODE):
                    writer.write("\n")
            elif node.nodeType == xml.dom.Node.CDATA_SECTION_NODE:
                pass
            elif node.nodeType == xml.dom.Node.ENTITY_NODE:
                if not self.onlyTextChildren[-1] and (not node.previousSibling or node.previousSibling.nodeType == xml.dom.Node.ELEMENT_NODE):
                    writer.write(self.indent)
                writer.write("&%s;" % node.nodeName)
                if not self.onlyTextChildren[-1] and (not node.nextSibling or node.nextSibling.nodeType == xml.dom.Node.ELEMENT_NODE):
                    writer.write("\n")
            elif node.nodeType == xml.dom.Node.PROCESSING_INSTRUCTION_NODE:
                pass
            elif node.nodeType == xml.dom.Node.COMMENT_NODE:
                pass
            elif node.nodeType == xml.dom.Node.DOCUMENT_NODE:
                _node(node.doctype)
                _node(node.documentElement)
            elif node.nodeType == xml.dom.Node.DOCUMENT_TYPE_NODE:
                writer.write("%s<!DOCTYPE html>\n" % self.indent)
            elif node.nodeType == xml.dom.Node.NOTATION_NODE:
                pass

        _node(self.document)

    def serializeToString(self):
        import StringIO
        writer = StringIO.StringIO()
        self.serializeToFile(writer)
        writer.close()
        return writer.getvalue()


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--debug', action='store_true', help="Do a debug build, which keeps all files separate, making in-browser debugging sane")
    parser.add_argument('--watch', action='store_true', help="Watch for file changes, and rebuild automatically when any change")
    args = parser.parse_args()
    builder = HTMLBuilder(debug=args.debug)
    builder.build()

if __name__ == "__main__":
    main()
