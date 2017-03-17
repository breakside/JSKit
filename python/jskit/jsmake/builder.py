import os
import re
import os.path
import plistlib
import json
import hashlib
import shutil
import mimetypes
from .image import ImageInfoExtractor
from .font import FontInfoExtractor


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

    @staticmethod
    def readInfo(projectPath):
        infoName = 'Info.plist'
        infoPath = os.path.join(projectPath, infoName)
        if os.path.exists(infoPath):
            return plistlib.readPlist(infoPath)
        else:
            infoName = 'Info.json'
            infoPath = os.path.join(projectPath, infoName)
            if (os.path.exists(infoPath)):
                try:
                    return json.load(open(infoPath))
                except Exception as e:
                    raise Exception("Error parsing Info.json: %s" % e.message)
            else:
                raise Exception("An Info.json or Info.plist file is required to build")


    def setup(self):
        self.mainBundle = None
        self.bundles = dict()
        self.info = Builder.readInfo(self.projectPath)
        if 'JSBundleIdentifier' not in self.info:
            raise Exception("%s must include an entry for JSBundleIdentifier")
        self.bundles[self.info['JSBundleIdentifier']] = self.mainBundle = {}
        self.mainBundle["Info"] = self.info
        self.mainBundle["Resources"] = {}
        self.mainBundle["Fonts"] = []
        self.outputProjectPath = os.path.join(self.outputParentPath, 'builds', self.info['JSBundleIdentifier'], self.buildLabel if not self.debug else 'debug')
        if not self.debug and os.path.exists(self.outputProjectPath):
            raise Exception("Output path already exists: %s" % self.outputProjectPath)

    def buildResources(self):
        resourcesPath = os.path.join(self.projectPath, "Resources")
        if os.path.exists(resourcesPath):
            self.scanResourceFolder(resourcesPath, [])

    def scanResourceFolder(self, resourcesPath, parentNameComponents):
        dirname = os.path.join(resourcesPath, *parentNameComponents)
        for filename in os.listdir(dirname):
            name, ext = os.path.splitext(filename)
            fullPath = os.path.join(dirname, filename)
            nameComponents = parentNameComponents + [name]
            if os.path.isdir(fullPath):
                if ext == '.imageset':
                    self.buildImageAssetResource(nameComponents, fullPath)
                else:
                    self.scanResourceFolder(resourcesPath, nameComponents)
            elif ext == '.json':
                try:
                    obj = json.load(open(fullPath))
                except Exception as e:
                    raise Exception("Error parsing %s: %s" % (fullPath, e.message))
                self.buildJSONLikeResource(nameComponents, obj)
            elif ext == '.plist':
                obj = plistlib.readPlist(fullPath)
                self.buildJSONLikeResource(nameComponents, obj)
            else:
                mimeguess = mimetypes.guess_type(fullPath)
                if mimeguess[0]:
                    primary_type, secondary_type = mimeguess[0].split('/')
                    if primary_type == 'image':
                        name, scale = self.imagePropertiesFromName(name)
                        nameComponents = parentNameComponents + [name]
                        self.buildImageResource(nameComponents, fullPath, mimeguess[0], scale)
                    elif primary_type == 'application':
                        if secondary_type in ('x-font-ttf', 'x-font-otf', 'x-font-woff'):
                            self.buildFontResource(nameComponents, fullPath, mimeguess[0])

    def addResourceToMainBundle(self, nameComponents, resource):
        bundleKey = '/'.join(nameComponents)
        if bundleKey not in self.mainBundle["Resources"]:
            self.mainBundle["Resources"][bundleKey] = []
        self.mainBundle["Resources"][bundleKey].append(resource)
        if resource["kind"] == "font":
            self.mainBundle["Fonts"].append(bundleKey)

    def imagePropertiesFromName(self, name):
        scale = 1
        matches = re.search("^(.+?)(@(\d)+x)?$", name)
        if matches is not None:
            if matches.group(2) is not None:
                scale = int(matches.group(3))
                name = matches.group(1)
        return (name, scale)

    def buildJSONLikeResource(self, nameComponents, obj):
        resource = dict(
            kind="object",
            value=obj
        )
        self.addResourceToMainBundle(nameComponents, resource)

    def buildImageAssetResource(self, nameComponents, fullPath):
        contentsPath = os.path.join(fullPath, "Contents.json")
        try:
            contents = json.load(open(contentsPath))
        except Exception as e:
            raise Exception("Error parsing %s: %s" % (contentsPath, e.message))
        images = contents.get('images', [])
        for image in images:
            vector = False
            filename = image.get('filename', '')
            scaleString = image.get('scale', '')
            if scaleString:
                scale = 1
                matches = re.search('^(\d+)[Xx]$', scaleString)
                if matches:
                    scale = int(matches.group(1))
            else:
                vector = True
            if filename:
                imageFullPath = os.path.join(fullPath, filename)
                mimeguess = mimetypes.guess_type(imageFullPath)
                resource = self.buildImageResource(nameComponents, imageFullPath, mimeguess[0], scale)
                resource["image"]["vector"] = vector

    def buildImageResource(self, nameComponents, fullPath, mime, scale):
        hash_, byte_size = self.hashOfPath(fullPath)
        info = dict(
            scale=scale
        )
        extractor = ImageInfoExtractor.for_path(fullPath)
        extractor.populate_dict(info)
        resource = dict(
            kind="image",
            hash=hash_,
            mimetype=mime,
            byte_size=byte_size,
            image=info
        )
        self.addResourceToMainBundle(nameComponents, resource)
        return resource

    def buildFontResource(self, nameComponents, fullPath, mime):
        hash_, byte_size = self.hashOfPath(fullPath)
        info = dict()
        extractor = FontInfoExtractor.for_path(fullPath)
        extractor.populate_dict(info)
        resource = dict(
            kind="font",
            hash=hash_,
            mimetype=mime,
            byte_size=byte_size,
            font=info
        )
        self.addResourceToMainBundle(nameComponents, resource)
        return resource

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
        return h, byte_size

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

