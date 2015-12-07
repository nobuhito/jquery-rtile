// http://qiita.com/itmammoth/items/94a19f538cf812e61906
// https://github.com/itmammoth/jqueryPluginTemplateUsingClass
// http://www.almondlab.jp/notes/1015
// http://www.6666666.jp/design/addmaxwidth/


var settings;
var colCount = {};
var columnWidth = {};
var heights = {};
var counter = {};
var items = {};
var itemCount = {};
var timer = {};

var observer;

function progressWait(selector) {
  $(selector).find(".rtile-progress-wait")
    .animate(
      {"left": ($(selector).width() -100 )+ "px"},
      1000,
      "swing",
      function() {
          $(selector).find(".rtile-progress-wait")
            .css("left", "0px");
          progressWait(selector);
      });
}

(function($) {
  var methods = {
    init: function(options) {
      var selector = $(this).selector;

      settings = $.extend({
        "minWidth": 640,
        "transition": "fadeIn", // fadeIn or slideIn
        "speed": "slow",
        "deley": 500,
        cb: function(){}
      }, options);

      $(this).text("");

      $(this)
        .append(
          $("<div>")
            .addClass("rtile-progress-wait")
            .css({
              "position": "relative",
              "background-color": "red",
              "left": "0px",
              "top": "0px",
              "height": "1px",
              "width": "50px",
              "margin": "0px",
              "padding": "0px"
            })
        )
        .append(
          $("<div>")
            .addClass("rtile-progress")
            .css({
              "position": "relative",
              "display": "none",
              "background-color": "red",
              "left": "0px",
              "top": "0px",
              "height": "1px",
              "width": "10%",
              "margin": "0px",
              "padding": "0px"
            })
        );

      progressWait(selector);

      counter[selector] = 0;
      heights[selector] = [];
      items[selector] = [];
      itemCount[selector] = 0;
      timer[selector] = 0;

      observer = new ArrayObserver(items[selector]);
      var $this = this;
      observer.open(function(splices) {
        if (splices[0].removed.length > 0 && items[selector].length === 0) {
          itemCount[selector] = 0;
          $($this).find(".rtile-progress").width("100%");
          $($this).find(".rtile-progress").animate({"opacity": 0});
        }
        if (splices[0].addedCount > 0) {
          $($this).find(".rtile-progress").css("opacity", 1);
          itemCount[selector]++;
        }
        if (splices[0].addedCount > 0 && splices[0].index === 0) {
          run(selector);
        }
        if (splices[0].removed.length > 0 && items[selector].length > 0) {
          run(selector);
          $($this).find(".rtile-progress-wait").css("display", "none");
          var width = (itemCount[selector] - items[selector].length) * 100 / itemCount[selector];
          $($this)
            .find(".rtile-progress")
            .width(width + "%")
            .css("display", "block");
        }
      });


      colCount[selector] = ($(this).width() < settings.minWidth)?       1:
                           ($(this).width() < settings.minWidth * 1.5)? 2:
                                                                        3;

      var column = $($(".col_0")[0]);
      columnWidth[selector] = column.width();

      for (var i=0; i<colCount[selector]; i++) {
        $(this)
          .append(
            $("<div>")
              .addClass("rtile col_" + i)
              .css({
                "width": (100/colCount[selector]) + "%",
                "float": "left"
              })
          );
      }
      $(this).append("<div>").css("clear", "both");

      return this;
    },

    stop: function() {
      var selector = $(this).selector;
      clearTimeout(timer[selector]);
      observer.close();
      items[selector] = [];
    },

    add: function(element) {
      var selector = $(this).selector;
      setTimeout(function() {
        items[selector].push(element);
        Platform.performMicrotaskCheckpoint();
      }, 1);

      return this;
    }
  };

  function run(selector) {
    if (colCount[selector] === 0) { $.error("Does not initialize on jQuery.rtile"); }
    var element = $("<div>").append(items[selector][0]);
    var imgs = element.find("img");

    Promise
      .all(
        imgs.get().map(function(img) {
          return new Promise(function(resolve, reject) {
            var image = new Image();
            image.src = img.src;
            $(image).bind("load", {elm: img}, function(event) {
              var $target = $(event.data.elm);
              var per = columnWidth[selector] / this.width;
              var height = $target.attr("height");
              if (height === undefined) {
                $target
                  .attr("width", this.width + "px")
                  .attr("height", this.height + "px")
                  .css({
                    "height": ($target.css("height") === "0px")? "99%": $target.css("height"),
                    "width": ($target.css("width") === "0px")? "99%": $target.css("width")
                  });
              }
              resolve();
            });
          });
        })
      )
      .then(function(results) {
        var maxVal = 0;
        var minVal = heights[selector][0];
        var h = 0;
        if (counter[selector] < colCount[selector]) {
          h = append($(selector).find(".col_" + counter[selector]), element, settings);
          heights[selector][counter[selector]] = h;
        } else {
          var min = 0;
          for (var i in heights[selector]) {
        	  if (heights[selector][i] > maxVal) { maxVal = heights[selector][i]; }
            if (i === 0) { continue; }
            if (heights[selector][i] < minVal) {
              minVal = heights[selector][i];
              min = i;
            }
          }
          h = append($(selector).find(".col_" + min), element, settings);
          heights[selector][min] = heights[selector][min] + h;
        }
        counter[selector]++;
        timer[selector] = setTimeout(function() {
          var item = items[selector].shift();
          Platform.performMicrotaskCheckpoint();
        }, settings.deley);
      });
  }

  $.fn.rtile = function(method) {
    if (method && methods[method]) {
      return methods[method].apply(this, Array.prototype.slice.call(arguments, 1));
    } else if (typeof method === "object" || !method) {
      return methods.init.apply(this, arguments);
    } else {
      $.error("Method " + method + " does not exist on jQuery.rtile");
    }
  };
})(jQuery);

function append(target, element, settings) {
  var height = 0;
  if (settings.transition === "fadeIn") {
    height = appendFadeIn(target, element, settings);
  } else if (settings.transition === "slideIn") {
    height = appendSlideIn(target, element, settings);
  } else {
    $.error("Transition " + settings.transition + " does not exist on jQuery.rtile");
  }
  return height;
}

function appendFadeIn(target, element, settings) {
  element.css("opacity", 0);
  target.append(element);
  setTimeout(function() {
    element.fadeTo(settings.speed, 1);
  }, 1);
  if (typeof(settings.cb) === "function") {
    settings.cb.call(element);
  }
  return element.children().first().outerHeight(true);
}

function appendSlideIn(target, element, settings) {
  var margin = element.css("margin-top");
  var height = $(document).height();
  element.css("margin-top", height);
  target.append(element);
  setTimeout(function() {
    element.animate({"margin-top": margin}, settings.speed, "swing");
  }, 1);
  if (typeof(settings.cb) === "function") {
    settings.cb.call(element);
  }
  return element.children().first().outerHeight(true);
}
