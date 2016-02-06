$("document").ready(function(){
  
  $("article h1 a").click(function(){
    var parent = $(this).attr("href");
    $(".more").not($(".more", $(parent))).slideUp(300);
    $(".more", $(parent)).slideDown(300, function(){
      var targetScrollOffset = $(parent).offset().top;
      $('html, body').animate({scrollTop: targetScrollOffset + "px"}, 500);
    });
    return false;
  });
  
});