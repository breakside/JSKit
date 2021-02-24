JSKit is a collection of JavaScript frameworks that can be used to build
desktop-quality web applications and production server applications.

Web Applications
================

As described in detail in our [Goals](https://docs.jskit.dev/goals) document, the web's underlying
technologies of HTML and CSS are fundamentally designed for writing documents,
not applications.

JSKit aims to provide an application-centered platform.  Instead of simply
augmenting interaction with the underlying HTML document, [UIKit](https://docs.jskit.dev/uikit) hides the
document-based paradigm completely so you can focus on building a great
application.

Server Applications
===================

JSKit isn't limited to the browser.  With [ServerKit](https://docs.jskit.dev/serverkit), you can easily create
a robust http server while still leveraging many conveniences from JSKit.

In fact, you can even share the exact same code between the browser and the
server.  For example, code that draws to the screen in the browser using [UIKit](https://docs.jskit.dev/uikit),
can draw to PDF files on the server with [PDFKit](https://docs.jskit.dev/pdfkit).

Serverless APIs
===================

JSKit also makes it easy to create serverless APIs for use with services such
as AWS API Gateway and AWS Lambda.  With [APIKit](https://docs.jskit.dev/apikit), you can create API handlers
that leverage [Foundation](https://docs.jskit.dev/foundation), [SecurityKit](https://docs.jskit.dev/securitykit), or other JSKit frameworks.

You can share code with [UIKit](https://docs.jskit.dev/uikit) front ends, [ServerKit](https://docs.jskit.dev/serverkit) backends, or among
multiple [APIKit](https://docs.jskit.dev/apikit) handlers.  [TestKit](https://docs.jskit.dev/testkit) ensures your API code is well tested
and ready to go.

Code, Document, Test, Deploy
============================

The [jskit](https://docs.jskit.dev/jskit) command line utility supports the entire range of development,
tying documentation, testing, and deployment all together.