import $ from 'jquery';
const Handlebars = require('handlebars');

let $triviaScript;
let $resultsScript;
let $root;

export function initTrivia() {
    $root = $('#content');
    $triviaScript = $('#trivia-main-template').html(); 
    $resultsScript = $('#trivia-results-template').html();
    renderTrivia();
}

function renderTrivia(data) {
    let triviaTemplate = Handlebars.compile($triviaScript);
    $root.append(triviaTemplate(data));
}

function renderResults(data) {
    let resultsTemplate = Handlebars.compile($resultscript);
    $root.append(resultsTemplate(data));
}