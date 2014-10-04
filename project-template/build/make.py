#!/usr/bin/python

import os
import os.path
import sys
import hashlib
import datetime
import xml.dom
import xml.sax
import xml.sax.handler
import plistlib
import shutil
import json
import argparse
import mimetypes
import struct
import re
from collections import namedtuple


class HTMLBuilder(object):
    buildDate = None
    buildID = ""
    buildLabel = ""
    outputRootPath = ""
    outputProductPath = ""
    outputResourcePath = ""
    indexFile = None
    javascriptFile = None
    manifestFile = None
    sourceRootPath = ""
    includePaths = None
    debug = False
    importedScripts = None

    def __init__(self, debug=False):
        super(HTMLBuilder, self).__init__()
        self.debug = debug
        self.buildDate = datetime.datetime.now()
        self.buildID = str(hashlib.md5(self.buildDate.strftime("%Y-%m-%d-%H-%M-%S")).hexdigest())
        self.buildLabel = self.buildDate.strftime("%Y-%m-%d-%H-%M-%S")
        self.outputRootPath = os.path.join('build', 'builds', self.buildLabel if not debug else 'debug')
        self.outputProductPath = os.path.join(self.outputRootPath, self.buildID)
        self.outputResourcePath = os.path.join(self.outputRootPath, "Resources")
        self.sourceRootPath = os.getcwd()
        self.includePaths = ('Frameworks', 'Classes', '.')
        self.importedScripts = {}
        self.watchFiles = []

    def build(self):
        self.watchFiles = []
        self.importedScripts = {}
        self.setup()
        self.buildJavascript()
        self.buildPlists()
        self.buildImages()
        self.buildIndex()
        self.finish()

    def setup(self):
        if os.path.exists(self.outputRootPath):
            if self.debug:
                shutil.rmtree(self.outputRootPath)
            else:
                raise Exception("Output path already exists: %s" % self.outputRootPath)
        os.makedirs(self.outputProductPath)
        self.infoName = 'Info.plist'
        infoPath = os.path.join(self.sourceRootPath, self.infoName)
        if not os.path.exists(infoPath):
            self.infoName = 'Info.json'
            infoPath = os.path.join(self.sourceRootPath, self.infoName)
        self.info = PlistWrapper(infoPath)
        self.manifestFile = open(os.path.join(self.outputRootPath, "manifest.appcache"), 'w')
        self.manifestFile.write("CACHE MANIFEST\n")
        self.manifestFile.write("# build %s\n" % self.buildID)

    def buildJavascript(self):
        self.javascriptFile = open(os.path.join(self.outputProductPath, 'app.js'), 'w')
        self.javascriptFile.write("var JSGlobalObject = window;\n")
        self.javascriptFile.write("var UIRendererInit = function(){ return UIHTMLRenderer.initWithRootElement(document.body); };\n")
        if self.debug:
            self.javascriptFile.write("""(function(head){\n  var includejs = function(src){\n    var s = document.createElement('script');\n    s.type = 'text/javascript';\n    s.src = src;\n    s.async = false;\n    head.appendChild(s);\n  };\n""")
        self._includeJavascript("main.js")
        self.manifestFile.write("%s\n" % _webpath(os.path.relpath(self.javascriptFile.name, self.outputRootPath)))

    def _includeJavascript(self, sourcePath):
        includedSourcePath = None
        for includePath in self.includePaths:
            possiblePath = os.path.join(self.sourceRootPath, includePath, sourcePath)
            if os.path.exists(possiblePath):
                includedSourcePath = possiblePath
                break

        if includedSourcePath:
            if includedSourcePath not in self.importedScripts:
                self.watchFiles.append(includedSourcePath)
                self.importedScripts[includedSourcePath] = True
                scanner = JSScanner(includedSourcePath)
                delayedStack = []
                startedOutput = False
                for line in scanner:
                    if isinstance(line, JSImport):
                        if line.delay:
                            delayedStack.append(line)
                        else:
                            try:
                                if startedOutput:
                                    self.javascriptFile.write("\n")
                                self._includeJavascript(line.path)
                                startedOutput = False
                            except IncludeNotFoundException:
                                print "ERROR: %s, line %d: include not found '%s'.  (include path is '%s')" % (sourcePath, line.sourceLine, line.path, ":".join(self.includePaths))
                                sys.exit(1)
                    elif not self.debug:
                        self.javascriptFile.write(line)
                        startedOutput = True
                if self.debug:
                    relativePath = _webpath(os.path.relpath(includedSourcePath, self.outputRootPath))
                    self.javascriptFile.write("  includejs('%s');" % relativePath)
                    startedOutput = True
                for include in delayedStack:
                    try:
                        if startedOutput:
                            self.javascriptFile.write("\n")
                        self._includeJavascript(include.path)
                        startedOutput = False
                    except IncludeNotFoundException:
                        print "ERROR: %s, line %d: include not found '%s'.  (include path is '%s')" % (sourcePath, include.sourceLine, include.path, ":".join(self.includePaths))
                        sys.exit(1)
                if startedOutput:
                    self.javascriptFile.write("\n")
        else:
            raise IncludeNotFoundException("Include not found: %s; include paths: %s" % (sourcePath, ", ".join(self.includePaths)))

    def buildPlists(self):
        resources = [self.infoName]
        self.javascriptFile.write("JSGlobalObject['_JSBundles'] = {};\n")
        self.javascriptFile.write("JSGlobalObject['_JSBundles']['%s'] = JSGlobalObject['_JSBundles']['__main__'] = {};\n" % self.info['JSApplicationIdentifier'])
        mainUIFile = self.info['JSMainUIDefinitionFile']
        if mainUIFile:
            resources.append(mainUIFile)
        for resourcePath in resources:
            fullPath = os.path.join(self.sourceRootPath, resourcePath)
            if not os.path.exists(fullPath):
                fullPath = os.path.join(self.sourceRootPath, 'Resources', resourcePath)
            if not os.path.exists(fullPath):
                raise Exception("Cannot find resource: %s" % resourcePath)
            self.watchFiles.append(fullPath)
            if fullPath[-5:] == '.json':
                resource = json.load(open(fullPath))
            elif fullPath[-6:] == '.plist':
                resource = plistlib.readPlist(fullPath)
            else:
                raise Exception("Unknown resource type: %s" % resourcePath)
            for k in resource:
                if isinstance(resource[k], dict) and 'JSInclude' in resource[k]:
                    self._includeJavascript(resource[k]['JSInclude'])
            includes = resource['JSIncludes']
            if includes is not None:
                for include in includes:
                    self._includeJavascript(include)
            self.javascriptFile.write("JSGlobalObject['_JSBundles']['__main__']['%s'] = %s;\n" % (resourcePath, json.dumps(resource, indent=self.debug)))
        if self.debug:
            self.javascriptFile.write("})(document.getElementsByTagName('head')[0]);\n")

    def buildImages(self):
        resourcesPath = os.path.join(self.sourceRootPath, "Resources")
        os.makedirs(self.outputResourcePath)
        for (dirname, folders, files) in os.walk(resourcesPath):
            for name in files:
                fullPath = os.path.join(dirname, name)
                resourcePath = os.path.relpath(fullPath, resourcesPath)
                mimeguess = mimetypes.guess_type(fullPath)
                if mimeguess[0] and mimeguess[0].split('/')[0] == 'image':
                    h = hashlib.sha1()
                    f = open(fullPath)
                    chunk = f.read(h.block_size)
                    while chunk != '':
                        h.update(chunk)
                        chunk = f.read(h.block_size)
                    byte_size = f.tell()
                    f.close()
                    h = h.hexdigest()
                    outputPath = os.path.join(self.outputResourcePath, h)
                    shutil.copyfile(fullPath, outputPath)
                    info = {
                        'hash': h,
                        'mimetype': mimeguess[0],
                        'url': _webpath(os.path.relpath(outputPath, self.outputRootPath)),
                        'byte_size': byte_size
                    }
                    extractor = ImageInfoExtractor.for_path(fullPath)
                    extractor.populate_dict(info)
                    self.javascriptFile.write("JSGlobalObject['_JSBundles']['__main__']['%s'] = %s\n" % (resourcePath, info))
                    self.manifestFile.write("%s\n" % info['url'])

    def buildIndex(self):
        self.indexFile = open(os.path.join(self.outputRootPath, 'index.html'), 'w')
        dom = xml.dom.getDOMImplementation()
        doctype = dom.createDocumentType("html", None, None)
        document = dom.createDocument(None, "html", doctype)
        head = document.documentElement.appendChild(document.createElement('head'))
        body = document.documentElement.appendChild(document.createElement('body'))
        title = head.appendChild(document.createElement('title'))
        title.appendChild(document.createTextNode(self.info['JSApplicationTitle'] or ""))
        meta = head.appendChild(document.createElement('meta'))
        meta.setAttribute('http-equiv', 'Content-Type')
        meta.setAttribute('content', 'text/html; charset=utf-8')
        if self.manifestFile:
            document.documentElement.setAttribute('manifest', _webpath(os.path.relpath(self.manifestFile.name, os.path.dirname(self.indexFile.name))))
        if self.javascriptFile:
            relativeJavascriptPath = _webpath(os.path.relpath(self.javascriptFile.name, os.path.dirname(self.indexFile.name)))
            script = head.appendChild(document.createElement('script'))
            script.setAttribute('type', 'text/javascript')
            script.setAttribute('src', relativeJavascriptPath)
            body.setAttribute('onload', 'main()')
        HTML5DocumentSerializer(document).serializeToFile(self.indexFile)

    def finish(self):
        if not self.debug:
            buildsPath = os.path.dirname(self.outputRootPath)
            linkPath = os.path.join(buildsPath, 'latest')
            if os.path.lexists(linkPath):
                os.unlink(linkPath)
            os.symlink(os.path.relpath(self.outputRootPath, os.path.dirname(linkPath)), linkPath)
        self.javascriptFile.close()
        self.javascriptFile = None
        self.indexFile.close()
        self.indexFile = None
        self.info = None


