import $ from 'jquery';
import jQuery from 'jquery';
// export for others scripts to use
window.$ = $;
window.jQuery = jQuery;

import 'bootstrap';
import { evothings } from './../libs/evothings/evothings';
import { sortable } from './../libs/sortable/Sortable';
var attachFastClick = require('fastclick');

// avoid the 300ms click delay on mobile devices
attachFastClick(document.body);

