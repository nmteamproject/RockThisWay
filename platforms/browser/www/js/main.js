import $ from 'jquery';
import jQuery from 'jquery';
// export for others scripts to use
window.$ = $;
window.jQuery = jQuery;

import { evothings } from './../libs/evothings/evothings';
import { sortable } from './../libs/sortable/Sortable';
var attachFastClick = require('fastclick'); 
import * as survey from './survey.js'; 

$(document).ready(function() {
    // avoid the 300ms click delay on mobile devices
    attachFastClick(document.body); 
    
    // if we're on the survey page launch the survey script
    if (location.pathname.match(/survey/gi)) {
        survey.initSurvey();
    }
}); 