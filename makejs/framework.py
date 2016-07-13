import os.path
from .builder import builder

class FrameworkBuilder(Builder):

    frameworkName = None
    includePaths = None

    def setup(self):
        super(FrameworkBuilder, self).setup()
        self.frameworkName = os.path.basename(self.sourceRootPath)
        self.includePaths = self.absolutePathsRelativeToSourceRoot('Frameworks', '.')

    def build(self):
        self.setup()
        self.buildVariants()
        self.finsh()

    def buildVariants(self):
        # TODO: map {sourceRoot} to .
        # TODO: ignore self.frameworkRootPath import
        variants = self.info.get('JSFrameworkVariants', [])
        for variant in variants:
            variantPath = variant
            compilation = JSCompilation(self.includePaths, minify=not self.debug, combine=True)
            compilation.include(variantPath)
            if len(compilation.outfiles) == 1:
                outfile = compilation.outfiles[0]
                outfile.fp.flush()
                outputDir = os.path.join(self.outputPath, self.frameworkName)
                os.makedirs(outputDir)
                shutil.copy(outfile.fp.name, os.path.join(outputDir, variant))
            else:
                raise Exception("Expecting 1 output file, got %d" % len(compilation.outfiles))

