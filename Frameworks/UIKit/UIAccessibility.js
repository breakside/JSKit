// #import Foundation
'use strict';

JSProtocol("UIAccessibility", JSProtocol, {

    // Visibility
    isAccessibilityElement: false,
    accessibilityHidden: false,
    accessibilityLayer: null,

    // Role
    accessibilityRole: null,
    accessibilitySubrole: null,

    // Label
    accessibilityIdentifier: null,
    accessibilityLabel: null,
    accessibilityHint: null,

    // Value
    accessibilityValue: null,
    accessibilityValueRange: null,
    accessibilityChecked: null,

    // Properties
    accessibilityTextualContext: null,
    accessibilityMenu: null,
    accessibilityRowIndex: null,
    accessibilitySelected: null,
    accessibilityExpanded: null,
    accessibilityOrientation: null,
    accessibilityEnabled: false,
    accessibilityLevel: null,

    // Children
    accessibilityParent: null,
    accessibilityElements: [],

});

UIAccessibility.Checked = {
    on: "on",
    off: "off",
    mixed: "mixed"
};

UIAccessibility.Action = {
    cancel: "cancel",
    confirm: "confirm",
    decrement: "decrement",
    delete: "delete",
    increment: "increment",
    pick: "pick",
    press: "press",
    raise: "raise",
    showAlternateUI: "showAlternateUI",
    showDefaultUI: "showDefaultUI",
    showMenu: "showMenu",
};

UIAccessibility.Role = {
    application: "application",
    browser: "browser",
    activityIndicator: "activityIndicator",
    button: "button",
    cell: "cell",
    checkbox: "checkbox",
    colorWell: "colorWell",
    column: "column",
    comboBox: "comboBox",
    disclosureTriangle: "disclosureTriangle",
    drawer: "drawer",
    grid: "grid",
    group: "group",
    growArea: "growArea",
    handle: "handle",
    helpTag: "helpTag",
    image: "image",
    incrementor: "incrementor",
    layoutArea: "layoutArea",
    layoutItem: "layoutItem",
    levelIndicator: "levelIndicator",
    link: "link",
    list: "list",
    matte: "matte",
    menu: "menu",
    menuBar: "menuBar",
    menuBarItem: "menuBarItem",
    menuButton: "menuButton",
    menuItem: "menuItem",
    outline: "outline",
    pageRole: "pageRole",
    popupButton: "popupButton",
    popover: "popover",
    progressIndicator: "progressIndicator",
    radioButton: "radioButton",
    radioGroup: "radioGroup",
    relevanceIndicator: "relevanceIndicator",
    row: "row",
    ruler: "ruler",
    rulerMarker: "rulerMarker",
    scrollArea: "scrollArea",
    scrollBar: "scrollBar",
    sheet: "sheet",
    slider: "slider",
    splitGroup: "splitGroup",
    splitter: "splitter",
    text: "text",
    systemWide: "systemWide",
    tabGroup: "tabGroup",
    table: "table",
    textArea: "textArea",
    textField: "textField",
    toolbar: "toolbar",
    unknown: "unknown",
    valueIndicator: "valueIndicator",
    window: "window",

    // JSKit
    header: "header"
};

UIAccessibility.Subrole = {
    closeButton: "closeButton",
    collectionListSubrole: "collectionListSubrole",
    contentList: "contentList",
    decrementArrow: "decrementArrow",
    decrementPage: "decrementPage",
    definitionList: "definitionList",
    descriptionList: "descriptionList",
    dialog: "dialog",
    floatingWindow: "floatingWindow",
    fullScreenButton: "fullScreenButton",
    incrementArrow: "incrementArrow",
    incrementPage: "incrementPage",
    minimizeButton: "minimizeButton",
    outlineRow: "outlineRow",
    ratingIndicator: "ratingIndicator",
    searchField: "searchField",
    sectionListSubrole: "sectionListSubrole",
    secureTextField: "secureTextField",
    sortButton: "sortButton",
    standardWindow: "standardWindow",
    switch: "switch",
    systemDialog: "systemDialog",
    systemFloatingWindow: "systemFloatingWindow",
    tab: "tab",
    tableRow: "tableRow",
    textAttachment: "textAttachment",
    textLink: "textLink",
    timeline: "timeline",
    toggle: "toggle",
    toolbarButton: "toolbarButton",
    unknown: "unknown",
    zoomButton: "zoomButton",

    // JSKit-added
    separator: "separator",
    tooltip: "tooltip",
    alert: "alert",
    menuItemRadio: "menuItemRadio",
    menuItemCheckbox: "menuItemCheckbox"
};

UIAccessibility.Orientation = {
    horizontal: 0,
    vertical: 1
};

UIAccessibility.Trait = {
    none:                     0,
    staticText:               1 << 1,
    header:                   1 << 2,
    image:                    1 << 3,
    link:                     1 << 4,
    button:                   1 << 5,
    tabBar:                   1 << 6,
    searchField:              1 << 7,
    summaryElement:           1 << 8,
    notEnabled:               1 << 9,
    selected:                 1 << 10,
    adjustable:               1 << 11,
    allowsDirectInteraction:  1 << 12,
    causesPageTurn:           1 << 13,
    playsSound:               1 << 14,
    startsMediaSession:       1 << 15,
    updatesFrequently:        1 << 16
};

UIAccessibility.TextualContext = {
    normal:         0,
    console:        1 << 0,
    fileSystem:     1 << 1,
    messaging:      1 << 2,
    narrative:      1 << 3,
    sourceCode:     1 << 4,
    spreadsheet:    1 << 5,
    wordProcessing: 1 << 6
};

UIAccessibility.Notification = {
    announcementRequested: "UIAccessibility.Notification.announcementRequested",
    elementCreated: "UIAccessibility.Notification.elementCreated",
    elementDestroyed: "UIAccessibility.Notification.elementDestroyed",
    firstResponderChanged: "UIAccessibility.Notification.firstResponderChanged",
    keyWindowChanged: "UIAccessibility.Notification.keyWindowChanged",
    mainWindowChanged: "UIAccessibility.Notification.mainWindowChanged",
    rowCountChanged: "UIAccessibility.Notification.rowCountChanged",
    rowExpanded: "UIAccessibility.Notification.rowExpanded",
    rowCollapsed: "UIAccessibility.Notification.rowCollapsed",
    selectedChildrenChanged: "UIAccessibility.Notification.selectedChildrenChanged",
    selectedTextChanged: "UIAccessibility.Notification.selectedTextChanged",
    titleChanged: "UIAccessibility.Notification.titleChanged",
    valueChanged: "UIAccessibility.Notification.valueChanged",
    visibilityChanged: "UIAccessibility.Notification.visibilityChanged",
    enabledChanged: "UIAccessibility.Notification.enabledChanged",
};