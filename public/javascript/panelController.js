var panel = angular.module("panel", ["checklist-model"]);

var model = {};

panel.controller("panel", function($scope, $http){
	$scope.panel = model;
	$scope.state = "";
	$scope.selection = [];


	$http.get("/stats").success(function(data){
		console.log(data);
		$scope.numOfFiles = data.numOfFiles;
		$scope.numOfDocs = data.numOfDocs;
		$scope.numOfIndex = data.numOfIndex;
		$scope.numOfWords = data.numOfWords;
		$scope.liveDocuments = [];
		$scope.hiddenDocuments = [];

		for(i in data.documents){
			if(!data.documents[i].delete){
				$scope.liveDocuments.push(data.documents[i]);
			}else{
				$scope.hiddenDocuments.push(data.documents[i]);
			}
		}
		if($scope.numOfFiles == 0){
			$scope.state = "disabled";
		}
	});

	$scope.hideDocs = function(){
		$http.post("/hideDocs", {selection:$scope.selection}).success(function(data){
			setTimeout(function () {
            $("#hide-btn").button('reset');
            window.location.reload();
        }, 1000)

			console.log(data);
		});
		
		
	};

		$scope.showDocs = function(){
		$http.post("/showDocs", {selection:$scope.selection}).success(function(data){
			setTimeout(function () {
            $("#show-btn").button('reset');
            window.location.reload();
        }, 1000)

			console.log(data);
		});
		
		
	};
});