Several motivations are behind the JSKit web application framework, but all have
a common theme: making absolutley great web apps!


Write an Application, not a Document
====================================

Most importantly, JSKit sees web applications as exactly that: applications.

By contrast, web languages like HTML and CSS grew out of a desire to represent
documents.  From their declariative style to their focus on text-markup (it's
called hyper _text_ for a reason), what makes them great for desgining static
documents isn't so great when what you really want to make is a rich interactive
application.

Javascript can help turn those static documents into dynamic and interactive
experiences.  However, the document-centric thinking is hard to escape; coders
still must live in a world  of the Document Object Model and often need to rig
complex combinations of elements to represent concepts that aren't easily
expressed by standard elements.

JSKit strives to hide the document-specific concepts behind a coherent
application paradigm, similar to what's found on mobile or desktop development
environments that never had the document-based legacy.


Javascript Only
===============

Think about the coding required to add a simple feature in a typical web app.
It requires editing at least three source files: HTML, CSS, and Javscript.

Then you end up writing Javascript that generates HTML to fit in with
already-written HTML.  Meanwhile, all the CSS styling goes into a separate file.
Styling rich application components can be a chore when the underlying HTML 
element structure is complicated and CSS has to refer to what are effectively
private implementation details.

By requiring only Javascript, JSKit allows developers to ignore HTML and CSS,
and focus on one single language, one single view of an application.
In turn, code can be better organized in one place with a straightforward API.


Offline Abilities
=================



Event System
============

The DOM event system is a great example of a design that works just fine when
a web page only needs a few little interactive elements, but becomes a pain
when an application is more like a native desktop or mobile app.

A goal of JSKit is to provide a much more straightfoward event system that
requires the minimal amount of implementation code to do the right thing, while
additionally providing a hirearchy of classes that makes organizing the
event handling code natural so it lives exactly where it should.


DOM Event Case Study
--------------

Consider making a custom button from a `div` element using traditional DOM
events. You might start with:

- Add a `mousedown` event listener on the `div` to show the pressed state
- Add a `mouseup` event listener on the `div` to trigger an action

You've got a basic button.  But what happens if the user `mousedown`s outside
the button and `mouseup`s inside?  The action fires because the `mouseup` event
fires, but that's probably not what you wanted since the user didn't
click both down and up on the button.  Easy enough to fix:

- Set an `isPressed` flag in `mousedown`
- Only fire the action in `mouseup` if `isPressed` is true

Better.  Now what about the reverse sequence, down inside and up outside?  The
button will be left stuck in its pressed state.  This is also fixable:

- Add a `mousemouse` listener on `mousedown`, and cancel the press along with
  the event listeners when the mouse leaves the button

This works okay, but take a look at how native buttons work: they will re-press
if the mouse is still down and moves back over the button.  This can be fixed
too:

- Don't cancel everything when the mouse leaves the button, just change its
  appearance
- Now the `mouseup` listener needs to change to the document, so you can catch
  any up outside the button
- Watch for the mouse to move back over the button and re-press visually

Getting close, but there's still a problem.  Try moving the downed mouse all the
way outside the browser window, then let up.  You'll never get the document
mouse up, and the button will be in a weird state, still listening for move and
up events.  If you mouse back over the button, it will re-press, even though
the mouse is up.  To solve that, you can:

- Watch for the mouse to leave the window, and treat it like a mouse up.

Now you've got event listeners on the `div`, `document`, and `window`, all just
to implement a button properly.

As a final thought, let's put the button inside a table cell that's also
clickable, so it's like a detail indicator.  Clicking the button should only do
the button action, not the cell's action.  But the cell probably has its own
`mousedown` listener, which will by default receive the event that started on
the button.  So there's another thing to do:

- Call `stopPropagation()` so the button event doesn't flow to the cell

And maybe you don't like how if the user clicks and moves on the button, the
browser selects the text label of the button.  That's certainly not how native
buttons work.  One more thing:

- Call `preventDefault()` so the browser won't select text.

Whew, I think we're done.


A Better Way
------------

That's an awful lot of work to implement a button's events.  So how does JSKit
make this better?

- First, it has the concept of a `View`, an object which can receive events
- To make a button, you subclass `View`
- To handle mouse events, you override the `mouseDown`, `mouseUp`, and 
  `mouseMove` methods from `View`.

That's it.

- Mouse move and up events are routed to the view that handled the mouse down,
  so there's no need to have listeners all over the place just for your button.
- Events that are handled by a view do no propagate by default, since
  non-propagation when handling events is the more typical use case by far.
- The browser default text selection behavior is disabled by default.

Basically, we try to do what you want by default, and for a rich application,
that's often the exact opposite of what DOM events do.


Drag & Drop
--------------------

Another major consideration was drag and drop.  It's often not used in web apps
because the event system is so messed up.  While not worth getting into the
details here, it is worth mentioning that drag and drop was a motivation behind
designing a new event system, and is a first-class event in the new system.


Text Input - Highly Controlled and Customized 
=============================================

- plain vs rich, nothing in between
- layout precision


Browsers Not Required
=====================

- node.js
- most of UIKit not dependent on DOM, relatively easy to add new "driver"


Cocoa Inspired
==============


The Complete Development Cycle
==============================

Debug, test, deploy.

- Debug builds without modifying javascript, so files you're editing are exactly the files the debugger sees
- Separate files when debugging, combined/minified files for production


