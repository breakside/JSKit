import os
import os.path
import shutil
import sys
import argparse
import pkg_resources


class Path(object):

    root = u""

    def __init__(self, root):
        self.root = root

    def __call__(self, *args):
        return os.path.join(self.root, *args)


class ProjectBuilder(object):

    name = None
    template = None

    def __init__(self, name, template):
        self.name = name
        self.template = template

    def build(self):
        template = Path(os.path.realpath(self.template))
        project = Path(os.path.join(os.getcwd(), self.name))

        if os.path.exists(project.root):
            raise Exception(u"Output path already exists: %u" % project.root)

        shutil.copytree(
            template.root,
            project.root
        )

        # TODO: walk files and replace ${} in filenames and in content


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument(u'name', help=u'The name for the new project')
    parser.add_argument(u'--template', default=u'HTML Application', help=u"The project template to use")
    args = parser.parse_args()
    builder = ProjectBuilder(args.name, args.template)
    builder.build()
