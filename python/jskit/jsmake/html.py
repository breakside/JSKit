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
    dockerBuilt = False
    dockerIdentifier = ""
    dockerOwner = ""
    dockerName = ""
    bootstrapVersion = 1
    workerJSPath = None

    def __init__(self, projectPath, includePaths, outputParentPath, debug=False, args=None):
        super(HTMLBuilder, self).__init__(projectPath, includePaths, outputParentPath, debug)
        self.includePaths.extend(self.absolutePathsRelativeToSourceRoot('Frameworks', 'Classes', '.'))
        self.addRecursiveIncludePaths(os.path.join(self.projectPath, 'Classes'))
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
        if self.hasLinkedDispatchFramework():
            self.buildWorker()
        self.buildIndex()
        self.buildNginxConf()
        if self.useDocker:
            self.buildDocker()
        self.finish()

    def hasLinkedDispatchFramework(self):
        return 'io.breakside.JSKit.Dispatch' in self.bundles

    def addRecursiveIncludePaths(self, parent):
        for name in os.listdir(parent):
            child = os.path.join(parent, name)
            if os.path.isdir(child):
                self.includePaths.append(child)
                self.addRecursiveIncludePaths(child)

    def setup(self):
        self.includes = []
        super(HTMLBuilder, self).setup()
        self.outputConfPath = os.path.join(self.outputProjectPath, "conf")
        self.outputWebRootPath = os.path.join(self.outputProjectPath, "www")
        self.outputCacheBustingPath = os.path.join(self.outputWebRootPath, self.buildID if not self.debug else "debug")
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

    def buildBinaryResource(self, bundle, nameComponents, fullPath, mime, extractors=dict()):
        resourceIndex = super(HTMLBuilder, self).buildBinaryResource(bundle, nameComponents, fullPath, mime, extractors)
        metadata = bundle.resources[resourceIndex]
        dontcare, ext = os.path.splitext(os.path.basename(fullPath))
        outputPath = os.path.join(self.outputResourcePath, metadata['hash'] + ext)
        metadata.update(dict(
             htmlURL=self.absoluteWebPath(outputPath)
        ))
        shutil.copyfile(fullPath, outputPath)
        self.manifest.append(outputPath)
        return resourceIndex

    def buildFontResource(self, bundle, nameComponents, fullPath, mime):
        resourceIndex = super(HTMLBuilder, self).buildFontResource(bundle, nameComponents, fullPath, mime)
        metadata = bundle.resources[resourceIndex]
        info = metadata["font"]
        variants = [(metadata["htmlURL"], None)]
        # Early on, this builder made woff variants of ttf font.  Turns out that woff variants
        # don't make sense anymore:
        # 1. The point of woff is to compress ttfs...
        # 2. But with appcache, we'll always download the ttf and woff, which is worse than just uncompressed ttf
        # 3. Furthermore, some of our code (PDF processing) epxects to deal with TTF only
        # 4. And we can alway gzip transfer the ttf at the server/transport level
        # if mime != 'application/x-font-woff':
        #     outputTmpWoffPath = os.path.join(self.outputResourcePath, resource['hash'] + '.woff')
        #     sfnt_to_woff(fullPath, outputTmpWoffPath)
        #     woff_hash, woff_size = Builder.hashOfPath(outputTmpWoffPath)
        #     outputWoffPath = os.path.join(self.outputResourcePath, woff_hash + '.woff')
        #     os.rename(outputTmpWoffPath, outputWoffPath)
        #     variants.insert(0, (self.absoluteWebPath(outputWoffPath), 'woff'))
        #     self.manifest.append(outputWoffPath)
        self.fonts.append(dict(info=info, variants=variants))
        return resourceIndex

    def findIncludes(self):
        self.includes.append('main.js')
        for bundle in self.bundles.values():
            envInclude = bundle.includeForEnvironment('html')
            if envInclude is not None:
                self.includes.append(envInclude)
        mainSpecName = self.mainBundle.info.get('UIMainSpec', None)
        if mainSpecName is not None:
            mainSpec = self.mainBundle[mainSpecName]["value"]
            self.findSpecIncludes(mainSpec)
        else:
            appDelegate = self.mainBundle.info.get('UIApplicationDelegate', None)
            if appDelegate is not None:
                path = appDelegate + '.js'
                for includeDir in self.includePaths:
                    if os.path.exists(os.path.join(includeDir, path)):
                        self.includes.append(path)
        if self.hasLinkedDispatchFramework():
            self.workerJSPath = os.path.join(self.outputCacheBustingPath, "JSDispatch-worker.js")
            self.mainBundle.info['JSHTMLDispatchQueueWorkerScript'] = self.absoluteWebPath(self.workerJSPath)

    def buildAppCSS(self):
        self.updateStatus("Creating application css...")
        sys.stdout.flush()
        outputPath = os.path.join(self.outputCacheBustingPath, 'app.css')
        with open(outputPath, 'w') as fp:
            for font in self.fonts:
                fp.write('@font-face {\n')
                fp.write('  font-family: "%s";\n' % font['info']['family'])
                fp.write('  font-style: %s;\n' % font['info']['style'])
                # TTF weights can be 1 to 1000, CSS weights can on be multiples of 100
                fp.write('  font-weight: %s;\n' % ((font['info']['weight'] / 100) * 100))
                fp.write('  src: %s;\n' % ', '.join([self.font_src(variant) for variant in font['variants']]))
                fp.write('  font-display: block;\n')
                fp.write('}\n\n')
            self.appCSS.append(outputPath)
            self.manifest.append(outputPath)

    def font_src(self, variant):
        if variant[1]:
            return 'url("%s") format("%s")' % (variant[0], variant[1])
        return 'url("%s")' % variant[0]

    def buildAppJavascript(self):
        self.updateStatus("Creating application js...")
        sys.stdout.flush()
        with tempfile.NamedTemporaryFile() as bundleJSFile:
            bundleJSFile.write("'use strict';\n")
            bundleJSFile.write("JSBundle.bundles = %s;\n" % json.dumps(self.bundles, indent=self.debug, default=lambda x: x.jsonObject()))
            bundleJSFile.write("JSBundle.mainBundleIdentifier = '%s';\n" % self.mainBundle.identifier)
            self.jsCompilation = JSCompilation(self.includePaths, minify=not self.debug, combine=not self.debug)
            if not self.debug:
                license = self.licenseText()
                self.jsCompilation.writeComment(u"%s (%s)\n----\n%s" % (self.mainBundle.info.get('JSBundleIdentifier'), self.mainBundle.info.get('JSBundleVersion'), license))
            for path in self.includes:
                self.jsCompilation.include(path)
            self.jsCompilation.include(bundleJSFile, 'bundle.js')
            appJSNumber = 0
            for outfile in self.jsCompilation.outfiles:
                if not outfile.fp.closed:
                    outfile.fp.flush()
                if outfile.name:
                    outputPath = os.path.join(self.outputCacheBustingPath, outfile.name)
                elif appJSNumber == 0:
                    outputPath = os.path.join(self.outputCacheBustingPath, 'app.js')
                    appJSNumber += 1
                else:
                    outputPath = os.path.join(self.outputCacheBustingPath, 'app%d.js' % appJSNumber)
                    appJSNumber += 1
                if not os.path.exists(os.path.dirname(outputPath)):
                    os.makedirs(os.path.dirname(outputPath))
                if self.debug and outfile.fp != bundleJSFile:
                    os.link(outfile.fp.name, outputPath)
                else:
                    shutil.copy(outfile.fp.name, outputPath)
                os.chmod(outputPath, stat.S_IRUSR | stat.S_IWUSR | stat.S_IRGRP | stat.S_IROTH)
                self.manifest.append(outputPath)
                self.appJS.append(outputPath)
                if not outfile.fp.closed:
                    outfile.fp.close()
        for importedPath in self.jsCompilation.importedScriptPaths():
            self.watchFile(importedPath)

    def buildPreflight(self):
        self.updateStatus("Creating preflight js...")
        sys.stdout.flush()
        self.featureCheck = JSFeatureCheck()
        self.featureCheck.addFeature(JSFeature('window'))
        self.featureCheck.addFeature(JSFeature("document.body"))
        for feature in self.jsCompilation.features:
            self.featureCheck.addFeature(feature)
        self.preflightFile = open(os.path.join(self.outputWebRootPath, 'preflight-%s.js' % self.featureCheck.hash), 'w')
        self.featureCheck.serialize(self.preflightFile, 'bootstrapper')
        self.preflightFile.close()
        self.manifest.append(self.preflightFile.name)

    def buildAppCacheManifest(self):
        self.updateStatus("Creating manifest.appcache...")
        sys.stdout.flush()
        self.manifestFile = open(os.path.join(self.outputWebRootPath, "manifest.appcache"), 'w')
        self.manifestFile.write("CACHE MANIFEST\n")
        self.manifestFile.write("# build %s\n" % self.buildID)
        for name in self.manifest:
            self.manifestFile.write("%s\n" % self.absoluteWebPath(name))
        self.manifestFile.write("\nNETWORK:\n*\n")
        self.manifestFile.close()

    def buildIndex(self):
        self.updateStatus("Creating index.html...")
        sys.stdout.flush()
        indexName = self.mainBundle.info.get('UIApplicationHTMLIndexFile', 'index.html')
        indexPath = os.path.join(self.projectPath, indexName)
        self.watchFile(indexPath)
        document = HTML5Document(indexPath).domDocument
        self.indexFile = open(os.path.join(self.outputWebRootPath, indexName), 'w')
        stack = [document.documentElement]
        includePaths = (pkg_resources.resource_filename('jskit', 'jsmake/html_resources'),)
        hasInsertedLogger = False
        while len(stack) > 0:
            node = stack.pop()
            if node.tagName == 'head':
                icons = self.applicationIcons()
                for icon in icons:
                    link = document.createElement("link")
                    link.setAttribute("rel", icon['rel'])
                    link.setAttribute("href", icon['href'])
                    if icon['rel'] == 'mask-icon':
                        link.setAttribute("color", icon['color'])
                    else:
                        link.setAttribute("type", icon['type'])
                        link.setAttribute("sizes", icon['sizes'])
                    node.appendChild(link)
            elif node.tagName == 'title' and node.parentNode.tagName == 'head':
                node.appendChild(document.createTextNode(self.mainBundle.developmentLoocalizedInfoString('UIApplicationTitle')))
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
                    jscontext = {
                        'preflightID': self.featureCheck.hash,
                        'preflightSrc': self.absoluteWebPath(self.preflightFile.name),
                        'appSrc': [self.absoluteWebPath(x) for x in self.appJS],
                        'appCss': [self.absoluteWebPath(x) for x in self.appCSS]
                    }
                    inscript.write(JSCompilation.preprocess(oldScriptText.strip(), jscontext))
                    compilation = JSCompilation(includePaths, minify=not self.debug, combine=not self.debug)
                    compilation.include(inscript)
                    for outfile in compilation.outfiles:
                        if not outfile.fp.closed:
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
                            self.manifest.append(outputPath)
                            self.watchFile(outfile.fp.name)
                            webpath = self.absoluteWebPath(outputPath)
                            script.setAttribute('src', webpath)
                        node.parentNode.insertBefore(script, node)
                        if not outfile.fp.closed:
                            outfile.fp.close()
                node.parentNode.removeChild(node)
            for child in node.childNodes:
                if child.nodeType == xml.dom.Node.ELEMENT_NODE:
                    stack.append(child)
        self.buildAppCacheManifest()
        if self.manifestFile:
            document.documentElement.setAttribute('manifest', self.absoluteWebPath(self.manifestFile.name))
        HTML5DocumentSerializer(document).serializeToFile(self.indexFile)
        self.indexFile.close()

    def applicationIcons(self):
        icons = []
        imagesetName = self.mainBundle.info.get("UIApplicationIcon", None)
        if imagesetName is not None:
            imagesetName += '.imageset'
            contents = self.mainBundle[imagesetName + '/Contents.json']
            images = contents['value']['images']
            for image in images:
                metadata = self.mainBundle[imagesetName + '/' + image['filename']]
                icons.append(dict(
                    rel="icon" if not image.get('mask', False) else 'mask-icon',
                    href=metadata['htmlURL'],
                    type=metadata['mimetype'],
                    sizes=('%dx%d' % (metadata['image']['width'], metadata['image']['height'])) if not metadata['image'].get('vector', False) else 'any',
                    color=image.get('color', None)
                ))
        return icons

    def buildWorker(self):
        self.updateStatus("Creating worker.js...")
        sys.stdout.flush()
        workerJSFile = open(self.workerJSPath, 'w')
        workerJSFile.write("'use strict';\n")
        # FIXME: we should probably include logger as a script file so we're syncd with index, and so
        # it's easier to import here
        workerJSFile.write("self.jslog_create = function(){ return console; };\n")
        workerJSFile.write("self.JSGlobalObject = self;\n")
        workerJSFile.write("importScripts.apply(undefined, %s);\n" % json.dumps([self.absoluteWebPath(js) for js in self.appJS], indent=2))
        workerJSFile.write("var queueWorker = JSHTMLDispatchQueueWorker.init();\n")
        workerJSFile.close()
        self.manifest.append(workerJSFile.name)

    def buildNginxConf(self):
        self.updateStatus("Creating nginx.conf...")
        sys.stdout.flush()
        if self.debug:
            cert = os.path.join(self.projectPath, "_localhost.cert")
            key = os.path.join(self.projectPath, "_localhost.key")
            if os.path.exists(cert) and os.path.exists(key):
                confName = "nginx-debug-ssl.conf"
                shutil.copy(cert, os.path.join(self.outputConfPath, "app.cert"))
                shutil.copy(key, os.path.join(self.outputConfPath, "app.key"))
            else:
                confName = "nginx-debug.conf"
        else:
            confName = "nginx-release.conf"
        templateFile = os.path.join(self.projectPath, confName);
        self.watchFile(templateFile)
        with open(templateFile, 'r') as fp:
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

    def buildDocker(self):
        ownerPrefix = ('%s/' % self.dockerOwner) if self.dockerOwner else ''
        self.dockerIdentifier = "%s%s:%s" % (ownerPrefix, self.mainBundle.identifier, self.buildLabel if not self.debug else 'debug')
        self.dockerIdentifier = self.dockerIdentifier.lower()
        self.dockerName = self.mainBundle.identifier.lower().replace('.', '_')
        if not self.dockerBuilt:
            self.updateStatus("Building docker image %s..." % self.dockerIdentifier)
            sys.stdout.flush()
            dockerFile = os.path.join(self.projectPath, "Dockerfile")
            self.watchFile(dockerFile)
            dockerOutputFile = os.path.join(self.outputProjectPath, "Dockerfile")
            shutil.copyfile(dockerFile, dockerOutputFile)
            args = ["docker", "build", "-t", self.dockerIdentifier, os.path.relpath(self.outputProjectPath)]
            with tempfile.NamedTemporaryFile() as fp:
                if subprocess.call(args, stdout=fp, stderr=fp) != 0:
                    raise Exception("Error building docker with: %s" % ' '.join(args))
                self.dockerBuilt = True

    def targetUsage(self):
        if self.debug:
            if self.useDocker:
                wwwPath = os.path.join(os.path.realpath(self.outputProjectPath), 'www')
                return "docker run \\\n    --rm \\\n    --name %s \\\n    -p%d:%d \\\n    --mount type=bind,source=%s,target=/jskitapp/www \\\n    %s" % (self.dockerName, self.debugPort, self.debugPort, wwwPath, self.dockerIdentifier)
            else:
                return "nginx -p %s" % os.path.relpath(self.outputProjectPath)

    def absoluteWebPath(self, outputPath):
        return '/' + _webpath(os.path.relpath(outputPath, self.outputWebRootPath))


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
        with open(path, 'r') as fp:
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
