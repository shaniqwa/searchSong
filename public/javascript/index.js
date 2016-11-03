
//post start indexing
$('.index-btn').on('click', function(){
  var $this = $(this);
  $this.button('loading');

    $.ajax({
      url: '/index',
      type: 'POST',
      data: null,
      processData: false,
      contentType: false,
      success: function(data){
        console.log(data);
          BootstrapDialog.show({
            title: 'Index New Files',
            type: BootstrapDialog.TYPE_SUCCESS,
            message: data.success,
            buttons: [{
                label: 'Close',
                action: function(dialog) {
                    $this.button('loading');
                    window.location.reload();
                }
            }]
        });
      },
    });
});

//trigger help dialog
  $("#help").on('click',function(){
      BootstrapDialog.show({
            title: 'How to search ?',
            buttons: [{
                label: 'Got It!',
                cssClass: 'btn-primary',
                action: function(dialog) {
                    dialog.close();
                }
            }],
            message: function(dialog) {
                var $message = $('<div></div>');
                var pageToLoad = dialog.getData('pageToLoad');
                $message.load(pageToLoad);
        
                return $message;
            },
            data: {
                'pageToLoad': '/help'
            }
        });
  });