#!/usr/bin/python

import os
import os.path
import stat
import sys
import shutil
import argparse
import json
import tempfile
import pkg_resources
import subprocess
from .builder import Builder
from .javascript import JSCompilation, JSFeature


class NodeBuilder(Builder):
    outputBundlePath = ""
    outputExecutablePath = ""
    outputResourcePath = ""
    jsCompilation = None
    featureCheck = None
    includes = None
    requires = None
    fonts = None
    debugPort = 8080
    dockerOwner = None
    dockerBuilt = False

    def __init__(self, projectPath, includePaths, outputParentPath, debug=False, args=None):
        super(NodeBuilder, self).__init__(projectPath, includePaths, outputParentPath, debug)
        self.includePaths.extend(self.absolutePathsRelativeToSourceRoot('Frameworks', 'Classes', '.'))
        self.includePaths.append(pkg_resources.resource_filename('jskit', 'jsmake/node_resources'))
        self.parse_args(args)

    def parse_args(self, arglist):
        parser = argparse.ArgumentParser()
        parser.add_argument(u'--http-port', default=u'8081')
        parser.add_argument(u'--docker-owner', default=u'')
        args = parser.parse_args(arglist)
        self.debugPort = int(args.http_port)
        self.dockerOwner = args.docker_owner
        self.useDocker = self.dockerOwner != u''

    def build(self):
        self.setup()
        self.buildResources()
        self.findIncludes()
        self.buildAppJavascript()
        self.buildExecutable()
        if self.useDocker:
            self.buildDocker()
        self.finish()

    def setup(self):
        self.includes = []
        super(NodeBuilder, self).setup()
        self.outputBundlePath = os.path.join(self.outputProjectPath, self.mainBundle.info.get('JSExecutableName'))
        self.outputExecutablePath = os.path.join(self.outputBundlePath, "Node")
        self.outputResourcePath = os.path.join(self.outputBundlePath, "Resources")
        if self.debug:
            for child in (self.outputBundlePath,):
                if os.path.exists(child):
                    if os.path.isdir(child):
                        shutil.rmtree(child)
                    else:
                        os.unlink(child)
        os.makedirs(self.outputResourcePath)
        self.requires = []

    def buildBinaryResource(self, nameComponents, fullPath, mime, extractors=dict()):
        resourceIndex = super(NodeBuilder, self).buildBinaryResource(nameComponents, fullPath, mime, extractors)
        metadata = self.mainBundle.resources[resourceIndex]
        outputPath = os.path.join(self.outputResourcePath, *nameComponents)
        metadata.update(dict(
             nodeBundlePath=_unixpath(os.path.relpath(outputPath, self.outputBundlePath))
        ))
        if not os.path.exists(os.path.dirname(outputPath)):
            os.makedirs(os.path.dirname(outputPath))
        shutil.copyfile(fullPath, outputPath)
        return resourceIndex

    def findIncludes(self):
        loggerResource = None
        if self.debug:
            self.includes.append('jslog-debug.js')
        else:
            self.includes.append('jslog-release.js')
        self.includes.append('main.js')
        mainSpecName = self.mainBundle.info.get('SKMainDefinitionResource', None)
        if mainSpecName is not None:
            mainSpec = self.mainBundle[mainSpecName]["value"]
            self.findSpecIncludes(mainSpec)

    def buildAppJavascript(self):
        self.updateStatus("Creating application js...")
        sys.stdout.flush()
        with tempfile.NamedTemporaryFile() as bundleJSFile:
            bundleJSFile.write("'use strict';\n")
            bundleJSFile.write("var process = require('process');\n")
            bundleJSFile.write("var path = require('path');\n")
            bundleJSFile.write("JSBundle.bundles = %s;\n" % json.dumps(self.bundles, indent=self.debug, default=lambda x: x.jsonObject()))
            bundleJSFile.write("JSBundle.mainBundleIdentifier = '%s';\n" % self.mainBundle.info['JSBundleIdentifier'])
            bundleJSFile.write("JSBundle.bundles[JSBundle.mainBundleIdentifier].nodeRootPath = path.dirname(path.dirname(process.argv[1]));\n")
            self.jsCompilation = JSCompilation(self.includePaths, minify=False, combine=False)
            for path in self.includes:
                self.jsCompilation.include(path)
            self.jsCompilation.include(bundleJSFile, 'bundle.js')
            for outfile in self.jsCompilation.outfiles:
                outfile.fp.flush()
                outputPath = os.path.join(self.outputExecutablePath, outfile.name)
                if not os.path.exists(os.path.dirname(outputPath)):
                    os.makedirs(os.path.dirname(outputPath))
                if self.debug and outfile.fp != bundleJSFile:
                    os.link(outfile.fp.name, outputPath)
                else:
                    shutil.copy(outfile.fp.name, outputPath)
                os.chmod(outputPath, stat.S_IRUSR | stat.S_IWUSR | stat.S_IRGRP | stat.S_IROTH)
                self.requires.append(outputPath)
        for importedPath in self.jsCompilation.importedScriptPaths():
            self.watchFile(importedPath)

    def buildExecutable(self):
        entryFile, entryFunction = self.mainBundle.info.get('EntryPoint', 'main.js:main').split(':')
        self.exePath = os.path.join(self.outputExecutablePath, self.mainBundle.info.get('JSExecutableName'))
        with open(self.exePath, 'w') as exeJSFile:
            exeJSFile.write("#!/usr/bin/env node\n")
            exeJSFile.write("'use strict';\n\n")
            for path in self.requires:
                relativePath = _unixpath(os.path.relpath(path, os.path.dirname(self.exePath)))
                if relativePath == entryFile:
                    exeJSFile.write("var entry = require('./%s').%s;\n" % (relativePath, entryFunction))
                else:
                    exeJSFile.write("require('./%s');\n" % relativePath)
            exeJSFile.write("\nentry();\n")
        os.chmod(self.exePath, stat.S_IRUSR | stat.S_IWUSR | stat.S_IXUSR | stat.S_IRGRP | stat.S_IXGRP | stat.S_IROTH | stat.S_IXOTH)

    def buildDocker(self):
        ownerPrefix = ('%s/' % self.dockerOwner) if self.dockerOwner else ''
        self.dockerIdentifier = "%s%s:%s" % (ownerPrefix, self.mainBundle.info['JSBundleIdentifier'], self.buildLabel if not self.debug else 'debug')
        self.dockerIdentifier = self.dockerIdentifier.lower()
        self.dockerName = self.mainBundle.info['JSBundleIdentifier'].lower().replace('.', '_')
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
                bundlePath = os.path.realpath(self.outputBundlePath)
                return "docker run \\\n    --rm \\\n    --name %s \\\n    -p%d:%d \\\n    --mount type=bind,source=%s,target=/jskitapp \\\n    %s" % (self.dockerName, self.debugPort, self.debugPort, bundlePath, self.dockerIdentifier)
            else:
                return "%s" % os.path.relpath(os.path.join(self.outputExecutablePath, self.exePath))


def _unixpath(ospath):
    if os.sep != '/':
        return ospath.replace(os.sep, '/')
    return ospath
