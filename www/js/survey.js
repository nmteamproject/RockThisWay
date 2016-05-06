import $ from 'jquery';
var Handlebars = require('handlebars');

const questions = require('./survey-questions');

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
    
export let questionCount = questions.length;

let surveyScript;
let surveyTemplate;
let $root;

let currentQuestion = 0;
let isFirstQuestion = true;
let isLastQuestion = false;
let isEditing = false;

function loadQuestion(question) {
    if (question === 0) {
        isFirstQuestion = true;
    } else {
        isFirstQuestion = false;
    }
    
    // if we're on the last question    
    if (currentQuestion >= questionCount - 1) {
        if (!isEditing) {    
            // first time they hit the last question activate edit page
            isEditing = true;
            initEditPage();
        } else {
            // else take them to the results
            //$('.bottom-cta').attr('href', 'survey-results.html');
        }
    } else {
        // else render the question
        let data = questions[question];
        data.isFirstQuestion = isFirstQuestion;
        data.currentQuestion = currentQuestion + 1; // add one because of zero index
        data.questionCount = questionCount;
    
        $root.html(surveyTemplate(data)); 
    }
}

function selectAnswer() {
    $(this).siblings().removeClass('selected');
    $(this).addClass('selected');
    // save the answer
    questions[currentQuestion]["savedAnswer"] = $(this).text();
}

let questionsToEdit = [];

export function initEditPage() {
    let editSurveyScript = $('#survey-edit-template').html();
    let editSurveyTemplate = Handlebars.compile(editSurveyScript);
    let data = {};
    // fill in for any questions that weren't answered
    for (let i = 0; i < questions.length; i++) {
        if (!questions[i]["savedAnswer"]) {
            questions[i]["savedAnswer"] = "You didn't answer!"
        }
    }
    data.questions = questions;
    // render the edit template
    $root.html(editSurveyTemplate(data));
}

export function initSurvey($templateRoot, $templateId) {
    // Setup template
    $root = $templateRoot;
    surveyScript = $templateId.html();
    surveyTemplate = Handlebars.compile(surveyScript);
    
    // Setup event listeners
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
        currentQuestion++;
        loadQuestion(currentQuestion);
    });
    
    loadQuestion(0);
}