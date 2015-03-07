var d3 = wavesUI.d3;
var loader = new loaders.AudioBufferLoader();

var graph_width = 1024

function waveform(div_id) {
    var id_sub = '#' + div_id + '_sub';
    // add waveform
    loader.load('download/ogg').then(function(audioBuffer) {
        try {

            var id = '#' + div_id;
            

            var data = [{
                start: audioBuffer.duration/4,
                duration: audioBuffer.duration/2
            }];

            var buffer = audioBuffer.getChannelData(0).buffer

            // 1. creat graph
            var graph = wavesUI.timeline()
                .xDomain([0, audioBuffer.duration])
                .width(graph_width)
                .height(80);

            // 2. create layers
            var waveformLayer = wavesUI.waveform()
		.params({height: 40})
                .data(buffer)
                .sampleRate(audioBuffer.sampleRate)
                .color('purple');
                // .opacity(0.8);

            var segmentLayer = wavesUI.segment()
                .params({
                    interactions: { editable: true },
                    opacity: 0.4,
                    handlerOpacity: 0.6,
		    top: 50,
		    height: 40
                })
                .data(data)
                .color('steelblue');

            // 3. add layers to graph
            graph.add(waveformLayer);
            graph.add(segmentLayer);

            // 4. draw graph
            d3.select(id).call(graph.draw);
	    
            var graph_sub = wavesUI.timeline()
                .xDomain([0, audioBuffer.duration])
                .width(graph_width)
                .height(140);

            var waveformLayerSub = wavesUI.waveform()
                .data(buffer)
                .sampleRate(audioBuffer.sampleRate)
                .color('steelblue')
                // .opacity(0.8);

            graph_sub.add(waveformLayerSub);

            d3.select(id_sub).call(graph_sub.draw);

	    // Add X-Ticks addTicks(id_sub, graph_sub);
	    // Create a svg element for the zoomer
	    var zoomerSvg = d3.select(id_sub).append('svg')
		.attr('width', graph_width)
		.attr('height', 30);

	    // Create the time axis - here a common d3 axis
	    // Graph must be drawn in order to have `graph.xScale` up to date
	    var xAxis = d3.svg.axis()
		.scale(graph_sub.xScale)
		.tickSize(1)
		.tickFormat(function(d) {
		    var form = '%S:%L';
		    var date = new Date(d * 1000);
		    var format = d3.time.format(form);
		    return format(date);
		});

	    // Add the axis to the newly created svg element
	    var axis = zoomerSvg.append('g')
		.attr('class', 'x-axis')
		.attr('transform', 'translate(0, 0)')
		.attr('fill', '#555')
		.call(xAxis);

	    var zoomLayer = wavesUI.zoomer()
            .select(id_sub)
            .on('mousemove', function(e) {
		// update graph xZoom
		graph_sub.xZoom(e);
		// update axis
		axis.call(xAxis);
		
            })
            .on('mouseup', function(e) {
                // set the final xZoom value of the graph
                graph_sub.xZoomSet();
		// update axis
		axis.call(xAxis);
            });

        } catch (err) {
            console.log(err);
        }
    }, function() {});
}



function timeline_get_data(json_url, div_id) {
    $.getJSON(json_url, function(data_list) {

	var nb_results = data_list.length;
	var height = 140 * data_list.length + 10 * (data_list.length -1);

	var duration = data_list[0].audio_metadata.duration;

	var graph = wavesUI.timeline()
        .xDomain([0, duration])
        .width(graph_width)
        .height(height);
		
	for (var i = 0; i < data_list.length; i++) {
            var data = data_list[i];
	    var ytop = i * (140 + 10)
	    
            timeline_result(data, graph, ytop);
	}
	// 4. draw graph
	d3.select('#'+div_id).call(graph.draw);

	var zoomLayer = wavesUI.zoomer()
            .select('#'+div_id)
            .on('mousemove', function(e) {
		// update graph xZoom
		graph.xZoom(e);
            })
            .on('mouseup', function(e) {
		// set the final xZoom value of the graph
		graph.xZoomSet();
            });
    });
}

