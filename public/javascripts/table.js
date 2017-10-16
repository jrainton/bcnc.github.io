/*
   var retrieve = function(id) {
   var link = '/resume?filename=' + id;
   window.open(link);
   document.getElementById('ifram1').src = link;

   $.ajax({
   type: "GET",
   url: '/resume',
   data: {
   'filename': id
   },
   success: function(resp) {
   window.open('/resume?filename=' + id);
//window.open('http://stackoverflow.com/', '_blank');

//window.open("data:application/pdf," + encodeURI(resp)); 
//console.log('done');
}
});
};*/
var accept = function(id) {

    var user = {};
    user = JSON.parse(sessionStorage.getItem('userEntity'));

    // deliberate with yes
    $.ajax({
        url: '/deliberate',
        type: 'POST',
        data: {'id': id,

            // 1 means accept
            'accept': 1,
            'userEmail': user.email
        },
            success: function(result) {
                // change the color of the row
                console.log('Result: ' + result)
                if (result >= 5) {
                    document.getElementById(id).setAttribute('class', 'accept');
                }
                else {
                    document.getElementById(id).setAttribute('class', 'reject');
                }
            }
    });

};
var reject = function(id) {

    var user = {};
    user = JSON.parse(sessionStorage.getItem('userEntity'));

    // deliberate with no
    $.ajax({
        url: '/deliberate',
        type: 'POST',
        data: {
            'id': id,

            // 2 means reject
            'accept': 2,
            'userEmail': user.email

        },
        success: function(result) {
            // change the color of the row
            console.log('Result: ' + result)
            if (result >= 5) {
                document.getElementById(id).setAttribute('class', 'accept');
            }
            else {
                document.getElementById(id).setAttribute('class', 'reject');
            }
        }
    });

};

$(document).ready(function() {


    // redirects the user to log in if needed
    if(sessionStorage.getItem('userEntity') === null) {
        window.location.href = 'login';
    } else {

        var user = {};
        user = JSON.parse(sessionStorage.getItem('userEntity'));

        console.log(user.Name + " is logged in!");
    }

    // load up the table
    $('#table').removeClass('table-hover');

    $(".fancybox").fancybox({
        openEffect  : 'fade',
        closeEffect : 'elastic',
        iframe : {
            preload: false
        }
    });


});

