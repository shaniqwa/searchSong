
//upload files to source folder
$('.upload-btn').on('click', function (){
    $('#upload-input').click();
    $('.progress-bar').text('0%');
    $('.progress-bar').width('0%');
});

$('#upload-input').on('change', function(){

  var files = $(this).get(0).files;

  if (files.length > 0){
    // create a FormData object which will be sent as the data payload in the
    // AJAX request
    var formData = new FormData();

    // loop through all the selected files and add them to the formData object
    for (var i = 0; i < files.length; i++) {
      var file = files[i];

      // add the files to formData object for the data payload
      formData.append('uploads[]', file, file.name);
    }

    $.ajax({
      url: '/upload',
      type: 'POST',
      data: formData,
      processData: false,
      contentType: false,
      success: function(data){
          // console.log('upload successful!\n' + data);
          var msg = 'Uploaded is done\n' + data;
          BootstrapDialog.show({
            title: 'File Uploader',
            type: BootstrapDialog.TYPE_SUCCESS,
            message: msg,
            buttons: [{
                label: 'Close',
                action: function(dialog) {
                    window.location.reload();
                }
            }]
        });
      }
    });

  }
});




//trigger help dialogs - upload
$("#helpUpload").on('click',function(){
  var $textAndPic = $('<div></div>');
      $textAndPic.append('<h4>Document Format</h4>Before uploading, it\'s very important that you make sure you are familier with the expected document format.<br />The file should be a simple .txt<br>Here is an example:<br /><br />');
      $textAndPic.append('<img src="./images/doc-format.png" style="width:400px; display:block;margin: 0 auto" />');
      $textAndPic.append('The Author, Title and Summary tags are highly recomanded, because they will be displayed in the search results.<br />If you leave the Summary tag empty, an autometic summary will be created from the begining of the body.<div class="hr-line-dashed"></div>To upload, click the upload button and choose one or more files.');
      BootstrapDialog.show({
            title: 'File Uploader',
            buttons: [{
                label: 'Got It!',
                cssClass: 'btn-primary',
                action: function(dialog) {
                    dialog.close();
                }
            }],
            message: $textAndPic
        });
  });

//trigger help dialogs - index
$("#helpIndex").on('click',function(){
      var $textAndPic = $('<div></div>');
      $textAndPic.append('After you have uploaded some documents to the Source Folder, it\'s time to index those words.<br /> If there are some files waiting in the Source Folder, the Index button will be enabled. All you have to do is click the index button and the process will begin.<br /> At the end your page will refresh and you will be able to search the new documents');
      BootstrapDialog.show({
            title: 'Indexing',
            buttons: [{
                label: 'Got It!',
                cssClass: 'btn-primary',
                action: function(dialog) {
                    dialog.close();
                }
            }],
            message: $textAndPic
        });
  });


//trigger help dialogs - hide
$("#helpHide").on('click',function(){
      var $textAndPic = $('<div></div>');
      $textAndPic.append('To hide documents from search results, simply check the names you want to hide and click the Hide button.<br>After the process is done the page will reload and you will see the hidden documents at the Show Documents list');
      BootstrapDialog.show({
            title: 'Hide Documents',
            buttons: [{
                label: 'Got It!',
                cssClass: 'btn-primary',
                action: function(dialog) {
                    dialog.close();
                }
            }],
            message: $textAndPic
        });
  });




//trigger help dialogs - show
$("#helpShow").on('click',function(){
      var $textAndPic = $('<div></div>');
      $textAndPic.append('To show documents that are now hidden from search results, simply check the names you want to show and click the Show button.');
      BootstrapDialog.show({
            title: 'Show Documents',
            buttons: [{
                label: 'Got It!',
                cssClass: 'btn-primary',
                action: function(dialog) {
                    dialog.close();
                }
            }],
            message: $textAndPic
        });
  });