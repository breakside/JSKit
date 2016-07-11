import os.path
from .builder import builder

class FrameworkBuilder(Builder):

    includePaths = None
    frameworkRootPath = None

    def setup(self):
        super(FrameworkBuilder, self).setup()
        self.frameworkName = os.path.basename(self.sourceRootPath)
        self.includePaths = self.absolutePathsRelativeToSourceRoot('Frameworks', '.')
        self.frameworkRootPath = self.info['JSFrameworkRoot']

    def build(self):
        self.setup()
        self.buildJavascript()
        self.buildVariants()
        self.finsh()

    def buildJavascript(self):
        # TODO: map {sourceRoot} to .
        # TODO: ignore external imports
        compilation = JSCompilation(self.includePaths, minify=self.debug)
        compilation.include(self.frameworkRootPath)
        for outfile in compilation.outfiles:
            pass

    def buildVariants(self):
        # TODO: map {sourceRoot} to .
        # TODO: ignore self.frameworkRootPath import
        variants = self.info.get('JSFrameworkVariants', [])
        for variant in variants:
            variantPath = variant
            compilation = JSCompilation(self.includePaths, minify=self.debug)
            compilation.include(variantPath)
            for outfile in compilation.outfiles:
                pass
