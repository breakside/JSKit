// #import "UIKit/UIView+HTMLRenderer.js"

UILabel.HTMLRenderer = UIView.HTMLRenderer.$extend({

    textNode: null,

    initWithView: function(view){
      UILabel.HTMLRenderer.$super.initWithElementName.call(this, view, 'label');
      this.drawMethodMap['text'] = '_drawText';
      this.drawMethodMap['textColor'] = '_drawTextColor';
    },

    setupElement: function(){
      UILabel.HTMLRenderer.$super.setupElement.call(this);
      this.textNode = this.element.appendChild(this.element.ownerDocument.createTextNode(''));
    },

    _drawText: function(label){
        this.textNode.data = label.text;
    },

    _drawTextColor: function(label){
      if (label.textColor){
        this.element.style.color = label.textColor.cssString();
      }else{
        this.element.style.color = '';
      }
    }

}, 'UILabel.HTMLRenderer');

UILabel.registerRenderer(UILabel.HTMLRenderer);