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


    var polygons = sendPolygon();
    var line = new ol.geom.LineString(points);
    var hasIntersects = false;

    for (var polygon of polygons) {
        if (polygon.intersectsExtent(line.getExtent())) {
            hasIntersects = true;
            break;
        }
    }

    var vectorLine = new ol.source.Vector({});
    if(hasIntersects)
    {
        var foundPolygon;
        var intersectionPoints = [];

        for (var polygon of polygons) {
            if (polygon.intersectsExtent(line.getExtent())) {
                foundPolygon = polygon;
                break;
            }
        }
        var ringCoords = foundPolygon.getCoordinates()[0];
        for (var i = 0; i < ringCoords.length - 1; i++) {
            var segment = new ol.geom.LineString([ringCoords[i], ringCoords[i + 1]]);
            var intersection = getLineIntersection(line, segment);
            if (intersection) {
                intersectionPoints.push(intersection);
            }
        }

        if (intersectionPoints.length > 0) {
            // Сортируем точки пересечения по расстоянию от начальной точки
            intersectionPoints.sort((a, b) => {
                return ol.sphere.getDistance(points[0], a) - ol.sphere.getDistance(points[0], b);
            });
            var startPointInside = foundPolygon.intersectsCoordinate(points[0]);
            var endPointInside = foundPolygon.intersectsCoordinate(points[1]);
            var path = [];
            if(!startPointInside)
            {
                // Добавляем начальную точку
                path.push(points[0]);
            }

            // Добавляем точки пересечения
            intersectionPoints.forEach(point => path.push(point));
            if(!endPointInside)
            {
                // Добавляем конечную точку
                path.push(points[1]);
            }
            if(path.length == 2)
            {
                const entryPoint = intersectionPoints[0]; // Точка входа
                const exitPoint = intersectionPoints[intersectionPoints.length - 1]; // Точка выхода

                // 4. Находим индексы точек на границе полигона
                const entryIndex = findClosestVertexIndex(ringCoords, entryPoint);
                const exitIndex = findClosestVertexIndex(ringCoords, exitPoint);

                // 5. Строим два пути (по часовой и против часовой стрелки)
                const pathClockwise = buildBoundaryPath(ringCoords, entryIndex, exitIndex, true);
                const pathCounterClockwise = buildBoundaryPath(ringCoords, entryIndex, exitIndex, false);

                // 6. Выбираем более короткий путь
                const shortestPath = (
                    ol.sphere.getLength(pathClockwise) < ol.sphere.getLength(pathCounterClockwise) ?
                    pathClockwise : pathCounterClockwise
                );

                // 7. Строим итоговую линию: вход → кратчайший путь по границе → выход
                const boundaryPath = new ol.geom.LineString([entryPoint, ...shortestPath, exitPoint]);

                // 8. Добавляем линию на карту (например, красным пунктиром)
                const boundaryFeature = new ol.Feature({
                    geometry: boundaryPath,
                    name: 'Shortest Boundary Path'
                });

                boundaryFeature.setStyle(
                    new ol.style.Style({
                        stroke: new ol.style.Stroke({
                            color: [255, 0, 0, 1], // Красный
                            width: 4,
                            lineDash: [5, 5] // Пунктир
                        })
                    })
                );
                vectorLine.addFeature(boundaryFeature);
            }

            var shortestPathFeature = new ol.Feature({
                geometry: new ol.geom.LineString(path)
            });
            vectorLine.addFeature(shortestPathFeature);
        }
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
// Находит ближайшую вершину полигона к точке пересечения
function findClosestVertexIndex(coords, point) {
    let minDist = Infinity;
    let closestIndex = 0;
    for (let i = 0; i < coords.length; i++) {
        const dist = ol.sphere.getDistance(point, coords[i]);
        if (dist < minDist) {
            minDist = dist;
            closestIndex = i;
        }
    }
    return closestIndex;
}
// Строит путь вдоль границы между двумя точками
function buildBoundaryPath(coords, startIndex, endIndex, clockwise) {
    const path = [];
    const n = coords.length;

    if (clockwise) {
        for (let i = startIndex; i !== endIndex; i = (i + 1) % n) {
            path.push(coords[i]);
        }
    } else {
        for (let i = startIndex; i !== endIndex; i = (i - 1 + n) % n) {
            path.push(coords[i]);
        }
    }
    path.push(coords[endIndex]); // Добавляем конечную точку
    return path;
}

function getLineIntersection(line1, line2) {
    var p1 = line1.getCoordinates()[0];
    var p2 = line1.getCoordinates()[1];
    var p3 = line2.getCoordinates()[0];
    var p4 = line2.getCoordinates()[1];

    var denom = (p4[1] - p3[1]) * (p2[0] - p1[0]) - (p4[0] - p3[0]) * (p2[1] - p1[1]);

    if (denom === 0) {
        return null; // Линии параллельны
    }

    var ua = ((p4[0] - p3[0]) * (p1[1] - p3[1]) - (p4[1] - p3[1]) * (p1[0] - p3[0])) / denom;
    var ub = ((p2[0] - p1[0]) * (p1[1] - p3[1]) - (p2[1] - p1[1]) * (p1[0] - p3[0])) / denom;

    if (ua < 0 || ua > 1 || ub < 0 || ub > 1) {
        return null; // Пересечение вне отрезков
    }

    // Вычисляем точку пересечения
    var intersectionX = p3[0] + ub * (p4[0] - p3[0]);
    var intersectionY = p3[1] + ub * (p4[1] - p3[1]);

    return [intersectionX, intersectionY];
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
