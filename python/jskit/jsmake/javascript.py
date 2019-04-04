import os.path
import json
import tempfile


class JSCompilation(object):
    
    outfiles = None
    features = None
    testfiles = None

    includePaths = None
    minify = True
    combine = True
    importedScriptsByPath = None
    outfilesByName = None
    weakIncludes = None
    includeAliases = None
    precombiledOutfileIndex = 0

    def __init__(self, includePaths, minify=True, combine=True):
        self.includePaths = includePaths
        self.minify = minify or combine
        self.combine = combine
        self.importedScriptsByPath = {}
        self.features = []
        self.outfiles = []
        self.testfiles = []
        self.currentOutfile = None
        self.outfilesByName = {}
        self.weakIncludes = []
        self.includeAliases = {}

    def importedScriptPaths(self):
        return self.importedScriptsByPath.keys()

    def setImportedScriptPaths(self, paths):
        for path in paths:
            self.importedScriptsByPath[path] = True

    def writeComment(self, comment):
        if not self.combine:
            return
        if not self.currentOutfile:
            self.startNewCombinedOutfile('comment')
        lines = comment.split("\n")
        for line in lines:
            self.currentOutfile.write("// %s\n" % line.encode('utf-8'))

    def include(self, source, sourceName=None):
        if isinstance(source, basestring):
            self.includePath(source)
        else:
            source.seek(0)
            self.includeFilePointer(source, sourceName=sourceName)

    def resolveIncludePath(self, sourcePath):
        for includePath in self.includePaths:
            possiblePath = os.path.join(includePath, sourcePath)
            if os.path.exists(possiblePath):
                realPath = os.path.realpath(possiblePath)[-len(sourcePath):]
                if realPath != sourcePath:
                    raise Exception("Case mismatch for include: %s, should be: %s" % (sourcePath, realPath))
                return possiblePath
            possiblePath = os.path.join(includePath, "DOM", sourcePath)
            if os.path.exists(possiblePath):
                realPath = os.path.realpath(possiblePath)[-len(sourcePath):]
                if realPath != sourcePath:
                    raise Exception("Case mismatch for include: %s, should be: %s" % (sourcePath, realPath))
                return possiblePath
        possibleAlias = os.path.dirname(sourcePath)
        if possibleAlias in self.includeAliases:
            possiblePath = os.path.join(self.includeAliases[possibleAlias], os.path.basename(sourcePath))
            if os.path.exists(possiblePath):
                realPath = os.path.realpath(possiblePath)[-len(sourcePath):]
                if realPath != sourcePath:
                    raise Exception("Case mismatch for include: %s, should be: %s" % (sourcePath, realPath))
                return possiblePath
        return None

    def includePath(self, sourcePath, weak=False):
        includedSourcePath = self.resolveIncludePath(sourcePath)
        if includedSourcePath:
            if includedSourcePath not in self.importedScriptsByPath:
                self.importedScriptsByPath[includedSourcePath] = True
                with open(includedSourcePath, 'r') as jsfile:
                    self.includeFilePointer(jsfile, sourceName=sourcePath, weak=weak)
        else:
            raise IncludeNotFoundException("Include not found: %s; include paths: %s" % (sourcePath, ", ".join(self.includePaths)))

    def includeFilePointer(self, fp, sourceName=None, weak=False):
        if self.combine and not self.currentOutfile:
            self.startNewCombinedOutfile(fp.name + ' top')
        scanner = JSScanner(fp, sourceName, minify=self.minify)
        combinedFileOutputStarted = False
        fileIsStrict = False
        tests = []
        precompiled = False
        for line in scanner:
            if isinstance(line, JSImport):
                try:
                    if combinedFileOutputStarted:
                        self.currentOutfile.write("\n")
                    weakInclude = os.path.dirname(line.path) in self.weakIncludes
                    if not weak and weakInclude:
                        includedSourcePath = self.resolveIncludePath(line.path)
                        if includedSourcePath not in self.importedScriptsByPath:
                            self.currentOutfile.write(line.rawline)
                    # print "%s includes %s" % (sourceName, line.path)
                    self.includePath(line.path, weak=weakInclude)
                    combinedFileOutputStarted = False
                except IncludeNotFoundException:
                    raise Exception("ERROR: %s, line %d: include not found '%s'.  (include path is '%s')" % (sourceName if sourceName is not None else '(no file)', line.sourceLine, line.path, ":".join(self.includePaths)))
            elif isinstance(line, JSFeature):
                self.features.append(line)
            elif isinstance(line, JSPrecompiled):
                precompiled = True
            elif not precompiled and not weak:
                if self.combine:
                    if isinstance(line, JSStrict):
                        fileIsStrict = True
                        if self.currentOutfile.isStrictDetermined and not self.currentOutfile.isStrict:
                            self.startNewCombinedOutfile(fp.name + ' strict')
                        if not self.currentOutfile.isStrictDetermined:
                            self.currentOutfile.isStrict = True
                            self.currentOutfile.isStrictDetermined = True
                            self.currentOutfile.write("'use strict';\n")
                    else:
                        if self.currentOutfile.isStrictDetermined and self.currentOutfile.isStrict and not fileIsStrict:
                            self.startNewCombinedOutfile(fp.name + ' not strict')
                        if not self.currentOutfile.isStrictDetermined:
                            self.currentOutfile.isStrict = False
                            self.currentOutfile.isStrictDetermined = True
                        self.currentOutfile.write(line)
                        combinedFileOutputStarted = True
                elif self.minify:
                    if sourceName not in self.outfilesByName:
                        self.outfilesByName[sourceName] = JSCompilationOutfile(fp=tempfile.NamedTemporaryFile(), name=sourceName)
                        self.outfiles.append(self.outfilesByName[sourceName])
                    self.outfilesByName[sourceName].write(line)
        if not weak:
            if precompiled:
                outfile = JSCompilationOutfile(fp=fp, name=sourceName, locked=True)
                self.outfiles.insert(self.precombiledOutfileIndex, outfile)
                self.precombiledOutfileIndex += 1
            elif self.combine:
                if combinedFileOutputStarted:
                    self.currentOutfile.write("\n")
            else:
                self.outfiles.append(JSCompilationOutfile(fp=fp, name=sourceName, locked=True))

    def startNewCombinedOutfile(self, debugName):
        self.currentOutfile = JSCompilationOutfile(fp=tempfile.NamedTemporaryFile())
        self.outfiles.append(self.currentOutfile)
        if self.combine or self.minify:
            self.currentOutfile.write("// #precompiled\n\n")


    @staticmethod
    def preprocess(jsstr, context):
        from StringIO import StringIO
        infile = StringIO(jsstr)
        outfile = StringIO()
        scanner = JSScanner(infile, minify=False)
        for line in scanner:
            if isinstance(line, JSVar):
                outfile.write('%svar %s = %s;\n' % (line.indent, line.name, json.dumps(context.get(line.name, None), indent=True)))
            elif hasattr(line, 'rawline'):
                outfile.write(line.rawline)
            else:
                outfile.write(line)
        return outfile.getvalue()


