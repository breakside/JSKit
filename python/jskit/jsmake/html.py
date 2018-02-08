#!/usr/bin/python

import os
import os.path
import stat
import sys
import hashlib
import xml.dom.minidom
import plistlib
import shutil
import argparse
import json
import mimetypes
import StringIO
import tempfile
import subprocess
import pkg_resources
from HTMLParser import HTMLParser
from .builder import Builder
from .javascript import JSCompilation, JSFeature
from .woff import sfnt_to_woff


class HTMLBuilder(Builder):
    outputCacheBustingPath = ""
    outputWebRootPath = ""
    outputResourcePath = ""
    outputConfPath = ""
    indexFile = None
    jsCompilation = None
    appJS = None
    appCSS = None
    manifestFile = None
    featureCheck = None
    manifest = None
    includes = None
    fonts = None
    nginxConf = None
    debugPort = 8080
    workerProcesses = 1
    workerConnections = 1024
    useDocker = False
    dockerIdentifier = ""
    dockerOwner = ""
    dockerName = ""

    def __init__(self, projectPath, includePaths, outputParentPath, buildID, buildLabel, debug=False, args=None):
        super(HTMLBuilder, self).__init__(projectPath, includePaths, outputParentPath, buildID, buildLabel, debug)
        self.includes = []
        self.includePaths.extend(self.absolutePathsRelativeToSourceRoot('Frameworks', 'Classes', '.'))
        self.parse_args(args)

    def parse_args(self, arglist):
        parser = argparse.ArgumentParser()
        parser.add_argument(u'--http-port', default=u'8080')
        parser.add_argument(u'--worker-processes', default=u'1')
        parser.add_argument(u'--worker-connections', default=u'1024')
        parser.add_argument(u'--docker-owner', default=u'')
        args = parser.parse_args(arglist)
        self.debugPort = int(args.http_port)
        self.workerProcesses = int(args.worker_processes)
        self.workerConnections = int(args.worker_connections)
        self.dockerOwner = args.docker_owner
        self.useDocker = self.dockerOwner != u''

    def build(self):
        self.setup()
        self.buildResources()
        self.findIncludes()
        self.buildAppCSS()
        self.buildAppJavascript()
        self.buildPreflight()
        self.buildAppCacheManifest()
        self.buildIndex()
        self.buildNginxConf()
        if self.useDocker:
            self.buildDocker()
        self.finish()

    def setup(self):
        super(HTMLBuilder, self).setup()
        self.outputConfPath = os.path.join(self.outputProjectPath, "conf")
        self.outputWebRootPath = os.path.join(self.outputProjectPath, "www")
        self.outputCacheBustingPath = os.path.join(self.outputWebRootPath, self.buildID)
        self.outputResourcePath = os.path.join(self.outputWebRootPath, "Resources")
        if self.debug:
            for child in (self.outputWebRootPath,):
                if os.path.exists(child):
                    if os.path.isdir(child):
                        shutil.rmtree(child)
                    else:
                        os.unlink(child)
        if not os.path.exists(self.outputConfPath):
            os.makedirs(self.outputConfPath)
        logsPath = os.path.join(self.outputProjectPath, "logs")
        if not os.path.exists(logsPath):
            os.makedirs(logsPath)
        os.makedirs(self.outputCacheBustingPath)
        os.makedirs(self.outputResourcePath)
        self.manifest = []
        self.appJS = []
        self.appCSS = []
        self.fonts = []

    def buildImageResource(self, nameComponents, fullPath, mime, scale):
        resource = super(HTMLBuilder, self).buildImageResource(nameComponents, fullPath, mime, scale)
        info = resource["image"]
        dontcare, ext = os.path.splitext(os.path.basename(fullPath))
        outputImagePath = os.path.join(self.outputResourcePath, resource['hash'] + ext)
        info.update(dict(
             url=_webpath(os.path.relpath(outputImagePath, self.outputWebRootPath))
        ))
        shutil.copyfile(fullPath, outputImagePath)
        self.manifest.append(outputImagePath)
        return resource

    def buildFontResource(self, nameComponents, fullPath, mime):
        resource = super(HTMLBuilder, self).buildFontResource(nameComponents, fullPath, mime)
        info = resource["font"]
        dontcare, ext = os.path.splitext(os.path.basename(fullPath))
        outputFontPath = os.path.join(self.outputResourcePath, resource['hash'] + ext)
        url = _webpath(os.path.relpath(outputFontPath, self.outputWebRootPath))
        variants = [(url, None)]
        if mime != 'application/x-font-woff':
            outputTmpWoffPath = os.path.join(self.outputResourcePath, resource['hash'] + '.woff')
            sfnt_to_woff(fullPath, outputTmpWoffPath)
            woff_hash, woff_size = Builder.hashOfPath(outputTmpWoffPath)
            outputWoffPath = os.path.join(self.outputResourcePath, woff_hash + '.woff')
            os.rename(outputTmpWoffPath, outputWoffPath)
            variants.insert(0, (_webpath(os.path.relpath(outputWoffPath, self.outputWebRootPath)), 'woff'))
        info.update(dict(
            url=url,
            variants=variants
        ))
        shutil.copyfile(fullPath, outputFontPath)
        self.manifest.append(outputFontPath)
        self.fonts.append(info)

    def findIncludes(self):
        for path in self.info.get('JSIncludes', []):
            self.includes.append(path)
        mainSpecName = self.info.get('UIMainDefinitionResource', None)
        if mainSpecName is not None:
            mainSpec = self.mainBundle["Resources"][mainSpecName][0]["value"]
            self.findSpecIncludes(mainSpec)

    def findSpecIncludes(self, spec):
        for k, v in spec.items():
            if k == 'JSIncludes':
                for path in v:
                    self.includes.append(path)
            elif k == 'JSInclude':
                self.includes.append(v)
            elif isinstance(v, dict):
                self.findSpecIncludes(v)

    def buildAppCSS(self):
        print "Creating application css..."
        sys.stdout.flush()
        outputPath = os.path.join(self.outputCacheBustingPath, 'app.css')
        fp = open(outputPath, 'w')
        for font in self.fonts:
            fp.write('@font-face {\n')
            fp.write('  font-family: "%s";\n' % font['family'])
            fp.write('  font-style: %s;\n' % font['style'])
            fp.write('  font-weight: %s;\n' % font['weight'])
            fp.write('  src: %s;\n' % ', '.join([self.font_src(variant) for variant in font['variants']]))
            fp.write('}\n\n')
        fp.close()
        self.appCSS.append(outputPath)

    def font_src(self, variant):
        if variant[1]:
            return 'url("../%s") format("%s")' % (variant[0], variant[1])
        return 'url("../%s")' % variant[0]

    def buildAppJavascript(self):
        print "Creating application js..."
        sys.stdout.flush()
        with tempfile.NamedTemporaryFile() as bundleJSFile:
            bundleJSFile.write("'use strict';\n")
            bundleJSFile.write("JSBundle.bundles = %s;\n" % json.dumps(self.bundles, indent=self.debug))
            bundleJSFile.write("JSBundle.mainBundleIdentifier = '%s';\n" % self.info['JSBundleIdentifier'])
            self.jsCompilation = JSCompilation(self.includePaths, minify=not self.debug, combine=not self.debug)
            for path in self.includes:
                self.jsCompilation.include(path)
            self.jsCompilation.include(bundleJSFile, 'bundle.js')
            for outfile in self.jsCompilation.outfiles:
                outfile.fp.flush()
                if outfile.name:
                    outputPath = os.path.join(self.outputCacheBustingPath, outfile.name)
                elif len(self.appJS) == 0:
                    outputPath = os.path.join(self.outputCacheBustingPath, 'app.js')
                else:
                    outputPath = os.path.join(self.outputCacheBustingPath, 'app%d.js' % len(self.appJS))
                if not os.path.exists(os.path.dirname(outputPath)):
                    os.makedirs(os.path.dirname(outputPath))
                if self.debug and outfile.fp != bundleJSFile:
                    os.link(outfile.fp.name, outputPath)
                else:
                    shutil.copy(outfile.fp.name, outputPath)
                os.chmod(outputPath, stat.S_IRUSR | stat.S_IWUSR | stat.S_IRGRP | stat.S_IROTH)
                self.manifest.append(outputPath)
                self.appJS.append(outputPath)

    def buildPreflight(self):
        print "Creating preflight js..."
        sys.stdout.flush()
        self.featureCheck = JSFeatureCheck()
        self.featureCheck.addFeature(JSFeature('window'))
        self.featureCheck.addFeature(JSFeature("document.body"))
        for feature in self.jsCompilation.features:
            self.featureCheck.addFeature(feature)
        self.preflightFile = open(os.path.join(self.outputWebRootPath, 'preflight-%s.js' % self.featureCheck.hash), 'w')
        self.featureCheck.serialize(self.preflightFile, 'bootstrapper')

    def buildAppCacheManifest(self):
        print "Creating manifest.appcache..."
        sys.stdout.flush()
        self.manifestFile = open(os.path.join(self.outputWebRootPath, "manifest.appcache"), 'w')
        self.manifestFile.write("CACHE MANIFEST\n")
        self.manifestFile.write("# build %s\n" % self.buildID)
        for name in self.manifest:
            self.manifestFile.write("%s\n" % _webpath(os.path.relpath(name, self.outputWebRootPath)))

    def buildIndex(self):
        print "Creating index.html..."
        sys.stdout.flush()
        indexName = self.info.get('UIApplicationHTMLIndexFile', 'index.html')
        document = HTML5Document(os.path.join(self.projectPath, indexName)).domDocument
        self.indexFile = open(os.path.join(self.outputWebRootPath, indexName), 'w')
        stack = [document.documentElement]
        appSrc = []
        for includedSourcePath in self.appJS:
            relativePath = _webpath(os.path.relpath(includedSourcePath, os.path.dirname(self.indexFile.name)))
            appSrc.append(relativePath)
        jscontext = {
            'preflightID': self.featureCheck.hash,
            'preflightSrc': _webpath(os.path.relpath(self.preflightFile.name, self.outputWebRootPath)),
            'appSrc': appSrc
        }
        includePaths = (pkg_resources.resource_filename('jskit', 'jsmake/html_resources'),)
        hasInsertedLogger = False
        while len(stack) > 0:
            node = stack.pop()
            if node.tagName == 'head':
                for css in self.appCSS:
                    style = document.createElement('link')
                    style.setAttribute('rel', 'stylesheet')
                    style.setAttribute('type', 'text/css')
                    style.setAttribute('href', _webpath(os.path.relpath(css, self.outputWebRootPath)))
                    node.appendChild(style)

                if self.debug:
                    self.includes.append('jslog-debug.js')
                else:
                    self.includes.append('jslog-release.js')
            elif node.tagName == 'title' and node.parentNode.tagName == 'head':
                node.appendChild(document.createTextNode(self.info.get('UIApplicationTitle', '')))
            elif node.tagName == 'script' and node.getAttribute('type') == 'text/javascript':
                if not hasInsertedLogger:
                    loggerResource = None
                    if self.debug:
                        loggerResource = 'jslog-debug.js'
                    else:
                        loggerResource = 'jslog-release.js'
                    script = document.createElement('script')
                    script.setAttribute('type', 'text/javascript')
                    fp = open(pkg_resources.resource_filename('jskit', 'jsmake/html_resources/' + loggerResource), 'r')
                    script.appendChild(document.createTextNode(fp.read()))
                    fp.close()
                    node.parentNode.insertBefore(script, node)
                    hasInsertedLogger = True
                oldScriptText = u''
                for child in node.childNodes:
                    if child.nodeType == xml.dom.Node.TEXT_NODE:
                        oldScriptText += child.nodeValue
                with tempfile.NamedTemporaryFile() as inscript:
                    inscript.write(JSCompilation.preprocess(oldScriptText.strip(), jscontext))
                    compilation = JSCompilation(includePaths, minify=not self.debug, combine=not self.debug)
                    compilation.include(inscript)
                    for outfile in compilation.outfiles:
                        outfile.fp.flush()
                        script = document.createElement('script')
                        script.setAttribute('type', 'text/javascript')
                        if outfile.name is None:
                            outfile.fp.seek(0)
                            textNode = document.createTextNode("\n" + outfile.fp.read() + "\n")
                            script.appendChild(textNode)
                        else:
                            outputPath = os.path.join(self.outputCacheBustingPath, outfile.name)
                            if self.debug:
                                os.link(outfile.fp.name, outputPath)
                            else:
                                shutil.copy(outfile.fp.name, outputPath)
                            relativePath = _webpath(os.path.relpath(outputPath, os.path.dirname(self.indexFile.name)))
                            script.setAttribute('src', relativePath)
                        node.parentNode.insertBefore(script, node)
                node.parentNode.removeChild(node)
            for child in node.childNodes:
                if child.nodeType == xml.dom.Node.ELEMENT_NODE:
                    stack.append(child)
        if self.manifestFile and not self.debug:
            document.documentElement.setAttribute('manifest', _webpath(os.path.relpath(self.manifestFile.name, os.path.dirname(self.indexFile.name))))
        HTML5DocumentSerializer(document).serializeToFile(self.indexFile)
        self.indexFile.close()
        self.indexFile = None

    def buildNginxConf(self):
        print "Creating nginx.conf..."
        sys.stdout.flush()
        templateFile = os.path.join(self.projectPath, "nginx-debug.conf");
        fp = open(templateFile, 'r')
        template = fp.read()
        fp.close()
        args = dict(
            HTTP_PORT=self.debugPort,
            WORKER_PROCESSES=self.workerProcesses,
            WORKER_CONNECTIONS=self.workerConnections
        )
        template = template.replace("{{", "__TEMPLATE_OPEN__")
        template = template.replace("}}", "__TEMPLATE_CLOSE__")
        template = template.replace("{", "{{")
        template = template.replace("}", "}}")
        template = template.replace("__TEMPLATE_OPEN__", "{")
        template = template.replace("__TEMPLATE_CLOSE__", "}")
        conf = template.format(**args)
        self.confFile = os.path.join(self.outputConfPath, "nginx.conf")
        fp = open(self.confFile, 'w')
        fp.write(conf)
        fp.close()

    def buildDocker(self):
        ownerPrefix = ('%s/' % self.dockerOwner) if self.dockerOwner else ''
        self.dockerIdentifier = "%s%s:%s" % (ownerPrefix, self.info['JSBundleIdentifier'], self.buildLabel if not self.debug else 'debug')
        self.dockerIdentifier = self.dockerIdentifier.lower()
        self.dockerName = self.info['JSBundleIdentifier'].lower()
        print "Building docker %s..." % self.dockerIdentifier
        sys.stdout.flush()
        dockerFile = os.path.join(self.projectPath, "Dockerfile")
        dockerOutputFile = os.path.join(self.outputProjectPath, "Dockerfile")
        shutil.copyfile(dockerFile, dockerOutputFile)
        args = ["docker", "build", "-t", self.dockerIdentifier, os.path.relpath(self.outputProjectPath)]
        if subprocess.call(args) != 0:
            print "! Error building docker with: %s" % ' '.join(args)
            sys.stdout.flush()


    def finish(self):
        super(HTMLBuilder, self).finish()
        print "\nDone!"
        if self.debug:
            if self.useDocker:
                print "\ndocker run --rm --name %s -p%d:%d %s\n" % (self.dockerName, self.debugPort, self.debugPort, self.dockerIdentifier)
            else:
                print "\nnginx -p %s\n" % os.path.relpath(self.outputProjectPath)
            sys.stdout.flush()


