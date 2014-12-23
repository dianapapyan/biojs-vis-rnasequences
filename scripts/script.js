$(document).ready(function(e) {

    function readTextFile(file) {
        var newSplitted = [];
        var rawFile = new XMLHttpRequest();
        rawFile.open("GET", file, false);
        rawFile.onreadystatechange = function () {
            if (rawFile.readyState === 4) {
                if (rawFile.status === 200 || rawFile.status == 0) {
                    var allText = rawFile.responseText;
                    var textArraySplited = allText.split("\n");
                    for (var i = 0; i < textArraySplited.length; i++) {
                        newSplitted[i] = textArraySplited[i].split("\t");
                    }
                }
            }
        }
        rawFile.send(null);

        return newSplitted;
    }
    
    function numberToRGB(i) {
    	// red = 0° and green = 120°
    	// we convert the input to the appropriate hue value
    	//var hue = (120 * i)/maxValue;
    	
    	var normalizer = (maxValue/2)/255;
    	var red;
    	var green;
    	var blue;
    	
    	if (i <= maxValue/2){
    		red = (maxValue/2 - i) /normalizer;
    		green = 0;
    		blue = 0;	
    	}
    	else{
    		red = 0;
    		green = 0;
    		blue = (i - maxValue/2) /normalizer;
    	}
    	// we format to css value and return
    	return 'rgb(' + red + ',' + green + ',' + blue + ')'; 
	}

    function drawHeatmap(fileData, zoomRectId, canvasName,start,end) {

		start = Math.round(start);
		end = Math.round(end);
	
    	var canvas = document.getElementById(canvasName);
    	var context = canvas.getContext('2d');
    	context.clearRect(0, 0, canvas.width, canvas.height)
    	//context.canvas.width  = window.innerWidth;
    	//context.canvas.height = window.innerHeight;
    
    	var heightPixelSize = canvas.height/(end-start);
    	var widthPixelSize = heightPixelSize;
    
    	if (heightPixelSize < 1){
    		widthPixelSize = heightPixelSize + 1;
    	}
    
    	if (zoomRectId !== ''){
			var $zoomRect = $('#' + zoomRectId);
			var borderSize = $zoomRect.css("border-left-width").replace(/[^-\d\.]/g, '');
			$zoomRect.css("width",  (fileData[1].length * widthPixelSize - 2 * borderSize) + "px");
		}
        
    	canvas.width = fileData[1].length * widthPixelSize;

    	for (var i = start; i < end; i++) {
    		for (var j = 1; j < fileData[i].length; j++) {
    			//context.beginPath();
               /*
                if (fileData[i][j] < 100) {
                    context.fillStyle = "#00FF00";
                }
                else {
                    context.fillStyle = "#FF0000";
                }
                */
                context.fillStyle = numberToRGB(fileData[i][j]);
                context.fillRect((j - 1)* widthPixelSize, (i - start) *heightPixelSize, widthPixelSize, heightPixelSize);
                //context.fill();
            }
        }
    }
        
    function drawText(fileData, canvasName, start, end) {
		start = Math.round(start);
		end = Math.round(end);
			
   		var canvas = document.getElementById(canvasName);
    	var context = canvas.getContext('2d');
    	context.clearRect(0, 0, canvas.width, canvas.height)
    	//context.canvas.width  = window.innerWidth;
    	//context.canvas.height = window.innerHeight;
    
    	var heightPixelSize = canvas.height/(end-start);

    	for (var i = start; i < end; i++) {	
    		context.fillStyle = "black";
  			//context.font = "bold 10px Arial";
  			context.fillText(fileData[i][0], 0, (i-start) * heightPixelSize);
        }
    }

    var fileData = readTextFile("RNA_seq.txt");
    
    var maxValue = fileData[1][1];
    var minValue = fileData[1][1];
    for (var i = 1; i < fileData.length; i++) {
            for (var j = 1; j < fileData[i].length; j++) {
                if (fileData[i][j] > maxValue){
                	maxValue = fileData[i][j];
                }
                if (fileData[i][j] < minValue){
                	minValue = fileData[i][j];
                }
            }
        }
        
        console.log("maxValue " + maxValue);
        console.log("minValue " + minValue);

    //var zoomRegionAspectRatio = $('.original.container').height()/$('.original.container .zoomRegion').height();
	
	var originalCanvas = document.getElementById('wholeHeatmap');
	var originalCanvasRowSizeInPixels = originalCanvas.height/(fileData.length - 1);
	
	var firstZoomTopMargin = $('.original.container .zoomRegion').css('margin-top').replace(/[^-\d\.]/g, '');
	var firstZoomStartRow = 1
    var firstZoomLastRow = firstZoomStartRow + $('.original.container .zoomRegion').height()/originalCanvasRowSizeInPixels;
    
    var firstZoomedCanvas = document.getElementById('firstZoomedHeatmap');
	var firstCanvasRowSizeInPixels = firstZoomedCanvas.height/(firstZoomLastRow - firstZoomStartRow);
	
	var secondZoomTopMargin = $('.firstZoom.container .zoomRegion').css('margin-top').replace(/[^-\d\.]/g, '');
	var secondZoomStartRow = 1
    var secondZoomLastRow = secondZoomStartRow + $('.firstZoom.container .zoomRegion').height()/firstCanvasRowSizeInPixels;

    drawHeatmap(fileData, 'firstZoomRect', 'wholeHeatmap', 1, fileData.length);
    drawHeatmap(fileData, 'secondZoomRect','firstZoomedHeatmap', firstZoomStartRow, firstZoomLastRow);
    drawHeatmap(fileData, '','secondZoomedHeatmap', secondZoomStartRow, secondZoomLastRow);
    drawText(fileData, 'textCanvas', secondZoomStartRow, secondZoomLastRow);
    
    $(document).on('mousemove', '.container', function(e) {
        var $container = $(this);
        var $zoomRegion = $container.find('.zoomRegion');
        var relY = e.pageY - $container.offset().top;
        var marginTop = relY-$zoomRegion.height()/2;

        if (marginTop > 0 && marginTop+$zoomRegion.outerHeight()<$container.height()) {
            $zoomRegion.css('margin-top', marginTop+'px');
            firstZoomTopMargin = $('.original.container .zoomRegion').css('margin-top').replace(/[^-\d\.]/g, '');
			if (firstZoomTopMargin/originalCanvasRowSizeInPixels < 1)
			{
				firstZoomStartRow = 1;
			}
			else
			{
				firstZoomStartRow = firstZoomTopMargin/originalCanvasRowSizeInPixels;
			}
    		firstZoomLastRow = firstZoomStartRow + $('.original.container .zoomRegion').height()/originalCanvasRowSizeInPixels;
    		
    		firstZoomedCanvas = document.getElementById('firstZoomedHeatmap');
    		firstCanvasRowSizeInPixels = firstZoomedCanvas.height/(firstZoomLastRow - firstZoomStartRow);
    		
    		secondZoomTopMargin = $('.firstZoom.container .zoomRegion').css('margin-top').replace(/[^-\d\.]/g, '');
    		if (firstZoomStartRow + secondZoomTopMargin/firstCanvasRowSizeInPixels < 1)
			{
				secondZoomStartRow = 1;
			}
			else
			{
				secondZoomStartRow = firstZoomStartRow + secondZoomTopMargin/firstCanvasRowSizeInPixels;
			}
    		secondZoomLastRow = secondZoomStartRow + $('.firstZoom.container .zoomRegion').height()/firstCanvasRowSizeInPixels;
    		
    		setInterval(function() {
    			drawHeatmap(fileData, 'secondZoomRect','firstZoomedHeatmap', firstZoomStartRow, firstZoomLastRow);
    			drawHeatmap(fileData, '','secondZoomedHeatmap', secondZoomStartRow, secondZoomLastRow);
    			drawText(fileData, 'textCanvas', secondZoomStartRow, secondZoomLastRow);
    		},70); 
    		
            /*
            var zoomMarginTop = (-1)*marginTop*zoomRegionAspectRatio;
            var zoomContainerSelector = $container.data('zoom-container');
            $(zoomContainerSelector).find('canvas').css('margin-top', zoomMarginTop+'px');
            */
        }
 	});
 	
 	var data = fileData[1];//[280, 45, 133, 166, 84, 259, 266, 960, 219, 311, 67, 89];

        var lineGraph = new RGraph.Line({
            id: 'cvs',
            data: data,
            options: {
                labels: fileData[0],
                title: "Genes",
                text: {
                	angle:90
                },
                gutter: {
                    left: 35
                }
            }
        }).draw()

});