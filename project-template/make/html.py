#!/usr/bin/python

import os
import os.path
import hashlib
import xml.dom
import plistlib
import shutil
import json
import mimetypes
from .image import ImageInfoExtractor
from .scanners import JSFile, JSGlobal, JSFeature


class HTMLBuilder(object):
    buildID = ""
    buildLabel = ""
    outputRootPath = ""
    outputProductPath = ""
    outputResourcePath = ""
    indexFile = None
    appJSFile = None
    manifestFile = None
    sourceRootPath = ""
    debug = False
    featureCheck = None
    bundles = {}
    mainBundle = None
    manifest = None
    rootIncludes = None

    def __init__(self, buildID, buildLabel, outputRootPath, debug=False):
        super(HTMLBuilder, self).__init__()
        self.buildID = buildID
        self.buildLabel = buildLabel
        self.outputRootPath = outputRootPath
        self.debug = debug
        self.outputProductPath = os.path.join(self.outputRootPath, self.buildID)
        self.outputResourcePath = os.path.join(self.outputRootPath, "Resources")
        self.sourceRootPath = os.getcwd()

    def build(self):
        self.watchFiles = []
        self.manifest = []
        self.setup()
        self.buildPlists()
        self.buildImages()
        self.buildAppJavascript()
        self.buildPreflight()
        self.buildBootstrap()
        self.buildManifest()
        self.buildIndex()
        self.finish()

    def setup(self):
        if os.path.exists(self.outputRootPath):
            if self.debug:
                shutil.rmtree(self.outputRootPath)
            else:
                raise Exception("Output path already exists: %s" % self.outputRootPath)
        os.makedirs(self.outputProductPath)
        os.makedirs(self.outputResourcePath)
        self.infoName = 'Info.plist'
        infoPath = os.path.join(self.sourceRootPath, self.infoName)
        if os.path.exists(infoPath):
            self.info = PlistWrapper(infoPath)
        else:
            self.infoName = 'Info.json'
            infoPath = os.path.join(self.sourceRootPath, self.infoName)
            self.info = json.load(infoPath)
        self.bundles[self.info['JSApplicationIdentifier']] = self.mainBundle = {}
        self.rootIncludes = ['main.js', 'UIKit/UIHTMLRenderer.js', 'JSKit/JSBundle.js']

    def buildPlists(self):
        resources = [self.infoName]
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
                    self.rootIncludes.append(resource[k]['JSInclude'])
            includes = resource['JSIncludes']
            if includes is not None:
                for include in includes:
                    self.rootIncludes.append(include)
            self.mainBundle[resourcePath] = resource

    def buildImages(self):
        resourcesPath = os.path.join(self.sourceRootPath, "Resources")
        for (dirname, folders, files) in os.walk(resourcesPath):
            for name in files:
                fullPath = os.path.join(dirname, name)
                resourcePath = os.path.relpath(fullPath, resourcesPath)
                mimeguess = mimetypes.guess_type(fullPath)
                if mimeguess[0] and mimeguess[0].split('/')[0] == 'image':
                    h = hashlib.sha1()
                    f = open(fullPath)
                    chunk = f.read(h.block_size)
                    while chunk != '':
                        h.update(chunk)
                        chunk = f.read(h.block_size)
                    byte_size = f.tell()
                    f.close()
                    h = h.hexdigest()
                    outputPath = os.path.join(self.outputResourcePath, h)
                    shutil.copyfile(fullPath, outputPath)
                    info = {
                        'hash': h,
                        'mimetype': mimeguess[0],
                        'url': _webpath(os.path.relpath(outputPath, self.outputRootPath)),
                        'byte_size': byte_size
                    }
                    extractor = ImageInfoExtractor.for_path(fullPath)
                    extractor.populate_dict(info)
                    self.mainBundle[resourcePath] = info
                    self.manifest.append(outputPath)

    def buildAppJavascript(self):
        includePaths = [os.path.join(self.sourceRootPath, path) for path in ('Frameworks', 'Classes', '.')]
        self.appJSFile = JSFile(open(os.path.join(self.outputProductPath, 'app.js'), 'w'), includePaths)
        self.appJSFile.write("var JSGlobalObject = window;\n")
        self.appJSFile.write("var UIRendererInit = function(){ return UIHTMLRenderer.initWithRootElement(document.body); };\n")
        for path in self.rootIncludes:
            self.appJSFile.include(path, output=not self.debug)
        if self.debug:
            self.appJSFile.write("""(function(head){\n  var includejs = function(src){\n    var s = document.createElement('script');\n    s.type = 'text/javascript';\n    s.src = src;\n    s.async = false;\n    head.appendChild(s);\n  };\n""")
            for includedSourcePath in self.appJSFile.importedScripts:
                relativePath = _webpath(os.path.relpath(includedSourcePath, self.outputRootPath))
                self.appJSFile.write("  includejs('%s');\n" % relativePath)
            self.appJSFile.write("  JSBundle.bundles = %s;\n" % json.dumps(self.bundles, indent=self.debug))
            self.appJSFile.write("  JSBundle.mainBundle = JSBundle.bundles['%s'];\n" % self.info['JSApplicationIdentifier'])
            self.appJSFile.write("})(document.getElementsByTagName('head')[0]);\n")
        else:
            self.appJSFile.write("JSBundle.bundles = %s;\n" % json.dumps(self.bundles, indent=self.debug))
            self.appJSFile.write("JSBundle.mainBundle = JSBundle.bundles['%s'];\n" % self.info['JSApplicationIdentifier'])
        self.manifest.append(self.appJSFile.name)

    def buildPreflight(self):
        self.featureCheck = JSFeatureCheck()
        self.featureCheck.addGlobal(JSGlobal(['window', 'document']))
        self.featureCheck.addFeature(JSFeature("'body' in Document.prototype"))
        for g in self.appJSFile.globals_:
            self.featureCheck.addGlobal(g)
        for feature in self.appJSFile.features:
            self.featureCheck.addFeature(feature)
        self.featureCheck.hash = hash(self.featureCheck)
        self.preflightFile = open(os.path.join(self.outputRootPath, 'preflight-%s.js' % self.featureCheck.hash), 'w')
        self.featureCheck.serialize(self.preflightFile, 'bootstrapper')

    def buildBootstrap(self):
        pass

    def buildManifest(self):
        self.manifestFile = open(os.path.join(self.outputRootPath, "manifest.appcache"), 'w')
        self.manifestFile.write("CACHE MANIFEST\n")
        self.manifestFile.write("# build %s\n" % self.buildID)
        for name in self.manifest:
            self.manifestFile.write("%s\n" % _webpath(os.path.relpath(name, self.outputRootPath)))

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
        if self.manifestFile and not self.debug:
            document.documentElement.setAttribute('manifest', _webpath(os.path.relpath(self.manifestFile.name, os.path.dirname(self.indexFile.name))))
        if self.appJSFile:
            relativeJavascriptPath = _webpath(os.path.relpath(self.appJSFile.name, os.path.dirname(self.indexFile.name)))
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
        self.appJSFile.close()
        self.appJSFile = None
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


