Gallery
=======

Current Version: 1.1
Release Date: 7.29.2014

Description
===========
GalleryJS is a robust gallery module designed for rapid deployment. Coupled with proper CSS the functionality works all the way back to IE8 in quirks mode.
This gallery is designed to defeat the challenges presented by most gallery/slider implementation scenarios.

Business Objectives
===================
The objective of the Gallery module is to standardize and speed up the implementation of the various types slide galleries, and to support as
many types of gallery content as possible.

Scope
=====
The purpose of this document is to outline the technical implementation of the gallery module.

Audience
========
This document is targeted towards a technical audience looking to implement galleries on front-end web projects.

Integration details
===================

Overview
========
This module enables developers to quickly and uniformly implement galleries. Separating gallery view, gallery controls, thumbnails view, and
thumbnail controls into independent elements offers a great deal of flexibility.

The module supports two types of content:
-Image: Like any standard gallery, this gallery supports display of images
-DOM elements: In certain scenarios, it may be desired to have actual DOM content inside the display area of the player to accommodate
 things like CTA links or just lighter content. This is easily accomplished by specifying that the gallery place DOM elements with a specific
 ID inside the player area.
     
The module fires some events off of the body (more coming in the future) that will allow the developer to respond to change events, etc.

Requirements
============
-The toolkit requires that JavaScript is enabled.
-The toolkit requires that jQuery 1.7.2 or greater is installed.
	
Quick Start
===========
1. Include the Gallery.js module in the page head.
2. Inside the document.ready call, instantiate all Gallery modules on the page:
    (function () {
        $(document).ready(function () {
            $("[data-gallery-constructor='true']").each(function () {
                var g = new Gallery(this);
                g.init();
            });
        });
    })();
    
3.Add the base version of the gallery HTML code. The developer may need to add extra code for purposes of formatting, but this is
project-specific.
	a. The gallery requires a minimum of two elements:
		i. A div containing thumbnails.
		ii. A div for the main gallery display area.
	b. The gallery also accepts two optional elements:
		i. A div containing controls for the gallery display (typically set to position:absolute with a height of zero, and placed just
before the gallery div, allowing easy positioning of the controls around the player using positioning).
		ii. A div containing controls for the thumbnail slider (positioned similar to the main gallery controls).
	c. More robust versions of the player are quite common. For such implementations, check the examples section.
4. For each <li> within the thumbs <ul> element, specify which type of gallery element it is by simultaneously specifying the target full-size
content as a data-attribute tag. Fill each <li> with an image for the thumbnail.
5. For cases implementing gallery and thumbnail controls, adding and positioning elements of any type (img, div, etc) with the proper class
names is all that is needed to attain the functionality. Possible class names are “next”, “previous”, and “close”, each one doing what one
would assume it would do. The close element applies only to the main gallery controls block, and even then only when the gallery is
meant to show/hide when it is interacted with.