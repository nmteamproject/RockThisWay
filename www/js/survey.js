import $ from 'jquery';
var Handlebars = require('handlebars');

const results = {
    "rock": {
        title: "Forver Rock and Roll",
        desc: "Your plan will show you the best Rock and Roll exhibits from classic to modern!"
    },
    "contemporary": {         
        title: "Popular and Contemporary",
        desc: "You will see more contemporary artists that have already made their way into the Rock Hall!"
    },
    "country": {        
        title: "Country Love",
        desc: "Your plan will show you the roots and inspiration of Rock and Roll, good ol\' country music!" 
    },
    "alternative": {           
        title: "Something Different",
        desc: "You love anything and everything a little out of the box. You will see the greatest examples of Alternative music!" 
    }
};

let surveyScript;
let surveyTemplate;
let $root;

let currentQuestion = 0;
let isFirstQuestion = true;
let isLastQuestion = false;
let isEditing = false;

// keep track of how far we've gone in edit array
let editMarker = 0;

let questions = require('./survey-questions'); 

export let questionCount = questions.length;

// list of indexes of questions that were selected to edit
let questionsToEdit = [];

function selectAnswer() {
    // if we're in edit mode we can select more than one
    if (!isEditing) {
        $(this).siblings().removeClass('selected');
    }
    $(this).addClass('selected');
    
    // save the answer
    questions[currentQuestion]["savedAnswer"] = $(this).text();
}

function selectAnswerToEdit() {
    let val = $(this).val();
    console.log(val);
   
    if ($(this).is(":checked")) {
        // if the box was checked
        // save it to our questions
        questionsToEdit.push(val.toString());
        
        // and add styling
        $(this).parent().addClass('selected');
        
        console.log('selected a question to edit: ' + questionsToEdit); 
    } else {
        // if the box is being unchecked
        // delete it from our questions
        questionsToEdit[val] = false; 
       
        console.log('removed a question to edit: ' + questionsToEdit);
        // and remove styling
        $(this).parent().removeClass('selected'); 
    }
}

export function initEditPage() {
    // we are now editing
    isEditing = true;
    
    // set up template
    let editSurveyScript = $('#survey-edit-template').html();
    let editSurveyTemplate = Handlebars.compile(editSurveyScript);
    
    // set up event listeners
    $root.on('change', 'input[type="checkbox"]', selectAnswerToEdit);
    $root.on('click', '.bottom-cta:not(.blue)',  initSurvey);
    
    // set up data
    let data = {};
    
    // fill in for any questions that weren't answered
    for (let i = 0; i < questions.length; i++) {
        if (!questions[i]["savedAnswer"]) {
            questions[i]["savedAnswer"] = "You didn't answer!"
        }
    }
    // render the template
    data.questions = questions;
    $root.html(editSurveyTemplate(data));
}

function first(obj) {
    for (var a in obj) return a;
}

export function initSurvey() {
    // Setup template
    $root = $('#content'); 
    surveyScript = $('#survey-template').html();
    
    surveyTemplate = Handlebars.compile(surveyScript);
    
    // Setup event listeners
    $root.on('click', '.survey-options li', selectAnswer); 
    $root.on('click', '.next', next); 
    $root.on('click', '.back', back); 
    $root.on('click', '.bottom-cta:not(.red)',  next);
    
    // Load the first question
    startSurvey();
}

function next() {
    if (isEditing) {
        console.log("questionsToEdit.length: " + questionsToEdit.length);
        console.log("editMarker: " + editMarker);

        editMarker++;
        if (editMarker >= questionsToEdit.length) {
            console.log('last question');
        } else {
            currentQuestion = questionsToEdit[editMarker];
            progress();
        }
    } else {
        if (currentQuestion >= questions.length) {   
            console.log("last question");
        } else {
            progress();
            currentQuestion++;
        }
    }
}

function back() {
    if (!isFirstQuestion) {
        // go to previous question
        currentQuestion--;
        progress(); 
    }
}

function progress() { 
    if (currentQuestion >= questions.length) {
        // start editing
        initEditPage();
    } else { 
        // else go to next question 
        loadQuestion(currentQuestion);
    }
}

function startSurvey() {
    console.log("Are we editing? " + isEditing);
    console.log("starting survey");
    next(); 
    // // if we're editing
    // if (isEditing) {
    //    // load the first question we've selected to edit
    //    console.log("editMarker: " + editMarker);
    //    loadQuestion(questionsToEdit[editMarker], true); 
    // } else {
    //    // or just the first one
    //    loadQuestion(0, true);
    // }
}

function loadQuestion(question, isFirst) {
    console.log("loading question: " + question);
    
    isFirstQuestion = isFirst;
   
    // update currentQuestion
    currentQuestion = question;

    console.log("currentQuestion: " + currentQuestion);
    
    console.log("rending question");
    
    // render the question 
    let data = questions[question];
    
    data.isFirstQuestion = isFirstQuestion;
    data.currentQuestion = parseInt(question) + 1; // add one because of zero index 
    data.questionCount = questionCount;
    
    $root.html(surveyTemplate(data));
    
    if (isEditing && editMarker >= questionsToEdit.length-1) {
        console.log("done"); 
    }
}