def _webpath(ospath):
    if os.sep != '/':
        return ospath.replace(os.sep, '/')
    return ospath


class JSFeatureCheck(object):

    features = None
    _hash = None
    TEMPLATE_VERSION = 1

    template = """HTMLAppBootstrapper.mainBootstrapper.preflightChecks = %s;"""

    def __init__(self):
        self.features = []

    def addFeature(self, f):
        self.features.append(f)
        self._hash = None

    @property
    def hash(self):
        if self._hash is None:
            parts = {}
            for f in self.features:
                parts[f.check] = True
            parts = sorted(parts.keys())
            parts.append('TEMPLATE_VERSION=%s' % self.TEMPLATE_VERSION)
            return hashlib.sha1(':'.join(parts)).hexdigest()
        return self._hash

    def serialize(self, fp, globalDelegateName):
        checks = []
        for f in self.features:
            checks.append("{name: %s, fn: function(){ return !!(%s); }}" % (json.dumps('feature %s' % f.check), f.check))
        fp.write(self.template % ("[\n  %s\n]" % ",\n  ".join(checks)),)


class HTML5Document(object, HTMLParser):
    path = None
    domDocument = None
    element = None

    def __init__(self, path):
        HTMLParser.__init__(self)
        self.path = path
        dom = xml.dom.minidom.getDOMImplementation()
        doctype = dom.createDocumentType("html", None, None)
        self.domDocument = dom.createDocument(None, "html", doctype)
        fp = open(path, 'r')
        for line in fp:
            self.feed(line.decode('utf-8'))
        self.close()

    def handle_starttag(self, name, attrs):
        # TODO: see how this handles namespaces (like for svg)
        if name == 'html' and not self.element:
            self.element = self.domDocument.documentElement
        else:
            element = self._handle_starttag(name, attrs)
            if name not in HTML5DocumentSerializer.VOID_ELEMENTS:
                self.element = element

    def _handle_starttag(self, name, attrs):
        element = self.domDocument.createElement(name)
        for attr in attrs:
            element.setAttribute(attr[0], attr[1])
        self.element.appendChild(element)
        return element

    def handle_endtag(self, name):
        self.element.normalize()
        remove = []
        for child in self.element.childNodes:
            if child.nodeType == xml.dom.Node.TEXT_NODE and child.nodeValue.strip() == '':
                remove.append(child)
        for child in remove:
            self.element.removeChild(child)
        self.element = self.element.parentNode

    def handle_startendtag(self, name, attrs):
        self._handle_starttag(name, attrs)

    def handle_data(self, data):
        if self.element and self.element != self.domDocument.documentElement:
            node = self.domDocument.createTextNode(data)
            self.element.appendChild(node)

    def handle_entityref(self, name):
        # TODO
        pass

    def handle_charref(self, name):
        # TODO
        pass

    def handle_comment(self, data):
        pass

    def handle_decl(self, decl):
        pass

    def handle_pi(self, data):
        pass

    def unknown_decl(self, data):
        pass


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
                    else:
                        writer.write("></%s>" % node.tagName)
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
        writer = StringIO.StringIO()
        self.serializeToFile(writer)
        writer.close()
        return writer.getvalue()
