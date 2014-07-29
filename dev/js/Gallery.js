/**
 * Gallery.js   A robust slideshow for quick deployment. Requires jQuery 1.7.2 or later. See documentation
 *              for required markup structures, or read the source :)
 *
 * @author      Layton Miller [layton.miller@razorfish.com]
 * @date        7.10.2014
 * @version     1.1 (release date 7.29.2014)
 */

/**
 * @constructor
 *
 * @param {object} gallery  A jQuery selection containing the gallery constructor div. This div contains all of the
 *                          "config" options as data tags. These options are:
 *
 *                          data-gallery-display-id             The DOM ID of the primary display div for the gallery.
 *                                                              REQUIRED
 *
 *                          data-gallery-thumbs-id              The DOM ID of the thumbs container for the gallery.
 *                                                              REQUIRED
 *
 *                          data-gallery-controls-id            The DOM ID of the div containing controls for the
 *                                                              primary gallery display.
 *                                                              Not required.
 *
 *                          data-gallery-thumbs-controls-id     The DOM ID of the div containing controls for the
 *                                                              thumbnails (pagination controls).
 *                                                              Not required.
 *
 *                          data-gallery-set-size               The maximum number of thumbnails that are visible
 *                                                              at any given time. Will default to 5 if no value
 *                                                              was passed.
 *                                                              Not required
 *
 *                          data-gallery-auto-rotate            An integer in milliseconds of how long the gallery
 *                                                              will wait before automatically rotating to the next
 *                                                              slide. Not recommended for use alongside manual controls.
 *                                                              Non-zero integers will activate this, otherwise it will
 *                                                              be disabled.
 *                                                              Not required
 *
 *                          data-gallery-clear-auto-on-interact A boolean defining whether or not the user interacting
 *                                                              with the controls will stop the auto rotation timer.
 *                                                              Not required.
 */
var Gallery = function (gallery) {
    var context = this;
    gallery = $(gallery);
    var options = {
        displayID: gallery.attr("id"),
        thumbsID: gallery.data("gallery-thumbs-id"),
        galleryControlsID: gallery.data("gallery-controls-id"),
        thumbsControlsID: gallery.data("gallery-thumbs-controls-id"),
        setSize: gallery.data("gallery-set-size"),
        autoRotate: gallery.data("gallery-auto-rotate"),
        clearAutoRotateOnInteract: gallery.data("gallery-clear-auto-on-interact")
    };
    this.display = $("#" + options.displayID);
    this.thumbs = $("#" + options.thumbsID);
    if (options.setSize >= 0) {
        this.setSetSize(options.setSize);
    }
    else {
        this.setSetSize(5);
    }
    this.controls = $("#" + options.galleryControlsID);
    this.thumbsControls = $("#" + options.thumbsControlsID);
    this.closeButton = this.controls.find(".close");
    this.nextButton = this.controls.find(".next");
    this.prevButton = this.controls.find(".previous");
    this.nextPageButton = this.thumbsControls.find(".next");
    this.prevPageButton = this.thumbsControls.find(".previous");
    this.currentPage = 0;
    this.thumbs.css({position: "relative"});
    this.bodyTag = $("body");
    this.isInitCall = true;
    this.inTransition = false;
    this.inTransitionThumbs = false;
    //currentIndex starts at -1 for init purposes (see init method)
    this.currentIndex = -1;
    this.autoRotateIntervalLength = options.autoRotate;
    this.autoRotateInterval = null;
    this.clearAutoRotateOnInteract = options.clearAutoRotateOnInteract || false;

    //Open gallery when an item is clicked
    this.bodyTag.on("mousedown", "#" + options.thumbsID + " li", function () {
        if(context.inTransition === true){
            return;
        }
        var thumbIndex = $("#" + options.thumbsID + " li").index(this);
        if(thumbIndex === context.currentIndex){
            return;
        }
        if (context.clearAutoRotateOnInteract === true) {
            context.clearAutoRotateInterval.bind(context)();
        }
        var direction = thumbIndex < context.currentIndex ? context.constant("DIRECTION_PREVIOUS") : context.constant("DIRECTION_NEXT");
        context.open(this, direction);
    });

    //Close gallery when close button is clicked
    this.closeButton.length > 0 && this.closeButton.on("click", function(){
        if (context.clearAutoRotateOnInteract === true) {
            context.clearAutoRotateInterval.bind(context)();
        }
        context.close.bind(context)();
    });

    //Go to next item when next button is clicked
    this.nextButton.length > 0 && this.nextButton.on("click", function(){
        if (context.clearAutoRotateOnInteract === true) {
            context.clearAutoRotateInterval();
        }
        context.next.bind(context)();
    });

    //Go to previous item when previous button is clicked
    this.prevButton.length > 0 && this.prevButton.on("click", function(){
        if (context.clearAutoRotateOnInteract === true) {
            context.clearAutoRotateInterval.bind(context)();
        }
        context.previous.bind(context)();
    });

    //Go to next page when next page button is clicked
    this.nextPageButton.length > 0 && this.nextPageButton.on("click", function () {
        if (context.clearAutoRotateOnInteract === true) {
            context.clearAutoRotateInterval.bind(context)();
        }
        context.nextPage.bind(context)();
    });

    //Go to previous page when previous page button is clicked
    this.prevPageButton.length > 0 && this.prevPageButton.on("click", function () {
        if (context.clearAutoRotateOnInteract === true) {
            context.clearAutoRotateInterval.bind(context)();
        }
        context.previousPage.bind(context)();
    });

    //Allows access to un-saved gallery instance references off the prototype
    //(static variable)
    Gallery.prototype.instances.push(this);
};

