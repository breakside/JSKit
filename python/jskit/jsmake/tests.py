import os.path
import shutil
import argparse
import xml.dom.minidom
import tempfile
import json
import pkg_resources
import stat
from .builder import Builder
from .html import HTML5DocumentSerializer
from .javascript import JSCompilation

class TestsBuilder(Builder):

    outputProductPath = None
    outputResourcePath = None
    nginxPath = None
    nginxWwwPath = None
    includes = None
    appJS = None
    indexFile = None
    htmlWorkerJSPath = None
    nodeWorkerJSPath = None

    def __init__(self, projectPath, includePaths, outputParentPath, debug=False, args=[]):
        super(TestsBuilder, self).__init__(projectPath, includePaths, outputParentPath, debug=True)
        self.includes = []
        self.includePaths.append(pkg_resources.resource_filename('jskit', 'jsmake/tests_resources'))
        self.includePaths.extend(self.absolutePathsRelativeToSourceRoot('.'))
        self.includePaths.extend([os.path.realpath(x) for x in self.absolutePathsRelativeToSourceRoot('../../Frameworks')])
        self.parse_args(args)

    def parse_args(self, arglist):
        parser = argparse.ArgumentParser()
        args = parser.parse_args(arglist)

    def build(self):
        self.setup()
        self.buildResources()
        self.findIncludes()
        self.buildHTMLJavascript()
        self.buildHTML()
        self.buildNginx()
        self.buildNodeExecutable()
        if self.hasLinkedDispatchFramework():
            self.buildHTMLWorker()
            self.buildNodeWorker()
        self.finish()

    def hasLinkedDispatchFramework(self):
        return 'io.breakside.JSKit.Dispatch' in self.bundles

    def setup(self):
        super(TestsBuilder, self).setup()
        self.outputProductPath = os.path.join(self.outputProjectPath, "Code")
        self.outputResourcePath = os.path.join(self.outputProjectPath, "Resources")
        self.nginxPath = os.path.join(self.outputProjectPath, "nginx")
        self.nginxWwwPath = os.path.join(self.nginxPath, "www")
        if self.debug and os.path.exists(self.outputProjectPath):
            for child in os.listdir(self.outputProjectPath):
                if child != 'nginx' and child[0] != '.':
                    child = os.path.join(self.outputProjectPath, child)
                    if os.path.isdir(child):
                        shutil.rmtree(child)
                    else:
                        os.unlink(child)
        if not os.path.exists(self.outputProductPath):
            os.makedirs(self.outputProductPath)
        if not os.path.exists(self.outputResourcePath):
            os.makedirs(self.outputResourcePath)
        if not os.path.exists(self.nginxPath):
            os.makedirs(self.nginxPath)
        self.appJS = []

    def buildBinaryResource(self, bundle, nameComponents, fullPath, mime, extractors=dict()):
        resourceIndex = super(TestsBuilder, self).buildBinaryResource(bundle, nameComponents, fullPath, mime, extractors)
        metadata = bundle.resources[resourceIndex]
        outputPath = os.path.join(self.outputResourcePath, bundle.identifier, *nameComponents)
        if not os.path.exists(os.path.dirname(outputPath)):
            os.makedirs(os.path.dirname(outputPath))
        metadata.update(dict(
             htmlURL=os.path.relpath(outputPath, self.outputProjectPath).replace(os.sep, '/'),
             nodeBundlePath=outputPath
        ))
        shutil.copyfile(fullPath, outputPath)
        return resourceIndex

    def findIncludes(self):
        for (dirname, folders, files) in os.walk(self.projectPath):
            for name in files:
                if name[-3:] == '.js':
                    self.includes.append(os.path.relpath(os.path.join(dirname, name), self.projectPath))
        if self.hasLinkedDispatchFramework():
            self.htmlWorkerJSPath = os.path.join(self.nginxWwwPath, "html-JSDispatch-worker.js")
            self.mainBundle.info['JSHTMLDispatchQueueWorkerScript'] = os.path.basename(self.htmlWorkerJSPath)
            self.nodeWorkerJSPath = os.path.join(self.outputProjectPath, "node-JSDispatch-worker.js")
            self.mainBundle.info['JSNodeDispatchQueueWorkerModule'] = os.path.basename(self.nodeWorkerJSPath)

    def buildHTMLJavascript(self):
        with tempfile.NamedTemporaryFile() as bundleJSFile:
            bundleJSFile.write("'use strict';\n")
            bundleJSFile.write("JSBundle.bundles = %s;\n" % json.dumps(self.bundles, indent=self.debug, default=lambda x: x.jsonObject()))
            bundleJSFile.write("JSBundle.mainBundleIdentifier = '%s';\n" % self.mainBundle.info['JSBundleIdentifier'])
            jsCompilation = JSCompilation(self.includePaths, minify=False, combine=False)
            jsCompilation.include('HTMLTestRunner.js')
            for bundle in self.bundles.values():
                envInclude = bundle.includeForEnvironment('html')
                if envInclude is not None:
                    jsCompilation.include(envInclude)
            for path in self.includes:
                jsCompilation.include(path)
            jsCompilation.include(bundleJSFile, 'bundle.js')
            for outfile in jsCompilation.outfiles:
                if not outfile.fp.closed:
                    outfile.fp.flush()
                outputPath = os.path.join(self.outputProductPath, outfile.name)
                if not os.path.exists(os.path.dirname(outputPath)):
                    os.makedirs(os.path.dirname(outputPath))
                if outfile.fp.name[0:len(self.projectPath)] == self.projectPath:
                    os.symlink(outfile.fp.name, outputPath)
                else:
                    shutil.copy(outfile.fp.name, outputPath)
                if not outfile.fp.closed:
                    outfile.fp.close()
                self.appJS.append(outputPath)
            for importedPath in jsCompilation.importedScriptPaths():
                self.watchFile(importedPath)

    def buildHTML(self):
        if not os.path.exists(self.nginxWwwPath):
            os.makedirs(self.nginxWwwPath)
        self.indexFile = open(os.path.join(self.nginxWwwPath, 'tests.html'), 'w')
        dom = xml.dom.minidom.getDOMImplementation()
        doctype = dom.createDocumentType("html", None, None)
        document = dom.createDocument(None, "html", doctype)
        html = document.documentElement
        head = html.appendChild(document.createElement("head"))
        meta = head.appendChild(document.createElement("meta"))
        meta.setAttribute("content", "text/html; charset=utf-8")
        meta.setAttribute("http-equiv", "Content-Type")
        style = head.appendChild(document.createElement("link"))
        style.setAttribute("rel", "stylesheet")
        style.setAttribute("type", "text/css")
        style.setAttribute("href", "tests.css")
        shutil.copy(pkg_resources.resource_filename('jskit', 'jsmake/tests_resources/tests.css'), os.path.join(self.nginxWwwPath, 'tests.css'))
        title = head.appendChild(document.createElement("title"))
        title.appendChild(document.createTextNode("Tests"))
        body = html.appendChild(document.createElement("body"))
        script = body.appendChild(document.createElement("script"))
        script.setAttribute("type", "text/javascript")
        script.appendChild(document.createTextNode("""'use strict';window.JSGlobalObject = window;"""))
        for includedSourcePath in self.appJS:
            relativePath = _webpath(os.path.relpath(includedSourcePath, self.outputProjectPath))
            script = body.appendChild(document.createElement("script"))
            script.setAttribute("type", "text/javascript")
            script.setAttribute("src", relativePath)
        script = body.appendChild(document.createElement("script"))
        script.setAttribute("type", "text/javascript")
        script.appendChild(document.createTextNode("""main();"""))
        HTML5DocumentSerializer(document).serializeToFile(self.indexFile)
        shutil.copy(pkg_resources.resource_filename('jskit', 'jsmake/tests_resources/tests.css'), os.path.join(self.nginxWwwPath, 'tests.css'))
        resourcesLinkPath = os.path.join(self.nginxWwwPath, "Resources")
        if os.path.exists(resourcesLinkPath):
            os.unlink(resourcesLinkPath)
        codeLinkPath = os.path.join(self.nginxWwwPath, "Code")
        if os.path.exists(codeLinkPath):
            os.unlink(codeLinkPath)
        os.symlink(self.outputResourcePath, resourcesLinkPath)
        os.symlink(self.outputProductPath, codeLinkPath)

    def buildHTMLWorker(self):
        workerJSFile = open(self.htmlWorkerJSPath, 'w')
        workerJSFile.write("'use strict';\n")
        workerJSFile.write("self.JSGlobalObject = self;\n")
        workerJSFile.write("importScripts.apply(undefined, %s);\n" % json.dumps([_webpath(os.path.relpath(js, self.outputProjectPath)) for js in self.appJS], indent=2))
        workerJSFile.write("var queueWorker = JSHTMLDispatchQueueWorker.init();\n")
        workerJSFile.close()

    def buildNodeWorker(self):
        workerJSFile = open(self.nodeWorkerJSPath, 'w')
        workerJSFile.write("'use strict';\n\n")
        workerJSFile.write("global.JSGlobalObject = global;\n")
        for path in self.nodeAppJS:
            relativePath = _webpath(os.path.relpath(path, os.path.dirname(self.nodeWorkerJSPath)))
            workerJSFile.write("require('./%s');\n" % relativePath)
        workerJSFile.write("\nvar queueWorker = JSNodeDispatchQueueWorker.init();\n")
        workerJSFile.close()

    def buildNginx(self):
        confdir = os.path.join(self.nginxPath, 'conf')
        logdir = os.path.join(self.nginxPath, 'logs')
        if not os.path.exists(confdir):
            os.makedirs(confdir)
        if not os.path.exists(logdir):
            os.makedirs(logdir)
        shutil.copy(pkg_resources.resource_filename('jskit', 'jsmake/tests_resources/nginx.conf'), os.path.join(confdir, 'nginx.conf'))

    def buildNodeExecutable(self):
        self.nodeAppJS = []
        with tempfile.NamedTemporaryFile() as bundleJSFile:
            bundleJSFile.write("'use strict';\n")
            bundleJSFile.write("JSBundle.bundles = %s;\n" % json.dumps(self.bundles, indent=self.debug, default=lambda x: x.jsonObject()))
            bundleJSFile.write("JSBundle.mainBundleIdentifier = '%s';\n" % self.mainBundle.info['JSBundleIdentifier'])
            jsCompilation = JSCompilation(self.includePaths, minify=False, combine=False)
            jsCompilation.include('NodeTestRunner.js')
            for bundle in self.bundles.values():
                envInclude = bundle.includeForEnvironment('node')
                if envInclude is not None:
                    jsCompilation.include(envInclude)
            for path in self.includes:
                jsCompilation.include(path)
            jsCompilation.include(bundleJSFile, 'bundle.js')
            for outfile in jsCompilation.outfiles:
                if not outfile.fp.closed:
                    outfile.fp.flush()
                outputPath = os.path.join(self.outputProductPath, outfile.name)
                if not os.path.exists(os.path.dirname(outputPath)):
                    os.makedirs(os.path.dirname(outputPath))
                if not os.path.exists(outputPath):
                    if outfile.fp.name[0:len(self.projectPath)] == self.projectPath:
                        os.symlink(outfile.fp.name, outputPath)
                    else:
                        shutil.copy(outfile.fp.name, outputPath)
                self.nodeAppJS.append(outputPath)
                if not outfile.fp.closed:
                    outfile.fp.close()
            for importedPath in jsCompilation.importedScriptPaths():
                self.watchFile(importedPath)
        exePath = os.path.join(self.outputProjectPath, 'tests')
        entryFile = _webpath(os.path.relpath('%s/NodeTestRunner.js' % self.outputProductPath, os.path.dirname(exePath)))
        with open(exePath, 'w') as exeJSFile:
            exeJSFile.write("#!/usr/bin/env node\n")
            exeJSFile.write("'use strict';\n\n")
            exeJSFile.write("global.JSGlobalObject = global;\n")
            for path in self.nodeAppJS:
                relativePath = _webpath(os.path.relpath(path, os.path.dirname(exePath)))
                if relativePath == entryFile:
                    exeJSFile.write("var entry = require('./%s').run;\n" % (relativePath,))
                else:
                    exeJSFile.write("require('./%s');\n" % relativePath)
            exeJSFile.write("\nentry();\n")
        os.chmod(exePath, stat.S_IRUSR | stat.S_IWUSR | stat.S_IXUSR | stat.S_IRGRP | stat.S_IXGRP | stat.S_IROTH | stat.S_IXOTH)

    def finish(self):
        super(TestsBuilder, self).finish()
        self.indexFile.close()
        self.indexFile = None

    def targetUsage(self):
        return [
            "nginx -p %s && open http://localhost:8088/" % os.path.relpath(self.nginxPath),
            "open %s" % os.path.relpath(os.path.join(self.nginxWwwPath, 'tests.html')),
            "%s" % os.path.relpath(os.path.join(self.outputProjectPath, 'tests'))
        ]


def _webpath(ospath):
    if os.sep != '/':
        return ospath.replace(os.sep, '/')
    return ospath