class PlistWrapper(object):

    def __init__(self, path):
        self.plist = plistlib.readPlist(path)

    def __getitem__(self, i):
        try:
            return self.plist[i]
        except KeyError:
            return None


class IncludeNotFoundException(Exception):
    pass


def _webpath(ospath):
    if os.sep != '/':
        return ospath.replace(os.sep, '/')
    return ospath


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


class ImageInfoExtractor(object):

    def populate_dict(self, info):
        pass

    @staticmethod
    def for_path(path):
        f = open(path)
        sig = f.read(8)
        if sig == '\x89\x50\x4E\x47\x0D\x0A\x1A\x0A':
            return PNGInfoExtractor(f)
        elif sig[0:2] == '\xFF\xD8':
            return JPEGInfoExtractor(f)
        elif sig[0:4] == 'II\x2A\x00' or sig[0:4] == 'MM\x00\x2A':
            return TIFFInfoExtractor(f)
        elif sig[0:5] == '<?xml':
            return SVGInfoExtractor(f)
        return ImageInfoExtractor()


class PNGInfoExtractor(ImageInfoExtractor):

    fp = None

    def __init__(self, fp):
        self.fp = fp

    def populate_dict(self, info):
        self.fp.seek(8)
        (datalength, chunk_type, width, height) = struct.unpack('!I4s2I', self.fp.read(16))
        if chunk_type == 'IHDR' and datalength >= 8:
            info['width'] = width
            info['height'] = height