class JSCompilationOutfile(object):
    isStrictDetermined = False
    isStrict = False
    name = None
    fp = None
    maxLineLength = 4096
    currentLineLength = 0

    def __init__(self, fp=None, name=None, locked=False):
        self.fp = fp
        self.name = name
        filename = fp.name

    def write(self, data):
        if self.currentLineLength > 0 and self.currentLineLength + len(data) > self.maxLineLength:
            self.fp.write("\n")
            self.currentLineLength = 0;
        self.fp.write(data)
        self.currentLineLength += len(data)
        if data[-1] == "\n":
            self.currentLineLength = 0


class IncludeNotFoundException(Exception):
    pass


class JSScanner(object):
    file = None
    context = ""
    sourceName = None
    sourceLine = 0
    minify = True

    CONTEXT_JS = 'js'
    CONTEXT_COMMENT = 'comment'

    def __init__(self, fp, sourceName=None, minify=True):
        super(JSScanner, self).__init__()
        self.file = fp
        self.sourceName = sourceName
        self.minify = minify
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
            lstripped = line.lstrip()
            stripped = line.strip()
            cstripped = None
            command = None
            arguments = None
            if lstripped[0:2] == "//":
                cstripped = lstripped[2:].strip()
                if cstripped[0:1] == "#":
                    if ' ' in cstripped:
                        command, arguments = cstripped.split(" ", 1)
                    else:
                        command = cstripped
                        arguments = ""
                    command = command[1:]
                    arguments = arguments.strip()
            if self.context == self.CONTEXT_JS:
                if command == "precompiled":
                    self.minify = False
                    return JSPrecompiled(rawline=line)
                if command == "import":
                    i = arguments.find('"')
                    if i >= 0:
                        j = arguments.find('"', i + 1)
                        if j >= 0:
                            path = arguments[i + 1:j]
                            return JSImport(path, sourceLine=self.sourceLine, rawline=line)
                    # new build system imports frameworks by name without quotes
                    # hack to stay compatible with new files
                    path = "%s/%s.js" % (arguments, arguments)
                    return JSImport(path, sourceLine=self.sourceLine, rawline=line)
                    # raise Exception("Invalid #import in %s at %d" % (command, self.sourceName, self.sourceLine))
                if command == "feature":
                    return JSFeature(arguments, sourceLine=self.sourceLine, rawline=line)
                if command == "var":
                    return JSVar(arguments, sourceLine=self.sourceLine, indent=line[0:len(line) - len(lstripped)])
                if command is not None:
                    raise Exception(u"Unknown command '%s' in %s at %d" % (command, self.sourceName, self.sourceLine))
                if stripped == '"use strict";' or stripped == "'use strict';":
                    return JSStrict(sourceLine=self.sourceLine, rawline=line)
            if not self.minify:
                return line
            if len(stripped) > 0 and stripped[-1] == '\\':
                return line
            while line != "":
                if self.context == self.CONTEXT_JS:
                    i = line.find('//')
                    j = line.find('/*')
                    while i >= 0 and in_string_literal(line, i):
                        i = line.find('//', i + 1)
                    while j >= 0 and in_string_literal(line, j):
                        j = line.find('/*', j + 1)
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


