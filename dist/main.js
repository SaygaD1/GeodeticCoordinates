window.onload = init;
var map;
var vectorSource; // Источник для векторных данных
var Inter = []; // Точки пересечения
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
function addOrtodroma(lat1, lng1, lat2, lng2) {
    var points = [[lat1, lng1], [lat2, lng2]];
    for (var i = 0; i < points.length; i++) {
        points[i] = ol.proj.transform(points[i], 'EPSG:4326', 'EPSG:3857');
    }

    var featureLine = new ol.Feature({
        geometry: new ol.geom.LineString(points)
    });

    var polygons = sendPolygon();
    var intersections = [];

    for (var polygon of polygons) {
        if (polygon instanceof ol.geom.Polygon) {
            var ringCoords = polygon.getCoordinates()[0];
            for (var i = 0; i < ringCoords.length - 1; i++) {
                var segment = new ol.geom.LineString([ringCoords[i], ringCoords[i + 1]]);
                var intersection = getLineIntersection(featureLine.getGeometry(), segment);
                if (intersection) {
                    intersections.push(intersection);
                    // Inter.push(intersection);
                }
            }
        }
    }

    var path = [];
    path.push(points[0]);
    path.push(points[1]);
    if(polygon)
    {
        if(polygon.intersectsCoordinate(points[0]))
        {
            path.pop();
            path.pop();
            path.push(points[1]);
        }
        if(polygon.intersectsCoordinate(points[1]))
        {
            path.pop();
        }
    }
    var currentPoint = points[0];
    for (var i = 0; i < intersections.length; i++) {
        var nextPoint = intersections[i];
        var segment = new ol.geom.LineString([currentPoint, nextPoint]);
        if(polygon.intersectsCoordinate(points[1]))
        {
            path.pop();
            path.push(currentPoint);
            Inter.push(nextPoint);
            path.push(nextPoint);
        }
        if(polygon.intersectsCoordinate(points[0]))
        {
            path.pop();
            path.pop();
            path.push(nextPoint);
            Inter.push(nextPoint);
            path.push(points[1]);
        }
        currentPoint = nextPoint;
    }

    featureLine = new ol.Feature({
        geometry: new ol.geom.LineString(path)
    });
    // featureLine.setGeometry(new ol.geom.LineString(path));

    var vectorLine = new ol.source.Vector({});
    vectorLine.addFeature(featureLine);

    var vectorLineLayer = new ol.layer.Vector({
        source: vectorLine,
        style: new ol.style.Style({
            stroke: new ol.style.Stroke({
                color: '#0000FF', // Синий цвет для ортодромии
                width: 2
            })
        })
    });

    map.addLayer(vectorLineLayer);
}
// function addOrtodroma(lat1, lng1, lat2, lng2)
// {
// 	var points = [ [lat1, lng1], [lat2, lng2] ];
//     for (var i = 0; i < 2; i++) {
// 		points[i] = ol.proj.transform(points[i], 'EPSG:4326', 'EPSG:3857');
// 	}


//     var polygons = sendPolygon();
//     var line = new ol.geom.LineString(points);
//     var hasIntersects = false;

//     for (var polygon of polygons) {
//         if (polygon.intersectsExtent(line.getExtent())) {
//             hasIntersects = true;
//             break;
//         }
//     }

//     var vectorLine = new ol.source.Vector({});
//     if(hasIntersects)
//     {
//         var foundPolygon;
//         var intersectionPoints = [];

//         for (var polygon of polygons) {
//             if (polygon.intersectsExtent(line.getExtent())) {
//                 foundPolygon = polygon;
//                 break;
//             }
//         }
//         var ringCoords = foundPolygon.getCoordinates()[0];
//         for (var i = 0; i < ringCoords.length - 1; i++) {
//             var segment = new ol.geom.LineString([ringCoords[i], ringCoords[i + 1]]);
//             var intersection = getLineIntersection(line, segment);
//             if (intersection) {
//                 intersectionPoints.push(intersection);
//             }
//         }

