# Addons
Addons in SimpliPlay desktop are a new feature introduced in v2.0.4. They are simply regular JavaScript files with the `.simpliplay` extension.

The process of loading an addon adds a script element with the src tag, along with other necessary info to distinguish it from a non-addon script tag.
When you unload an addon, it removes this element, but any lasting effects created by the addon (such as changing the app's background color) will last until you restart the app (closing and opening it again).
Non-lasting effects, like context menus (that use event listeners), will disappear upon unloading.
