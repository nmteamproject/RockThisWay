window.$ = window.jQuery = require('jquery');

var bootstrap = require('./../../node_modules/bootstrap/dist/js/bootstrap.js');
import { evothings } from './../libs/evothings/evothings';
import { sortable } from './../libs/sortable/Sortable';
import "./app";
var attachFastClick = require('fastclick');

// avoid the 300ms click delay on mobile devices
attachFastClick(document.body);

