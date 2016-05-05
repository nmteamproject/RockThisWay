var $ = require('jquery');
import { evothings } from './../libs/evothings/evothings';
import { sortable } from './../libs/sortable/Sortable';
import './app';
var attachFastClick = require('fastclick'); 

// avoid the 300ms click delay on mobile devices
attachFastClick(document.body); 

$(function() {
    localStorage.removeItem("user");
    localStorage.removeItem("score");
    localStorage.atcScore = 0;
    localStorage.triviaScore = 0;
    localStorage.lyricScore = 0;
});