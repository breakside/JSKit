import os.path
import shutil
import argparse
import xml.dom.minidom
import tempfile
import json
import pkg_resources
from .builder import Builder
from .html import HTML5DocumentSerializer
from .javascript import JSCompilation

class TestsBuilder(Builder):

    outputProductPath = None
    includes = None
    appJS = None
    indexFile = None

    def __init__(self, projectPath, includePaths, outputParentPath, buildID, buildLabel, debug=False, args=[]):
        super(TestsBuilder, self).__init__(projectPath, includePaths, outputParentPath, buildID, buildLabel, debug=True)
        self.includes = []
        self.includePaths.append(pkg_resources.resource_filename('jskit', 'jsmake/tests_resources'))
        self.includePaths.extend(self.absolutePathsRelativeToSourceRoot('.'))
        self.parse_args(args)

    def parse_args(self, arglist):
        parser = argparse.ArgumentParser()
        args = parser.parse_args(arglist)

    def build(self):
        self.setup()
        self.findIncludes()
        self.buildAppJavascript();
        self.buildIndex()
        self.finish()

    def setup(self):
        super(TestsBuilder, self).setup()
        self.outputProductPath = os.path.join(self.outputProjectPath, self.buildID)
        os.makedirs(self.outputProductPath)
        self.appJS = []

    def findIncludes(self):
        for path in self.info.get('JSIncludes', []):
            self.includes.append(path)
        for (dirname, folders, files) in os.walk(self.projectPath):
            for name in files:
                if name[-3:] == '.js':
                    self.includes.append(os.path.relpath(os.path.join(dirname, name), self.projectPath))

    def buildAppJavascript(self):
        with tempfile.NamedTemporaryFile() as bundleJSFile:
            bundleJSFile.write("'use strict';\n")
            bundleJSFile.write("JSBundle.bundles = %s;\n" % json.dumps(self.bundles, indent=self.debug))
            bundleJSFile.write("JSBundle.mainBundleIdentifier = '%s';\n" % self.info['JSBundleIdentifier'])
            self.jsCompilation = JSCompilation(self.includePaths, minify=False, combine=False)
            for path in self.includes:
                self.jsCompilation.include(path)
            self.jsCompilation.include(bundleJSFile, 'bundle.js')
            self.jsCompilation.include('HTMLTestRunner.js')
            for outfile in self.jsCompilation.outfiles:
                outfile.fp.flush()
                outputPath = os.path.join(self.outputProductPath, outfile.name)
                if not os.path.exists(os.path.dirname(outputPath)):
                    os.makedirs(os.path.dirname(outputPath))
                if outfile.fp.name[0:len(self.projectPath)] == self.projectPath:
                    os.symlink(outfile.fp.name, outputPath)
                else:
                    shutil.copy(outfile.fp.name, outputPath)
                self.appJS.append(outputPath)

    def buildIndex(self):
        self.indexFile = open(os.path.join(self.outputProjectPath, 'tests.html'), 'w')
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
        shutil.copy(pkg_resources.resource_filename('jskit', 'jsmake/tests_resources/tests.css'), os.path.join(self.outputProjectPath, 'tests.css'))
        title = head.appendChild(document.createElement("title"))
        title.appendChild(document.createTextNode("Tests"))
        body = html.appendChild(document.createElement("body"))
        for includedSourcePath in self.appJS:
            relativePath = _webpath(os.path.relpath(includedSourcePath, os.path.dirname(self.indexFile.name)))
            script = body.appendChild(document.createElement("script"))
            script.setAttribute("type", "text/javascript")
            script.setAttribute("src", relativePath)
        HTML5DocumentSerializer(document).serializeToFile(self.indexFile)

    def finish(self):
        super(TestsBuilder, self).finish()
        self.indexFile.close()
        self.indexFile = None


def _webpath(ospath):
    if os.sep != '/':
        return ospath.replace(os.sep, '/')
    return ospath
