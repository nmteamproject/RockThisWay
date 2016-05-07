import $ from 'jquery';
var Handlebars = require('handlebars');

const results = {
    "rock": {
        title: "Forver Rock and Roll",
        desc: "Your plan will show you the best Rock and Roll exhibits from classic to modern!"
    },
    "pop": {         
        title: "Popular and Contemporary",
        desc: "You will see more contemporary artists that have already made their way into the Rock Hall!"
    },
    "country": {        
        title: "Country Love",
        desc: "Your plan will show you the roots and inspiration of Rock and Roll, good ol\' country music!" 
    },
    "alternative": {           
        title: "Alternative Grunge",
        desc: "You love anything and everything a little out of the box. You will see the greatest examples of Alternative music!" 
    }
};

let surveyScript;
let surveyTemplate;
let $root;

let currentQuestion = 0;
let isFirstQuestion = true; 
let isLastQuestion = false;

// are we in edit mode
let isEditing = false;

// keep track of how far we've gone in edit array
let editMarker = 0;

// list of our questions
let questions = require('./survey-questions'); 

export let questionCount = questions.length;

// list of indexes of questions that were selected to edit
let questionsToEdit = [];

/**
 * Event listener for selecting an answer
 */
function selectAnswer() {
    $(this).siblings().removeClass('selected');
    
    $(this).addClass('selected');
    // save the answer
    questions[currentQuestion]["savedAnswer"] = $(this).text();
}

/** 
 * Event listener for checking answers to edit
 */
function selectAnswerToEdit() {
    let val = $(this).val();
   
    if ($(this).is(":checked")) {
        // if the box was checked
        // save it to our questions
        if (questionsToEdit.indexOf(val) === -1) {
            questionsToEdit.push(val);
        } 
        
        // and add styling
        $(this).parent().addClass('selected');
        
        // console.log('selected a question to edit: ' + questionsToEdit); 
    } else {
        // if the box is being unchecked
        // delete it from our questions
        if (questionsToEdit.indexOf(val) !== -1) {
            let index = questionsToEdit.indexOf(val);
            questionsToEdit.splice(index, 1);
        }
       
        // console.log('removed a question to edit: ' + questionsToEdit);
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
    $root.on('click', '.bottom-cta.red',  function() {
        // for red button
        if (questionsToEdit.length > 0) {
            // if we pick some options
            initSurvey(); 
        }
        else {
            // if we didn't pick any options, go straight to results
            let result = calculateResult();
            let data = results[result];
            initResults(data, result); 
        }
    });
    
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
    
    $(document.body).addClass('edit');
}

function next() {
    $(document.body).removeClass('edit'); 
    
    if (isEditing) {
        editMarker++;
        currentQuestion = questionsToEdit[editMarker];
        progress();
    } else {
        if (currentQuestion >= questions.length - 1) {   
            isLastQuestion = true;
            initEditPage();
        } else {
            currentQuestion++;
            progress();
        } 
    }
}

// TODO: make work for edit mode
function back() {
    if (!isFirstQuestion) {
        // go to previous question
        currentQuestion--;
        progress(); 
    }
}

function progress() { 
    // else go to next question 
    loadQuestion(currentQuestion);
}

function startSurvey() {
    // console.log("Are we editing? " + isEditing);
    // console.log("starting survey");
    // // if we're editing
    isFirstQuestion = true;
    if (isEditing) { 
       editMarker = 0;
       // console.log("questionsToEdit.length: " + questionsToEdit.length);
       // console.log("editMarker: " + editMarker);
       // load the first question we've selected to edit
       loadQuestion(questionsToEdit[editMarker], true); 
    } else {
       // or just the first one
       loadQuestion(0, true);
    }
}

/**
 * Render a question
 */
function loadQuestion(question, isFirst) {
    // console.log("rendering question: " + question);
    
    isFirstQuestion = isFirst;
   
    // update currentQuestion
    currentQuestion = question;
    
    // render the question 
    let data = questions[question];
    
    data.isFirstQuestion = isFirstQuestion;
    data.currentQuestion = parseInt(question) + 1; // add one because of zero index 
    data.questionCount = questionCount;
    
    $root.html(surveyTemplate(data));
}

/**
 * Start the results page
 */
function initResults(data, result) {
    // console.log("starting results page");
    
    let resultsScript = $('#survey-results-template').html();
    let resultsTemplate = Handlebars.compile(resultsScript);
    
    $root.html(resultsTemplate(data));
    
    $(document.body).addClass(result); 
}

/**
 * Start the survey page
 */
export function initSurvey() {
    // Setup template
    $root = $('#content'); 
    surveyScript = $('#survey-template').html();
    
    surveyTemplate = Handlebars.compile(surveyScript);
    
    // Setup event listeners
    $root.on('click', '.survey-options li', selectAnswer); 
    $root.off('click', '.next', clickEventHandler); 
    $root.on('click', '.next', clickEventHandler); 
    $root.on('click', '.back', back); 
    $root.off('click', '.bottom-cta.blue',  clickEventHandler);
    $root.on('click', '.bottom-cta.blue',  clickEventHandler);
    
    // Load the first question
    startSurvey();
}

/**
 * Event handler for whenever the button is clicked
 */
function clickEventHandler() {
    if (isEditing && editMarker >= questionsToEdit.length - 1) {
        // if we're editing and at the last question
        isLastQuestion = true;
        let result = calculateResult();
        let data = results[result];
        initResults(data, result);
    } else {  
        next();
    }
}

/**
 * Assign our result
 */
function calculateResult() {
    $(document.body).removeClass('edit'); 
    if (!questions[1].savedAnswer || questions[1].savedAnswer === "You didn't answer!") {
        return "rock";
    }
    sessionStorage.setItem("result", questions[1].savedAnswer.toLowerCase());
    return questions[1].savedAnswer.toLowerCase();
}