import yaml
from collections import OrderedDict


def _constructOrderedDict(loader, node):
    loader.flatten_mapping(node)
    return OrderedDict(loader.construct_pairs(node))


class OrderedLoader(yaml.SafeLoader):
    pass


OrderedLoader.add_constructor(yaml.resolver.BaseResolver.DEFAULT_MAPPING_TAG, _constructOrderedDict)

def load(f):
    if isinstance(f, basestring):
        f = open(f, 'r')
    return yaml.load(f, OrderedLoader)