/**
 * Activate gallery objects page-wide.
 * Not a fan of jQuery loops? No big deal - write yourself a vanilla JS one.
 * This was so I could get this out the door quicker.
 */
(function () {
    $(document).ready(function () {
        $("[data-gallery-constructor='true']").each(function () {
            var g = new Gallery(this);
            g.init();
        });
    });
})();