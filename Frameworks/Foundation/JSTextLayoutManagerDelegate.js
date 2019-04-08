// #import "Foundation/JSProtocol.js"
/* global JSProtocol */
'use strict';

JSProtocol("JSTextLayoutManagerDelegate", JSProtocol, {

    layoutManagerEffectiveAttributedString: function(layoutManager){},
    layoutManagerDidInvalidateLayout: function(layoutMangaer){},
    layoutManagerDidCompleteLayoutForContainer: function(layoutManager, container, isAtEnd){},
    layoutManagerTextContainerForLocation: function(layoutManager, location){}

});
