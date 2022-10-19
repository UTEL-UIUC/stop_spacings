import React, { useRef, useEffect, useState } from 'react';
import ReactDOM from 'react-dom/client';
import './map_canvas.css';
import App from './map_script';
// import Select from 'react-select';



function MountStart() {
    const root = ReactDOM.createRoot(document.getElementById('root'));
    root.render(<React.StrictMode><App/></React.StrictMode>);
    // root.render(<App/>);
};



MountStart();

export function fetchJSON(url, params = {}) {
    return fetch(url)
        .then(function (response) {
            if (response.ok) {
                return response.json();
            } else {
                throw new Error('Server response wasnt OK');
            }
        });
};