class TIFFInfoExtractor(ImageInfoExtractor):

    fp = None
    tiffoffset = 0
    oder = None

    MAGIC_NUMBER = 42
    WIDTH_TAG_ID = 256
    HEIGHT_TAG_ID = 257
    ENTRY_SIZE = 12
    ENTRY_STRUCT = 'HHII'
    Entry = namedtuple('TIFFIFDEntry', ('tag', 'type', 'count', 'offsetOrValue'))

    def __init__(self, fp):
        self.fp = fp

    def populate_dict(self, info):
        self.fp.seek(0)
        self.tiff_populate_dict(info)

    def tiff_populate_dict(self, info):
        self.tiffoffset = self.fp.tell()
        header = self.fp.read(8)
        if struct.unpack('2s', header[0:2])[0] == 'II':
            self.order = '<'
        else:
            self.order = '>'
        fixed, ifdoffset = struct.unpack(self.order + 'HI', header[2:])
        if fixed == self.MAGIC_NUMBER:
            self.ifd_populate_dict(ifdoffset, info)

    def entry_populate_dict(self, entry, info):
        if entry.tag == self.HEIGHT_TAG_ID:
            info['height'] = entry.offsetOrValue
        elif entry.tag == self.WIDTH_TAG_ID:
            info['width'] = entry.offsetOrValue

    def ifd_populate_dict(self, ifdoffset, info):
        self.fp.seek(self.tiffoffset + ifdoffset)
        entrycount = struct.unpack(self.order + 'H', self.fp.read(2))[0]
        # Go ahead and read all the entries because it's more efficient
        # AND because some entries could cause us to read elsewhere in the file (see JPEG EXIF_IFD_TAG_ID)
        entriesbuff = self.fp.read(entrycount * self.ENTRY_SIZE)
        for buffoffset in range(0, entrycount * self.ENTRY_SIZE, self.ENTRY_SIZE):
            entry = self.Entry._make(struct.unpack(self.order + self.ENTRY_STRUCT, entriesbuff[buffoffset:buffoffset + self.ENTRY_SIZE]))
            self.entry_populate_dict(entry, info)