def _webpath(ospath):
    if os.sep != '/':
        return ospath.replace(os.sep, '/')
    return ospath


class JSFeatureCheck(object):

    globals_ = None
    features = None
    TEMPLATE_VERSION = 1

    template = """
(function(checks){
    %s.preflightStarted(failures);
    var failures = [];
    for (var i = 0, l = checks.length; i < l; ++i){
        try {
            if (!checks[i].fn()){
                failures.push({check: checks[i].name});
            }
        }catch (error){
            failures.push({check: checks[i].name, error: error});
        }
    }
    if (failures.length > 0){
        %s.preflightFailed(failures);
    }
})(%s);
"""

    def __init__(self):
        self.globals_ = []
        self.features = []

    def addGlobal(self, g):
        self.globals_.append(g)

    def addFeature(self, f):
        self.features.append(f)

    def __hash__(self):
        parts = {}
        for g in self.globals_:
            for o in g.objects:
                parts[o] = True
        for f in self.features:
            parts[f] = True
        parts = sorted(parts.keys())
        parts.append('TEMPLATE_VERSION=%s' % self.TEMPLATE_VERSION)
        return hashlib.sha1(':'.join(parts)).hexdigest()

    def serialize(self, fp, globalDelegateName):
        checks = []
        for g in self.globals_:
            for o in g.objects:
                checks.append("{name: %s, fn: function(){ return !!(window.%s); }}" % (json.dumps('global %s' % o), o))
        for f in self.features:
            checks.append("{name: %s, fn: function(){ return !!(%s); }}" % (json.dumps('feature %s' % f.check), f.check))
        fp.write(self.template % (globalDelegateName, globalDelegateName, "[\n  %s\n]" % ",\n  ".join(checks)))


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
