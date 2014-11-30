/**
 * Created by archer on 14/10/18.
 */

(function(){

    $(document).ready(function(){

        var bannerContent = $("#sidebar--follow--info");
        var tmp = {};

        //定义各个组件
        var mobileQrCode = "<img src='../assets/images/qrcode.png'><span class='saoyisao'>扫一扫</span>";
        var weiboWidget = "<iframe width='100%' height='550' " +
            "class='share_self'  frameborder='0' scrolling='no' " +
            "src='http://widget.weibo.com/weiboshow/index.php?" +
            "language=&width=0&height=550&fansRow=2&ptype=1" +
            "&speed=0&skin=5&isTitle=0&noborder=0&isWeibo=" +
            "1&isFans=1&uid=1893906792&verifier=26da3846&dpc=1'></iframe>";


        var showBanner = function(modelId, what){
            modelId.addClass("currentfollow");
            bannerContent.html(what);
            bannerContent.fadeIn("slow");
        };

        var hideBanner = function(modelId){
            modelId.removeClass("currentfollow");
            bannerContent.fadeOut("slow");
            $(tmp.currentObj).removeClass("twinkling");
            delete(tmp.currentObj);

        };

        var switchContent = function(modelId){
            modelId.addClass("currentfollow");
            var caseInfo = modelId.text();
            switch(caseInfo){
                case "微博":
                    bannerContent.html(weiboWidget);
                    break;
                case "移动版":
                    bannerContent.html(mobileQrCode);
                    break;
            }
        };

        //获取github api followers
        $.getJSON("https://api.github.com/users/qddegtya/followers",function(data){
            //alert(data.length);
            $('.github--followers').text(data.length);
        });

        //扫一扫
        $('#mobile').click(function(event){
            //tmp.currentObj = event.target;
            var self = $(this);
            var text = self.text();

            if(!tmp.currentObj) {
                tmp.currentObj = self;

                if(bannerContent.is(":hidden")){
                    showBanner(self, mobileQrCode);
                }
                else if(bannerContent.is(":visible")){
                    hideBanner(self);
                }

                } else if(tmp.currentObj.text() !== text){
                    $(tmp.currentObj).addClass("twinkling");
                    //switchContent($(event.target));
                } else if(tmp.currentObj.text() === text){

                if(bannerContent.is(":hidden")){
                    showBanner(self, mobileQrCode);
                }

                else if(bannerContent.is(":visible")){
                    hideBanner(self);
                }
            }
        });

        //新浪微博组件
        $("#weibo").click(function(event){
            var self = $(this);
            var text = self.text();

           if(!tmp.currentObj){
               tmp.currentObj = self;

               if (bannerContent.is(":hidden")) {
                   showBanner(self, weiboWidget);
               }
               else if (bannerContent.is(":visible")) {
                   hideBanner(self);
               }

               } else if(tmp.currentObj.text() !== text){
                    $(tmp.currentObj).addClass("twinkling");
                    //switchContent($(event.target));
               } else if(tmp.currentObj.text() === text) {

               if (bannerContent.is(":hidden")) {
                   showBanner(self, weiboWidget);
               }

               else if (bannerContent.is(":visible")) {
                   hideBanner(self);
               }
           }
        });
    });

}());

