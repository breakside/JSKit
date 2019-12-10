What is Binding?
================

Binding is a way of linking two objects so changes to a property of one
automatically result in changes to the other.

A typical use case is linking a text field to a data model property.

* Changes can propagate in both directions
* Transformers can modify a value on one end to a different type on the other
* Multiple bindings can result in boolean operations
* Bindings can be easily expressed in spec files (see `JSSpec`)


A Simple Example
================

We'll use a basic `Person` class as an example throughout this guide:

````
JSClass("Person", JSObject, {

  init: function(){
    this.firstName = '';
    this.lastName = '';
  },

  firstName: null,
  lastName: null,

  fullName: JSReadOnlyProperty(),

  getFullName: function(){
    if (this.firstName !== '' && this.lastName !== ''){
      return this.firstName + ' ' + this.lastName;
    }
    if (this.firstName !== ''){
      return this.firstName;
    }
    if (this.lastName !== ''){
      return this.lastName;
    }
    return null;
  }
});
````

Now let's say we want to have a UI with text fields for the first and last names,
and a label for the synthesized full name.

````
var firstNameField = UITextField.init()
var lastNameField = UITextField.init();
var fullNameLabel = UILabel.init()
````

Binding is done by simply calling the `JSObject.bind()` method that all objects inherit.

````
var person = Person.init();

firstNameField.bind('text', person, 'firstName');
lastNameField.bind('text', person, 'lastName');
fullNameLabel.bind('text', person, 'fullName');
````

Note the direction here, we're binding `firstNameField.text` to `person.firstName`.

1. Bindings should always go from something like a UI component to the underlying data object.
1. Something like a text field can only be bound to a single data object (because it can show just one value)
1. Several UI components can be bound to the same underlying data object/property.

In effect, what's happening under the hood is:

1. `firstNameField` adds itself as an observer of the `firstName` keyPath on `person`
1. When the user types in `firstNameField`, it updates the `person.firstName` to match
1. When `person.firstName` changes by other means than typing, `firstNameField` receives a notification and updates its `text` property


Complex KeyPaths
================

The simple example above is a bit more basic than you'll likely find in the
real world.

Typically you'll use a controller to manage the links between your data
and views.

In this case, the bindings look a little different:

````
JSClass("PersonViewController", UIViewController, {

  person: null,
  firstNameField: null,
  lastNameField: null,
  fullNameLabel: null,

  viewDidLoad: function(){
    PersonViewController.$super.viewDidLoad.call(this);

    this.firstNameField = UITextField.init()
    this.lastNameField = UITextField.init();
    this.fullNameLabel = UILabel.init();
    this.view.addSubview(this.firstNameField);
    this.view.addSubview(this.lastNameField);
    this.view.addSubview(this.fullNameLabel);

    // Bindings
    this.firstNameField.bind('text', this, 'person.firstName');
    this.lastNameField.bind('text', this, 'person.lastName');
    this.fullNameLabel.bind('text', this, 'person.fullName');
  }

});
````

Those final three lines are binding the input fields and label not directly
to a particular person object, but rather to the controller's person object.

The effect is that the `person` property of the controller can change, and
the text fields will automatically change to match the new `person`.


Value Transformers
==================

The `text` property isn't the only part of a text field than can make use of bindings.

You can also set the `enabled` property automatically based on bindings, like
`this.firstNameField.enabled = true` only when `this.person !== null`, using `this` as our
view controller from before.

If we were to simply bind `this.firstNameField.enabled` to `this.person`, we'd be
setting a `boolean` property with an object.  What we really want instead is to
set `enabled` to an actual `boolean` value.

This is where value transformers become useful.  Here's how we'd do it:

````
JSClass("PersonViewController", UIViewController, {

  person: null,
  firstNameField: null,
  lastNameField: null,
  fullNameLabel: null,

  viewDidLoad: function(){
    PersonViewController.$super.viewDidLoad.call(this);

    this.firstNameField = UITextField.init()
    this.lastNameField = UITextField.init();
    this.fullNameLabel = UILabel.init();
    this.view.addSubview(this.firstNameField);
    this.view.addSubview(this.lastNameField);
    this.view.addSubview(this.fullNameLabel);

    this.firstNameField.bind('text', this, 'person.firstName');
    this.lastNameField.bind('text', this, 'person.lastName');
    this.fullNameLabel.bind('text', this, 'person.fullName');

    // Auto enabling/disabling the fields
    this.firstNameField.bind('enabled', this, 'person', {valueTransformer: JSIsNotNullValueTransformer});
    this.lastNameField.bind('enabled', this, 'person', {valueTransformer: JSIsNotNullValueTransformer});
  }

});
````

Note the final two lines we've added from the previous example.  We're using the
fourth argument (`options`) of `bind()` to pass a value transformer that turns `null` into `false` and
anything else into `true`.