class JPEGInfoExtractor(TIFFInfoExtractor):

    MARKER_EXIF = '\xE1'
    STAND_ALONES = ('\xD0', '\xD1', '\xD2', '\xD3', '\xD4', '\xD5', '\xD6', '\xD7', '\xD8', '\xD9')
    FRAME_MARKERS = ('\xC0', '\xC1', '\xC2', '\xC3', '\xC5', '\xC6', '\xC7', '\xC8', '\xC9', '\xCA', '\xCB', '\xCD', '\xCE', '\xCF')
    EXIF_IFD_TAG_ID = 34665
    EXIF_WIDTH_TAG_ID = 40962
    EXIF_HEIGHT_TAG_ID = 40963
    FRAME_STRUCT = '!BHH'
    FrameHeader = namedtuple('JPEGFrameHeader', ('P', 'Y', 'X'))

    def __init__(self, fp):
        super(JPEGInfoExtractor, self).__init__(fp)

    def populate_dict(self, info):
        self.fp.seek(2)
        markerinfo = self.fp.read(4)
        # Scan through markers to find EXIF data
        while len(markerinfo) == 4:
            marker, datalength = struct.unpack('!2sH', markerinfo)
            if marker[0] != '\xFF':
                break  # not a marker...we're in the wrong place or the file is corrupt
            if marker[1] == '\x00':
                break  # invalid marker
            if marker[1] == '\xFF':
                # we've landed in a run of filler bytes
                # moving one byte at a time really slow way of finding the next marker, but we probably
                # won't ever hit this when looking for exif, which should be at or near the start
                markerinfo = markerinfo[1:] + self.fp.read(1)
                continue
            if marker[1] in self.STAND_ALONES:
                # Stand-alone marker, doesn't have a datalength field, so what we assumed would be a datalength is really another marker
                markerinfo = markerinfo[2:] + self.fp.read(2)
                continue
            if marker[1] in self.FRAME_MARKERS:
                header = self.FrameHeader._make(struct.unpack(self.FRAME_STRUCT, self.fp.read(5)))
                info['width'] = header.X
                info['height'] = header.Y
                break
                # self.fp.seek(datalength - 7, os.SEEK_CUR)  # minus 7, 2 for datalength and 5 for header data we've already read
            elif marker[1] == self.MARKER_EXIF:
                exifoffset = self.fp.tell()
                exif = self.fp.read(6)
                # TODO: haven't found a spec on this exif identifier sequence, but it apepars to be 'Exif' followed by two null bytes
                # For now we'll check for 'Exif' and then skip the next two bytes
                if exif[0:4] == 'Exif':
                    self.tiff_populate_dict(info)
                self.fp.seek(exifoffset + datalength - 2)
            else:
                self.fp.seek(datalength - 2, os.SEEK_CUR)  # Minus 2 because we already read the datalength, which includes itself
            markerinfo = self.fp.read(4)

    def entry_populate_dict(self, entry, info):
        if entry.tag == self.EXIF_IFD_TAG_ID:
            self.ifd_populate_dict(entry.offsetOrValue, info)
        elif entry.tag == self.EXIF_HEIGHT_TAG_ID:
            info['height'] = entry.offsetOrValue
        elif entry.tag == self.EXIF_WIDTH_TAG_ID:
            info['width'] = entry.offsetOrValue
        else:
            super(JPEGInfoExtractor, self).entry_populate_dict(entry, info)


