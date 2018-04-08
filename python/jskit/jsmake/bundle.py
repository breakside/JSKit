import os.path

class Bundle(object):

    info = None
    resources = None
    resourceLookup = None

    def __init__(self):
        self.info = dict()
        self.resources = []
        self.resourceLookup = dict()

    def __getitem__(self, attr):
        hits = self.resourceLookup.get('global', dict()).get(attr, [])
        if len(hits) == 0:
            return None
        return self.resources[hits[0]]

    def addResource(self, pathComponents, metadata):
        name, ext = os.path.splitext(pathComponents[0])
        localization = 'global'
        if ext == '.lproj':
            localization = name
            pathComponents.pop(0)
        path = '/'.join(pathComponents)
        metadata['path'] = path
        resourceIndex = len(self.resources)
        self.resources.append(metadata)
        if localization not in self.resourceLookup:
            self.resourceLookup[localization] = dict()
        names = [path]
        name, ext = os.path.splitext(pathComponents[-1])
        if ext != '':
            componentsWithoutExtension = pathComponents[:-1]
            componentsWithoutExtension.append(name)
            names.append('/'.join(componentsWithoutExtension))
        for name in names:
            if name not in self.resourceLookup[localization]:
                self.resourceLookup[localization][name] = []
            self.resourceLookup[localization][name].append(resourceIndex)
        return resourceIndex

    def jsonObject(self):
        return dict(
            Info=self.info,
            Resources=self.resources,
            ResourceLookup=self.resourceLookup,
            Fonts=[i for i in range(len(self.resources)) if "font" in self.resources[i]]
        )

