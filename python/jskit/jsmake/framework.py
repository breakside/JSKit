import os.path
import shutil
from .builder import Builder
from .javascript import JSCompilation

class FrameworkBuilder(Builder):

    frameworkName = None
    includePaths = None
    frameworkOutputPath = None
    weakIncludes = None
    importedPaths = None

    def __init__(self, projectPath, includePaths, outputParentPath, debug=False, args=None):
        super(FrameworkBuilder, self).__init__(projectPath, includePaths, outputParentPath, debug)
        self.includes = []
        self.weakIncludes = []
        self.parse_args(args)

    def parse_args(self, arglist):
        pass

    def setup(self):
        super(FrameworkBuilder, self).setup()
        self.frameworkName = os.path.basename(self.projectPath)
        self.includePaths.extend(self.absolutePathsRelativeToSourceRoot('Frameworks', '.'))
        self.frameworkOutputPath = os.path.join(self.outputProjectPath, self.frameworkName)
        if os.path.exists(self.frameworkOutputPath):
            shutil.rmtree(self.frameworkOutputPath)
        os.makedirs(self.frameworkOutputPath)

    def setupIncludedFramework(self, frameworkName):
        self.weakIncludes.append(frameworkName)

    def build(self):
        self.setup()
        self.buildMain()
        self.buildEnvironments()
        self.copyLicense()
        self.copyInfo()
        self.copyResources()
        self.finish()

    def buildMain(self):
        license = self.licenseText()
        sourceName = self.frameworkName + '.js'
        compilation = JSCompilation(self.includePaths, minify=not self.debug, combine=True)
        compilation.weakIncludes = self.weakIncludes
        compilation.includeAliases[self.frameworkName] = self.projectPath
        compilation.writeComment(u"%s (%s)\n----\n%s" % (self.mainBundle.info.get('JSBundleIdentifier'), self.mainBundle.info.get('JSBundleVersion'), license))
        compilation.include(sourceName)
        self.importedPaths = compilation.importedScriptPaths()
        if len(compilation.outfiles) == 1:
            outfile = compilation.outfiles[0]
            outfile.fp.flush()
            shutil.copy(outfile.fp.name, os.path.join(self.frameworkOutputPath, sourceName))
        else:
            raise Exception("Expecting 1 output file, got %d" % len(compilation.outfiles))

    def buildEnvironments(self):
        environments = self.mainBundle.info.get('JSBundleEnvironments', {})
        license = self.licenseText()
        for environment, sourceName in environments.items():
            compilation = JSCompilation(self.includePaths, minify=not self.debug, combine=True)
            compilation.weakIncludes = self.weakIncludes
            compilation.setImportedScriptPaths(self.importedPaths)
            compilation.includeAliases[self.frameworkName] = self.projectPath
            compilation.writeComment(u"%s [%s] (%s)\n----\n%s" % (self.mainBundle.info.get('JSBundleIdentifier'), environment, self.mainBundle.info.get('JSBundleVersion'), license))
            compilation.include(sourceName)
            if len(compilation.outfiles) == 1:
                outfile = compilation.outfiles[0]
                outfile.fp.flush()
                shutil.copy(outfile.fp.name, os.path.join(self.frameworkOutputPath, sourceName))
            else:
                raise Exception("Expecting 1 output file, got %d" % len(compilation.outfiles))

    def copyLicense(self):
        licenseFile = os.path.join(self.projectPath, self.mainBundle.info.get('JSLicense', 'LICENSE.txt'))
        if os.path.exists(licenseFile):
            shutil.copy(licenseFile, os.path.join(self.frameworkOutputPath, os.path.basename(licenseFile)))

    def copyInfo(self):
        shutil.copy(self.infoFile, os.path.join(self.frameworkOutputPath, os.path.basename(self.infoFile)))

    def copyResources(self):
        resourcesPath = os.path.join(self.projectPath, 'Resources')
        if os.path.exists(resourcesPath):
            shutil.copytree(resourcesPath, os.path.join(self.frameworkOutputPath, 'Resources'))