`Foundation` comes with a few standard value transformers:

* `JSIsNullValueTransformer`
* `JSIsNotNullValueTransformer`
* `JSIsEmptyValueTransformer`
* `JSIsNotEmptyValueTransformer`
* `JSNegateBooleanValueTransformer`
* `JSCommaSeparatedListValueTransformer`

Making your own value transformer
---------------------------------

If the standard value transformers don't provide the operation you need, then you
can easily create your own transformer.

Value transformers implement a very simple interface:

````
{
  transformValue: function(value){ },

  // Optional, only implement if the transformation can be reversed
  reverseTransformValue: function(value){ }
}
````

Non-reversible transformers imply a read-only binding.


Boolean Logic with Multiple Bindings
====================================

Automatically setting `enabled` based on an object's existence is great, but
often other conditions apply too, such as disabling fields when saving.

For this reason, it's possible to bind boolean properties like `enabled` to
multiple data objects.

The result is as if `enabled` is bound to the boolean `AND` of all its data objects.

````
JSClass("PersonViewController", UIViewController, {

  person: null,
  firstNameField: null,
  lastNameField: null,
  fullNameLabel: null,

  isSaving: false,

  viewDidLoad: function(){
    PersonViewController.$super.viewDidLoad.call(this);

    this.firstNameField = UITextField.init()
    this.lastNameField = UITextField.init();
    this.fullNameLabel = UILabel.init();
    this.view.addSubview(this.firstNameField);
    this.view.addSubview(this.lastNameField);
    this.view.addSubview(this.fullNameLabel);

    this.firstNameField.bind('text', this, 'person.firstName');
    this.lastNameField.bind('text', this, 'person.lastName');
    this.fullNameLabel.bind('text', this, 'person.fullName');

    // auto enable/disable based on the AND of two properties
    this.firstNameField.bind('enabled', this, 'person', {valueTransformer: JSIsNotNullValueTransformer});
    this.firstNameField.bind('enabled', this, 'isSaving', {valueTransformer: JSNegateBooleanValueTransformer});

    // auto enable/disable based on the AND of two properties
    this.lastNameField.bind('enabled', this, 'person', {valueTransformer: JSIsNotNullValueTransformer});
    this.lastNameField.bind('enabled', this, 'isSaving', {valueTransformer: JSNegateBooleanValueTransformer});
  }

});
````

Here we've added an extra bind for `firstNameField` and `lastNameField`, each so
`enabled` will be `false` if `this.isSaving === true`.

It's equivalent to saying `this.firstNameField.enabled = this.person !== null && !this.isSaving`.


Binding in Spec Files
=====================

The same view controller we've been writing in code can be be written
declaratively in a spec file instead.

The details of spec file writing are covered in `JSSpec`, but it's worth going over
a few special features of bindings in specs:

````
ViewController:
  class: PersonViewController
  outlets:
    firstNameField: /FirstNameField
    lastNameField: /LastNameField
    fullNameLabel: /FullNameLabel
  view:
    subviews:
      - /FirstNameField
      - /LastNameField
      - /FullNameLabel

FirstNameField:
  class: UITextField
  bindings:
    # Simple binding of text to single property
    text: {to: /ViewController, value: 'person.firstName'}
    # Binding of enabled to multiple properties (boolean AND)
    enabled:
      # Compact syntax for specifying value transformers
      - {to: /ViewController, value: 'person !== null'}
      - {to: /ViewController, value: '!isSaving'}

LastNameField:
  class: UITextField
  bindings:
    text: {to: /ViewController, value: 'person.lastName'}
    enabled:
      - {to: /ViewController, value: 'person !== null'}
      - {to: /ViewController, value: '!isSaving'}

FullNameLabel:
  class: UITextField
  bindings:
    text: {to: /ViewController, value: 'person.fullName'}
````

When declaring bindings in a spec, all options are possible:

1. We're able to specify either single or multiple bindings per property
1. Value transformers can be included as expressions

Value transformer expressions:

1. `JSIsNullValueTransformer`: `=== null` suffix
1. `JSIsNotNullValueTransformer`: `!== null` suffix
1. `JSIsEmptyValueTransformer`: `.length === 0` suffix
1. `JSIsNotEmptyValueTransformer`: `.length > 0` suffix
1. `JSNegateBooleanValueTransformer`: `!` prefix

Our code gets a lot simpler because we don't need to create the objects or
bindings by hand anymore:

````
JSClass("PersonViewController", UIViewController, {

  person: null,
  firstNameField: null,
  lastNameField: null,
  fullNameLabel: null,

  isSaving: false

});
````


Observing Without Binding
=========================

Binding is built on top of simpler observation methods, which can be used
independently if you don't require all the features of binding.