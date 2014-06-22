import os
import os.path
import shutil
import sys


class ProjectBuilder(object):

    name = None
    projectPath = None

    def __init__(self, name):
        self.name = name
        self.projectPath = os.path.join(os.getcwd(), self.name)

    def build(self):
        if os.path.exists(self.projectPath):
            raise Exception("Output path already exists: %s" % self.projectPath)
        frameworksPath = os.path.join(self.projectPath, 'Frameworks')
        jskitPath = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
        templatePath = os.path.join(jskitPath, 'project-template')
        shutil.copytree(templatePath, self.projectPath)
        os.symlink(jskitPath, frameworksPath)


def main():
    if len(sys.argv) < 2:
        print u"%s projectname" % sys.argv[0]
        sys.exit(1)
    builder = ProjectBuilder(sys.argv[1])
    builder.build()

if __name__ == "__main__":
    main()
