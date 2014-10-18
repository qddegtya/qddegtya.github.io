/**
 * Created by archer on 14/10/18.
 */

(function(){
    //获取github api followers
    $.getJSON("https://api.github.com/users/qddegtya/followers",function(data){
        //alert(data.length);
        $('.github--followers').text(data.length);
    });
}());

