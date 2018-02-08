import argparse
import hashlib
import os.path


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument(u'--debug', action=u'store_true', help=u"Do a debug build, which keeps all files separate, making in-browser debugging sane")
    parser.add_argument(u'--watch', action=u'store_true', help=u"Watch for file changes, and rebuild automatically when any change")
    parser.add_argument(u'--kind', default=None, help=u"What kind of project to build")
    parser.add_argument(u'--output-dir', default=u'.', help=u"Where to put the build output")
    parser.add_argument(u'--include-dir', default=[], action='append')
    parser.add_argument(u'project', default=u'.')
    args, unknown = parser.parse_known_args()
    kind = args.kind
    if kind is None:
        kind = determine_kind(args.project)
    if kind == u'html':
        from .html import HTMLBuilder
        builderClass = HTMLBuilder
    elif kind == u'framework':
        from .framework import FrameworkBuilder
        builderClass = FrameworkBuilder
    elif kind == u'tests':
        from .tests import TestsBuilder
        builderClass = TestsBuilder
    else:
        raise Exception(u"Unsupported build type: %u" % args.kind)
    builder = builderClass(projectPath=args.project, includePaths=args.include_dir, outputParentPath=args.output_dir, debug=args.debug, args=unknown)
    builder.run(watch=args.debug and args.watch)

def determine_kind(project):
    from .builder import Builder
    infofile, info = Builder.readInfo(project)
    if 'JSBundleType' not in info:
        raise Exception("JSBundleType is required in Info to build without --kind flag")
    return info['JSBundleType']