def in_string_literal(line, pos):
    in_literal = False
    delimiter = ''
    skip = False
    for i in range(pos):
        if skip:
            skip = False
            continue
        c = line[i]
        if in_literal:
            if c == '\\':
                skip = True
            elif c == delimiter:
                in_literal = False
        else:
            if c == '"':
                in_literal = True
                delimiter = c
            elif c == "'":
                in_literal = True
                delimiter = c
    return in_literal


class JSImport(object):
    delay = False
    path = ""
    sourceLine = 0
    rawline = ""

    def __init__(self, path, delay=False, sourceLine=0, rawline=""):
        super(JSImport, self).__init__()
        self.path = path
        self.delay = delay
        self.sourceLine = sourceLine
        self.rawline = rawline


class JSPrecompiled(object):
    rawline = ""
    
    def __init__(self, rawline=""):
        self.rawline = rawline


class JSFeature(object):
    check = None
    sourceLine = 0
    rawline = ""

    def __init__(self, check, sourceLine=0, rawline=""):
        self.check = check
        self.sourceLine = sourceLine
        self.rawline = rawline


class JSVar(object):
    name = None
    sourceLine = 0
    indent = ''

    def __init__(self, name, sourceLine=0, indent=''):
        self.name = name
        self.sourceLine = sourceLine
        self.indent = indent


class JSStrict(object):
    sourceLine = None
    rawline = ""

    def __init__(self, sourceLine=0, rawline=""):
        self.sourceLine = sourceLine
        self.rawline = rawline
