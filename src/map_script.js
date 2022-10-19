// TO MAKE THE MAP APPEAR YOU MUST
// ADD YOUR ACCESS TOKEN FROM
// https://account.mapbox.com
import mapboxgl from '!mapbox-gl';
import React, { useRef, useEffect, useState } from 'react';
import { fetchJSON} from './index';
import {DisplayFeatures,DisplaySelect} from './ui_comps';


mapboxgl.accessToken =
    'pk.eyJ1Ijoic2FpcHJhbmVldGhkIiwiYSI6ImNsMHRvdGR6eTBwMzEzY3FwZ3J2YjF5Y2UifQ.BVrcTF-CiMB5gVqLCV_U-w';

export default function App() {
    const map = useRef(null);
    const mapContainer = useRef(null);
    const [lng, setLng] = useState(-122.676);
    const [lat, setLat] = useState(45.513);
    const [zoom, setZoom] = useState(12);
    const [features, setFeatures] = useState(null);
    const [city, setCity] = useState(null);
    const [hoveredState, setHoverState] = useState(null);

    // const popup = new mapboxgl.Popup({
    //     closeButton: false,
    //     closeOnClick: false
    // });
    // console.log(popup);


    useEffect(() => {
        if (map.current) return; // initialize map only once
        map.current = new mapboxgl.Map({
            container: mapContainer.current,
            style: 'mapbox://styles/saipraneethd/cl6zaninz000k14r77hfadi3h',
            center: [lng, lat],
            zoom: zoom,
            attributionControl: false
        });
        // map,current.addControl(new mapboxgl.AttributionControl(), 'bottom-left');
    });

    useEffect(() => {
        if (!map.current) return; // wait for map to initialize
        map.current.on('move', () => {
            setLng(map.current.getCenter().lng.toFixed(4));
            setLat(map.current.getCenter().lat.toFixed(4));
            setZoom(map.current.getZoom().toFixed(2));
        });
    });

    useEffect(() => {
        // For hover effects
        let hoveredStateId = null;

        map.current.on('mousemove', 'route', (e) => {
            // Display Prop
            
            // Change the cursor style as a UI indicator.

            map.current.getCanvas().style.cursor = 'pointer';

            // Copy coordinates array.
            const coordinates = e.features[0].geometry.coordinates;
            const traversals = e.features[0].properties.Traversals;
            // const segment = e.features[0].properties.segment_id;
            // popup.setLngLat(e.lngLat).setHTML(
            //     "<p> Segment ID: " + segment + "</p>" +
            //     "<p> Traversals: " + traversals + "</p>"
            // ).addTo(map.current);

            if (hoveredStateId !== null) {
                hoveredStateId = null;
                map.current.setFeatureState({
                    source: 'bus_routes',
                    id: hoveredStateId
                }, {
                    hover: false
                });
            }
            hoveredStateId = e.features[0].properties.segment_id;
            const segment = e.features.filter(value => Object.keys(value).length !== 0)[0];
            setHoverState(segment.properties.segment_id);
            setFeatures(segment.properties);   
            map.current.setFeatureState({
                source: 'bus_routes',
                id: hoveredStateId
            }, {
                hover: true
            });
            
        });

        map.current.on('mouseleave', 'route', () => {
            map.current.getCanvas().style.cursor = '';
            // popup.remove();
            // console.log("Leaving");
            if (hoveredStateId !== null) {
                
                map.current.setFeatureState({
                    source: 'bus_routes',
                    id: hoveredStateId
                }, {
                    hover: false
                });
            }
            setHoverState(null);
            hoveredStateId = null;
        });
    });


    function fetchMap(city_index) {


        console.log('fetching...')

        fetchJSON("http://localhost:3001/json?" + new URLSearchParams({ id: city_index }))
            .then(function (data) {
                var data_list = [];
                var stop_circles_list = [];
                var max_tr = Math.max.apply(Math, data.features.map(function (o) {
                    return o.properties.Traversals;
                }));
                data.features.forEach(function (feature) {
                    // console.log(feature);
                    // var symbol = feature.properties['icon'];
                    feature.properties['width'] = Math.max(feature.properties['Traversals'] / max_tr * 12, 3);
                    feature.properties['stop_id1'] = feature.geometry.coordinates[0]
                    feature.properties['stop_id2'] = feature.geometry.coordinates.slice(-1)[0];
                    var l = feature.geometry.coordinates.length
                    if (l == 2) {
                        var mp = (feature.geometry.coordinates[0] + feature.geometry.coordinates[1]) / 2
                        feature.properties['mp_lng'] = mp[0];
                        feature.properties['mp_lat'] = mp[1];
                    } else {
                        var mp = feature.geometry.coordinates.slice(parseInt(l / 2))[0];
                        feature.properties['mp_lng'] = mp[0];
                        feature.properties['mp_lat'] = mp[1];
                    }
                    data_list.push(feature)
                    stop_circles_list.push({
                        "type": "Feature",
                        "geometry": {
                            "type": "Point",
                            "coordinates": feature.geometry.coordinates[0]
                        }
                    });
                    stop_circles_list.push({
                        "type": "Feature",
                        "geometry": {
                            "type": "Point",
                            "coordinates": feature.geometry.coordinates.slice(-1)[0]
                        }
                    });
                });
                return [data_list, stop_circles_list];
            })
            .then(function (data) {
                var routes_inp = {
                    "type": "FeatureCollection",
                    "features": data[0]
                };
                var stops_inp = {
                    "type": "FeatureCollection",
                    "features": data[1]
                };
                if (map.current.getLayer('stop')) {
                    remove_routes_stops(map);
                }
                add_routes(routes_inp, map);
                add_stops(stops_inp, map);
                var lat_mean = data[1].map((o) => o.geometry.coordinates[0]).reduce(average, 0);
                var lng_mean = data[1].map((o) => o.geometry.coordinates[1]).reduce(average, 0);
                map.current.flyTo({
                    center: [lat_mean, lng_mean],
                    zoom: 12,
                    essential: true // this animation is considered essential with respect to prefers-reduced-motion
                });
            });
    }
    return (
        <div>
            {/* <pre id="features"></pre> */}
            <DisplayFeatures hovered = {hoveredState} features = {features}/>
            <div id="bottombar" className="bottombar">
                Longitude: {lng} | Latitude: {lat} | Zoom: {zoom}
            </div>
            <DisplaySelect city={city} setCity={setCity} fetchMap={fetchMap} />
            {/* <button id='button' onClick={fetchMap}>
                Fetch Data
            </button> */}
            <div id="map" ref={mapContainer} className="map-container" />
        </div>
    );
}

