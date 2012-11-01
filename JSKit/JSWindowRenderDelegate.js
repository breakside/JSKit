// #import "JSKit/JSViewRenderDelegate.js"
// #import "JSKit/JSHTMLViewRenderDelegate.js"

function JSWindowRenderDelegate(){
}

JSWindowRenderDelegate.$extends(JSViewRenderDelegate);

function JSHTMLWindowRenderDelegate(){
}

JSHTMLWindowRenderDelegate.renderDelegateType = JSViewRenderDelegateTypeHTML5;

JSHTMLWindowRenderDelegate.prototype = {

    init: function(){
        this.$super.initWithElementName('div');
        document.body.appendChild(this.element);
    },
    
};

JSWindowRenderDelegate.$extends(JSHTMLWindowRenderDelegate);
