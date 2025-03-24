// import {intersects} from 'ol/extent';

window.onload = init;
var map;
var vectorSource; // Источник для векторных данных
function init()
{
	map = new ol.Map({
		view: new ol.View({
			center: [0, 0],
			zoom: 2
        }),
        layers:[
			new ol.layer.Tile({
				source: new ol.source.OSM()
            }),
            new ol.layer.Vector({
                source: new ol.source.Vector({}),
            }),
		],
		target: 'map'
	})

    vectorSource = new ol.source.Vector({});
    var vectorLayer = new ol.layer.Vector({
        source: vectorSource,
        style: new ol.style.Style({
            stroke: new ol.style.Stroke({
                color: '#FF0000', // Цвет линии
                width: 2 // Ширина линии
            })
        })
    });
    map.addLayer(vectorLayer);
    // addDrawInteraction();
}

function addLoksodroma(lat1, lng1, lat2, lng2)
{
	var points = [ [lat1, lng1], [lat2, lng2] ];
	for (var i = 0; i < points.length; i++) {
		points[i] = ol.proj.transform(points[i], 'EPSG:4326', 'EPSG:3857');
		console.log(points[i]);
	}

	var featureLine = new ol.Feature({
	        geometry: new ol.geom.LineString(points)
	    });

	    var vectorLine = new ol.source.Vector({});
	    vectorLine.addFeature(featureLine);

	    var vectorLineLayer = new ol.layer.Vector({
	        source: vectorLine,
	        style: new ol.style.Style({
	            fill: new ol.style.Fill({ color: '#FF3318', weight: 4 }),
	            stroke: new ol.style.Stroke({ color: '#FF3318', width: 2 })
	        })
	    });
    map.addLayer(vectorLineLayer);
}
function addOrtodroma(lat1, lng1, lat2, lng2)
{
	var points = [ [lat1, lng1], [lat2, lng2] ];
    for (var i = 0; i < 2; i++) {
		points[i] = ol.proj.transform(points[i], 'EPSG:4326', 'EPSG:3857');
	}


    var Polygons = sendPolygon();
    var line = new ol.geom.LineString(points);
    var hasIntersects = false
    if(!Polygons)
    {
        hasIntersects = Polygons.getExtent().intersects(line.getExtent());
    }

    var vectorLine = new ol.source.Vector({});
    if(hasIntersects)
    {
        var foundPolygon;
        var closestA;
        var closestB;
        for(var polygon of Polygons)
        {
            const ca = polygon.getClosestPoint(points[0]);
            const cb = polygon.getClosestPoint(points[1]);
            if(polygon.intersectsCoordinate(ca) && polygon.ol.geom.intersectsCoordinate(cb))
            {
                foundPolygon = polygon;
                closestA = ca;
                closestB = cb;
                break;
            }
        }
        var ringCoords = foundPolygon.getCoordinates()[0];

        const findClosestIndex = (point, coords) =>
            coords.reduce((bestIdx, cur, idx) =>
                Math.hypot(cur[0] - point[0 , cur[1] - point[1]]) <
                Math.hypot(coords[bestIdx][0] - point[0], coords[bestIdx][1] - point[1]) ? idx : bestIdx, 0);

        var indexA = findClosestIndex(closestA, ringCoords);
        var indexB = findClosestIndex(closestB, ringCoords);
        var path1 = ringCoords.slice(indexA, indexB + 1);
        var path2 = ringCoords.slice(indexB).concat(ringCoords.slice(0, indexA + 1));

        const calculatePathLength = (path) => path.reduce((sum, cur, idx, arr) =>
            idx == 0 ? sum : sum + Math.hypot(cur[0] - arr[idx - 1][0], cur[1] - arr[idx - 1][1]), 0);

        var length1 = calculatePathLength(path1);
        var length2 = calculatePathLength(path2);

        var shortestPath = length1 < length2 ? path1 : path2;
        var shortestPathFeature = new ol.Feature({
            geometry: new ol.geom.LineString(shortestPath)
        });
        vectorLine.addFeature(shortestPathFeature);
    }
    else
    {
        var featureLine = new ol.Feature({
                geometry: new ol.geom.LineString(points)
        });
        vectorLine.addFeature(featureLine);
    }

    var vectorLineLayer = new ol.layer.Vector({
        source: vectorLine,
        style: new ol.style.Style({
            fill: new ol.style.Fill({ color: '#00FF00', weight: 4 }),
            stroke: new ol.style.Stroke({ color: '#00FF00', width: 2 })
        })
    });

   	map.addLayer(vectorLineLayer);
}

var drawInteraction = null;
function addDrawInteraction() {
    drawInteraction = new ol.interaction.Draw({
        source: vectorSource,
        // type: 'LineString' // Тип рисуемого объекта (линия)
        type: 'Polygon'
    });

    map.addInteraction(drawInteraction);

    drawInteraction.on('drawend', function (event) {
        // Обработка завершения рисования
        var feature = event.feature;
        console.log(feature.getGeometry().getCoordinates());
    });
}
function disableDrawInteraction() {

    if (drawInteraction) {
        map.removeInteraction(drawInteraction);
        drawInteraction = null;
    }
}
function sendPolygon() {
    var features = vectorSource.getFeatures();
    var polygons = [];
    features.forEach(function(feature) {
        if (feature.getGeometry().getType() === 'Polygon') {
            polygons.push(feature.getGeometry());
        }
    });
    return polygons;
}
function deleteMap()
{
    var layerArray, layer;
    layerArray = map.getLayers().getArray();
    var len = layerArray.length;
    while(len > 1)
    {
        layer = layerArray[len-1];
        map.removeLayer(layer);
        layerArray = map.getLayers().getArray();
        var len = layerArray.length;
    }
    vectorSource = new ol.source.Vector({});
    var vectorLayer = new ol.layer.Vector({
        source: vectorSource,
        style: new ol.style.Style({
            stroke: new ol.style.Stroke({
                color: '#FF0000', // Цвет линии
                width: 2 // Ширина линии
            })
        })
    });
    map.addLayer(vectorLayer);
}
