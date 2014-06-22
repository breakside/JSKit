// #import "JSView.js"

function JSImageView(){
}

JSImageView.prototype = {
    
    image:      null,
    
    initWithImage: function(image){
        JSImageView.$super.initWithFrame.call(this, CGRectMake(0,0,image.width,image.height));
        this.image = image;
    },
    
    setImage: function(image){
        this.image = image;
        this._renderer.imageViewDidChangeImage(this);
    },
    
    getImage: function(){
        return this.image;
    }
    
};

JSImageView.$extends(JSView);

function JSImageViewRenderer(){
}

JSImageViewRenderer.prototype = {
    
    imageViewDidChangeImage: ['view']
    
};

JSImageViewRenderer.$extends(JSViewRenderer);

function JSHTMLImageViewRenderer(){
}

JSHTMLImageViewRenderer.prototype = {
    
    imageViewDidChangeImage: function(view){
        var image = view.image;
        if (image.stretchable){
        }else{
            var resourceInfo = UIApplication.sharedApplication.infoForResource(image.resource);
            this.element.style.backgroundImage = "url('%s') -%dpx -%dpx;".sprintf(resourceInfo.url, resourceInfo.x, resourceInfo.y);
        }
    },
    
};

JSHTMLImageViewRenderer.$extends(JSHTMLViewRenderer).$implements(JSImageViewRenderer);
