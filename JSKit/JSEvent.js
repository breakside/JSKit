function JSEvent(){
}

JSEvent.prototype = {
    
    initWithDOMEvent: function(domEvent){
        this.$super.init.call(this);
        return this;
    },
    
};

JSEvent.$extends(JSObject);