function timeline_result(data, graph, ytop) {

    var time_mode = data.time_mode
    var data_mode = data.data_mode
    var id = data.id_metadata.id

    switch (time_mode) {
    case 'global':
	console.log(id, time_mode, data_mode);
	break;
    case 'event':
	switch (data_mode) {
	case 'value':
            console.log(id, time_mode, data_mode);
            break;
	case 'label':
            timeline_event_label(data, graph, ytop);
            break;
	}
	break;
    case 'segment':
	switch (data_mode) {
	case 'value':
            timeline_segment_value(data, graph, ytop);
            break;
	case 'label':
	    timeline_segment_label(data, graph, ytop);
            break;
	}
	break;
    case 'framewise':
	switch (data_mode) {
	case 'value':
            timeline_framewise_value(data, graph, ytop);
            break;
	case 'label':
	    console.log(id, time_mode, data_mode);
            break;
	}
	break;
    }
}

function timeline_framewise_value(data, graph, ytop) {

    // Extract frame_metadata parameters
    var samplerate = data.data_object.frame_metadata.samplerate;
    var blocksize = data.data_object.frame_metadata.blocksize;
    var stepsize = data.data_object.frame_metadata.stepsize;

    var values = data.data_object.value.numpyArray;

    // format data
    var data = values.map(function(dummy, index) {
        return {
	    cx: (blocksize / 2 +  stepsize * index ) / samplerate,
            cy: values[index]
        };
    });

    

    // var minValue = Math.min.apply(null, values);
    var max_value = Math.max.apply(null, values);

    var breakpointLayer = wavesUI.breakpoint()
	.params({
	    height: 140,
	    top: ytop,
	    yDomain: [0, max_value]
	})
        .data(data)
        .color('steelblue')
        .opacity(0.8);
    
    // 3. add layers to graph
    graph.add(breakpointLayer);
}

function timeline_segment_value(data, graph, ytop) {

    var durations = data.data_object.duration.numpyArray;
    var starts = data.data_object.time.numpyArray;
    var values = data.data_object.value.numpyArray;
    // format data
    var data = durations.map(function(dummy, index) {
        return {
            start: starts[index],
            duration: durations[index],
            height: values[index]
        };
    });
    

    // var minValue = Math.min.apply(null, values);
    var max_value = Math.max.apply(null, values);

    console.log(ytop)
    
    var segmentLayer = wavesUI.segment()
        .data(data)
        .color('steelblue')
        .opacity(0.8)
	.params({
	    height: 140,
	    top: ytop,
	    yDomain: [0, max_value]
	});
    
    // 3. add layers to graph
    graph.add(segmentLayer);
    
}

function timeline_segment_label(data, graph, ytop) {

    var durations = data.data_object.duration.numpyArray;
    var starts = data.data_object.time.numpyArray;
    var labels = data.data_object.label.numpyArray;

    // format data
    var data = durations.map(function(dummy, index) {
        return {
            start: starts[index],
            duration: durations[index],
	    label: labels[index]
        };
    });

    var colors = d3.scale.category10().domain(d3.set(labels).values()).range();
    
    var segmentLayer = wavesUI.segment()
        .data(data)
        .color(function(d) { return colors[d.label]})
        .opacity(0.8)
	.params({
	    height: 140,
	    top: ytop,
	    handlerOpacity: 1
	});
	

    // 3. add layers to graph
    graph.add(segmentLayer);
    
}

function timeline_event_label(data, graph, ytop) {

    var starts = data.data_object.time.numpyArray;
    var values = data.data_object.label.numpyArray;
    // format data
    var data = starts.map(function(dummy, index) {
        return {
            x: starts[index],
            height: values[index]
        };
    });


    // var minValue = Math.min.apply(null, values);
    var max_value = Math.max.apply(null, values);

    console.log(ytop)

    var markerLayer = wavesUI.marker()
        .data(data)
        .color('steelblue')
        .opacity(0.8)
    	.params({
	    height: 140,
	    top: ytop,
	    yDomain: [0, max_value],
	});
    
    // 3. add layers to graph
    graph.add(markerLayer);

}