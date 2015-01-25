/**
 * Created by archer on 14/10/18.
 */

(function($){
    $(document).ready(function() {
        //mouse init
        var mouseX = null;
        var mouseY = null;

        //mousemove
        $(".blog__head__img").mousemove(function (e) {

            //if mouseX and mouseY is status init
            if (!mouseX && !mouseY) {
                mouseX = e.clientX;
                mouseY = e.clientY;
            } else {

                //y
                if (mouseY > e.clientY) {
                    $(this).css("background-position", "left -100px");
                } else if (mouseY < e.clientY) {
                    $(this).css("background-position", "left -140px");
                } else if (mouseY === e.clientY) {
                    //
                }

                //new value
                mouseX = e.clientX;
                mouseY = e.clientY;

            }
        });


        $(".footer--mask").click(function(){
            setTimeout(function(){
                var topInterval = setInterval(function(){
                    if(document.body.scrollTop > 0){
                        document.body.scrollTop -= 16.67;
                    } else {
                        //stop
                        clearInterval(topInterval);
                    }
                }, 1);
            }, 100);
        });

        //移动端菜单
        $("#navopen").click(function(){
            $("#side_nav").css({ "width": "70%" });
        });

    });
}(jQuery));