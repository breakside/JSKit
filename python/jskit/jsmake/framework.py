import os.path
import shutil
from .builder import Builder
from .javascript import JSCompilation

class FrameworkBuilder(Builder):

    frameworkName = None
    includePaths = None
    frameworkOutputPath = None

    def __init__(self, projectPath, includePaths, outputParentPath, debug=False, args=None):
        super(FrameworkBuilder, self).__init__(projectPath, includePaths, outputParentPath, debug)
        self.includes = []
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

    def build(self):
        self.setup()
        self.buildVariants()
        self.copyLicense()
        self.copyInfo()
        self.finish()

    def buildVariants(self):
        variants = self.info.get('JSFrameworkVariants', [])
        license = self.licenseText()
        for variant in variants:
            variantPath = variant
            compilation = JSCompilation(self.includePaths, minify=not self.debug, combine=True)
            compilation.weakIncludes = self.info.get("JSWeakIncludes", [])
            compilation.includeAliases[self.frameworkName] = self.projectPath
            compilation.writeComment(u"%s (%s)\n----\n%s" % (self.info.get('JSBundleIdentifier'), self.info.get('JSBundleVersion'), license))
            compilation.include(variantPath)
            if len(compilation.outfiles) == 1:
                outfile = compilation.outfiles[0]
                outfile.fp.flush()
                shutil.copy(outfile.fp.name, os.path.join(self.frameworkOutputPath, variant))
            else:
                raise Exception("Expecting 1 output file, got %d" % len(compilation.outfiles))

    def licenseText(self):
        licenseFile = os.path.join(self.projectPath, self.info.get('JSLicense', 'LICENSE.txt'))
        if os.path.exists(licenseFile):
            with open(licenseFile, 'r') as license:
                return license.read()

    def copyLicense(self):
        licenseFile = os.path.join(self.projectPath, self.info.get('JSLicense', 'LICENSE.txt'))
        if os.path.exists(licenseFile):
            shutil.copy(licenseFile, os.path.join(self.frameworkOutputPath, os.path.basename(licenseFile)))

    def copyInfo(self):
        shutil.copy(self.infoFile, os.path.join(self.frameworkOutputPath, os.path.basename(self.infoFile)))


