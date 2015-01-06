$(document).ready(function(e) {
	
	mouseDownTrue = false;
	secondZoomStartRow = 1;
	textHeightPixelSize = 1;

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
    	
    	var normalizer = (maxValue/2)/255;
    	var red;
    	var green;
    	var blue;
    	
    	if (i <= maxValue/2){
    		red = Math.round((maxValue/2 - i) /normalizer);
    		green = 0;
    		blue = 0;	
    	}
    	else{
    		red = 0;
    		green = 0;
    		blue = Math.round((i - maxValue/2) /normalizer);
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
                context.fillStyle = numberToRGB(fileData[i][j]);
                context.fillRect((j - 1)* widthPixelSize, (i - start) *heightPixelSize, widthPixelSize, heightPixelSize);
            }
        }
    }
        
    function drawText(fileData, canvasName, start, end) {
		var startRow = Math.round(start);
		var endRow = Math.round(end);
			
   		var canvas = document.getElementById(canvasName);
    	var context = canvas.getContext('2d');
    	context.clearRect(0, 0, canvas.width, canvas.height);
    	//context.canvas.width  = window.innerWidth;
    	//context.canvas.height = window.innerHeight;
    
    	textHeightPixelSize = canvas.height/(endRow-startRow);

    	for (var i = startRow; i < endRow; i++) {	
    		context.fillStyle = "black";
  			//context.font = "bold 10px Arial";
  			context.fillText(fileData[i][0], 0, (i-startRow + 1) * textHeightPixelSize);
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

    //var zoomRegionAspectRatio = $('.original.container').height()/$('.original.container .zoomRegion').height();
	
	var originalCanvas = document.getElementById('wholeHeatmap');
	var originalCanvasRowSizeInPixels = originalCanvas.height/(fileData.length - 1);
	
	var firstZoomTopMargin = $('.original.container .zoomRegion').css('margin-top').replace(/[^-\d\.]/g, '');
	var firstZoomStartRow = 1;
    var firstZoomLastRow = firstZoomStartRow + $('.original.container .zoomRegion').height()/originalCanvasRowSizeInPixels;
    
    var firstZoomedCanvas = document.getElementById('firstZoomedHeatmap');
	var firstCanvasRowSizeInPixels = firstZoomedCanvas.height/(firstZoomLastRow - firstZoomStartRow);
	
	var secondZoomTopMargin = $('.firstZoom.container .zoomRegion').css('margin-top').replace(/[^-\d\.]/g, '');
	secondZoomStartRow = 1;
    var secondZoomLastRow = secondZoomStartRow + $('.firstZoom.container .zoomRegion').height()/firstCanvasRowSizeInPixels;

    drawHeatmap(fileData, 'firstZoomRect', 'wholeHeatmap', 1, fileData.length);
    drawHeatmap(fileData, 'secondZoomRect','firstZoomedHeatmap', firstZoomStartRow, firstZoomLastRow);
    drawHeatmap(fileData, '','secondZoomedHeatmap', secondZoomStartRow, secondZoomLastRow);
    drawText(fileData, 'textCanvas', secondZoomStartRow, secondZoomLastRow);
    
    $(document).on('mouseup', function(){
    	mouseDownTrue = false;
    });
    
    $( ".container" )
  	.mousedown(function(e) {
  		mouseDownTrue = true;
  		
  		var $container = $(this);
  		if ($container.attr('id') === 'textContainer')
  		{
        	var relY = e.pageY - $container.offset().top;
			var $canvas = $container.children( "canvas" );
			var selectedLineNumber = secondZoomStartRow + Math.floor(relY/textHeightPixelSize);
			alert("number of line " + selectedLineNumber);
  		}
  	})
  	.mousemove(function(e) 
  	{
  		if (mouseDownTrue)
  		{
    		var $container = $(this);
        	var $zoomRegion = $container.find('.zoomRegion');
        	var relY = e.pageY - $container.offset().top;
        	var marginTop = relY-$zoomRegion.height()/2;
        	
        	var $canvas = $container.children( "canvas" );

        	if (marginTop > 0 && marginTop+$zoomRegion.outerHeight()<$canvas.height()) {
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
					secondZoomStartRow = Math.round(firstZoomStartRow + secondZoomTopMargin/firstCanvasRowSizeInPixels);
				}
    			secondZoomLastRow = secondZoomStartRow + $('.firstZoom.container .zoomRegion').height()/firstCanvasRowSizeInPixels;
    		
    			drawHeatmap(fileData, 'secondZoomRect','firstZoomedHeatmap', firstZoomStartRow, firstZoomLastRow);
    			drawHeatmap(fileData, '','secondZoomedHeatmap', secondZoomStartRow, secondZoomLastRow);
    			drawText(fileData, 'textCanvas', secondZoomStartRow, secondZoomLastRow);
            
        	}
  		}
  	}.throttle(50));    
 	
 	var chart = new CanvasJS.Chart("chartContainer",
		{
			zoomEnabled: false,
			title:{
				text: "Genes"
			},
			axisY2:{
				valueFormatString:"0",
				
				maximum: 1000,
				interval: 100,
				interlacedColor: "#F5F5F5",
				gridColor: "#D7D7D7",      
	 			tickColor: "#D7D7D7"								
			},
            theme: "theme2",
            toolTip:{
            	shared: true
            },
			legend:{
				verticalAlign: "bottom",
				horizontalAlign: "center",
				fontSize: 15,
				fontFamily: "Lucida Sans Unicode"

			},
			data: [
			{        
				type: "line",
				lineThickness:3,
				axisYType:"secondary",
				showInLegend: true,           
				name: fileData[1][0], 
				dataPoints: [
				{ x: new Date(2001, 0), y: 0 },
				{ x: new Date(2002, 0), y: 0.001 },
				{ x: new Date(2003, 0), y: 0.01},
				{ x: new Date(2004, 0), y: 0.05 },
				{ x: new Date(2005, 0), y: 0.1 },
				{ x: new Date(2006, 0), y: 0.15 },
				{ x: new Date(2007, 0), y: 0.22 },
				{ x: new Date(2008, 0), y: 0.38  },
				{ x: new Date(2009, 0), y: 0.56 },
				{ x: new Date(2010, 0), y: 0.77 },
				{ x: new Date(2011, 0), y: 0.91 },
				{ x: new Date(2012, 0), y: 0.94 }


				]
			},
			{        
				type: "line",
				lineThickness:3,
				showInLegend: true,           
				name: "China",
				axisYType:"secondary",
				dataPoints: [
				{ x: new Date(2001, 00), y: 0.18 },
				{ x: new Date(2002, 00), y: 0.2 },
				{ x: new Date(2003, 0), y: 0.25},
				{ x: new Date(2004, 0), y: 0.35 },
				{ x: new Date(2005, 0), y: 0.42 },
				{ x: new Date(2006, 0), y: 0.5 },
				{ x: new Date(2007, 0), y: 0.58 },
				{ x: new Date(2008, 0), y: 0.67  },
				{ x: new Date(2009, 0), y: 0.78},
				{ x: new Date(2010, 0), y: 0.88 },
				{ x: new Date(2011, 0), y: 0.98 },
				{ x: new Date(2012, 0), y: 1.04 }


				]
			},
			{        
				type: "line",
				lineThickness:3,
				showInLegend: true,           
				name: "USA",        
				axisYType:"secondary",
				dataPoints: [
				{ x: new Date(2001, 00), y: 0.16 },
				{ x: new Date(2002, 0), y: 0.17 },
				{ x: new Date(2003, 0), y: 0.18},
				{ x: new Date(2004, 0), y: 0.19 },
				{ x: new Date(2005, 0), y: 0.20 },
				{ x: new Date(2006, 0), y: 0.23 },
				{ x: new Date(2007, 0), y: 0.261 },
				{ x: new Date(2008, 0), y: 0.289  },
				{ x: new Date(2009, 0), y: 0.3 },
				{ x: new Date(2010, 0), y: 0.31 },
				{ x: new Date(2011, 0), y: 0.32 },
				{ x: new Date(2012, 0), y: 0.33 }


				]
			}



			],
          legend: {
            cursor:"pointer",
            itemclick : function(e) {
              if (typeof(e.dataSeries.visible) === "undefined" || e.dataSeries.visible) {
              e.dataSeries.visible = false;
              }
              else {
                e.dataSeries.visible = true;
              }
              chart.render();
            }
          }
        });

		chart.render();

});