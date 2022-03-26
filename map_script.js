// TO MAKE THE MAP APPEAR YOU MUST
// ADD YOUR ACCESS TOKEN FROM
// https://account.mapbox.com
mapboxgl.accessToken =
    'pk.eyJ1Ijoic2FpcHJhbmVldGhkIiwiYSI6ImNsMHRvdGR6eTBwMzEzY3FwZ3J2YjF5Y2UifQ.BVrcTF-CiMB5gVqLCV_U-w';
const map = new mapboxgl.Map({
    container: 'map',
    style: 'mapbox://styles/saipraneethd/cl0tppk30000115l7t21cm3lc',
    center: [-122.676, 45.513],
    zoom: 12
});

function fetchJSON(url) {
    return fetch(url)
        .then(function (response) {
            return response.json();
        });
}
var data_list = []
var stop_circles_list = []
fetchJSON('portland_gtfs.geojson') // portland_gtfs
    .then(function (data) {
        max_tr = Math.max.apply(Math, data.features.map(function (o) {
            return o.properties.Traversals;
        }));
        // do what you want to do with `data` here...
        data.features.forEach(function (feature) {
            // console.log(feature);
            // var symbol = feature.properties['icon'];
            feature.properties['width'] = Math.max(feature.properties['Traversals'] / max_tr * 12, 3)
            feature.properties['stop_id1'] = feature.geometry.coordinates[0]
            feature.properties['stop_id2'] = feature.geometry.coordinates.slice(-1)[0]
            l = feature.geometry.coordinates.length
            if (l == 2){
                mp = (feature.geometry.coordinates[0] + feature.geometry.coordinates[1])/2
                feature.properties['mp_lng'] = mp[0]
                feature.properties['mp_lat'] = mp[1]
            }else{
                mp = feature.geometry.coordinates.slice(parseInt(l/2))[0]
                feature.properties['mp_lng'] = mp[0]
                feature.properties['mp_lat'] = mp[1]
            }
            data_list.push(feature)
            stop_circles_list.push({
                "type": "Feature",
                "geometry": {
                    "type": "Point",
                    "coordinates": feature.geometry.coordinates[0]
                }
            })
            stop_circles_list.push({
                "type": "Feature",
                "geometry": {
                    "type": "Point",
                    "coordinates":  feature.geometry.coordinates.slice(-1)[0]
                }
            })
        });
    });
console.log(stop_circles_list.length)
stop_circles_list = [... new Set(stop_circles_list)]
console.log(stop_circles_list.length)
routes_inp = {
    "type": "FeatureCollection",
    "features": data_list
}
stops_inp = {
    "type": "FeatureCollection",
    "features": stop_circles_list
}

console.log(routes_inp)
map.on('load', () => {
    // Main source of data
    map.addSource('bus_route', {
        'type': 'geojson',
        'data': routes_inp,
        "promoteId": 'segment_id'
    });

    map.addSource('bus_stops', {
        'type': 'geojson',
        'data': stops_inp,
    });
    // Routes Layer
    map.addLayer({
        'id': 'route',
        'type': 'line',
        'source': 'bus_route',
        'layout': {
            'line-join': 'round',
            'line-cap': 'round'
        },
        'paint': {
            'line-width': [
                'interpolate',
                ['exponential', 2],
                ['zoom'],
                12, ["*", ["get", "width"],
                    ["^", 2, 0]
                ],
                24, ["*", ["get", "width"],
                    ["^", 2, 7]
                ]
            ],
            'line-color': [
                'case',
                ['boolean', ['feature-state', 'hover'], false],
                '#222222',
                '#95a5a6'
            ]
        }
    }, 0);
    // Stops Layer
    map.addLayer({
        'id': 'stop',
        'type': 'circle',
        'source': 'bus_stops',
        'paint': {
            'circle-color': '#ED811F',
            'circle-radius': [
                'interpolate',
                ['exponential', 2],
                ['zoom'],
                12, ["*", 1,
                    ["^", 3, 1]
                ],
                24, ["*", 1,
                    ["^", 2, 7]
                ]
            ],
            'circle-stroke-width': [
                'interpolate',
                ['exponential', 2],
                ['zoom'],
                12, ["*", 1,
                    ["^", 2, 1]
                ],
                24, ["*", 1,
                    ["^", 2, 7]
                ]
            ],
            'circle-stroke-color': '#B2222F',
            'circle-opacity': 0.15,
            'circle-stroke-opacity': 0.25
        }
    }, 0);


    // Create a popup, but don't add it to the map yet.
    const popup = new mapboxgl.Popup({
        closeButton: false,
        closeOnClick: false
    });


    function display_prop(e) {
        const features = map.queryRenderedFeatures(e.point);

        // Limit the number of properties we're displaying for
        // legibility and performance
        const displayProperties = [
            // 'type',
            'properties',
            // 'id',
            // 'layer',
            // 'source',
            // 'sourceLayer',
            // 'state'
        ];

        const displayFeatures = features.map((feat) => {
            const displayFeat = {};
            let shouldSkip = false;
            displayProperties.forEach((prop) => {
                if ("route_id" in feat[prop]) {
                    displayFeat[prop] = feat[prop];
                    return false;
                }
            });
            return displayFeat;
        });
        // console.log(displayFeatures)

        // Write object as string with an indent of two spaces.
        document.getElementById('features').innerHTML = JSON.stringify(
            displayFeatures,
            null,
            2
        );
    }

    // For hover effects
    let hoveredStateId = null;
    map.on('mousemove', 'route', (e) => {
        // Display Prop
        display_prop(e)
        // Change the cursor style as a UI indicator.
        map.getCanvas().style.cursor = 'pointer';

        // Copy coordinates array.
        const coordinates = e.features[0].geometry.coordinates;
        const traversals = e.features[0].properties.Traversals;
        const segment = e.features[0].properties.segment_id;
        // Ensure that if the map is zoomed out such that multiple
        // copies of the feature are visible, the popup appears
        // over the copy being pointed to.
        midpoint = [e.features[0].properties.mp_lng,e.features[0].properties.mp_lat]
        // console.log(turf.along(e.features[0],turf.length(e.features[0])/2))
        while (Math.abs(e.lngLat.lng - midpoint) > 180) {
            midpoint += e.lngLat.lng > midpoint ? 360 : -360;
        }
        // Populate the popup and set its coordinates
        // based on the feature found.
        popup.setLngLat(midpoint).setHTML(
            "<p>Segment ID: " + segment + "</p>" +
            "<p>Traversals: " + traversals + "</p>"
        ).addTo(map);

        if (hoveredStateId !== null) {
            map.setFeatureState({
                source: 'bus_route',
                id: hoveredStateId
            }, {
                hover: false
            });
        }
        hoveredStateId = e.features[0].properties.segment_id;

        map.setFeatureState({
            source: 'bus_route',
            id: hoveredStateId
        }, {
            hover: true
        });

    });

    map.on('mouseleave', 'route', () => {
        map.getCanvas().style.cursor = '';
        popup.remove();
        if (hoveredStateId !== null) {
            map.setFeatureState({
                source: 'bus_route',
                id: hoveredStateId
            }, {
                hover: false
            });
        }
        hoveredStateId = null;
    });

});