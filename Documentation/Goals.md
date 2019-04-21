Write an Application, not a Document
====================================

Most importantly, `UIKit` sees web applications as exactly that: applications.

By contrast, web languages like HTML and CSS grew out of a desire to represent
documents.  From their declariative style to their focus on text-markup (it's
called hyper*text* for a reason), what makes them great for desgining static
documents isn't so great when what you really want to make is a rich interactive
application.

Javascript can help turn those static documents into dynamic and interactive
experiences.  However, the document-centric thinking is hard to escape; coders
still must live in a world  of the Document Object Model and often need to rig
complex combinations of elements to represent concepts that aren't easily
expressed by standard elements.

`UIKit` strives to hide the document-specific concepts behind a coherent
application paradigm, similar to what's found on mobile or desktop development
environments that never had the document-based legacy.


Javascript Only
===============

Think about the coding required to add a simple feature in a typical web app.
It often involves editing at least three source files: HTML, CSS, and Javscript.

Then you end up writing Javascript that generates HTML to fit in with
already-written HTML.  Meanwhile, all the CSS styling goes into a separate file.
Styling rich application components can be a chore when the underlying HTML 
element structure is complicated and CSS has to refer to what are effectively
private implementation details.

By requiring only Javascript, `UIKit` allows developers to ignore HTML and CSS,
and focus on one single language, one single view of an application.
In turn, code can be better organized in one place with a straightforward API.


Offline Abilities
=================



Event System
============

The DOM event system is a great example of a design that works just fine when
a web page only needs a few little interactive elements, but becomes a pain
when an application is more like a native desktop or mobile app.

A goal of `UIKit` is to provide a much more straightfoward event system that
requires the minimal amount of implementation code to do the right thing, while
additionally providing a hirearchy of classes that makes organizing the
event handling code natural so it lives exactly where it should.

A more detailed comparison can be foudn in [Why not use DOM Events?](UIKit/WhyNotUseDOM).

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