class SVGInfoExtractor(ImageInfoExtractor, xml.sax.handler.ContentHandler):

    SVGNS = 'http://www.w3.org/2000/svg'

    fp = None
    currentInfo = None

    def __init__(self, fp):
        self.fp = fp

    def populate_dict(self, info):
        self.fp.seek(0)
        self.currentInfo = info
        self.parser = xml.sax.make_parser()
        self.parser.setFeature(xml.sax.handler.feature_namespaces, True)
        self.parser.setFeature(xml.sax.handler.feature_external_ges, False)  # reaaaaly slow with external_ges enabled
        self.parser.setContentHandler(self)
        try:
            self.parser.parse(self.fp)
        except self.StopParser:
            pass

    def startDocument(self):
        pass

    def endDocument(self):
        pass

    def startPrefixMapping(self, prefix, uri):
        pass

    def endPrefixMapping(self, prefix):
        pass

    def startElement(self, name, attrs):
        raise self.StopParser

    def endElement(self, name):
        pass

    def startElementNS(self, name, qname, attrs):
        def svgnumber(s):
            matches = re.match(r'^(.*?)(em|ex|px|in|cm|mm|pt|pc|%)?$', s)
            units = matches.group(2)
            n = matches.group(1)
            matches = re.match(r'(.*?)[eE]([+\-]?[0-9]+)$', n)
            if matches:
                exponent = int(matches.group(2))
                n = matches.group(1)
            else:
                exponent = 0
            if re.match(r'^[+\-]?[0-9]+$', n):
                return int(n) * 10 ** exponent, units
            if re.match(r'^[+\-]?[0-9]*\.[0-9]+$', n):
                return float(n) * 10 ** exponent, units
            return None, None

        def pxlength(n, units):
            if units == 'px' or units == 'pt':
                return n
            if units == 'pc':
                return 12 * n
            if units == 'em':
                return 12 * n
            if units == 'ex':
                return 24 * n
            if units == 'in':
                return 72 * n
            if units == 'cm':
                return 72 * n / 2.54
            if units == 'mm':
                return 72 * n / 25.4

        if name[0] == self.SVGNS and name[1] == 'svg':
            widthkey = (None, 'width')
            heightkey = (None, 'height')
            if widthkey in attrs and heightkey in attrs and attrs[widthkey] and attrs[heightkey]:
                width, wu = svgnumber(attrs[widthkey])
                height, hu = svgnumber(attrs[heightkey])
                if wu and hu and wu != '%' and hu != '%':
                    self.currentInfo['width'] = pxlength(width, wu)
                    self.currentInfo['height'] = pxlength(height, wu)
        raise self.StopParser

    def endElementNS(self, name, qname):
        pass

    def characters(self, content):
        pass

    def ignorableWhitespace(self, whitespace):
        pass

    def processingInstruction(self, target, data):
        pass

    def skippedEntity(self, name):
        pass

    class StopParser(Exception):
        pass


