/**
 * Created by archer on 14/10/18.
 */

(function (window, document, $) {
  var b2t = $("#b2t");

  $(window).scroll(function () {
    if ($(window).scrollTop() > 300) {
      b2t.addClass("show");
    } else {
      b2t.removeClass("show");
    }
  });

  b2t.on("click", function (e) {
    e.preventDefault();
    $("html, body").animate({ scrollTop: 0 }, "300");
  });
})(window, document, jQuery);
