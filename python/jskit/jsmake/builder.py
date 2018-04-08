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
from .bundle import Bundle


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
        self.mainBundle = Bundle()
        self.bundles = dict()
        self.infoFile, self.mainBundle.info = Builder.readInfo(self.projectPath)
        self.watchFile(self.infoFile)
        if 'JSBundleIdentifier' not in self.mainBundle.info:
            raise Exception("%s must include an entry for JSBundleIdentifier")
        self.bundles[self.mainBundle.info['JSBundleIdentifier']] = self.mainBundle
        self.outputProjectPath = os.path.join(self.outputParentPath, 'builds', self.mainBundle.info['JSBundleIdentifier'], self.buildLabel if not self.debug else 'debug')
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
            if filename[0] == '.':
                continue
            fullPath = os.path.join(dirname, filename)
            nameComponents = parentNameComponents + [filename]
            dontcare, ext = os.path.splitext(filename)
            if os.path.isdir(fullPath):
                self.scanResourceFolder(resourcesPath, nameComponents)
            elif ext == '.json':
                try:
                    obj = json.load(open(fullPath), object_pairs_hook=collections.OrderedDict)
                except Exception as e:
                    raise Exception("Error parsing %s: %s" % (fullPath, e.message))
                self.buildJSONLikeResource(nameComponents, fullPath, obj)
            elif ext == '.plist':
                obj = plistlib.readPlist(fullPath)
                self.buildJSONLikeResource(nameComponents, fullPath, obj)
            else:
                mime, encoding = mimetypes.guess_type(fullPath)
                if mime is None:
                    mime = 'application/octet-stream'
                primary_type, secondary_type = mime.split('/')
                if primary_type == 'image':
                    self.buildImageResource(nameComponents, fullPath, mime)
                elif primary_type == 'application' and secondary_type in ('x-font-ttf', 'x-font-otf', 'x-font-woff'):
                    self.buildFontResource(nameComponents, fullPath, mime)
                else:
                    self.buildBinaryResource(nameComponents, fullPath, mime)

    def buildJSONLikeResource(self, nameComponents, fullPath, obj):
        metadata = dict(
            value=obj
        )
        self.watchFile(fullPath)
        return self.mainBundle.addResource(nameComponents, metadata)

    def buildImageResource(self, nameComponents, fullPath, mime):
        return self.buildBinaryResource(nameComponents, fullPath, mime, dict(image=ImageInfoExtractor.for_path(fullPath)))

    def buildFontResource(self, nameComponents, fullPath, mime):
        return self.buildBinaryResource(nameComponents, fullPath, mime, dict(font=FontInfoExtractor.for_path(fullPath)))

    def buildBinaryResource(self, nameComponents, fullPath, mime, extractors=dict()):
        self.updateStatus("Packaging resource %s..." % os.path.basename(fullPath))
        hash_, byte_size = self.hashOfPath(fullPath)
        metadata = dict(
            hash=hash_,
            mimetype=mime,
            byte_size=byte_size,
        )
        for k in extractors:
            info = dict()
            extractor = extractors[k]
            extractor.populate_dict(info)
            metadata[k] = info
        self.watchFile(fullPath)
        return self.mainBundle.addResource(nameComponents, metadata)

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

    def targetUsage(self):
        return None

