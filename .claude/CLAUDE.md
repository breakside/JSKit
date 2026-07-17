Overview
===
JSKit is a collection of JavaScript frameworks, most of which are designed to
run in both web browser and node.js environments.

Public documentation is available in HTML format at https://docs.jskit.dev.
Documentation is also available in a custom YAML format in the
./Documentation/Code/ folder within this repository.

Frameworks
===
JSKit's framework projects are all stored under the ./Frameworks/ folder.

- Foundation: Core classes that are used to build all the other frameworks
- UIKit: A model-view-controller (MVC) framework for creating rich client apps
- ServerKit: For building backend services such as HTTP servers, job queues, etc
- APIKit: For building serverless APIs, such as those that run on AWS Lambda
- SecurityKit: Cryptography primitives and higher level concepts providing the
  same interface across environments
- ImageKit: Bitmap image decoding and creation
- FontKit: Low level Open Type font file reading
- MediaKit: Reading media containers such as QuickTime or MP4
- MediaKitUI: Components for playing media in a `UIKit` application
- NotificationKit: Support for user notifications such as push notifications
- AuthKit: OAuth client session
- ChartKit: Rich chart/graph drawing for data sets
- PDFKit: Reading and writing PDF files 
- QRKit: Generating and drawing QR codes (not scanning)
- Dispatch: Worker-based job execution
- SearchKit: Worker-based indexed search
- ConferenceKit: Creating and managing a video conference session 
- DBKit: Object storage abstraction, both local and remote
- DOM: Document Object Model interface
- CSSOM: CSS Object Model interface
- TestKit: Supports writing tests for any JSKit-based code
- APIKitTesting: Mock classes useful for testing `APIKit`
- UIKitTesting: Mock classes useful for testing `UIKit`
- ServerKitTesting: Mock classes useful for testing `ServerKit`

Command
===
In addition, the ./Command/jskit/ folder contains the `jskit` CLI.  It is a
node-based project.  Its tests are found in ./Tests/jskitTests/.

Defining Classes
===
JSKit was designed to support object oriented design, and includes features that
are not available with standard JavaScript syntax.

Therefore, most classes within the JSKit frameworks are defined using the
`JSClass` factory, which allows for features such as: multiple constructors,
nullable constructors, lazy properties, categories (class add-ons), mix-ins,
and others.

However, it's also possible to use the standard `class` syntax or even define
simple classes using JavaScript functions and their `prototype`s.  Compatibility
with standard JavaScript is important.

Consult the ./Documentation/Code/Foundation/JSClass.doc.yaml file for details
and examples.

Special Syntax
===
When JSKit was first designed, there wasn't widespread support for JavaScript's
`require()` function.

Therefore, we made our own special set of commands within comments.  The syntax
is very specific, with no tolerance for extra white space within or at the ends
of lines.

To import a JavaScript file, use a filename with double quotes:
```
// #import "JSObject.js"
```
Note that the filename does not require a directory/folder prefix, it will be
found regardless of where it is in the project directory structure.  This also
means that you cannot use the same filename twice in a project.

To import a JSKit framework, use the framework name without quotes:
```
// #import UIKit
```

Additional special commands are `// #feature` and `// #esversion`, which together
allow the build system to auto-generate a set of preflight tests that can be run
in an environment before attempting to load actual code.

The `// #feature` command is followed by a single space character and then
a JavaScript expression.  It is typically used in environment-specific files.
Note that `// #feature` should only be used when the feature is absolutely
required.  An alternative pattern is conditional use of platform features,
which can be accomplished with runtime `if` checks.

The `// #esversion` command is followed by a single space character and then
an integer, representing the ECMAScript Edition (1-17) required for the project.
It only needs to be specified once per project, and may need to be updated if
you use new JavaScript features or syntax.

Environments
===
JSKit supports two general environments (or platforms): Node and HTML.

Each framework may contain files that are only included when the framework
is used in a project built for a particular environment  This is how we are
able to create consistent interfaces across environments.  A general file may
define an abstraction, and then environment-specific files provide
specific implementations.

The framework's `Info.yaml` file defines which files to include for which
environments, via the `JSBundleEnvironments` dictionary.  There are currently
two acceptable keys in the dictionary: `html` and `node`.

It's important that environment-specific features are only used in
environment-specific files.  For example, a reference to `XMLHttpRequest` is
only acceptable in a file that only gets included in an HTML environment.

Building
===
You will not be required to run any builds.  A build would not verify much of
anything or flag errors.  It's more of a packaging step that is handled by
other systems.


Testing
===
Each framework has a corresponding test project.  For example, the `Foundation`
framework has a corresponding `FoundationTests` project.  In JSKit, the test
projects are all stored in the ./Tests/ folder.

Tests are designed using `TKTestSuite`.  Typically, there is a test suite for
each class.  For example, `JSObject` has `JSObjectTests`.  Each test suite 
has a number of test cases, which are individual methods.

Test suites and cases are auto-discovered.  Any `TKTestSuite` subclass with a
name ending in "Tests" will be discovered.  Any method in a `TKTestSuite`
with a name starting with "test" will be discovered.

Run tests with the `jskit test` command:
- Full framework: `npx jskit test Tests/FoundationTests`
- Single suite: `npx jskit test Tests/FoundationTests --suite JSObjectTests`
- Single case: `npx jskit test Tests/FoundationTests --suite JSObjectTests --case testObjectID`

The available assertions can be found in ./Frameworks/TestKit/TKAssert.js

Linting
===
Lint files after making changes with: `npx jskit lint path/to/file.js`.

Typically, no lint errors or warnings are allowed.

For W117 (reference is not defined), fix by adding an `// #import` for the
relevant file or framework, if applicable.

An import is not applicable in two cases:
- If the import would create a circular import
- If the reference is a built-in global from the environment

In such exception cases, you can use a `/* global: SomeName */` comment
to suppress the warning.

Use of null and undefined
===
JSKit has a strong preference for using `null` instead of `undefined`.  Some
code protects against both, but a lot of code assumes that only `null` will be
used.  With very few expections, nullable variables and properties should be
initialized to either an actual value or to `null`.

Dependencies
===
JSKit is designed to be self-contained, with its frameworks having no
dependencies on third party packages other than what the node and HTML
environments provide.

An exception is made only for dependencies that support development, such as
playwright.
