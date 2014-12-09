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

    function toColor(num) {
        num >>>= 0;
        var b = num & 0xFF,
            g = (num & 0xFF00) >>> 8,
            r = (num & 0xFF0000) >>> 16,
            a = ( (num & 0xFF000000) >>> 24 ) / 255;
        return "rgba(" + [r, g, b, a].join(",") + ")";
    }

    function rgb2hex(rgb) {
        rgb = rgb.match(/^rgba?[\s+]?\([\s+]?(\d+)[\s+]?,[\s+]?(\d+)[\s+]?,[\s+]?(\d+)[\s+]?/i);
        return (rgb && rgb.length === 4) ? "#" +
            ("0" + parseInt(rgb[1], 10).toString(16)).slice(-2) +
            ("0" + parseInt(rgb[2], 10).toString(16)).slice(-2) +
            ("0" + parseInt(rgb[3], 10).toString(16)).slice(-2) : '';
    }

    function drawHeatmap(fileData,canvasName,start,end) {

	start = Math.round(start);
	end = Math.round(end);
	
    var canvas = document.getElementById(canvasName);
    var context = canvas.getContext('2d');
    context.clearRect(0, 0, canvas.width, canvas.height)
    //context.canvas.width  = window.innerWidth;
    //context.canvas.height = window.innerHeight;
    
    var heightPixelSize = canvas.height/(end-start);

    for (var i = start; i < end; i++) {
            for (var j = 1; j < fileData[i].length; j++) {
                //context.beginPath();
               
                if (fileData[i][j] < 100) {
                    context.fillStyle = "#00FF00";
                }
                else {
                    context.fillStyle = "#FF0000";
                }
                //context.fillStyle = rgb2hex(toColor(fileData[i][j]));
                // context.fillRect(j - 1, (i - 1) * 0.03, 1, 0.03);
                context.fillRect(j - 1, (i - start) *heightPixelSize, 1, heightPixelSize);
                //context.fill();
            }
        }
/*
    //$("#canvasImg").elevateZoom({tint:true, tintColour:'#F90', tintOpacity:0.5});

    //var canvasZoomed = document.getElementById('firstZoomedHeatmap');
    var canvasZoomed = document.getElementById(scaledCanvas);
    var contextZoomed = canvasZoomed.getContext('2d');
    contextZoomed.scale(10,10);
    contextZoomed.drawImage(canvas, 0, 0);

    */


    }

    var fileData = readTextFile("RNA_seq.txt");

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
	
    drawHeatmap(fileData,'wholeHeatmap', 1, fileData.length);
    drawHeatmap(fileData,'firstZoomedHeatmap', firstZoomStartRow, firstZoomLastRow);
    drawHeatmap(fileData,'secondZoomedHeatmap', secondZoomStartRow, secondZoomLastRow);
    
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
    		
    		drawHeatmap(fileData,'firstZoomedHeatmap', firstZoomStartRow, firstZoomLastRow);
    		drawHeatmap(fileData,'secondZoomedHeatmap', secondZoomStartRow, secondZoomLastRow);
            /*
            var zoomMarginTop = (-1)*marginTop*zoomRegionAspectRatio;
            var zoomContainerSelector = $container.data('zoom-container');
            $(zoomContainerSelector).find('canvas').css('margin-top', zoomMarginTop+'px');
            */
        }

        

    });
/*
    $(document).on('mouseover', '.secondZoom.container', function(e) {

        var $container = $(this);
        var $zoomRegion = $container.find('.zoomRegion');
        var relY = e.pageY - $container.offset().top;
        var marginTop = relY-$zoomRegion.height()/2;

        if (marginTop > 0 && marginTop+$zoomRegion.outerHeight()<$container.height()) {
            $zoomRegion.css('margin-top', marginTop+'px');
            var zoomMarginTop = (-1)*marginTop*zoomRegionAspectRatio;
            var zoomContainerSelector = $container.data('zoom-container');
            $(zoomContainerSelector).find('canvas').css('margin-top', zoomMarginTop+'px');
        }
        
    });

*/

});