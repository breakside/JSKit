import argparse
import datetime
import hashlib
import os.path


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument(u'--debug', action=u'store_true', help=u"Do a debug build, which keeps all files separate, making in-browser debugging sane")
    parser.add_argument(u'--watch', action=u'store_true', help=u"Watch for file changes, and rebuild automatically when any change")
    parser.add_argument(u'--kind', default=u'html', help=u"What kind of project to build")
    args = parser.parse_args()
    buildDate = datetime.datetime.now()
    buildID = unicode(hashlib.md5(buildDate.strftime(u"%Y-%m-%d-%H-%M-%S")).hexdigest())
    buildLabel = unicode(buildDate.strftime(u"%Y-%m-%d-%H-%M-%S"))
    outputRootPath = os.path.join(u'builds', buildLabel if not args.debug else u'debug')
    if args.kind == u'html':
        from .html import HTMLBuilder
        builder = HTMLBuilder(buildID=buildID, buildLabel=buildLabel, outputRootPath=outputRootPath, debug=args.debug)
        builder.build()
    elif args.kind == u'framework':
        from .framework import FrameworkBuilder
        builder = FrameworkBuilder(buildID=buildID, buildLabel=buildLabel, outputRootPath=outputRootPath, debug=args.debug)
        builder.build()
    else:
        raise Exception(u"Unsupported build type: %u" % args.kind)

if __name__ == "__main__":
    main()