class HTML5DocumentSerializer(object):

    document = None

    VOID_ELEMENTS = ('area', 'base', 'br', 'col', 'command', 'embed', 'hr', 'img', 'input', 'keygen', 'link', 'meta', 'param', 'source', 'track', 'wbr')
    CLOSED_ELEMENTS = ('script', 'style', 'title', 'body')
    RAW_ELEMENTS = ('script', 'style')

    def __init__(self, document):
        super(HTML5DocumentSerializer, self).__init__()
        self.document = document

    def serializeToFile(self, writer):
        self.indent = ""
        self.indentString = "  "
        self.onlyTextChildren = [False]

        def _node(node):
            if node.nodeType == xml.dom.Node.ELEMENT_NODE:
                writer.write("%s<%s" % (self.indent, node.tagName))
                i = 0
                while i < node.attributes.length:
                    _node(node.attributes.item(i))
                    i += 1
                if node.tagName in self.VOID_ELEMENTS:
                    writer.write(">\n")
                else:
                    self.onlyTextChildren.append(True)
                    if node.childNodes.length:
                        writer.write(">")
                        for child in node.childNodes:
                            if child.nodeType not in (xml.dom.Node.TEXT_NODE, xml.dom.Node.ENTITY_NODE):
                                self.onlyTextChildren[-1] = False
                                break
                        if not self.onlyTextChildren[-1]:
                            writer.write("\n")
                            self.indent += self.indentString
                        for child in node.childNodes:
                            _node(child)
                        if not self.onlyTextChildren[-1]:
                            self.indent = self.indent[0:-len(self.indentString)]
                            writer.write("%s</%s>" % (self.indent, node.tagName))
                        else:
                            writer.write("</%s>" % node.tagName)
                    elif node.tagName in self.CLOSED_ELEMENTS:
                        writer.write("></%s>" % node.tagName)
                    else:
                        writer.write("/>")
                    writer.write("\n")
                    self.onlyTextChildren.pop()
            elif node.nodeType == xml.dom.Node.ATTRIBUTE_NODE:
                writer.write(' %s="%s"' % (node.name, node.value.replace("&", "&amp;").replace('"', "&quot;").replace("<", "&lt;").encode('utf-8')))
            elif node.nodeType == xml.dom.Node.TEXT_NODE:
                if not self.onlyTextChildren[-1] and (not node.previousSibling or node.previousSibling.nodeType == xml.dom.Node.ELEMENT_NODE):
                    writer.write(self.indent)
                if node.parentNode.tagName in self.RAW_ELEMENTS:
                    writer.write(node.nodeValue.encode('utf-8'))
                else:
                    writer.write(node.nodeValue.replace("&", "&amp;").replace("<", "&lt;").encode('utf-8'))
                if not self.onlyTextChildren[-1] and (not node.nextSibling or node.nextSibling.nodeType == xml.dom.Node.ELEMENT_NODE):
                    writer.write("\n")
            elif node.nodeType == xml.dom.Node.CDATA_SECTION_NODE:
                pass
            elif node.nodeType == xml.dom.Node.ENTITY_NODE:
                if not self.onlyTextChildren[-1] and (not node.previousSibling or node.previousSibling.nodeType == xml.dom.Node.ELEMENT_NODE):
                    writer.write(self.indent)
                writer.write("&%s;" % node.nodeName)
                if not self.onlyTextChildren[-1] and (not node.nextSibling or node.nextSibling.nodeType == xml.dom.Node.ELEMENT_NODE):
                    writer.write("\n")
            elif node.nodeType == xml.dom.Node.PROCESSING_INSTRUCTION_NODE:
                pass
            elif node.nodeType == xml.dom.Node.COMMENT_NODE:
                pass
            elif node.nodeType == xml.dom.Node.DOCUMENT_NODE:
                _node(node.doctype)
                _node(node.documentElement)
            elif node.nodeType == xml.dom.Node.DOCUMENT_TYPE_NODE:
                writer.write("%s<!DOCTYPE html>\n" % self.indent)
            elif node.nodeType == xml.dom.Node.NOTATION_NODE:
                pass

        _node(self.document)

    def serializeToString(self):
        import StringIO
        writer = StringIO.StringIO()
        self.serializeToFile(writer)
        writer.close()
        return writer.getvalue()


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--debug', action='store_true', help="Do a debug build, which keeps all files separate, making in-browser debugging sane")
    parser.add_argument('--watch', action='store_true', help="Watch for file changes, and rebuild automatically when any change")
    args = parser.parse_args()
    builder = HTMLBuilder(debug=args.debug)
    builder.build()

if __name__ == "__main__":
    main()
