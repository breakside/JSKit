import os
import re
import sys
import os.path
import plistlib
import json
import hashlib
import shutil
import mimetypes
import datetime
import collections
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
    watchedFiles = None
    statusMessage = ""

    def __init__(self, projectPath, includePaths, outputParentPath, debug=False):
        self.includePaths = [os.path.realpath(path) for path in includePaths]
        self.projectPath = os.path.realpath(projectPath)
        self.outputParentPath = os.path.realpath(outputParentPath)
        self.debug = debug
        self.bundles = dict()
        self.watchedFiles = []

    def run(self, watch=False):
        if watch:
            self._print("Automatically rebuilding when files change\n")
        self._build()
        print_final_newline = True
        if self.debug:
            usages = self.targetUsage()
            if usages is not None:
                if isinstance(usages, basestring):
                    usages = [usages]
                for usage in usages:
                    usage = ("$ %s\n" % usage).encode('utf-8')
                    self._print(usage, overwriteStatus=watch)
                    print_final_newline = False
        if watch:
            self.watchForChanges()
        if print_final_newline:
            self._print_raw("\n")

    def _build(self):
        buildDate = datetime.datetime.now()
        self.buildID = unicode(hashlib.md5(buildDate.strftime(u"%Y-%m-%d-%H-%M-%S")).hexdigest())
        self.buildLabel = unicode(buildDate.strftime(u"%Y-%m-%d-%H-%M-%S"))
        self.updateStatus("Starting build...")
        self.build()
        self.updateStatus("Done!")

    def _print(self, message, reprintStatus=False, overwriteStatus=False):
        if overwriteStatus:
            reprintStatus = True
        if not overwriteStatus and len(self.statusMessage) > 0:
            self._print_raw("\n", flush=False)
        if overwriteStatus:
            self._erase(len(self.statusMessage))
        self._print_raw(message)
        if reprintStatus:
            if len(message) > 0 and message[-1] != "\n":
                self._print_raw("\n", flush=False)
            self._print_raw(self.statusMessage)
        else:
            self.statusMessage = ""

    def _print_raw(self, message, flush=True):
        sys.stdout.write(message)
        if flush:
            sys.stdout.flush()

    def _erase(self, count, flush=False):
        if sys.stdout.isatty():
            self._print_raw("\x08" * count, flush=flush)
            self._print_raw("\x1B[0K")
        elif count > 0:
            self._print_raw("\n")

    def updateStatus(self, message):
        self._erase(len(self.statusMessage))
        prefix = u"[build %s] " % self.buildLabel
        line = prefix + message
        self.statusMessage = line.encode('utf-8')
        self._print_raw(self.statusMessage)

    def build(self):
        pass

    def watchFile(self, path):
        path = os.path.realpath(path)
        self.watchedFiles.append(path)

    def watchedFolders(self):
        folders = [os.path.dirname(path) for path in self.watchedFiles]
        folders.sort()
        if len(folders) == 0:
            return []
        last = folders.pop()
        uniqueFolders = [last]
        while len(folders) > 0:
            folder = folders.pop()
            if folder != last:
                last = folder
                uniqueFolders.append(last)
        return uniqueFolders

    def watchForChanges(self):
        try:
            import watchdog
            import watchdog.events
            import watchdog.observers

            class ChangeHandler(watchdog.events.FileSystemEventHandler):

                observer = None
                files = None
                changed = ""
                resourcesPath= None

                def __init__(self, observer, files, resourcesPath):
                    self.observer = observer
                    self.files = files
                    self.resourcesPath = resourcesPath

                def is_resource(self, path):
                    return path[0:len(self.resourcesPath)] == self.resourcesPath

                def on_created(self, event):
                    path = os.path.realpath(event.src_path)
                    self.changed = path
                    if self.is_resource(path):
                        self.observer.stop()

                def on_deleted(self, event):
                    path = os.path.realpath(event.src_path)
                    self.changed = path
                    if self.is_resource(path):
                        self.observer.stop()

                def on_modified(self, event):
                    path = os.path.realpath(event.src_path)
                    self.changed = path
                    if path in self.files:
                        self.observer.stop()
        except:
            print u"watchdog is not installed, cannot watch for file changes"
            print u"$ pip install watchdog"
            return
        try:
            resourcesPath = os.path.realpath(os.path.join(self.projectPath, "Resources"))
            while True:
                # print '\n    '.join(self.watchedFiles)
                observer = watchdog.observers.Observer()
                handler = ChangeHandler(observer, self.watchedFiles, resourcesPath)
                if os.path.exists(resourcesPath):
                    # print "    %s" % resourcesPath
                    observer.schedule(handler, resourcesPath, recursive=True)
                for folder in self.watchedFolders():
                    if folder[0:len(resourcesPath)] != resourcesPath:
                        # print "    %s" % folder
                        observer.schedule(handler, folder, recursive=False)
                observer.start()
                while observer.isAlive():
                    observer.join(3600)
                self.updateStatus(u"Changed %s" % handler.changed)
                self.watchedFiles = []
                self._build()
        except KeyboardInterrupt:
            observer.stop()


    @staticmethod
    def readInfo(projectPath):
        infoName = 'Info.plist'
        infoPath = os.path.join(projectPath, infoName)
        if os.path.exists(infoPath):
            return infoPath, plistlib.readPlist(infoPath)
        else:
            infoName = 'Info.json'
            infoPath = os.path.join(projectPath, infoName)
            if (os.path.exists(infoPath)):
                try:
                    return infoPath, json.load(open(infoPath), object_pairs_hook=collections.OrderedDict)
                except Exception as e:
                    raise Exception("Error parsing Info.json: %s" % e.message)
            else:
                raise Exception("An Info.json or Info.plist file is required to build")


    def setup(self):
        self.mainBundle = None
        self.bundles = dict()
        infofile, self.info = Builder.readInfo(self.projectPath)
        self.watchFile(infofile)
        if 'JSBundleIdentifier' not in self.info:
            raise Exception("%s must include an entry for JSBundleIdentifier")
        self.bundles[self.info['JSBundleIdentifier']] = self.mainBundle = {}
        self.mainBundle["Info"] = self.info
        self.mainBundle["Resources"] = {}
        self.mainBundle["Fonts"] = []
        self.outputProjectPath = os.path.join(self.outputParentPath, 'builds', self.info['JSBundleIdentifier'], self.buildLabel if not self.debug else 'debug')
        if not self.debug and os.path.exists(self.outputProjectPath):
            raise Exception("Output path already exists: %s" % self.outputProjectPath)

    def findSpecIncludes(self, spec):
        for k, v in spec.items():
            if k == 'JSIncludes':
                for path in v:
                    self.includes.append(path)
            elif k == 'JSInclude':
                self.includes.append(v)
            elif k == 'JSIncludeAll':
                for includeDir in self.includePaths:
                    path = os.path.join(includeDir, v)
                    if os.path.exists(path) and os.path.isdir(path):
                        for file in os.listdir(path):
                            if file[-3:] == '.js':
                                self.includes.append(u"%s/%s" % (v, file))
            elif isinstance(v, dict):
                self.findSpecIncludes(v)

    def buildResources(self):
        resourcesPath = os.path.join(self.projectPath, "Resources")
        if os.path.exists(resourcesPath):
            self.scanResourceFolder(resourcesPath, [])

    def scanResourceFolder(self, resourcesPath, parentNameComponents):
        self.updateStatus("Building Resources...")
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
                    obj = json.load(open(fullPath), object_pairs_hook=collections.OrderedDict)
                except Exception as e:
                    raise Exception("Error parsing %s: %s" % (fullPath, e.message))
                self.buildJSONLikeResource(nameComponents, obj)
                self.watchFile(fullPath)
            elif ext == '.plist':
                obj = plistlib.readPlist(fullPath)
                self.buildJSONLikeResource(nameComponents, obj)
                self.watchFile(fullPath)
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
        self.updateStatus("Packaging resource %s..." % os.path.basename(fullPath))
        contentsPath = os.path.join(fullPath, "Contents.json")
        try:
            contents = json.load(open(contentsPath), object_pairs_hook=collections.OrderedDict)
        except Exception as e:
            raise Exception("Error parsing %s: %s" % (contentsPath, e.message))
        images = contents.get('images', [])
        self.watchFile(contentsPath)
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
        self.updateStatus("Packaging resource %s..." % os.path.basename(fullPath))
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
        self.watchFile(fullPath)
        return resource

    def buildFontResource(self, nameComponents, fullPath, mime):
        self.updateStatus("Packaging resource %s..." % os.path.basename(fullPath))
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
        self.watchFile(fullPath)
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

    def targetUsage(self):
        return None

