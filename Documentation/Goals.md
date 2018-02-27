Several motivations are behind the JSKit web application framework, but all have
a common theme: making absolutley great web apps!


Write an Application, not a Document
====================================

Most importantly, JSKit sees web applications as exactly that: applications.

By contrast, web languages like HTML and CSS grew out of a desire to represent
documents.  From their declariative style to their focus on text-markup, what
makes them great for desgining static documents isn't so great if what you
really want to make is a rich interactive application.

Javascript does help turn those static documents into dynamic and interactive
experiences.  However, the document-centric thinking is hard to escape; coders
must still live in a world  of the Document Object Model and often need to rig
complex combinations of elements to represent concepts that aren't easily
expressed by standard elements.

JSKit strives to hide the document-specific concepts behind a coherent
application paradigm, similar to what's found on mobile or desktop development
environments that never had the document-baed legacy.


Javascript Only
===============

Think about the coding required to add a simple feature in a typical web app.
It requires editing at least three source files: HTML, CSS, and Javscript.

While HTML and CSS have their uses, they often hinder writing highly dynamic and
interactive applications.  You end up writing Javascript that generates HTML
that fits in with already-written HTML.  Then all the CSS styling goes into a
separate file.  Styling rich application compoents can be a chore when the
underlying HTML element structure is complex and CSS has to refer to what are
effectively private implementation details.

By requiring only Javascript, JSKit allows developers to ignore HTML and CSS,
and focus on a single language.  In turn, code can be better organized in one
place with a straightforward API.


Offline Abilities
=================


Event System
============

- Like an app, a more sensible flow making it easier to intercept/cancel/etc
- Drag and drop as first-class consideration
- What you want by default


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


