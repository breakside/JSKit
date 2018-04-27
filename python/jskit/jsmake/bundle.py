import os.path

class Bundle(object):

    name = None
    info = None
    resourcesPath = None
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

    @property
    def identifier(self):
        return self.info.get('JSBundleIdentifier', None)

    def includeForEnvironment(self, env):
        include = self.info.get('JSBundleEnvironments', dict()).get(env, None)
        if include is not None and self.name is not None:
            return "%s/%s" % (self.name, include)
        return None

    def addLocalization(self, localization):
        if 'JSLocalizations' not in self.info:
            self.info['JSLocalizations'] = []
        if localization not in self.info['JSLocalizations']:
            self.info['JSLocalizations'].append(localization)

    def addResource(self, pathComponents, metadata):
        name, ext = os.path.splitext(pathComponents[0])
        localization = 'global'
        if ext == '.lproj':
            localization = name
            self.addLocalization(localization)
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

    def developmentLoocalizedInfoString(self, infoKey):
        infoValue = self.info.get(infoKey, '')
        devlang = self.info.get('JSDevelopmentLanguage', None)
        if devlang is not None and devlang in self.resourceLookup:
            if len(infoValue) > 0 and infoValue[0] == '.':
                table = self.resourceLookup.get(devlang, dict()).get("Info.strings", [])
                if len(table) > 0:
                    table = self.resources[table[0]]['strings']
                    return table.get(infoValue[1:], '')
        return infoValue

