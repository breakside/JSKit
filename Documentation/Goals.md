Write an Application, not a Document
====================================

From the bottom up, `JSKit` sees applications as exactly that: **applications**.

While the foundational front-end web technologies like HTML, Javascript,
and CSS have made tremendous advancements over the years, they still have a
very document-centric view of the world.

From their declarative style to their focus on text-markup (it's
called hyper*text* for a reason), what makes them great for designing static
documents isn't so great when what you really want to make is a rich interactive
application.

Sure, Javascript can help turn those static documents into dynamic and
interactive experiences, but the document-centric thinking is hard to escape.
Coders still must live in a world of the *Document* Object Model and often need
to rig complex combinations of elements to represent concepts that aren't easily
expressed by standard elements.

Without a true application toolkit, web applications tend to rely on under-
coded UI elements that function good enough instead of great.

`JSKit` strives to:

- **Provide a common foundation** on which advanced UI or server applications can be built
- **Hide document-specific concepts** behind a coherent application paradigm
- **Provide a rich UI toolkit** of desktop-quality interface elements
- **Support the entire development cycle** including testing, packaging, and deployment


A Common Foundation
===================

`Foundation` is the framework that everything else in `JSKit` is built upon.
It provides a suite of functionality that any application would need, whether it
be a backend server or a front end client.

With a shared foundation, it's possible to share code between servers and
clients.  For example, drawing code in the front end client can be used
without modification to genereate static images on the server.



Application Paradigm
====================

For web applications, `UIKit` builds on `Foundation` to allow for applications
that can focus on the user experience rather than fighting against
document-centric languages and concepts.

As far as `UIKit`-based applications are concerned, they can run independently
from the browser and a `DOM` based interface.  Only a few hidden parts deep
inside the `UIKit` framework have to deal with the `DOM` deatils.

More like coding a desktop application, `UIKit` encourages organized `MVC` code
where the building blocks are not `HTML` elements, but are view objects with
properties and methods relevant to rich interface development.


Offline In Mind
---------------

In fact, `UIKit` applications are designed to be such self-contained bundles
that they easily work in offline mode.

Support for offline mode is built-in and just works without having to think
about it.

This is possible because `UIKit` applications are single page applications made
entirely of static resources.


Rich UI Toolkit
===============

`UIKit` contains a suite of highly customizable rich UI elements.

For example, `UIListView` allows for scrolling lists of arbitrary length without
performance issues common to large `HTML`-based lists becuase it only draws
items that are visible on screen, constantly updating during scrolling.

There are also things like windows, buttons, menus, tab views, and more, that
all support the same level of functionality as you'd find in a desktop app.
For example, menus automatically constrain their size to the availble space in
the browser, allow for overflow scrolling, support arrow key navigation, and
more.  Windows can be moved, resized, and stack.

Of course, everything `UIKit` provides can be hand coded or probably even found
piece by piece as open source plugins to other frameworks.  But the tight
integration of `UIKit` and its components allows everything to function
correctly together to deliver the richest and most seamless experience to users.

Event System
------------

In designing such a desktop-like UI framework, it became necessary to
reconsider the standard `DOM` event system typically used for web applications.

The `DOM` event system is a great example of a design that works just fine when
a web page only needs a few little interactive elements, but becomes a pain
when an application is more like a native desktop or mobile app.

So `UIKit` provides a much more straight-forward event system that
requires the minimal amount of implementation code to do the right thing,
especially when it comes to the events that still aren't as common as they
should be on the web like drag and drop.

A more detailed comparison can be found in [Why not use DOM Events?](UIKit/WhyNotUseDOM).


Text Input
----------

`UIKit` also provides a text input system that allows for more control than
a typical web app solution.

Rich text editing in web apps is generally only available through
`contenteditable` features, which is essentially all or nothing, especially
when it comes to what a user can paste.

Rather than deal with that, `UIKit` supports text editing in a completely
custom way while still behaving as the user would expect.  It's possible to
do plain text, limited rich text, or even completely custom rich text, because
the underlying text format is not `HTML`, but is a `JSAttributedString` that
allows for complete customization.


The Complete Development Cycle
==============================

Code, test, debug, document, deploy.

`JSKit` covers the entire development cycle so everything you need is in one
tool.

An itegrated test framework, `TestKit`, makes it easy to unit test code.  The
inherent platform flexibility means that most `UIKit` code can be tested via
a command line utility without ever invoking a browser.

A rich code documenation format and viewer make it easy to keep everything
properly documented.

A robust build system can create Docker images for debug or for production.

Debug builds keep all the source files separate exactly as code for easy
debugging, while production builds automatically combine and minify the
Javascript for efficient distribution.

See our [Features](Features) list for a complete description of everything
that's built directly into `JSKit`.


Familiarity
===========

Those familiar with macOS and iOS coding will be right at home in `JSKit`
because it was designed to work and feel a lot like those platforms, diverging
when appropriate due to coding language differences or functionality choices.

Javascript is of course not Objective-C or Swift, so there are obvious needs for
differences in the frameworks.

`JSKit` is not meant to work exactly like any other framework or be tied to
particular externally-defined behaviors, so don't expect copies of your
favorite components, but relax in the comforable similarities.
