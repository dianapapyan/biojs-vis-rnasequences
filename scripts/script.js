$(document).ready(function(e) {
	
	mouseDownTrue = false;
	genesGraphArray = [];
	var parseGraphDataArray = [{
    			type: "line",
				dataPoints:[],
    		}];
	secondZoomStartRow = 1;
	textHeightPixelSize = 1;
	supportedFileTypes = ['txt', 'soft'];
	datasetStartIdentifier = '!dataset_table_begin';
	datasetEndIdentifier = '!dataset_table_end';

	//add listener to Load button
	document.getElementById ("btnLoad").addEventListener ("click", handleFileSelect, false);
	
	/**
 	* Parse RNA file
 	* @param {String} fileText - Text in the file which should be parsed
 	* @returns {String[][]} - Structured matrix from file text
 	*/
	function createMatrixFromText(fileText){
    	var newSplitted = [];
    	///clear chart
    	genesGraphArray.length = 0;
    	
        
        var textArraySplited = fileText.split("\n");
        if (extension === 'txt') {
        	for (var i = 0; i < textArraySplited.length; i++) {
        		newSplitted[i] = textArraySplited[i].split("\t");
        	}
        	newSplitted[0].splice(0,0,'Gene name');
        }
        else {
        	var startIndex = textArraySplited.indexOf(datasetStartIdentifier);
        	var endIndex = textArraySplited.indexOf(datasetEndIdentifier);
        	if (startIndex > -1) {
        		textArraySplited.splice(0, startIndex + 1);
        	}
        	
        	textArraySplited.splice(endIndex, 1);
        	
        	for (var i = 0; i < textArraySplited.length; i++){
        		newSplitted[i] = textArraySplited[i].split("\t");
        	}
        	var geneTitleLabelIndex = newSplitted[0].indexOf('Gene title');
        	var genebankAccessionLabelIndex = newSplitted[0].indexOf('GenBank Accession');
        	
        	for (var i = 0; i < newSplitted.length; i++){
        		if (newSplitted[i][genebankAccessionLabelIndex] === ''){
        			newSplitted.splice(i, 1);
        			i = i-1;
        		}
        		else{
        			newSplitted[i][0] = newSplitted[i][genebankAccessionLabelIndex];
        			newSplitted[i].splice(1, 1);
        			newSplitted[i].splice(geneTitleLabelIndex - 1, newSplitted[i].length - geneTitleLabelIndex + 1);
        		}
        	}
        }
        return newSplitted;
    }

	/**
 	* Read default file
 	* @param {String} file - File name, if needed with the full path
 	*/
	function readTextFile(file) {
		extension = 'txt';
        var parsedText = [];
        var rawFile = new XMLHttpRequest();
        rawFile.open("GET", file, false);
        rawFile.onreadystatechange = function () {
            if (rawFile.readyState === 4) {
                if (rawFile.status === 200 || rawFile.status == 0) {
                	parsedText = createMatrixFromText(rawFile.responseText);
                }
            }
        }
        rawFile.send(null);
        
        fileData = parsedText;   
        //draw everything
        $('.content').show();
        redrawAllCanvases();
        parseGraphArray();
        chart.render(); 
    }
 
    /**
 	* File selection and loading 
 	*/
    function handleFileSelect(){
    	if (!window.File || !window.FileReader || !window.FileList || !window.Blob) {
    		alert('The File APIs are not fully supported in this browser.');
    		return;
    	}
    	
    	input = document.getElementById('fileinput');
        if (!input) {
        	$( ".content" ).hide();  
        	alert("Um, couldn't find the fileinput element.");
        }
        else if (!input.files) {
        	$( ".content" ).hide();
        	alert("This browser doesn't seem to support the `files` property of file inputs.");
        }
        else if (!input.files[0]) {
        	$( ".content" ).hide();
        	alert("Please select a file before clicking 'Load'");
        }
        else {
        	extension = input.files[0].name.split('.').pop().toLowerCase();  //file extension from input file
        	var isSuccess = supportedFileTypes.indexOf(extension) > -1;
        	if (isSuccess)
        	{
        		file = input.files[0];
            	fr = new FileReader();
           		fr.onload = receivedText;
            	fr.readAsText(file);
        	}
        	else{
        		alert("Chosen file format is not supported. Please choose different file.")
        	}	
        }
    }

	/**
 	* After selected file is loaded receivedText() function will be called
 	*/
     function receivedText() {
        fileData = createMatrixFromText(fr.result);
        $('.content').show();
        redrawAllCanvases();
        parseGraphArray();
        chart.render();
     }
            
    /**
 	* Converting number to color 
 	* @param {Number} i - Number which should be converted into color
 	* @returns {String} - Color in RGB format
 	*/
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
    		green = Math.round((i - maxValue/2) /normalizer);;
    		blue = 0;
    	}
    	// we format to css value and return
    	return 'rgb(' + red + ',' + green + ',' + blue + ')'; 
	}

	/**
 	* General function to draw heatmap
 	* @param {String[][]} fileData - Matrix of RNA Sequences
 	* @param {String} zoomRectId - html id of the zooming rectangle 
 	* @param {String} canvasName - html id of the canvas on which it draw 
 	* @param {Number} start - row in file from which it should start drawing
 	* @param {Number} end - row in file until which it should draw
 	*/
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
			var borderSize = parseInt($zoomRect.css("border-left-width"));
			$zoomRect.css("width",  (fileData[1].length * widthPixelSize - 2 * borderSize) + "px");
		}
        
    	canvas.width = fileData[1].length * widthPixelSize;
    	$(canvas.parentNode).css('width', canvas.width + 'px');

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
    		if ($.inArray(fileData[i], genesGraphArray) != -1){
    			context.fillStyle = "yellow";
    			context.fillRect(0, ((i - startRow) * textHeightPixelSize), canvas.width, textHeightPixelSize - ((i - startRow) * textHeightPixelSize));
    		}
    		context.font = "10px Arial";
    		context.fillStyle = "black";
    		context.fillText(fileData[i][0], 0, (i-startRow + 0.8) * textHeightPixelSize);
  			//context.font = "bold 10px Arial";
        }
    }

    //fileData = readTextFile("RNA_seq.txt");
    
    function redrawAllCanvases() {
    	
    	$('.original.container .zoomRegion').css('margin-top', '0px');
        $('.firstZoom.container .twice.zoomRegion').css('margin-top', '0px');
    
    	maxValue = fileData[1][1];
    	minValue = fileData[1][1];
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
        
        var originalCanvas = document.getElementById('wholeHeatmap');
		originalCanvasRowSizeInPixels = originalCanvas.height/(fileData.length - 1);
	
		var firstZoomTopMargin = parseInt($('.original.container .zoomRegion').css('margin-top'));
		var firstZoomStartRow = 1;
    	var firstZoomLastRow = firstZoomStartRow + $('.original.container .zoomRegion').height()/originalCanvasRowSizeInPixels;
    
    	var firstZoomedCanvas = document.getElementById('firstZoomedHeatmap');
		var firstCanvasRowSizeInPixels = firstZoomedCanvas.height/(firstZoomLastRow - firstZoomStartRow);
	
		var secondZoomTopMargin = parseInt($('.firstZoom.container .zoomRegion').css('margin-top'));
		secondZoomStartRow = 1;
    	var secondZoomLastRow = secondZoomStartRow + $('.firstZoom.container .zoomRegion').height()/firstCanvasRowSizeInPixels;

    	drawHeatmap(fileData, 'firstZoomRect', 'wholeHeatmap', 1, fileData.length);
    	drawHeatmap(fileData, 'secondZoomRect','firstZoomedHeatmap', firstZoomStartRow, firstZoomLastRow);
    	drawHeatmap(fileData, '','secondZoomedHeatmap', secondZoomStartRow, secondZoomLastRow);
    	drawText(fileData, 'textCanvas', secondZoomStartRow, secondZoomLastRow);

    	$("#chartContainer").css('width', $(window).outerWidth() - $("#leftWrapper").outerWidth(true) + 'px');
    }
    
    function parseGraphArray(){
    	
		parseGraphDataArray.length = 0;
  		
    	for (var i = 0; i < genesGraphArray.length; i++){
    		var parsedDataRow = [];
    		for (var j = 1; j < genesGraphArray[i].length; j++){
    			parsedDataRow.push( {label:fileData[0][j], y:parseFloat(genesGraphArray[i][j])});
    		}
    		var graphDic = {
    			type: "line",
				lineThickness:3,
				markerType: "circle",
				showInLegend: true,           
				name: genesGraphArray[i][0],
				dataPoints:parsedDataRow,
    		};
    		parseGraphDataArray.push(graphDic);
    	}
    }
    
    $(document).on('mouseup', function(){
    	mouseDownTrue = false;
    });
    
    $( ".container" )
  	.mousedown(function(e) {
  		mouseDownTrue = true;
  	})
  	.mousemove(function(e) {
  		var $container = $(this);
  		if (!mouseDownTrue || $container.attr('id') === 'textContainer'){
  			return;
  		}
  		
    	var $container = $(this);
    	var $canvas = $container.children( "canvas" );
        var $zoomRegion = $container.find('.zoomRegion');
        var relY = e.pageY - $container.offset().top;
        var marginTop = (relY-$zoomRegion.height()/2 < 0) ? 0 : relY-$zoomRegion.height()/2;
        marginTop = (marginTop+$zoomRegion.outerHeight()<=$canvas.height()) ? marginTop : $canvas.height() - $zoomRegion.outerHeight();
        
        $zoomRegion.css('margin-top', marginTop+'px');
        firstZoomTopMargin = parseInt($('.original.container .zoomRegion').css('margin-top'));
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
  		
  			secondZoomTopMargin = parseInt($('.firstZoom.container .zoomRegion').css('margin-top'));
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

  	}.throttle(50))
  	.click(function(e){
  		var $container = $(this);
  		if ($container.attr('id') !== 'textContainer'){
  			return;
  		}
  		
       	var relY = e.pageY - $container.offset().top;
		var $canvas = $container.children( "canvas" );
		var selectedLineNumber = secondZoomStartRow + Math.floor(relY/textHeightPixelSize);
		
		if ($.inArray( fileData[selectedLineNumber], genesGraphArray) != -1){
			genesGraphArray = jQuery.grep(genesGraphArray, function(value) {
 					return value != fileData[selectedLineNumber];
			});
			
			var canvas = document.getElementById('textCanvas');
   			var context = canvas.getContext('2d');
   			context.clearRect(0, ((selectedLineNumber - secondZoomStartRow) * textHeightPixelSize) + 1, canvas.width, textHeightPixelSize);
 				
 			context.fillStyle = "black";
 			context.fillText(fileData[selectedLineNumber][0], 0, (selectedLineNumber - secondZoomStartRow + 1) * textHeightPixelSize);
		} 
		else {
			genesGraphArray.push(fileData[selectedLineNumber]);
			//$(this).css({"z-index":"1", "border":"1px solid #000"});
		
  			var canvas = document.getElementById('textCanvas');
   			var context = canvas.getContext('2d');
   			context.clearRect(0, ((selectedLineNumber - secondZoomStartRow) * textHeightPixelSize) + 1, canvas.width, textHeightPixelSize);
       
       		context.fillStyle = "yellow";
 			context.fillRect(0, ((selectedLineNumber - secondZoomStartRow) * textHeightPixelSize) + 1, canvas.width, textHeightPixelSize - 1);
 				
 			context.fillStyle = "black";
 			context.fillText(fileData[selectedLineNumber][0], 0, (selectedLineNumber - secondZoomStartRow + 1) * textHeightPixelSize);
		}
		parseGraphArray();
		chart.render();
  	});
  		
  	var chart = new CanvasJS.Chart("chartContainer",
	{
		zoomEnabled: false,
		title:{
			text: "Genes"
		},
		exportEnabled: true,
		axisX:{
			title: "Conditions",
        	labelAngle: 30,
        	labelFontSize: 10,
        	interval: 1,
      	},
        toolTip:{
            shared: true
        },
		legend:{
			verticalAlign: "bottom",
			horizontalAlign: "center",
			fontSize: 15,
			fontFamily: "Lucida Sans Unicode"
		},
		data: parseGraphDataArray,
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
       
    //draw default RNA sequence
	readTextFile("RNA_seq.txt");
	redrawAllCanvases();
    chart.render();

});