import os.path


class JSFile(object):

    includePaths = None
    importedScriptsByPath = None
    importedScripts = None
    globals_ = None
    features = None

    def __init__(self, fp, includePaths):
        self.fp = fp
        self.name = self.fp.name
        self.includePaths = includePaths
        self.importedScriptsByPath = {}
        self.importedScripts = []
        self.globals_ = []
        self.features = []

    def include(self, sourcePath, output=True):
        includedSourcePath = None
        for includePath in self.includePaths:
            possiblePath = os.path.join(includePath, sourcePath)
            if os.path.exists(possiblePath):
                includedSourcePath = possiblePath
                break

        if includedSourcePath:
            if includedSourcePath not in self.importedScriptsByPath:
                self.importedScriptsByPath[includedSourcePath] = True
                scanner = JSScanner(includedSourcePath)
                startedOutput = False
                for line in scanner:
                    if isinstance(line, JSImport):
                        try:
                            if startedOutput:
                                self.fp.write("\n")
                            self.include(line.path)
                            startedOutput = False
                        except IncludeNotFoundException:
                            raise IncludeNotFoundException("ERROR: %s, line %d: include not found '%s'.  (include path is '%s')" % (sourcePath, line.sourceLine, line.path, ":".join(self.includePaths)))
                    elif isinstance(line, JSGlobal):
                        self.globals_.append(line)
                    elif isinstance(line, JSFeature):
                        self.features.append(line)
                    elif output:
                        self.fp.write(line)
                        startedOutput = True
                self.importedScripts.append(includedSourcePath)
                if startedOutput:
                    self.fp.write("\n")
        else:
            raise IncludeNotFoundException("Include not found: %s; include paths: %s" % (sourcePath, ", ".join(self.includePaths)))

    def write(self, s):
        self.fp.write(s)

    def close(self):
        self.fp.close()


class IncludeNotFoundException(Exception):
    pass


class JSScanner(object):
    file = None
    context = ""
    sourceLine = 0

    CONTEXT_JS = 'js'
    CONTEXT_COMMENT = 'comment'

    def __init__(self, path):
        super(JSScanner, self).__init__()
        self.file = open(path, 'r')
        self.context = self.CONTEXT_JS

    def __iter__(self):
        return self

    def next(self):
        return self.__next__()

    def __next__(self):
        code = ""
        while code == "":
            line = self.file.next()
            self.sourceLine += 1
            if self.context == self.CONTEXT_JS:
                if line[0:10] == "// #import":
                    i = line.find('"')
                    if i >= 0:
                        j = line.find('"', i + 1)
                        if j >= 0:
                            path = line[i + 1:j]
                            delay = line.strip()[-6:] == "/delay"
                            return JSImport(path, delay=delay, sourceLine=self.sourceLine)
                if line[0:11] == "// #global ":
                    objects = [x.strip() for x in line[11:].split(',') if x.strip()]
                    return JSGlobal(objects, sourceLine=self.sourceLine)
                if line[0:12] == "// #feature ":
                    return JSFeature(line[12:].strip(), sourceLine=self.sourceLine)
            while line != "":
                if self.context == self.CONTEXT_JS:
                    i = line.find('//')
                    j = line.find('/*')
                    if i >= 0 and j >= 0:
                        if i < j:
                            code += line[0:i].strip()
                            line = ""
                        else:
                            code += line[0:j].strip()
                            line = line[j + 2:]
                            self.context = self.CONTEXT_COMMENT
                    elif i >= 0:
                        code += line[0:i].strip()
                        line = ""
                    elif j >= 0:
                        code += line[0:j].strip()
                        line = line[j + 2:]
                        self.context = self.CONTEXT_COMMENT
                    else:
                        code += line.strip()
                        line = ""
                elif self.context == self.CONTEXT_COMMENT:
                    i = line.find('*/')
                    if i >= 0:
                        line = line[i + 2:]
                        self.context = self.CONTEXT_JS
                    else:
                        line = ""
        return code


class JSImport(object):
    delay = False
    path = ""
    sourceLine = 0

    def __init__(self, path, delay=False, sourceLine=0):
        super(JSImport, self).__init__()
        self.path = path
        self.delay = delay
        self.sourceLine = sourceLine


class JSFeature(object):
    check = None
    sourceLine = 0

    def __init__(self, check, sourceLine=0):
        self.check = check
        self.sourceLine = sourceLine


class JSGlobal(object):
    objects = None
    sourceLine = 0

    def __init__(self, objects, sourceLine=0):
        self.objects = objects
        self.sourceLine = sourceLine
