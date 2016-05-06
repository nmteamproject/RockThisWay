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

let questions = require('./survey-questions'); 

export let questionCount = questions.length;

// list of indexes of questions that were selected to edit
let questionsToEdit = {};

function loadQuestion(question) {
    console.log("loading question: " + question);
    
    if (question === 0) {
        isFirstQuestion = true;
    } else {
        isFirstQuestion = false;
    }
    
    // update currentQuestion
    currentQuestion = question;

    console.log("rendering question");
    // render the question
    let data = questions[question];
    
    data.isFirstQuestion = isFirstQuestion;
    data.currentQuestion = parseInt(question) + 1; // add one because of zero index 
    data.questionCount = questionCount;
    
    $root.html(surveyTemplate(data));     
}

function selectAnswer() {
    // if we're in edit mode we can select more than one
    if (!isEditing) {
        $(this).siblings().removeClass('selected');
        // save the answer
        questions[currentQuestion]["savedAnswer"] = $(this).text();
    }
    $(this).addClass('selected');
}

export function initEditPage() {
    // set up template
    let editSurveyScript = $('#survey-edit-template').html();
    let editSurveyTemplate = Handlebars.compile(editSurveyScript);
    
    // set up data
    let data = {};
    
    // fill in for any questions that weren't answered
    for (let i = 0; i < questions.length; i++) {
        if (!questions[i]["savedAnswer"]) {
            questions[i]["savedAnswer"] = "You didn't answer!"
        }
    }
    data.questions = questions;
    
    // set up event listeners
    $root.on('change', 'input[type="checkbox"]', function() {
        let val = $(this).val();
        
        // if the box was checked
        if ($(this).is(":checked")) {
            // save it to our questions
            if (!questionsToEdit[val]) {
                questionsToEdit[val] = true;
            }
        } else {
            // if the box is being unchecked
            // delete it from our questions
            if (questionsToEdit[val]) {
                questionsToEdit[val] = false;
            }
        }
    });
    $root.on('click', '.bottom-cta:not(.blue)',  function() {
        console.log("retake");
        // once we hit retake go back to survey
        initSurvey();
    });
    
    // render the template
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
    if (!isEditing) {
        $root.on('click', 'li', selectAnswer); 
        $root.on('click', '.next', function() {
            // go to next question
            currentQuestion++;
            loadQuestion(currentQuestion);
        }); 
        $root.on('click', '.back', function() {
            if (!isFirstQuestion) {
                // go to previous question
                currentQuestion--; 
                loadQuestion(currentQuestion); 
            }
        });
        $root.on('click', '.bottom-cta:not(.red)',  function() {
            // go to next question (unless it's the retake button)
            console.log("clicked");
            
            console.log(currentQuestion);
            console.log(questionCount);
            // if we're on the last question    
            if (currentQuestion >= questionCount-1) {
                if (!isEditing) {    
                    // first time they hit the last question activate edit page
                    isEditing = true;
                    initEditPage();
                } else {
                    // else take them to the results
                    console.log("results");
                }
            } else {
                currentQuestion++; 
                loadQuestion(currentQuestion);
            }
        });
    }
    
    // Load the first question
    startSurvey();
}

function startSurvey() {
    console.log("starting");
    // if we're editing, 
    // filter the questions just the ones selected to edit
    if (isEditing) {
        questions = questions.filter(function(el, index) {
            if (questionsToEdit[index]) {
                return true;
            }
        });
    };
    loadQuestion(first(questions)); 
}