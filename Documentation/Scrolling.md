Scrolling Goals
===============

# Scrolling should feel correct to users, mainly in the physics of motion
# Support recyler views without tearing or flickering
# Support features like `contentInsets`


Can We Use Native Scrollers?
============================

The easiset way to accomplish goal #1 is to simply use native scrolling `div`s.

Much effort went into finding a way to make them work, but ultimately no
workable solution could be found that also served goals #2 and #3.


Async DOM Scroll Events
-----------------------

All modern browsers (in 2018) fire `scroll` events asynchronously.  They do so
in an effort to prevent laggy scrolling on pages that abuse scroll event
handling.

While many ideas have been floated regarding support for opt-in synchronous
scrolling events, there is hardly a consensus over what is best or how high a
priority it is.

Without the ability to synchronize scroll movement with view updates, goal #2 is
impossible to meet.  A recycling list view, for example, will show considerable
flickering as the user scrolls because new views are added sometime after the
browser scrolls and exposes the open areas.


Negative Offests
----------------

While there could be ways to support `contentInsets` by adding special logic
to the display server that positions elements, the most straightforward way is
to use negative scroll offsets.  If the scroll view has a top inset of 20px,
starting it scrolled at -20px offset does exactly what we want.

Unfortunately, native scroll views do not support negative offsets.


Touch Devices
-------------

In addition to the previously mentioned issues, scrolling on touch devices
typically includes complex event handling where the scroll view can delay events
intended for the scrollable content to wait and see if the user is tapping or
scrolling.  Given our completly custom event system, this kind of interaction
is much easier to manage if we're handling the scrolling logic ourself.


What Do We Lose Without Native Scrollers?
==========================================

Look
----

If we aren't using native scrollers, then we have to do all the drawing ourself.

This can be viewed as a negative if the goal is to exactly mimic the native
scroll bars.  However, if the goal is to have 100% ability to customize the
scroll bars, doing all our own drawing is a positive.

At the end of the day, matching native scrollers in looks was not high on our
list of goals.


Bouncing
--------

Scroll views on macOS typically bounce when encountering the ends of a scrolling
view.

Without access to raw trackpad events, we cannot recreate the bounce effect
exactly.  For example, we do receive momentum scrolling events and could create
some kind of bounce if you run over the edge, but we don't know when the user
is touching the trackpad.  Try it out on a native scroll view and you'll see
that you can scroll up from zero, but nothing bounces until you let up from the
pad.

Given the choice between a poor approximation and no bouncing at all, we chose
no bouncing at all.
