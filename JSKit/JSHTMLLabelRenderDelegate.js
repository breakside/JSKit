function JSHTMLLabelRenderDelegate(){
}

JSHTMLLabelRenderDelegate.prototype = {

    textNode: null,

    viewDidChangeText: function(view, text, textProperties){
        if (!this.textNode){
            this.textNode = this.element.appendChild(this.element.ownerDocument.createTextNode());
        }
        this.textNode.value = text;
    },

};

JSHTMLLabelRenderDelegate.$extends(JSHTMLViewRenderDelegate).$implements(JSTextRenderDelegate);