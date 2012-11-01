// #import "JSView.js"

function JSImageView(){
}

JSImageView.prototype = {
    
    image:      null,
    
    initWithImage: function(image){
        this.$super.initWithFrame.call(this, CGRectMake(0,0,image.width,image.height));
        this.image = image;
        return this;
    },
    
    setImage: function(image){
        this.image = image;
        this._renderDelegate.imageViewDidChangeImage(this);
    },
    
    getImage: function(){
        return this.image;
    }
    
};

JSImageView.$extends(JSView);

function JSImageViewRenderDelegate(){
}

JSImageViewRenderDelegate.prototype = {
    
    imageViewDidChangeImage: ['view']
    
};

JSImageViewRenderDelegate.$extends(JSViewRenderDelegate);

function JSHTMLImageViewRenderDelegate(){
}

JSHTMLImageViewRenderDelegate.prototype = {
    
    imageViewDidChangeImage: function(view){
        var image = view.image;
        if (image.stretchable){
        }else{
            var resourceInfo = UIApplication.sharedApplication.infoForResource(image.resource);
            this.element.style.backgroundImage = "url('%s') -%dpx -%dpx;".sprintf(resourceInfo.url, resourceInfo.x, resourceInfo.y);
        }
    },
    
};

JSHTMLImageViewRenderDelegate.$extends(JSHTMLViewRenderDelegate).$implements(JSImageViewRenderDelegate);
