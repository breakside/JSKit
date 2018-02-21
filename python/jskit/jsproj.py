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


def filesafe_name(name):
    return name.replace('\\', '').replace('/', '').replace(':', '').replace('\'', '').replace('"', '').replace('`', '').replace('.', '_')


class ProjectBuilder(object):

    name = None
    template = None
    placeholders = None

    def __init__(self, name, template):
        self.name = name
        self.template = template
        self.placeholders = dict(
            PROJECT_NAME=self.name,
            PROJECT_NAME_FILE_SAFE=filesafe_name(self.name),
        )

    def build(self):
        template = Path(os.path.realpath(self.template))
        project = Path(os.path.join(os.getcwd(), self.name))

        if os.path.exists(project.root):
            raise Exception(u"Output path already exists: %s" % project.root)

        shutil.copytree(
            template.root,
            project.root
        )

        self.fill_placeholders(project.root)

    def fill_placeholders(self, path):
        for child in os.listdir(path):
            if child not in ('..', '.'):
                childpath = os.path.join(path, child)
                if os.path.isdir(childpath):
                    self.fill_placeholders(childpath)
                else:
                    fp = open(childpath, 'r')
                    contents = fp.read()
                    fp.close()
                    contents_changed = False
                    for name, value in self.placeholders.items():
                        placeholder = '${' + name + '}'
                        if placeholder in contents:
                            contents_changed = True
                            contents = contents.replace(placeholder, value)
                    if contents_changed:
                        fp = open(childpath, 'w')
                        fp.write(contents)
                        fp.close()
                for name, value in self.placeholders.items():
                    placeholder = '${' + name + '}'
                    if placeholder in child:
                        child = child.replace(placeholder, value)
                        newpath = os.path.join(path, child)
                        os.rename(childpath, newpath)
                        childpath = newpath

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument(u'name', help=u'The name for the new project')
    parser.add_argument(u'--template', default=u'HTML Application', help=u"The project template to use")
    args = parser.parse_args()
    builder = ProjectBuilder(args.name, args.template)
    builder.build()
