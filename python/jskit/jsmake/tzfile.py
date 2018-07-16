#!/usr/bin/python
import sys
import os.path
import struct
import base64
import json
import os
from collections import OrderedDict


class ZoneInfo(object):

    root = None
    zones = None
    map = None

    def __init__(self, root):
        self.root = root
        self.zones = []
        self.map = OrderedDict()

    def readFiles(self):
        self._readFolder([])

    def _readFolder(self, components):
        path = os.path.join(self.root, *components)
        for name in sorted(os.listdir(path)):
            if name in ('+VERSION',) or '.' in name:
                continue 
            childpath = os.path.join(path, name)
            if os.path.isdir(childpath):
                self._readFolder(components + [name])
            else:
                self.parseTzif(components + [name])

    def parseTzif(self, components):
        identifier = '/'.join(components)
        if identifier not in ("GMT", "America/Los_Angeles", "Australia/Sydney"):
            return
        path = os.path.join(self.root, *components)
        sys.stderr.write("Parsing %s\n" % identifier)
        sys.stderr.flush()
        with Tzif(path) as tzif:
            tzif.parse()
            self.zones.append(dict(
                types=tzif.localTimeTypes,
                transitions=tzif.transitionTimes,
                map=tzif.transitionTimeIndexes,
                tz=tzif.tzString,
                rule=tzif.rule
            ))
            self.map[identifier] = dict(index=len(self.zones) - 1)


class Tzif(object):

    path = None
    fp = None
    transitionTimeData = None
    localTimetypeData = None
    designationsData = None
    leapSecondData = None
    standardData = None
    utcData = None
    tzString = None
    transitionTimes = None
    localTimeTypes = None
    designations = None
    rule = None

    def __init__(self, path):
        self.path = path

    def __enter__(self):
        self.fp = open(self.path)
        return self

    def __exit__(self, type, value, tb):
        if self.fp is not None:
            self.fp.close()

    def parse(self):
        data = self.fp.read()
        offset = 0
        bytesPerTransitionTime = 4
        bytesPerLeapSecond = 4
        offset += self.extractBody(data, offset, bytesPerTransitionTime, bytesPerLeapSecond)
        l = len(data)
        if offset < l - 44:
            bytesPerTransitionTime = 8
            bytesPerLeapSecond = 8
            offset += self.extractBody(data, offset, bytesPerTransitionTime, bytesPerLeapSecond)

        # Transition times
        transitionTimeCount = len(self.transitionTimeData) / (bytesPerTransitionTime + 1)
        self.transitionTimes = struct.unpack('!%d%s' % (transitionTimeCount, 'i' if bytesPerTransitionTime == 4 else 'q'), self.transitionTimeData[0:-transitionTimeCount])
        self.transitionTimeIndexes = struct.unpack('!%dB' % transitionTimeCount, self.transitionTimeData[-transitionTimeCount:])

        # Designations
        def readDesignationAtByteIndex(byteIndex):
            designation = ""
            while self.designationsData[byteIndex] != "\x00":
                designation += self.designationsData[byteIndex]
                byteIndex += 1
            return designation

        # Local Time Types
        self.localTimeTypes = []
        offset = 0
        localTimeTypeCount = len(self.localTimetypeData) / 6
        for i in range(localTimeTypeCount):
            utcOffset, isDaylightSavings, designationByteIndex = struct.unpack("!i?B", self.localTimetypeData[offset:offset+6])
            self.localTimeTypes.append(dict(off=utcOffset, dst=isDaylightSavings, abbr=readDesignationAtByteIndex(designationByteIndex)))
            offset += 6

        if self.tzString:
            self.rule = parseRuleFromString(self.tzString)


        # Leap seconds (don't care)

        # Standard/Wall (don't care)

        # UTC/Local (don't care)

    def extractBody(self, data, offset, bytesPerTransitionTime, bytesPerLeapSecond):
        magic, version, reserved, utcCount, standardCount, leapSecondCount, transitionTimeCount, localTimeTypeCount, designationsByteCount = struct.unpack('!4sc15sIIIIII', data[offset:offset+44])
        if magic != 'TZif':
            raise Exception("Invalid magic: %s" % magic)
        if version != '2' and version != '3':
            raise Exception("Invalid version: %s" % version)
        if localTimeTypeCount == 0:
            raise Exception("Local time type count must not be zero")
        offset += 44
        length = transitionTimeCount * bytesPerTransitionTime + transitionTimeCount
        self.transitionTimeData = data[offset:offset+length]
        offset += length
        length = localTimeTypeCount * 6
        self.localTimetypeData = data[offset:offset+length]
        offset += length
        length = designationsByteCount
        self.designationsData = data[offset:offset+length]
        offset += length
        length = leapSecondCount * (4 + bytesPerLeapSecond)
        self.leapSecondData = data[offset:offset+length]
        offset += length
        length = standardCount
        self.standardData = data[offset:offset+length]
        offset += length
        length = utcCount
        self.utcData = data[offset:offset+length]
        offset += length
        l = len(data)
        if offset < l:
            if data[offset] == "\n":
                offset += 1
                self.tzString = ""
                while offset < l and data[offset] != "\n":
                    self.tzString += data[offset]
                    offset += 1
                if data[offset] != "\n":
                    raise Exception("Expecting newline")
                offset += 1
        return offset


