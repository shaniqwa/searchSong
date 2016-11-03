var app = angular.module("index", []).controller("indexController", ['$scope', '$http', '$sce',
    function ($scope, $http, $sce) {
        $scope.renderHtml = function (htmlCode) {
            return $sce.trustAsHtml(htmlCode);
        };
        $scope.keyword = "";
		$scope.resTime = "";
		$scope.noRes = false;
		$scope.searchResults = [];
		$scope.failMsg = "";

		$scope.highlight = function(haystack, needle) {
			var and = needle.indexOf("AND");
			var or = needle.indexOf("OR");
			var star = needle.indexOf("*");
			if(and >= 0){
				needle = needle.substr(0, and-1);
			}
			if(or >= 0){
				needle = needle.substr(0, or-1);
			}
			if(star >= 0){
				needle = needle.substr(0, star);
			}

		    if(!needle) {
		        return $sce.trustAsHtml(haystack);
		    }

		    return $sce.trustAsHtml(haystack.replace(new RegExp(needle, "gi"), function(match) {
		        return '<mark>' + match + '</mark>';
		    }));
		};

		$scope.search = function(text){
			$('.ibox-content').hide();
			$scope.searchResults = [];
			$scope.keyword = text;
			var start = new Date();
		  	$http.get('search/' + $scope.keyword).success(function(data){ 
		  		console.log(data);
		  		$scope.noRes = false;
		  		$scope.resTime = (new Date() - start) / 1000;
		    	$scope.searchResults = [];
		    	if(data.success){
		    		for (i in data.success){
		    			data.success[i].date = data.success[i].date.replace("T", "  ");
		    			data.success[i].date = data.success[i].date.substring(0, data.success[i].date.length-5);
		    			$('.ibox-content').show();
		    		}
		    		$scope.searchResults = data.success;
		    	}else if(data.fail){
					$scope.noRes = true;
					$scope.failMsg = data.fail;
					$('.ibox-content').show();
		    	}
		    	
		  	});
		};



		$scope.print = function(id) {
		    var iframe = document.getElementById(id);
		    iframe.contentWindow.print();
		};

    }]);

app.filter('orderObjectBy', function(){
 return function(input, attribute) {
    if (!angular.isObject(input)) return input;

    var array = [];
    for(var objectKey in input) {
        array.push(input[objectKey]);
    }

    array.sort(function(a, b){
        a = parseInt(a[attribute]);
        b = parseInt(b[attribute]);
        return b - a;
    });
    return array;
 }
});