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
from . import yml
from .image import ImageInfoExtractor
from .font import FontInfoExtractor
from .bundle import Bundle
from .constraints import compileConstraintEquality


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
    stringsFiles = None

    def __init__(self, projectPath, includePaths, outputParentPath, debug=False):
        self.includePaths = [os.path.realpath(path) for path in includePaths]
        self.projectPath = os.path.realpath(projectPath)
        self.outputParentPath = os.path.realpath(outputParentPath)
        self.debug = debug
        self.bundles = dict()
        self.watchedFiles = []
        self.stringsFiles = []

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
        infoName = 'Info.yaml'
        infoPath = os.path.join(projectPath, infoName)
        if os.path.exists(infoPath):
            return infoPath, yml.load(infoPath)
        infoName = 'Info.json'
        infoPath = os.path.join(projectPath, infoName)
        if os.path.exists(infoPath):
            try:
                with open(infoPath) as infofile:
                    return infoPath, json.load(infofile, object_pairs_hook=collections.OrderedDict)
            except Exception as e:
                raise Exception("Error parsing Info.json: %s" % e.message)
        raise Exception("An Info.(json|plist|yaml) file is required to build")


    def setup(self):
        self.mainBundle = Bundle()
        resourcesPath = os.path.join(self.projectPath, "Resources")
        if os.path.exists(resourcesPath):
            self.mainBundle.resourcesPath = resourcesPath
        self.bundles = dict()
        self.infoFile, self.mainBundle.info = Builder.readInfo(self.projectPath)
        self.watchFile(self.infoFile)
        if 'JSBundleIdentifier' not in self.mainBundle.info:
            raise Exception("%s must include an entry for JSBundleIdentifier")
        self.bundles[self.mainBundle.identifier] = self.mainBundle
        self.outputProjectPath = os.path.join(self.outputParentPath, 'builds', self.mainBundle.identifier, self.buildLabel if not self.debug else 'debug')
        if not self.debug and os.path.exists(self.outputProjectPath):
            raise Exception("Output path already exists: %s" % self.outputProjectPath)
        self.includedFrameworks = dict()
        self.includeBundleFrameworks(self.mainBundle)

    def includeBundleFrameworks(self, bundle):
        for frameworkName in bundle.info.get('JSIncludeFrameworks', []):
            self.setupIncludedFramework(frameworkName)

    def setupIncludedFramework(self, frameworkName):
        if frameworkName in self.includedFrameworks:
            return
        self.includedFrameworks[frameworkName] = True
        for path in self.includePaths:
            frameworkPath = os.path.join(path, frameworkName)
            if os.path.exists(frameworkPath) and os.path.isdir(frameworkPath):
                frameworkBundle = Bundle()
                frameworkBundle.name = frameworkName
                infoFile, frameworkBundle.info = Builder.readInfo(frameworkPath)
                self.bundles[frameworkBundle.identifier] = frameworkBundle
                framewordResourcesPath = os.path.join(frameworkPath, 'Resources')
                if os.path.exists(framewordResourcesPath):
                    frameworkBundle.resourcesPath = framewordResourcesPath
                self.includeBundleFrameworks(frameworkBundle)

    def findSpecIncludes(self, obj):
        if isinstance(obj, dict):
            if 'class' in obj:
                path = obj['class'] + '.js'
                for includeDir in self.includePaths:
                    if os.path.exists(os.path.join(includeDir, path)):
                        self.includes.append(path)
            if 'include' in obj:
                v = obj['include']
                if isinstance(v, basestring):
                    includes = [v]
                else:
                    includes = v
                for path in includes:
                    if path[-2:] == "/*":
                        name = path[:-2]
                        for includeDir in self.includePaths:
                            path = os.path.join(includeDir, name)
                            if os.path.exists(path) and os.path.isdir(path):
                                for file in os.listdir(path):
                                    if file[-3:] == '.js':
                                        self.includes.append(u"%s/%s" % (name, file))
                    else:
                        self.includes.append(path)
            for k, v in obj.items():
                if k not in ('class', 'include'):
                    self.findSpecIncludes(v)
        elif isinstance(obj, list):
            for v in obj:
                self.findSpecIncludes(v)

    def compileSpecConstraints(self, obj):
        if isinstance(obj, dict):
            if 'constraints' in obj and 'equalities' in obj['constraints']: 
                refs = dict(self='<self>')
                if 'references' in obj['constraints']:
                    refs.update(obj['constraints']['references'])
                obj['constraints'] = self.compileConstraints(obj['constraints']['equalities'], refs)
            for k, v in obj.items():
                if k not in ('constraints',):
                    self.compileSpecConstraints(v)
        elif isinstance(obj, list):
            for v in obj:
                self.compileSpecConstraints(v)

    def compileConstraints(self, equalities, refs):
        constraints = []
        for eq in equalities:
            constraint = compileConstraintEquality(eq.strip(), refs)
            constraints.append(constraint)
        return constraints

    def buildResources(self):
        for identifier, bundle in self.bundles.items():
            if bundle.resourcesPath is not None:
                self.scanResourceFolder(bundle, bundle.resourcesPath, [])

    def scanResourceFolder(self, bundle, resourcesPath, parentNameComponents):
        self.updateStatus("Building Resources...")
        dirname = os.path.join(resourcesPath, *parentNameComponents)
        localization = None
        if len(parentNameComponents) > 0:
            possibleLang, parentExt = os.path.splitext(parentNameComponents[-1])
            if parentExt == '.lproj':
                localization = possibleLang
        for filename in os.listdir(dirname):
            if filename[0] == '.':
                continue
            fullPath = os.path.join(dirname, filename)
            nameComponents = parentNameComponents + [filename]
            dontcare, ext = os.path.splitext(filename)
            if os.path.isdir(fullPath):
                self.scanResourceFolder(bundle, resourcesPath, nameComponents)
            elif ext == '.json':
                try:
                    with open(fullPath) as jsonfile:
                        obj = json.load(jsonfile, object_pairs_hook=collections.OrderedDict)
                except Exception as e:
                    raise Exception("Error parsing %s: %s" % (fullPath, e.message))
                self.buildJSONLikeResource(bundle, nameComponents, fullPath, obj)
            elif ext == '.plist':
                obj = plistlib.readPlist(fullPath)
                self.buildJSONLikeResource(bundle, nameComponents, fullPath, obj)
            elif ext == '.yaml':
                if localization is not None:
                    self.buildStringsFile(bundle, localization, nameComponents, fullPath)
                else:
                    obj = yml.load(fullPath)
                    self.buildJSONLikeResource(bundle, nameComponents, fullPath, obj)
            else:
                mime, encoding = mimetypes.guess_type(fullPath)
                if mime is None:
                    mime = 'application/octet-stream'
                primary_type, secondary_type = mime.split('/')
                if primary_type == 'image':
                    self.buildImageResource(bundle, nameComponents, fullPath, mime)
                elif (primary_type == 'font' and secondary_type in ('ttf',)) or (primary_type == 'application' and secondary_type in ('x-font-ttf', 'x-font-otf', 'x-font-woff')):
                    self.buildFontResource(bundle, nameComponents, fullPath, mime)
                else:
                    self.buildBinaryResource(bundle, nameComponents, fullPath, mime)

    def buildJSONLikeResource(self, bundle, nameComponents, fullPath, obj):
        metadata = dict(
            value=obj
        )
        if "File's Owner" in obj:
            self.findSpecIncludes(obj)
            # Constraints are a work in progress still on the JS side of things
            # This builder code is in good shape and parses easy-to-write
            # constraint expressions into full constraint objects so the JS
            # doesn't have to do that parsing, but devs don't have to write verbose constraints
            self.compileSpecConstraints(obj)
        self.watchFile(fullPath)
        return bundle.addResource(nameComponents, metadata)

    def buildImageResource(self, bundle, nameComponents, fullPath, mime):
        return self.buildBinaryResource(bundle, nameComponents, fullPath, mime, dict(image=ImageInfoExtractor.for_path(fullPath)))

    def buildFontResource(self, bundle, nameComponents, fullPath, mime):
        return self.buildBinaryResource(bundle, nameComponents, fullPath, mime, dict(font=FontInfoExtractor.for_path(fullPath)))

    def buildBinaryResource(self, bundle, nameComponents, fullPath, mime, extractors=dict()):
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
        return bundle.addResource(nameComponents, metadata)

    def buildStringsFile(self, bundle, localization, nameComponents, fullPath):
        strings = dict()
        obj = yml.load(fullPath)
        top = obj.get(localization, None)
        if top is None:
            raise Exception("Expecting top level key '%s' in '%s'" % (localization, fullPath))

        def walk(node, prefix=u''):
            for x in node:
                if isinstance(node[x], basestring):
                    strings[prefix + x] = node[x]
                elif isinstance(node[x], list) or isinstance(node[x], tuple):
                    strings[prefix + x] = node[x]
                else:
                    walk(node[x], prefix + x + '.')

        walk(top)
        metadata = dict(
            strings=strings
        )
        self.watchFile(fullPath)
        return bundle.addResource(nameComponents, metadata)

    @staticmethod
    def hashOfPath(fullPath):
        h = hashlib.sha1()
        with open(fullPath) as f:
            chunk = f.read(h.block_size)
            while chunk != '':
                h.update(chunk)
                chunk = f.read(h.block_size)
            byte_size = f.tell()
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

    def licenseFilename(self):
        filename = self.mainBundle.info.get('JSLicense', 'LICENSE.txt')
        return filename, os.path.exists(os.path.join(self.projectPath, filename))

    def licenseText(self):
        licenseFilename, exists = self.licenseFilename()
        if os.path.exists(licenseFilename):
            with open(licenseFilename, 'r') as licenseFile:
                return licenseFile.read()
        return ""