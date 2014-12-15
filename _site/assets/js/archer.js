/**
 * Created by archer on 14/10/18.
 */

(function(){

    $(document).ready(function(){

        var bannerContent = $("#sidebar--follow--info");
        var tmp = {};

        //定义各个组件
        var weixinQrCode = "<img src='../assets/images/qrcode-weixin.jpg'><span class='saoyisao'>微信号：archerblog</span>";
        var mobileQrCode = "<img src='../assets/images/qrcode.png'><span class='saoyisao'>扫一扫</span>";
        var weiboWidget = "<iframe width='100%' height='550' " +
            "class='share_self'  frameborder='0' scrolling='no' " +
            "src='http://widget.weibo.com/weiboshow/index.php?" +
            "language=&width=0&height=550&fansRow=2&ptype=1" +
            "&speed=0&skin=5&isTitle=0&noborder=0&isWeibo=" +
            "1&isFans=1&uid=1893906792&verifier=26da3846&dpc=1'></iframe>";


        //h3目录生成
        var mlHtml = "";
        var re = /<h3 id="(.*?)">([^<]+?)<\/h3>/gi;
        var blogContent = $("#singleblogcontent").html() || "";
        var ml = $("#contentml");
        var reMatch = blogContent.match(re);

        if(reMatch === null){
            mlHtml = "<li><a href='#'>暂无文章目录</a></li>";
        } else {
            for(r in reMatch){
                var curExe = re.exec(blogContent);
                mlHtml = mlHtml
                + "<li><a href='#" + curExe[1] + "'>"
                + curExe[2] + "</a></li>";
            }
        }

        //添加目录
        ml.html(mlHtml);

        var startTwink = function(times,interval,callbacks){
            var i = 1; //总共执行的次数
            var j = 0; //callback堆栈初始位置

            var thisInterval = setInterval(function(){
                if(i <= times){
                    if(j <= callbacks.length - 1){
                        callbacks[j].apply(this,arguments);
                        j++; //++
                    } else {
                        j = 0; //归位
                        callbacks[j].apply(this,arguments);
                    }

                    i++;

                } else {
                    stopTwink(thisInterval);
                }
            }, interval);
        };

        var stopTwink = function(interval){
            clearInterval(interval);
        };


        var showBanner = function(modelId, what){
            modelId.addClass("currentfollow");
            bannerContent.html(what);
            bannerContent.fadeIn("slow");
        };

        var hideBanner = function(modelId){
            modelId.removeClass("currentfollow");
            bannerContent.fadeOut("slow");
            $(tmp.currentObj).removeClass("greenfont"); //移除残留状态
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

                startTwink(9,200,[function(){
                    $(tmp.currentObj).removeClass("whitefont");
                    $(tmp.currentObj).addClass("greenfont");
                    //$(tmp.currentObj).removeClass("greenfont");
                }, function(){
                    $(tmp.currentObj).removeClass("greenfont");
                    $(tmp.currentObj).addClass("whitefont");
                    //$(tmp.currentObj).removeClass("whitefont");
                }]);

                //$(tmp.currentObj).addClass("twinkling");
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

        //微信组件
        $("#weixin").click(function(event){
            var self = $(this);
            var text = self.text();

            if(!tmp.currentObj){
                tmp.currentObj = self;

                if (bannerContent.is(":hidden")) {
                    showBanner(self, weixinQrCode);
                }
                else if (bannerContent.is(":visible")) {
                    hideBanner(self);
                }

            } else if(tmp.currentObj.text() !== text){

                startTwink(9,200,[function(){
                    $(tmp.currentObj).removeClass("whitefont");
                    $(tmp.currentObj).addClass("greenfont");
                    //$(tmp.currentObj).removeClass("greenfont");
                }, function(){
                    $(tmp.currentObj).removeClass("greenfont");
                    $(tmp.currentObj).addClass("whitefont");
                    //$(tmp.currentObj).removeClass("whitefont");
                }]);

                //$(tmp.currentObj).addClass("twinkling");
                //switchContent($(event.target));
            } else if(tmp.currentObj.text() === text) {

                if (bannerContent.is(":hidden")) {
                    showBanner(self, weixinQrCode);
                }

                else if (bannerContent.is(":visible")) {
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

                startTwink(9,200,[function(){
                    $(tmp.currentObj).removeClass("whitefont");
                    $(tmp.currentObj).addClass("greenfont");
                    //$(tmp.currentObj).removeClass("greenfont");
                }, function(){
                    $(tmp.currentObj).removeClass("greenfont");
                    $(tmp.currentObj).addClass("whitefont");
                    //$(tmp.currentObj).removeClass("whitefont");
                }]);

                //$(tmp.currentObj).addClass("twinkling");
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