function JSTextRenderDelegate(){
}

JSTextRenderDelegate.prototype = {

    viewDidChangeText: ['view', 'text', 'textProperties'],

};

JSTextRenderDelegate.$extends(JSViewRenderDelegate);