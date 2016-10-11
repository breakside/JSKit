import os
import os.path
import plistlib
import json
import hashlib
import shutil
from .image import ImageInfoExtractor


class Builder(object):
    buildID = ""
    buildLabel = ""
    includePaths = None
    projectPath = "."
    outputParentPath = "."
    outputProjectPath = ""
    debug = False
    bundles = None
    mainBundle = None

    def __init__(self, projectPath, includePaths, outputParentPath, buildID, buildLabel, debug=False):
        self.includePaths = [os.path.realpath(path) for path in includePaths]
        self.projectPath = os.path.realpath(projectPath)
        self.outputParentPath = os.path.realpath(outputParentPath)
        self.buildID = buildID
        self.buildLabel = buildLabel
        self.debug = debug
        self.bundles = dict()

    def build(self):
        pass

    def setup(self):
        self.mainBundle = None
        self.bundles = dict()
        self.infoName = 'Info.plist'
        infoPath = os.path.join(self.projectPath, self.infoName)
        if os.path.exists(infoPath):
            self.info = plistlib.readPlist(infoPath)
        else:
            self.infoName = 'Info.json'
            infoPath = os.path.join(self.projectPath, self.infoName)
            if (os.path.exists(infoPath)):
                self.info = json.load(open(infoPath))
            else:
                raise Exception("An Info.json or Info.plist file is required to build")
        if 'JSBundleIdentifier' not in self.info:
            raise Exception("%s must include an entry for JSBundleIdentifier")
        self.bundles[self.info['JSBundleIdentifier']] = self.mainBundle = {}
        self.mainBundle["Info"] = self.info
        self.outputProjectPath = os.path.join(self.outputParentPath, 'builds', self.info['JSBundleIdentifier'], self.buildLabel if not self.debug else 'debug')
        if os.path.exists(self.outputProjectPath):
            if self.debug:
                shutil.rmtree(self.outputProjectPath)
            else:
                raise Exception("Output path already exists: %s" % self.outputProjectPath)

    def buildResources(self):
        resourcesPath = os.path.join(self.projectPath, "Resources")
        if os.path.exists(resourcesPath):
            for (dirname, folders, files) in os.walk(resourcesPath):
                for name in files:
                    fullPath = os.path.join(dirname, name)
                    resourcePath = os.path.relpath(fullPath, resourcesPath)
                    if name[-5:] == '.json':
                        resource = json.load(open(fullPath))
                        self.buildJSONLikeResource(resourcePath, resource)
                    elif name[-6:] == '.plist':
                        resource = plistlib.readPlist(fullPath)
                        self.buildJSONLikeResource(resourcePath, resource)
                    else:
                        mimeguess = mimetypes.guess_type(fullPath)
                        if mimeguess[0] and mimeguess[0].split('/')[0] == 'image':
                            self.buildImageResource(resourcePath, fullPath)

    def buildJSONLikeResource(self, resourcePath, resource):
        self.mainBundle[resourcePath] = resource

    def buildImageResource(self, resourcePath, fullPath):
        hash_ = self.hashOfPath(fullPath)
        info = dict(
            hash=hash_,
            mimetype=mimeguess[0],
            byte_size=byte_size
        )
        extractor = ImageInfoExtractor.for_path(fullPath)
        extractor.populate_dict(info)
        self.mainBundle[resourcePath] = info

    @staticmethod
    def hashOfPath(fullPath):
        h = hashlib.sha1()
        f = open(fullPath)
        chunk = f.read(h.block_size)
        while chunk != '':
            h.update(chunk)
            chunk = f.read(h.block_size)
        byte_size = f.tell()
        f.close()
        h = h.hexdigest()
        return h

    def absolutePathsRelativeToSourceRoot(self, *paths):
        return [os.path.join(self.projectPath, path) for path in paths]

    def finish(self):
        if not self.debug:
            buildsPath = os.path.dirname(self.outputProjectPath)
            linkPath = os.path.join(buildsPath, 'latest')
            if os.path.lexists(linkPath):
                os.unlink(linkPath)
            os.symlink(os.path.relpath(self.outputProjectPath, os.path.dirname(linkPath)), linkPath)
        self.info = None

