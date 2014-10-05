import argparse
import datetime
import hashlib
import os.path


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--debug', action='store_true', help="Do a debug build, which keeps all files separate, making in-browser debugging sane")
    parser.add_argument('--watch', action='store_true', help="Watch for file changes, and rebuild automatically when any change")
    args = parser.parse_args()
    kind = 'html'  # TODO: support other kinds and get from args
    buildDate = datetime.datetime.now()
    buildID = str(hashlib.md5(buildDate.strftime("%Y-%m-%d-%H-%M-%S")).hexdigest())
    buildLabel = buildDate.strftime("%Y-%m-%d-%H-%M-%S")
    outputRootPath = os.path.join('builds', buildLabel if not args.debug else 'debug')
    if kind == 'html':
        from .html import HTMLBuilder
        builder = HTMLBuilder(buildID=buildID, buildLabel=buildLabel, outputRootPath=outputRootPath, debug=args.debug)
        builder.build()
    else:
        raise Exception("Unsupported build type: %s" % kind)

if __name__ == "__main__":
    main()
