// #import "Foundation/JSProtocol.js"
/* global JSProtocol */
'use strict';

JSProtocol("JSTextLayoutManagerDelegate", JSProtocol, {

    layoutManagerEffectiveAttributedString: ['layoutManager'],
    layoutManagerDidInvalidateLayout: ['layoutMangaer'],
    layoutManagerDidCompleteLayoutForContainer: ['layoutManager', 'container', 'isAtEnd'],
    layoutManagerTextContainerForLocation: ['layoutManager', 'location']

});
