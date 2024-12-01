import QtQuick 2.15
import QtLocation 5.11
import QtPositioning 5.11

Rectangle
{
    id:window

    property double latitude:51.5072
    property double longitude:0.1276

    property Component Locationmarker: maker

    Plugin
    {
        id:googlemapview
        name:"osm"
    }
    Map
    {
        id:mapView
        anchors.fill: parent
        plugin: googlemapview
        center: QtPositioning.coordinate(latitude, longitude)
        zoomLevel: 5
    }
}
