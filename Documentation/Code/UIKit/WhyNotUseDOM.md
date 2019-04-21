DOM Event Case Study
========

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
===========

That's an awful lot of work to implement a button's events.  So how does `UIKit`
make this better?

- First, it has the concept of a `UIResponder`, an object which can receive events
- Then it adds a `UIView` class to represent on screen elements (which is a subclass of `UIResponder`)

To make a button, you:

- subclass `UIView`
- override `mouseDown()` to make the button look pressed
- override `mouseDragged()` to make the button look un-pressed if you move out while pressed
- override `mouseUp()` to call an action if the button is pressed

That's it.

- Everything is contained within the button itself, no `document` or `window` events required
- Mouse drag and up events are routed to the `UIView` that handled the mouse down,
  so there's no need to have listeners all over the place just for your button.
- Events that are handled by a view do no propagate by default, so you don't need
  add a command like `stopPropagation()`
- The browser default text selection behavior is disabled by default.

Basically, we try to do what you want by default, and for a rich application,
that's often the exact opposite of what DOM events do.