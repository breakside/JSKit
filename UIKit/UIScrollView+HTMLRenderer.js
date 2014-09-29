UIScrollView.HTMLRenderer = JSObject.$extend({

    contentSizeElement: null,

    initWithView: function(view){
        UIScrollView.$super.initWithElementName.call(this, view, 'div');
        this.drawMethodMap['contentSize'] = '_drawContentSize';
        this.drawMethodMap['contentOffset'] = '_drawContentOffset';
    },

    setupElement: function(){
        UIScrollView.$super.setupElement.call(this);
        this.element.style.overflow = 'auto';
        this.contentSizeElement = this.element.ownerDocument.createElement('div');
        this.contentSizeElement.style.position = 'absolute';
        this.contentSizeElement.style.top = '0px';
        this.contentSizeElement.style.left = '0px';
        this.contentSizeElement.style.width = '0px';
        this.contentSizeElement.style.height = '0px';
    },

    _drawContentSize: function(scrollView){
        this.contentSizeElement.style.width = scrollView.contentSize.width + 'px';
        this.contentSizeElement.style.height = scrollView.contentSize.height + 'px';
    },

    _drawContentOffset: function(scrollView){
        this.element.scrollTop = scrollView.contentOffset.y;
        this.element.scrollLeft = scrollView.contentOffset.x;
    }

}, 'UIScrollView.HTMLRenderer');