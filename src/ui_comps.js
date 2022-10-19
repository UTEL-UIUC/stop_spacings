import React, { useRef, useEffect, useState } from 'react';
import { fetchJSON} from './index';


// material UI - imports
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import TextField from '@mui/material/TextField';
import Autocomplete from '@mui/material/Autocomplete';

// material icons
import DirectionsBusIcon from '@mui/icons-material/DirectionsBus';
import StraightenIcon from '@mui/icons-material/Straighten';
import RepeatIcon from '@mui/icons-material/Repeat';
import PlaceIcon from '@mui/icons-material/Place';

export function DisplayFeatures(props) {
    var features = props.features;
    const [segment, setSegment] = useState(null);
    const [route, setRoute] = useState(null);
    const [spacing, setSpacing] = useState(null);
    const [stop_id1, setStop_id1] = useState(null);
    const [stop_id2, setStop_id2] = useState(null);
    const [traversals, setTraversals] = useState(null);

    useEffect(() => {
        if (features !== null && props.hovered !== null) {
            setSegment(features.segment_id);
            setRoute(features.route_id);
            setSpacing(features.distance);
            setStop_id1(features.stop_id1);
            setStop_id2(features.stop_id2);
            setTraversals(features.traversals);
        }else{
            setSegment(null);
            setRoute(null);
            setSpacing(null);
            setStop_id1(null);
            setStop_id2(null);
            setTraversals(null);
        }
    });
    return(<List id ='features' m={0} pt={0}>
            <ListItem><ListItemText>Selected Segment : {segment}</ListItemText></ListItem>
            <ListItem><ListItemIcon className = 'my-icon'><DirectionsBusIcon style={{ color: '#fff' }}/></ListItemIcon><ListItemText>Route : {route}</ListItemText></ListItem>
            <ListItem><ListItemIcon className = 'my-icon'><StraightenIcon style={{ color: '#fff' }}/></ListItemIcon><ListItemText>Length: {Math.round(spacing)}m</ListItemText></ListItem>
            {/* <ListItem><ListItemIcon><PlaceIcon style={{ color: '#fff' }}/></ListItemIcon><ListItemText>Stop ID1 : {stop_id1}</ListItemText></ListItem> */}
            {/* <ListItem><ListItemIcon><PlaceIcon style={{ color: '#fff' }}/></ListItemIcon><ListItemText>Stop ID 2 : {stop_id2}</ListItemText></ListItem> */}
            <ListItem><ListItemIcon><RepeatIcon style={{ color: '#fff' }}/></ListItemIcon><ListItemText>Traversals : {traversals}</ListItemText></ListItem>
           </List>);
    // return(<pre id="features">{props.features}</pre>)
};

export function DisplaySelect(props) {
    const [options, setOptions] = useState(['default']);
    // const [city,setCity] = useState(null);
    // useEffect(() => {console.log(options);})

    useEffect(() => {

        fetchJSON("http://praneethd.web.illinois.edu//list")
            .then((data) => {
                const option_list = data.list.map(function (item, index) {
                    return { label: item, id: index };
                });
                return option_list; 

            })
            .then((data) => {
                setOptions(data);
            })
            .catch((err) => {
                console.log(err);
            }
            );
    }, []);

    return (<div>
        <Autocomplete
            id='search'
            options={options}
            sx={{ width: 600, height: 50 }}
            renderInput={(params) => <TextField {...params} placeholder='Search City' variant="outlined" />}
            onChange={(event, e) => {
                if (e !== null) {
                    props.fetchMap(e.id);
                    props.setCity(e.label);
                }
            }
            } />
        {/* <DisplayCity city={props.city} /> */}
    </div>
    );
};

function DisplayCity(props) {
    return (<div id='city'>Selected Provider: {props.city}</div>);
};