Gallery.prototype = {
    /**
     * Initializes the slideshow
     */
    init: function () {
        this.next();
        this.startAutoRotate();
    },

    constant: function(name){
        switch(name.toLowerCase()){
            case "direction_next":
                return "next";
                break;
            case "direction_previous":
                return "previous";
                break;
            case "thumb_class_selected":
                return "selected";
                break;
            case "event_gallery_next":
                return "GalleryNext";
                break;
            case "event_gallery_previous":
                return "GalleryPrev";
                break;
            case "event_gallery_change":
                return "GalleryChange";
                break;
            case "event_gallery_close":
                return "GalleryClose";
                break;
            default:
                return null;
                break;
        }
    },


    /**
     * Displays the requested slide, transitioning it from the requested direction.
     * Fires a "GalleryChange" event off the body.
     *
     * @param {object} target       A jQuery selection of the target thumbnail that is
     *                              going to be used as the next slide
     *
     * @param {string} direction    The direction that was requested ("next" or "prev").
     *                              This affects which way the slide transitions in.
     */
    open: function (target, direction) {
        var context = this;
        var subject;
        var slide = $("<div></div>").addClass("transition");
        var startX;
        var endX;

        this.inTransition = true;

        //Clear the display area on init
        if (this.isInitCall === true) {
            this.display.html("");
        }

        if ($(target).data("img-src") && $(target).data("img-src").length > 0) {
            //Using the "new Img();" syntax causes IE to add arbitrary width and height attributes
            //directly to the image tag. jQuery handles this issue.
            subject = $("<img>");
            subject.attr("src", $(target).data("img-src"));
            slide.html(subject);
        }
        else if ($(target).data("dom-id") && $(target).data("dom-id").length > 0) {
            this.slide = $(target).data("dom-id");
            slide.html($("#" + this.slide).clone());
        }

        if(direction.toLowerCase() === this.constant("DIRECTION_PREVIOUS")){
            this.display.prepend(slide);
            startX = -this.display.outerWidth();
            endX = 0;
        }
        else{
            this.display.append(slide);
            startX = 0;
            endX = -this.display.outerWidth();
        }

        this.display.addClass("inTransition");
        this.display.css({
            left: startX + "px",
            position: "relative"
        });

        var callback = function () {
            //Remove the old element
            context.display.find(".slide").remove();
            //Reset position of slider div
            context.display.css({
                left: 0
            });
            context.currentIndex = $(target).index();
            context.display.removeClass("inTransition");
            context.inTransition = false;
            context.updateThumbs();
            window.requestAnimationFrame(function(){
                //If the window is not in focus when the slide changes, requestAnimationFrame won't fire.
                //That means that the slide class won't ever update, and on subsequent auto-rotations
                //won't be removed. This means that if the user unfocuses the window for a prolonged amount
                //of time the slides will stack up. Need to add a remove call here as well.
                context.display.find(".slide").remove();
                slide.removeClass("transition");
                slide.addClass("slide");
            });
        };

        if(this.isInitCall === true){
            callback();
            this.isInitCall = false;
        } else {
            this.display.animate(
                {left: endX + "px"},
                {
                    duration: 400,
                    complete: callback
                }
            );
        }

        this.controls.show();
        this.display.show();

        //Fire a slide change event
        $("body").trigger(this.constant("EVENT_GALLERY_CHANGE"), [this]);
    },



    /**
     * "Closes" the display div (hide). This is for galleries that are by default hidden
     * but that display when a thumbnail is clicked.
     * Fires a "GalleryClose" event off the body
     */
    close: function () {
        this.display.hide();
        this.controls.hide();
        this.thumbs.show();
        //Fire a gallery close event
        $("body").trigger(this.constant("EVENT_GALLERY_CLOSE"), [this]);
    },



    /**
     * Goes to the next slide.
     * Fires a "GalleryNext" event off the body
     */
    next: function () {
        if(this.inTransition === true){
            return;
        }
        //Increment to next index or 0 if at last index
        var numChildren = this.thumbs.children().length;
        var targetIndex = this.currentIndex + 1;
        if (targetIndex == numChildren) {
            targetIndex = 0;
        }
        //Grab the target element, close current one, and put up the new one.
        var target = this.thumbs.children().eq(targetIndex);
        this.open(target, this.constant("DIRECTION_NEXT"));
        //Fire a gallery "next" event
        $("body").trigger(this.constant("EVENT_GALLERY_NEXT"), [this]);
    },



    /**
     * Goes to the previous slide
     * Fires a "GalleryPrev" event off the body
     */
    previous: function () {
        if (this.inTransition === true) {
            return;
        }
        var target;
        //Decrement to previous index or numChildren - 1 if at 0 index
        var thumbsChildren = this.thumbs.children();
        var targetIndex = this.currentIndex - 1;
        if (targetIndex < 0) {
            targetIndex = thumbsChildren.length - 1;
        }
        //Grab the target element, close current one, and put up the new one.
        target = thumbsChildren.eq(targetIndex);
        this.open(target, this.constant("DIRECTION_PREVIOUS"));
        //Fire a gallery "next" event
        $("body").trigger(this.constant("EVENT_GALLERY_PREVIOUS"), [this]);
    },


    /**
     * Resets the gallery to the init() state - slide zero, resets timer, etc.
     */
    reset: function(){
        this.currentIndex = -1;
        this.isInitCall = true;
        this.clearAutoRotateInterval();
        this.next();
        this.startAutoRotate();
    },



    /**
     * Updates the thumbnail layout when applicable (e.g. which is selected,
     * which "set" the thumbnails are on, etc).
     */
    updateThumbs: function () {
        var page;
        var children = this.thumbs.children();
        var offset = null;
        var thumbWidth = this.thumbs.children().eq(0).outerWidth(true);

        //Update selected thumbnail indicator
        children.removeClass(this.constant("THUMB_CLASS_SELECTED"));
        children.eq(this.currentIndex).addClass(this.constant("THUMB_CLASS_SELECTED"));

        //A set size of zero indicates that there is no moving thumbnail functionality.
        //inTransitionThumbs set to true means we're already doing a transition.
        if (this.setSize === 0
            || this.inTransitionThumbs === true) {
            return;
        }

        var remainder = this.currentIndex % this.setSize;
        if (remainder === 0 || remainder === (this.setSize - 1) || this.currentIndex === children.length - 1) {
            if (remainder === 0) {
                page = this.currentIndex / this.setSize;
            }
            else if (remainder === (this.setSize - 1)) {
                page = ((this.currentIndex + 1) / this.setSize) - 1;
            }
            else {
                page = ((this.currentIndex - (this.currentIndex % this.setSize)) / this.setSize);
            }
            this.currentPage = page;

            offset = -page * this.setSize * thumbWidth;
        }
        else if (this.currentPage != Math.floor(this.currentIndex / this.setSize)) {
            this.currentPage = Math.floor(this.currentIndex / this.setSize);
            offset = -this.currentPage * this.setSize * thumbWidth;
        }

        if(offset){
            this.updateThumbsLocation(offset);
        }
    },



    /**
     * Go to the next page of thumbnails (pagination)
     */
    nextPage: function () {
        //inTransitionThumbs set to true means we're already doing a transition.
        if (this.inTransitionThumbs === true) {
            return;
        }
        var thumbWidth = this.thumbs.children().eq(0).outerWidth(true);
        var numPages = Math.ceil(this.thumbs.children().length / this.setSize);
        this.currentPage++;
        if (this.currentPage == numPages) {
            this.currentPage = 0;
        }
        var offset = -this.currentPage * this.setSize * thumbWidth;
        this.updateThumbsLocation(offset);
    },



    /**
     * Go to the previous page of thumbnails (pagination)
     */
    previousPage: function () {
        //inTransitionThumbs set to true means we're already doing a transition.
        if (this.inTransitionThumbs === true) {
            return;
        }
        var thumbWidth = this.thumbs.children().eq(0).outerWidth(true);
        var numPages = Math.ceil(this.thumbs.children().length / this.setSize);
        this.currentPage--;
        if (this.currentPage < 0) {
            this.currentPage = numPages - 1;
        }
        var offset = -this.currentPage * this.setSize * thumbWidth;
        this.updateThumbsLocation(offset);
    },


    /**
     * Handles the animation of the thumbnails
     * @param {int} offset
     */
    updateThumbsLocation: function(offset){
        var context = this;
        this.inTransitionThumbs = true;
        this.thumbs.animate({left: offset + "px"}, {
            duration: 500,
            complete: function () {
                context.inTransitionThumbs = false;
            }
        });
    },



    /**
     * Set the number of thumbnails in a "set" (for thumbnail pagination)
     * @param {Integer} setSize     The number of thumbnails in a set
     */
    setSetSize: function (setSize) {
        if (setSize >= 0) {
            this.setSize = setSize;
        }
        else {
            console.warn("Could not set setSize for Gallery - you must supply a valid numeric value.");
        }
    },



    /**
     * Start auto-rotating the slides. Requires that the object was instantiated with
     * auto-rotate enabled.
     */
    startAutoRotate: function () {
        //Enable auto rotate, if applicable
        if (this.autoRotateIntervalLength > 0) {
            this.clearAutoRotateInterval();
            this.autoRotateInterval = window.setInterval(this.next.bind(this), this.autoRotateIntervalLength);
        }
    },



    /**
     * Clears the automatic rotation timer if the option is set to do so
     * when a user interacts with the controls
     */
    clearAutoRotateInterval: function(){
        window.clearInterval(this.autoRotateInterval);
        this.autoRotateInterval = null;
    },



    /**
     * Static variable that will contain references to all instances of this Gallery object.
     */
    instances: [],



    /**
     * Returns the instance of the gallery that is bound to the DOM
     * element or jQuery selection passed. The passed element must be
     * the element that was used as the constructor (e.g. has the
     * data-gallery-constructor tag set)
     *
     * @param {Object} displayDiv       A DOM object or jQuery selection of the constructor to retrieve
     *                                  the gallery instance for.
     *                                  REQUIRED
     *
     * @returns {*} A Gallery object instance
     */
    getInstance: function(displayDiv){
        displayDiv = $(displayDiv);
        for(var i = 0; i < Gallery.prototype.instances.length; i++){
            var g = Gallery.prototype.instances[i];
            if(g.display.get(0) === displayDiv.get(0)){
                return g;
            }
        }
        return null;
    }
};