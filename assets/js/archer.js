/**
 * Created by archer on 14/10/18.
 */

(function($){

    var _checkTransFormType = function(){
        var t;
        var el = document.createElement('fakeelement');
        var resultObj = {};
        var transforms = {
            'transform':'transform',
            'OTransform':'-o-transform',
            'MozTransform':'-moz-transform',
            'WebkitTransform':'-webkit-transform',
            'MsTransform':'-ms-transform'
        };

        for(t in transforms){
            if(el.style[t] !== undefined ){
                resultObj.k = t;
                resultObj.v = transforms[t];
                return resultObj;
            }
        }
    };

    $(document).ready(function() {
        //mouse init
        var mouseX = null;
        var mouseY = null;

        var prefix = _checkTransFormType();

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
            // setTimeout(function(){
            //     var topInterval = setInterval(function(){
            //         if(document.body.scrollTop > 0){
            //             document.body.scrollTop -= 16.67;
            //         } else {
            //             //stop
            //             clearInterval(topInterval);
            //         }
            //     }, 1);
            // }, 100);
        });

        //移动端菜单
        $("#navopen").click(function(){
            var that_ele = $("#side_nav");
            var m_ele = $("#side_nav_bg");
            that_ele.css(prefix.v, "translate3d(-150%,0,0)");
            m_ele.css("background", "rgba(0,0,0,0)");
            m_ele.css("display", "block");

            //延迟触发
            setTimeout(function(){
                that_ele.css({
                    "MozTransition": ".3s ease-out",
                    "WebkitTransition": ".3s ease-out",
                    "OTransition": ".3s ease-out"
                });

                m_ele.css({
                        "MozTransition": ".3s ease-out",
                        "WebkitTransition": ".3s ease-out",
                        "OTransition": ".3s ease-out"
                });

                that_ele.css("transition", prefix.v + " .3s ease-out");
                that_ele.css(prefix.v, "translate3d(0,0,0)");

                m_ele.css("transition", "background .3s ease-out");
                m_ele.css("background", "rgba(0,0,0,0.5)");

            }, 50);
        });

        //收菜单栏
        $("#side_nav_bg").click(function(){

            var that_ele = $("#side_nav");
            that_ele.css(prefix.v, "translate3d(0,0,0)");
            var m_ele = $("#side_nav_bg");
            m_ele.css("opacity", "0");

            //延迟触发
            setTimeout(function(){
                that_ele.css({
                    "MozTransition": ".3s ease-out",
                    "WebkitTransition": ".3s ease-out",
                    "OTransition": ".3s ease-out"
                });

                that_ele.css("transition", prefix.v + " .3s ease-out");
                that_ele.css(prefix.v, "translate3d(-150%,0,0)");

                m_ele.css("transition", "background .1s ease");
                m_ele.css("opacity", "0.65");

                m_ele.css("display", "none");

            }, 50);

        });

    });
}(jQuery));