//         if (intersectionPoints.length > 0) {
//             // Сортируем точки пересечения по расстоянию от начальной точки
//             intersectionPoints.sort((a, b) => {
//                 return ol.sphere.getDistance(points[0], a) - ol.sphere.getDistance(points[0], b);
//             });
//             var startPointInside = foundPolygon.intersectsCoordinate(points[0]);
//             var endPointInside = foundPolygon.intersectsCoordinate(points[1]);
//             var path = [];
//             if(!startPointInside)
//             {
//                 // Добавляем начальную точку
//                 path.push(points[0]);
//             }

//             // Добавляем точки пересечения
//             intersectionPoints.forEach(point => path.push(point));
//             if(!endPointInside)
//             {
//                 // Добавляем конечную точку

//                 path.push(points[1]);
//             }
//             if(path.length == 2)
//             {
//                 const entryPoint = intersectionPoints[0]; // Точка входа
//                 const exitPoint = intersectionPoints[intersectionPoints.length - 1]; // Точка выхода

//                 // 4. Находим индексы точек на границе полигона
//                 const entryIndex = findClosestVertexIndex(ringCoords, entryPoint);
//                 const exitIndex = findClosestVertexIndex(ringCoords, exitPoint);

//                 // 5. Строим два пути (по часовой и против часовой стрелки)
//                 const pathClockwise = buildBoundaryPath(ringCoords, entryIndex, exitIndex, true);
//                 const pathCounterClockwise = buildBoundaryPath(ringCoords, entryIndex, exitIndex, false);

//                 // 6. Выбираем более короткий путь
//                 const shortestPath = (
//                     ol.sphere.getLength(pathClockwise) < ol.sphere.getLength(pathCounterClockwise) ?
//                     pathClockwise : pathCounterClockwise
//                 );

//                 // 7. Строим итоговую линию: вход → кратчайший путь по границе → выход
//                 const boundaryPath = new ol.geom.LineString([entryPoint, ...shortestPath, exitPoint]);

//                 // 8. Добавляем линию на карту (например, красным пунктиром)
//                 const boundaryFeature = new ol.Feature({
//                     geometry: boundaryPath,
//                     name: 'Shortest Boundary Path'
//                 });

//                 boundaryFeature.setStyle(
//                     new ol.style.Style({
//                         stroke: new ol.style.Stroke({
//                             color: [0, 255, 0, 1], // Зеленый
//                             width: 6,
//                             lineDash: [5, 5] // Пунктир
//                         })
//                     })
//                 );
//                 vectorLine.addFeature(boundaryFeature);
//             }

//             var shortestPathFeature = new ol.Feature({
//                 geometry: new ol.geom.LineString(path)
//             });
//             vectorLine.addFeature(shortestPathFeature);
//         }
//     }
//     else
//     {
//         var featureLine = new ol.Feature({
//                 geometry: new ol.geom.LineString(points)
//         });
//         vectorLine.addFeature(featureLine);
//     }

//     var vectorLineLayer = new ol.layer.Vector({
//         source: vectorLine,
//         style: new ol.style.Style({
//             fill: new ol.style.Fill({ color: '#00FF00', weight: 4 }),
//             stroke: new ol.style.Stroke({ color: '#00FF00', width: 2 })
//         })
//     });

//    	map.addLayer(vectorLineLayer);
// }
// Находит ближайшую вершину полигона к точке пересечения
// function findClosestVertexIndex(coords, point) {
//     let minDist = Infinity;
//     let closestIndex = 0;
//     for (let i = 0; i < coords.length; i++) {
//         const dist = ol.sphere.getDistance(point, coords[i]);
//         if (dist < minDist) {
//             minDist = dist;
//             closestIndex = i;
//         }
//     }
//     return closestIndex;
// }
// Строит путь вдоль границы между двумя точками
// function buildBoundaryPath(polygon, startPoint, endPoint) {
//     var ringCoords = polygon.getCoordinates()[0];
//     var entryIndex = findClosestVertexIndex(ringCoords, startPoint);
//     var exitIndex = findClosestVertexIndex(ringCoords, endPoint);

//     var path = [];
//     var n = ringCoords.length;

//     if (entryIndex < exitIndex) {
//         for (let i = entryIndex; i <= exitIndex; i++) {
//             path.push(ringCoords[i]);
//         }
//     } else {
//         for (let i = entryIndex; i < n; i++) {
//             path.push(ringCoords[i]);
//         }
//         for (let i = 0; i <= exitIndex; i++) {
//             path.push(ringCoords[i]);
//         }
//     }