function average(p, c, i, a) { return p + (c / a.length) };

function add_routes(routes, map) {
    map.current.addSource('bus_routes', {
        'type': 'geojson',  
        'data': routes,
        "promoteId": 'segment_id'
    });
    map.current.addLayer({
        'id': 'route',
        'type': 'line',
        'source': 'bus_routes',
        'layout': {
            'line-join': 'round',
            'line-cap': 'round'
        },
        'paint': {
            'line-width': [
                'interpolate',
                ['linear'],
                ['zoom'],
                8, 0,
                20, 6
            ],
            'line-color': [
                'case',
                ['boolean', ['feature-state', 'hover'], false],
                '#222222',
                '#95a5a6'
            ]
        }
    }, 0);
}

function add_stops(stops, map) {
    map.current.addSource('bus_stops', {
        'type': 'geojson',
        'data': stops,
    });

    // Stops Layer
    map.current.addLayer({
        'id': 'stop',
        'type': 'circle',
        'source': 'bus_stops',
        'paint': {
            'circle-color': '#ED811F',
            'circle-radius': [
                'interpolate',
                ['linear'],
                ['zoom'],
                8, 0,
                20, 6
            ],
            'circle-stroke-width': [
                'interpolate',
                ['linear'],
                ['zoom'],
                8, 0,
                20, 6
            ],
            'circle-stroke-color': '#B2222F',
            'circle-opacity': 0.15,
            'circle-stroke-opacity': 0.25
        }
    });
}

function remove_routes_stops(map) {
    map.current.removeLayer('stop');
    map.current.removeSource('bus_stops');
    map.current.removeLayer('route');
    map.current.removeSource('bus_routes');
}

function clean(obj) {
    for (var propName in obj) {
      if (obj[propName] === null || obj[propName] === undefined) {
        delete obj[propName];
      }
    }
    return obj
  }

// [
//     'interpolate',
//     ['exponential', 2],
//     ['zoom'],
//     12, ["*", 1,
//         ["^", 2, 1]
//     ],
//     24, ["*", 1,
//         ["^", 2, 7]
//     ]
// ]