# Rainbow Folders Fixer

This is a plugin I made for personal use in [Obsidian](https://obsidian.md). It solves the issue of rainbow folders changing colors as DOM elements are loaded and unloaded (i.e. when scrolling) in the File explorer by making use of data attributes.

# How to use

In the plugin settings, there are three settings to be configured:

- Number of colors: the number of colors you want to iterate through.  
- Attribute name: this is what will be added to the element. For example, putting `"foldernumber"` in here will add an attribute called `"data-foldernumber"` to the element.  
- Apply recursively: toggle this on or off to have the rainbow iterate recursively through all subfolders, or to keep all children folders the same color as their parents.

In your CSS snippets or your theme, you now only need to do the following instead of relying on Nth-child implementations (though it may still be useful to keep that on hand and commented out in case you no longer wish to use this plugin):

```css
.nav-folder[data-foldernumber="1"] {
  --rainbowcolor: var(--rainbowcolor1);
}
.nav-folder[data-foldernumber="2"] {
  --rainbowcolor: var(--rainbowcolor2);
}
.nav-folder[data-foldernumber="3"] {
  --rainbowcolor: var(--rainbowcolor3);
}
/* etc... */
```
