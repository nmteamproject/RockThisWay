import $ from 'jquery';
import jQuery from 'jquery';
// export for others scripts to use
window.$ = $;
window.jQuery = jQuery;

import { evothings } from './../libs/evothings/evothings';
import { sortable } from './../libs/sortable/Sortable';
import './app';
var attachFastClick = require('fastclick'); 

$(document).ready(function() {
    // clear localStorage on home page load
    // if (window.location.pathname = '/index.html') {    
    //     cleanOnStart();
    // }
    
    // avoid the 300ms click delay on mobile devices
    attachFastClick(document.body);
});