//     return path;
// }

function findClosestSegment(coordinates, point) {
    let minDistance = Infinity;
    let closestSegment = { index: -1, point: null, t: 0 };

    for (let i = 0; i < coordinates.length - 1; i++) {
        const p1 = coordinates[i];
        const p2 = coordinates[i + 1];
        const segment = new ol.geom.LineString([p1, p2]);

        const closest = segment.getClosestPoint(point);
        const distance = ol.coordinate.distance(closest, point);

        if (distance < minDistance) {
            minDistance = distance;
            closestSegment.index = i;
            closestSegment.point = closest;

            const segmentLength = ol.coordinate.distance(p1, p2);
            if (segmentLength > 0) {
                closestSegment.t = ol.coordinate.distance(p1, closest) / segmentLength;
            } else {
                closestSegment.t = 0;
            }
        }
    }

    return closestSegment;
}

function buildPath(vertices, startIndex, endIndex, startPoint, endPoint, clockwise)
{
    const path = [startPoint];
    const n = vertices.length;

    if (startIndex === endIndex) {
        path.push(endPoint);
        return new ol.geom.LineString(path);
    }

    let currentIndex = startIndex;
    const visitedIndices = new Set();
    let firstIteration = true;

    while(true)
    {
        if (visitedIndices.has(currentIndex) && !firstIteration) break;
        visitedIndices.add(currentIndex);
        firstIteration = false;

        const nextIndex = clockwise ?
                    (currentIndex + 1) % n :
                    (currentIndex - 1 + n) % n;
        if (!(currentIndex === startIndex && ol.coordinate.equals(startPoint, vertices[startIndex]))) {
            path.push(vertices[currentIndex]);
        }

        if(nextIndex == endIndex)
        {
            if (!ol.coordinate.equals(endPoint, vertices[endIndex])) {
                path.push(vertices[endIndex]);
            }
            path.push(endPoint);
            break;
        }
        currentIndex = nextIndex;
    }
    return new ol.geom.LineString(path);
}

function buildBoundaryPath(polygon, startPoint, endPoint) {
    if (!polygon || !polygon.getCoordinates || !polygon.getCoordinates()[0] || polygon.getCoordinates()[0].length === 0) {
        throw new Error('Invalid polygon geometry');
    }
    const ringCoords = polygon.getCoordinates()[0];
    const startSegment = findClosestSegment(ringCoords, startPoint);
    const endSegment = findClosestSegment(ringCoords, endPoint);

    if(startSegment.index == endSegment.index && Math.abs(startSegment.t - endSegment.t) < 1)
    {
        return new ol.geom.LineString([startPoint, endPoint]);
    }

    const isClosed = ol.coordinate.equals(ringCoords[0], ringCoords[ringCoords.length-1]);
    const vertices = isClosed ? ringCoords.slice(0, -1) : ringCoords;

    const startIndex = startSegment.index;
    const endIndex = endSegment.index;

    const path1 = buildPath(vertices, startIndex, endIndex, startPoint, endPoint, true);
    const path2 = buildPath(vertices, startIndex, endIndex, startPoint, endPoint, false);

    return path1.getLength() < path2.getLength() ? path1 : path2;
}

function drawIntersection()
{
    var polygons = sendPolygon();
    for(let i = 0; i < Inter.length; i+=2)
    {
        for(var polygon of polygons)
        {
            var boundaryPath = buildBoundaryPath(polygon, Inter[i], Inter[i+1]);
            pathFeature = new ol.Feature({
                geometry: boundaryPath
            });
            var vectorLine = new ol.source.Vector({});
            vectorLine.addFeature(pathFeature);

            var vectorLineLayer = new ol.layer.Vector({
                source: vectorLine,
                style: new ol.style.Style({
                    stroke: new ol.style.Stroke({
                        color: '#0000FF', // Синий цвет для ортодромии
                        width: 3
                    })
                })
            });

            map.addLayer(vectorLineLayer);
        }
    }
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
    Inter = [];
    map.addLayer(vectorLayer);
}