def parseRuleFromString(tzstr):
    print "parsing: %s" % tzstr
    try:
        # Assuming we are dealing with well-formed strings from tzif files, so not 
        # much checking for incorrect formatting
        offset = [0]
        l = len(tzstr)
        def parseAbbr():
            abbr = ''
            if tzstr[offset[0]] == '<':
                offset[0] += 1 
                while offset[0] < l and tz[offset[0]] != '>':
                    abbr += tzstr[offset[0]]
                    offset[0] += 1
                if offset[0] < l:
                    offset[0] += 1
            else:
                while offset[0] < l and ((tzstr[offset[0]] >= 'a' and tzstr[offset[0]] <= 'z') or (tzstr[offset[0]] >= 'A' and tzstr[offset[0]] <= 'Z')):
                    abbr += tzstr[offset[0]]
                    offset[0] += 1
            return abbr
        def parseOffset():
            h = 0
            m = 0
            s = 0
            factor = -1
            if tzstr[offset[0]] == '-':
                factor = 1
                offset[0] += 1 
            elif tzstr[offset[0]] == '+':
                offset[0] += 1
            h = parseInteger()
            if offset[0] < l and tzstr[offset[0]] == ':':
                m = parseInteger()
                if offset[0] < l and tzstr[offset[0]] == ':':
                    s = parseInteger()
            return factor * h * 3600 + m * 60 + s
        def parseInteger():
            intstr = ''
            while offset[0] < l and tzstr[offset[0]] >= '0' and tzstr[offset[0]] <= '9':
                intstr += tzstr[offset[0]]
                offset[0] += 1
            return int(intstr)
        def parseRule():
            rule = dict()
            if tzstr[offset[0]] == 'J':
                offset[0] += 1
                rule['day1'] = parseInteger()
            elif tzstr[offset[0]] == 'M':
                offset[0] += 1
                rule['month'] = parseInteger()
                offset[0] += 1
                rule['week'] = parseInteger()
                offset[0] += 1
                rule['dow'] = parseInteger()
            else:
                offset[0] += 1
                rule['day0'] = parseInteger()
            t = 2 * 3600
            if offset[0] < l and tzstr[offset[0]] == '/':
                offset[0] += 1
                t = -parseOffset()
            rule['time'] = t
            return rule
        standardAbbr = parseAbbr()
        standardOffset = parseOffset()
        if offset[0] < l:
            daylightAbbr = parseAbbr()
            if offset[0] < l and tzstr[offset[0]] != ',':
                daylightOffset = parseOffset()
            else:
                daylightOffset = standardOffset + 3600
            fromStandard = None
            toStandard = None
            if offset[0] < l and tzstr[offset[0]] == ',':
                offset[0] += 1
                fromStandard = parseRule()
                offset[0] += 1
                toStandard = parseRule()
                # TODO: Version 3 if DST is the whole year
                isFullYearDST = False
                if isFullYearDST:
                    return dict(
                        daylight=dict(abbr=daylightAbbr, off=daylightOffset, dst=True)
                    )
            return dict(
                standard=dict(abbr=standardAbbr, off=standardOffset, dst=False),
                daylight=dict(abbr=daylightAbbr, off=daylightOffset, dst=True),
                fromStandard=fromStandard,
                toStandard=toStandard
            )
        return dict(
            standard=dict(abbr=standardAbbr, off=standardOffset, dst=False)
        )
    except Exception as e:
        print "Exception at offset %d" % offset[0]
        raise


def main():
    root = sys.argv[1] if len(sys.argv) > 1 else '/usr/share/zoneinfo'
    info = ZoneInfo(root)
    info.readFiles()
    json.dump(OrderedDict(map=info.map, zones=info.zones), sys.stdout, indent=1)


if __name__ == "__main__":
    main()