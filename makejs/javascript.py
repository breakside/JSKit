import os.path
import json
import tempfile


class JSCompilation(object):

    includePaths = None
    importedScriptsByPath = None
    globals_ = None
    features = None
    minify = True
    outfiles = None
    testfiles = None

    def __init__(self, includePaths, context=None, minify=True):
        if context is None:
            self.context = {}
        else:
            self.context = context
        self.minify = minify
        self.includePaths = includePaths
        self.importedScriptsByPath = {}
        self.features = []
        self.outfiles = []
        self.testfiles = []
        self.outfile = None

    def include(self, source, sourceName=None):
        if isinstance(source, basestring):
            self._includePath(source)
        else:
            source.seek(0)
            self._includeFilePointer(source, sourceName=sourceName)

    def _includePath(self, sourcePath):
        includedSourcePath = None
        for includePath in self.includePaths:
            possiblePath = os.path.join(includePath, sourcePath)
            if os.path.exists(possiblePath):
                includedSourcePath = possiblePath
                break
        if includedSourcePath:
            if includedSourcePath not in self.importedScriptsByPath:
                self.importedScriptsByPath[includedSourcePath] = True
                self._includeFilePointer(open(includedSourcePath, 'r'), sourceName=sourcePath)
        else:
            raise IncludeNotFoundException("Include not found: %s; include paths: %s" % (sourcePath, ", ".join(self.includePaths)))

    def _includeFilePointer(self, fp, sourceName=None):
        scanner = JSScanner(fp, sourceName, minify=self.minify)
        fileOutputStarted = False
        fileIsStrict = False
        tests = []
        if self.minify and not self.outfile:
            self._newOutfile()
        for line in scanner:
            if isinstance(line, JSImport):
                try:
                    if fileOutputStarted:
                        self.outfile.write("\n")
                    self._includePath(line.path)
                    fileOutputStarted = False
                except IncludeNotFoundException:
                    raise Exception("ERROR: %s, line %d: include not found '%s'.  (include path is '%s')" % (sourceName if sourceName is not None else '(no file)', line.sourceLine, line.path, ":".join(self.includePaths)))
            elif isinstance(line, JSFeature):
                self.features.append(line)
            elif isinstance(line, JSTest):
                test = line
                tests.append(test)
            elif isinstance(line, JSTestCode):
                test.lines.append(line)
            elif self.minify:
                if isinstance(line, JSStrict):
                    fileIsStrict = True
                    if not self.outfile.started:
                        self.outfile.is_strict = True
                        self.outfile.write("'use strict';\n")
                    elif not self.outfile.is_strict:
                        self._newOutfile()
                        self.outfile.is_strict = True
                        self.outfile.write("'use strict';\n")
                else:
                    if not fileIsStrict and self.outfile.is_strict:
                        self._newOutfile()
                    self.outfile.write(line)
                    fileOutputStarted = True
        if not self.minify:
            self.outfiles.append(JSCompilationOutfile(fp=fp, name=sourceName, locked=True))
        if fileOutputStarted:
            self.outfile.write("\n")
        # if len(tests):
            # TODO: write tests to another file
            # keep track of that file so it can be included in the test suite
            # testfileName = sourceName + u'_tests'
            # testfile = None
            # self.testfiles.append(testfile)
            # i = 1
            # for test in tests:
            #     testName = testfileName + "_" + i
            #     i += 1

    def _newOutfile(self):
        self.outfile = JSCompilationOutfile(fp=tempfile.NamedTemporaryFile())
        self.outfiles.append(self.outfile)

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
    is_strict = False
    name = None
    fp = None
    started = False

    def __init__(self, fp=None, name=None, locked=False):
        self.fp = fp
        self.name = name

    def write(self, data):
        self.started = True
        self.fp.write(data)


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
    CONTEXT_TEST = 'test'

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
                    command, arguments = cstripped.split(" ", 1)
                    command = command[1:]
                    arguments = arguments.strip()
            if self.context == self.CONTEXT_TEST:
                if command is not None:
                    if command in ('assert', 'assert.throw', 'assert.nothrow'):
                        return JSTestCode(arguments, assert_=command)
                    raise Exception(u"Unknown test command '%u' in %u at %d", command, sourceName, self.sourceLine)
                if lstripped[0:2] == "//":
                    return JSTestCode(lstripped[2:], sourceLine=self.sourceLine, rawline=line)
                self.context = self.CONTEXT_JS
            if self.context == self.CONTEXT_JS:
                if command == "import":
                    i = arguments.find('"')
                    if i >= 0:
                        j = arguments.find('"', i + 1)
                        if j >= 0:
                            path = arguments[i + 1:j]
                            return JSImport(path, sourceLine=self.sourceLine, rawline=line)
                if command == "feature":
                    return JSFeature(arguments, sourceLine=self.sourceLine, rawline=line)
                if command == "var":
                    return JSVar(arguments, sourceLine=self.sourceLine, indent=line[0:len(line) - len(lstripped)])
                if command == "test":
                    self.context = self.CONTEXT_TEST
                    return JSTest(arguments, sourceLine=self.sourceLine, rawline=line)
                if stripped == '"use strict";' or stripped == "'use strict';":
                    return JSStrict(sourceLine=self.sourceLine, rawline=line)
            if not self.minify:
                return line
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
    rawline = ""

    def __init__(self, path, delay=False, sourceLine=0, rawline=""):
        super(JSImport, self).__init__()
        self.path = path
        self.delay = delay
        self.sourceLine = sourceLine
        self.rawline = rawline


class JSFeature(object):
    check = None
    sourceLine = 0
    rawline = ""

    def __init__(self, check, sourceLine=0, rawline=""):
        self.check = check
        self.sourceLine = sourceLine
        self.rawline = rawline


class JSTest(object):
    name = None
    sourceLine = 0
    rawline = ""
    lines = None

    def __init__(self, name, sourceLine=0, rawline=""):
        self.name = name
        self.sourceLine = sourceLine
        self.rawline = rawline
        self.lines = []


class JSTestCode(object):
    code = None
    sourceLine = 0
    rawline = ""
    assert_ = None

    def __init__(self, code, sourceLine=0, rawline="", assert_=None):
        self.code = code
        self.sourceLine = sourceLine
        self.rawline = rawline
        self.assert_ = assert_


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
