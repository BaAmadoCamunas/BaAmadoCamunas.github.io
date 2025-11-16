/*
    Multiverse by HTML5 UP
    html5up.net | @ajlkn
    Free for personal and commercial use under the CCA 3.0 license (html5up.net/license)
*/

(function($) {

    var $window = $(window),
        $body = $('body'),
        $wrapper = $('#page-wrappers'),
        $banner = $('#banner'),
        $header = $('#header');

    // Breakpoints.
    breakpoints({
        xlarge:  [ '1281px',  '1680px' ],
        large:   [ '981px',   '1280px'  ],
        medium:  [ '737px',   '980px'   ],
        small:   [ '481px',   '736px'   ],
        xsmall:  [ null,      '480px'   ]
    });

    // Play initial animations on page load.
    $window.on('load', function() {
        window.setTimeout(function() {
            $body.removeClass('is-preload');
        }, 100);
    });

    // Hack: Enable IE workarounds.
    if (browser.name == 'ie')
        $body.addClass('ie');

    // Touch?
    if (browser.mobile)
        $body.addClass('is-mobile');
    else {
        breakpoints.on('>medium', function() { $body.removeClass('is-mobile'); });
        breakpoints.on('<=medium', function() { $body.addClass('is-mobile'); });
    }

    // Transitions supported?
    if (browser.canUse('transition')) {
        var resizeTimeout;

        $window.on('resize', function() {
            window.clearTimeout(resizeTimeout);
            $body.addClass('is-resizing');
            resizeTimeout = window.setTimeout(function() {
                $body.removeClass('is-resizing');
            }, 100);
        });
    }

    // Scroll back to top.
    $window.scrollTop(0);

    // Panels.
    var $panels = $('.panel');

    $panels.each(function() {
        var $this = $(this),
            $toggles = $('[href="#' + $this.attr('id') + '"]'),
            $closer = $('<div class="closer" />').appendTo($this);

        $closer.on('click', function(event) {
            $this.trigger('---hide');
        });

        $this
            .on('click', function(event) { event.stopPropagation(); })
            .on('---toggle', function() {
                if ($this.hasClass('active'))
                    $this.triggerHandler('---hide');
                else
                    $this.triggerHandler('---show');
            })
            .on('---show', function() {
                if ($body.hasClass('content-active'))
                    $panels.trigger('---hide');
                $this.addClass('active');
                $toggles.addClass('active');
                $body.addClass('content-active');
            })
            .on('---hide', function() {
                $this.removeClass('active');
                $toggles.removeClass('active');
                $body.removeClass('content-active');
            });

        $toggles
            .removeAttr('href')
            .css('cursor', 'pointer')
            .on('click', function(event) {
                event.preventDefault();
                event.stopPropagation();
                $this.trigger('---toggle');
            });
    });

    // Global events.
    $body.on('click', function(event) {
        if ($body.hasClass('content-active')) {
            event.preventDefault();
            event.stopPropagation();
            $panels.trigger('---hide');
        }
    });

    $window.on('keyup', function(event) {
        if (event.keyCode == 27 && $body.hasClass('content-active')) {
            event.preventDefault();
            event.stopPropagation();
            $panels.trigger('---hide');
        }
    });

    // Scrolly.
    $('.scrolly').scrolly({
        speed: 1500,
        offset: $header.outerHeight()
    });

    // Menu.
    $('#menu')
        .append('<a href="#menu" class="close"></a>')
        .appendTo($body)
        .panel({
            delay: 500,
            hideOnClick: true,
            hideOnSwipe: true,
            resetScroll: true,
            resetForms: true,
            side: 'right',
            target: $body,
            visibleClass: 'is-menu-visible'
        });

    // Header.
    if ($banner.length > 0 && $header.hasClass('alt')) {
        $window.on('resize', function() { $window.trigger('scroll'); });

        $banner.scrollex({
            bottom: $header.outerHeight() + 1,
            terminate: function() { $header.removeClass('alt'); },
            enter: function() { $header.addClass('alt'); },
            leave: function() { $header.removeClass('alt'); }
        });
    }

    // Links.
    $header.find('a').each(function() {
        var $this = $(this), href = $this.attr('href');
        if (!href || href.charAt(0) == '#') return;
        $this.removeAttr('href').css('cursor','pointer').on('click', function(event){
            event.preventDefault();
            event.stopPropagation();
            window.location.href = href;
        });
    });

    // Footer.
    var $footer = $('#footer');
    $footer.find('.copyright').each(function() {
        var $this = $(this), $parent = $this.parent(), $lastParent = $parent.parent().children().last();
        breakpoints.on('<=medium', function() { $this.appendTo($lastParent); });
        breakpoints.on('>medium', function() { $this.appendTo($parent); });
    });

    // Main.
    var $main = $('#main');

    // Thumbs.
    $main.children('.thumb').each(function() {
        var $this = $(this),
            $image = $this.find('.image'), 
            $image_img = $image.children('img'),
            x;

        if ($image.length == 0) return;

        // Set background.
        $image.css('background-image', 'url(' + $image_img.attr('src') + ')');

        if (x = $image_img.data('position'))
            $image.css('background-position', x);

        $image_img.hide();
    });

    // Poptrox (solo si existen thumbs y la función está disponible)
    if ($main.children('.thumb').length && typeof $main.poptrox === 'function') {
        $main.poptrox({
            baseZIndex: 20000,
            caption: function($a) {
                var s = '';
                $a.nextAll().each(function() { s += this.outerHTML; });
                return s;
            },
            fadeSpeed: 300,
            onPopupClose: function() { $body.removeClass('modal-active'); },
            onPopupOpen: function() { $body.addClass('modal-active'); },
            overlayOpacity: 0,
            popupCloserText: '',
            popupHeight: 150,
            popupLoaderText: '',
            popupSpeed: 300,
            popupWidth: 150,
            selector: '.thumb > a.image',
            usePopupCaption: true,
            usePopupCloser: true,
            usePopupDefaultStyling: false,
            usePopupForceClose: true,
            usePopupLoader: true,
            usePopupNav: true,
            windowMargin: 50
        });

        // Hack: Set margins for xsmall safely
        breakpoints.on('<=xsmall', function() {
            if ($main[0]._poptrox) $main[0]._poptrox.windowMargin = 0;
        });
        breakpoints.on('>xsmall', function() {
            if ($main[0]._poptrox) $main[0]._poptrox.windowMargin = 50;
        });
    }

})(jQuery);
