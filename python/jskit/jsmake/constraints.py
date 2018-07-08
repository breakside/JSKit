def compileConstraintEquality(equality, refs):
    """
    >>> refs = dict(self="/Root", one='/One', two='/Two', n=10)
    >>> sorted(compileConstraintEquality("self.width = 12", refs).items())
    [('constant', 12), ('firstAttribute', '$UILayoutAttribute.width'), ('firstItem', '/Root'), ('relation', '$UILayoutRelation.equal')]
    >>> sorted(compileConstraintEquality("self.height = n", refs).items())
    [('constant', 10), ('firstAttribute', '$UILayoutAttribute.height'), ('firstItem', '/Root'), ('relation', '$UILayoutRelation.equal')]
    >>> sorted(compileConstraintEquality("one.top = self.top", refs).items())
    [('firstAttribute', '$UILayoutAttribute.top'), ('firstItem', '/One'), ('relation', '$UILayoutRelation.equal'), ('secondAttribute', '$UILayoutAttribute.top'), ('secondItem', '/Root')]
    >>> sorted(compileConstraintEquality("one.top = self.top + 12", refs).items())
    [('constant', 12), ('firstAttribute', '$UILayoutAttribute.top'), ('firstItem', '/One'), ('relation', '$UILayoutRelation.equal'), ('secondAttribute', '$UILayoutAttribute.top'), ('secondItem', '/Root')]
    >>> sorted(compileConstraintEquality("one.top = self.top + n", refs).items())
    [('constant', 10), ('firstAttribute', '$UILayoutAttribute.top'), ('firstItem', '/One'), ('relation', '$UILayoutRelation.equal'), ('secondAttribute', '$UILayoutAttribute.top'), ('secondItem', '/Root')]
    >>> sorted(compileConstraintEquality("one.top = self.top - 12", refs).items())
    [('constant', -12), ('firstAttribute', '$UILayoutAttribute.top'), ('firstItem', '/One'), ('relation', '$UILayoutRelation.equal'), ('secondAttribute', '$UILayoutAttribute.top'), ('secondItem', '/Root')]
    >>> sorted(compileConstraintEquality("one.top = self.top - n", refs).items())
    [('constant', -10), ('firstAttribute', '$UILayoutAttribute.top'), ('firstItem', '/One'), ('relation', '$UILayoutRelation.equal'), ('secondAttribute', '$UILayoutAttribute.top'), ('secondItem', '/Root')]
    >>> sorted(compileConstraintEquality("two.width = one.width * 2", refs).items())
    [('firstAttribute', '$UILayoutAttribute.width'), ('firstItem', '/Two'), ('multiplier', 2), ('relation', '$UILayoutRelation.equal'), ('secondAttribute', '$UILayoutAttribute.width'), ('secondItem', '/One')]
    >>> sorted(compileConstraintEquality("two.width = one.width * 2.5", refs).items())
    [('firstAttribute', '$UILayoutAttribute.width'), ('firstItem', '/Two'), ('multiplier', 2.5), ('relation', '$UILayoutRelation.equal'), ('secondAttribute', '$UILayoutAttribute.width'), ('secondItem', '/One')]
    >>> sorted(compileConstraintEquality("two.width = one.width * 2 + 12", refs).items())
    [('constant', 12), ('firstAttribute', '$UILayoutAttribute.width'), ('firstItem', '/Two'), ('multiplier', 2), ('relation', '$UILayoutRelation.equal'), ('secondAttribute', '$UILayoutAttribute.width'), ('secondItem', '/One')]
    >>> sorted(compileConstraintEquality("two.width = one.width * 2.5 + 12", refs).items())
    [('constant', 12), ('firstAttribute', '$UILayoutAttribute.width'), ('firstItem', '/Two'), ('multiplier', 2.5), ('relation', '$UILayoutRelation.equal'), ('secondAttribute', '$UILayoutAttribute.width'), ('secondItem', '/One')]
    >>> sorted(compileConstraintEquality("two.width = one.width * 2 + n", refs).items())
    [('constant', 10), ('firstAttribute', '$UILayoutAttribute.width'), ('firstItem', '/Two'), ('multiplier', 2), ('relation', '$UILayoutRelation.equal'), ('secondAttribute', '$UILayoutAttribute.width'), ('secondItem', '/One')]
    >>> sorted(compileConstraintEquality("two.width = one.width * 2.5 + n", refs).items())
    [('constant', 10), ('firstAttribute', '$UILayoutAttribute.width'), ('firstItem', '/Two'), ('multiplier', 2.5), ('relation', '$UILayoutRelation.equal'), ('secondAttribute', '$UILayoutAttribute.width'), ('secondItem', '/One')]
    >>> sorted(compileConstraintEquality("two.width = one.width * 2 - 12", refs).items())
    [('constant', -12), ('firstAttribute', '$UILayoutAttribute.width'), ('firstItem', '/Two'), ('multiplier', 2), ('relation', '$UILayoutRelation.equal'), ('secondAttribute', '$UILayoutAttribute.width'), ('secondItem', '/One')]
    >>> sorted(compileConstraintEquality("two.width = one.width * 2.5 - 12", refs).items())
    [('constant', -12), ('firstAttribute', '$UILayoutAttribute.width'), ('firstItem', '/Two'), ('multiplier', 2.5), ('relation', '$UILayoutRelation.equal'), ('secondAttribute', '$UILayoutAttribute.width'), ('secondItem', '/One')]
    >>> sorted(compileConstraintEquality("two.width = one.width * 2 - n", refs).items())
    [('constant', -10), ('firstAttribute', '$UILayoutAttribute.width'), ('firstItem', '/Two'), ('multiplier', 2), ('relation', '$UILayoutRelation.equal'), ('secondAttribute', '$UILayoutAttribute.width'), ('secondItem', '/One')]
    >>> sorted(compileConstraintEquality("two.width = one.width * 2.5 - n", refs).items())
    [('constant', -10), ('firstAttribute', '$UILayoutAttribute.width'), ('firstItem', '/Two'), ('multiplier', 2.5), ('relation', '$UILayoutRelation.equal'), ('secondAttribute', '$UILayoutAttribute.width'), ('secondItem', '/One')]
    >>> sorted(compileConstraintEquality("self.width = 12 @ 100", refs).items())
    [('constant', 12), ('firstAttribute', '$UILayoutAttribute.width'), ('firstItem', '/Root'), ('priority', 100), ('relation', '$UILayoutRelation.equal')]
    >>> sorted(compileConstraintEquality("self.width = 12 @ $UILayoutPriority.defaultLow", refs).items())
    [('constant', 12), ('firstAttribute', '$UILayoutAttribute.width'), ('firstItem', '/Root'), ('priority', '$UILayoutPriority.defaultLow'), ('relation', '$UILayoutRelation.equal')]
    >>> sorted(compileConstraintEquality("self.width = one.width * 2 + 3 @ 100", refs).items())
    [('constant', 3), ('firstAttribute', '$UILayoutAttribute.width'), ('firstItem', '/Root'), ('multiplier', 2), ('priority', 100), ('relation', '$UILayoutRelation.equal'), ('secondAttribute', '$UILayoutAttribute.width'), ('secondItem', '/One')]
    >>> sorted(compileConstraintEquality("self.width = one.width * 2 + 3 @ $UILayoutPriority.defaultLow", refs).items())
    [('constant', 3), ('firstAttribute', '$UILayoutAttribute.width'), ('firstItem', '/Root'), ('multiplier', 2), ('priority', '$UILayoutPriority.defaultLow'), ('relation', '$UILayoutRelation.equal'), ('secondAttribute', '$UILayoutAttribute.width'), ('secondItem', '/One')]
    """
    def resolveNumber(token):
        if token in refs:
            return refs[token]
        if token[0:1] == '$':
            return token
        if '.' in token:
            return float(token);
        return int(token)
    equality = equality.replace(' ', '')
    l = len(equality)
    if l == 0:
        raise Exception(u"Empty equality found")
    i = 0
    constraint = dict()
    item1Name = ''
    while i < l and equality[i] != '.':
        item1Name += equality[i]
        i += 1
    if len(item1Name) == 0:
        raise Exception("Expecting item name to start equality: %s" % equality)
    if i == l:
        raise Exception("Expecting '.' in equality: %s" % equality)
    if item1Name not in refs:
        raise Exception("Ref name '%s' not found in equality: %s", (item1Name, equality))
    constraint['firstItem'] = refs[item1Name]
    i += 1
    item1Attr = ''
    while i < l and equality[i] not in ('<', '>', '='):
        item1Attr += equality[i]
        i += 1
    if len(item1Attr) == 0:
        raise Exception("Expecting item attribute in equality: %s" % equality)
    if i == l:
        raise Exception("Expecting '=', '<=', or '>=' in equality: %s" % equality)
    if item1Attr not in ('left', 'right', 'top', 'bottom', 'leading', 'trailing', 'width', 'height', 'centerX', 'centerY'):
        raise Exception("Attribute name '%s' not valid in equality: %s", (item1Attr, equality))
    constraint['firstAttribute'] = '$UILayoutAttribute.%s' % item1Attr
    relation = '$UILayoutRelation.equal'
    if equality[i] in ('<', '>'):
        i += 1
        if i == l or equality[i] != '=':
            raise Exception("Expecting '=' after %s in equality: %s" % (equality[i - 1], equality))
        if equality[i - 1] == '<':
            relation = '$UILayoutRelation.lessThanOrEqual'
        else:
            relation = '$UILayoutRelation.greaterThanOrEqual'
    i += 1
    if i == l:
        raise Exception("Expecting right hand side of equality: %s", equality)
    constraint['relation'] = relation
    token = ''
    while i < l and equality[i] not in ('.', '*', '+', '-', '@'):
        token += equality[i]
        i += 1
    if len(token) == 0:
        raise Exception("Expecting item or constant on right of equality: %s", equality)
    if i == l:
        constraint['constant'] = resolveNumber(token)
    else:
        if equality[i] == '.':
            i += 1
            item2Name = token
            if item2Name not in refs:
                raise Exception("Ref name '%s' not found in equality: %s", (item2Name, equality))
            constraint['secondItem'] = refs[item2Name]
            item2Attr = ''
            while i < l and equality[i] not in ('*', '+', '-', '@'):
                item2Attr += equality[i]
                i += 1
            if len(item2Attr) == 0:
                raise Exception("Expecting item attribute in equality: %s" % equality)
            if item2Attr not in ('left', 'right', 'top', 'bottom', 'leading', 'trailing', 'width', 'height', 'centerX', 'centerY'):
                raise Exception("Attribute name '%s' not valid in equality: %s", (item2Attr, equality))
            constraint['secondAttribute'] = '$UILayoutAttribute.%s' % item2Attr
        elif equality[i] == '@':
            constraint['constant'] = resolveNumber(token)
        else:
            raise Exception("Unexpected token in equality at %d: %s" % (i, equality))
        if i < l and equality[i] == '*':
            i += 1
            token = ''
            while i < l and equality[i] not in ('+', '-', '@'):
                token += equality[i]
                i += 1
            if len(token) == 0:
                raise Exception("Expecting multiplier in equality: %s" % equality)
            constraint['multiplier'] = resolveNumber(token)
        if i < l and equality[i] in ('-', '+'):
            sign = -1 if equality[i] == '-' else 1
            i += 1
            token = ''
            while i < l and equality[i] not in ('@',):
                token += equality[i]
                i += 1
            if len(token) == 0:
                raise Exception("Expecting constraint in equality: %s" % equality)
            constraint['constant'] = sign * resolveNumber(token)
        if i < l and equality[i] == '@':
            i += 1
            token = equality[i:]
            if len(token) == 0:
                raise Exception("Expecting priority in equality: %s" % equality)
            constraint['priority'] = resolveNumber(token)
    return constraint