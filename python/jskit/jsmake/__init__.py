import argparse
import datetime
import hashlib
import os.path


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument(u'--debug', action=u'store_true', help=u"Do a debug build, which keeps all files separate, making in-browser debugging sane")
    parser.add_argument(u'--watch', action=u'store_true', help=u"Watch for file changes, and rebuild automatically when any change")
    parser.add_argument(u'--kind', default=u'html', help=u"What kind of project to build")
    parser.add_argument(u'--output-dir', default=u'.', help=u"Where to put the build output")
    parser.add_argument(u'--include-dir', default=[], action='append')
    parser.add_argument(u'project', default=u'.')
    args, unknown = parser.parse_known_args()
    buildDate = datetime.datetime.now()
    buildID = unicode(hashlib.md5(buildDate.strftime(u"%Y-%m-%d-%H-%M-%S")).hexdigest())
    buildLabel = unicode(buildDate.strftime(u"%Y-%m-%d-%H-%M-%S"))
    if args.kind == u'html':
        from .html import HTMLBuilder
        builderClass = HTMLBuilder
    elif args.kind == u'framework':
        from .framework import FrameworkBuilder
        builderClass = FrameworkBuilder
    elif args.kind == u'tests':
        from .tests import TestsBuilder
        builderClass = TestsBuilder
    else:
        raise Exception(u"Unsupported build type: %u" % args.kind)
    builder = builderClass(projectPath=args.project, includePaths=args.include_dir, outputParentPath=args.output_dir, buildID=buildID, buildLabel=buildLabel, debug=args.debug, args=unknown)
    builder.build()