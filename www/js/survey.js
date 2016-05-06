import $ from 'jquery';
var Handlebars = require('handlebars');

const questions = [
    {
        "question": "Been here before?",
        "icon": "record",
        "answers": [
            {
                "points": "0",
                "answer": "Yes"
            },
            {
                "points": "0",
                "answer": "No"
            },
            {
                "points": "0",
                "answer": "Maybe"
            },
            {
                "points": "0",
                "answer": "Not sure"
            }
        ]
    },
    {
        "question": "Pick a genre",
        "icon": "record",
        "answers": [
            {
                "points": "1",
                "answer": "Rock"
            },
            {
                "points": "2",
                "answer": "Pop"
            },
            {
                "points": "3",
                "answer": "Alternative"
            },
            {
                "points": "4",
                "answer": "Country"
            }
        ]
    },
    {
        "question": "Pick a decade",
        "icon": "record",
        "answers": [
            {
                "points": "3",
                "answer": "60s"
            },
            {
                "points": "1",
                "answer": "70s"
            },
            {
                "points": "1",
                "answer": "80s"
            },
            {
                "points": "2",
                "answer": "90s"
            }
        ]
    },
    {
        "question": "Pick a song",
        "icon": "record",
        "answers": [
            {
                "points": "1",
                "answer": "\"Jump\" by Van Halen"
            },
            {
                "points": "2",
                "answer": "\"Like a Virgin\" by Madonna"
            },
            {
                "points": "2",
                "answer": "\"Hotline Bling\" by Drake"
            },
            {
                "points": "4",
                "answer": "\"Ring of Fire\" by Johnny Cash"
            }
        ]
    },
    {
        "question": "Pick an artist",
        "icon": "record",
        "answers": [
            {
                "points": "1",
                "answer": "Aerosmith"
            },
            {
                "points": "2",
                "answer": "Beyonce"
            },
            {
                "points": "4",
                "answer": "Nirvana"
            },
            {
                "points": "1",
                "answer": "Green Day"
            }
        ]
    },
    {
        "question": "Pick an instrument",
        "icon": "record",
        "answers": [
            {
                "points": "1",
                "answer": "Guitar"
            },
            {
                "points": "1",
                "answer": "Bass"
            },
            {
                "points": "1",
                "answer": "Drums"
            },
            {
                "points": "4",
                "answer": "Piano"
            }
        ]
    },
    {
        "question": "Pick an artifact",
        "icon": "record",
        "answers": [
            {
                "points": "4",
                "answer": "Kurt Cobain's Guitar"
            },
            {
                "points": "2",
                "answer": "Michael Jackson's Glove"
            },
            {
                "points": "3",
                "answer": "Taylor Swift's Lyric Sheets"
            },
            {
                "points": "1",
                "answer": "Elvis Presley's Custom Motorcycle"
            }
        ]
    }
];

const results = [
    {   
        title: "Forver Rock and Roll",
        desc: "Your plan will show you the best Rock and Roll exhibits from classic to modern!"
    },
    {   
        title: "Popular and Contemporary",
        desc: "You will see more contemporary artists that have already made their way into the Rock Hall!"
    },
    {   
        title: "Country Love",
        desc: "Your plan will show you the roots and inspiration of Rock and Roll, good ol\' country music!"
    },
    {   
        title: "Something Different",
        desc: "You love anything and everything a little out of the box. You will see the greatest examples of Alternative music!"
    }
];

export let questionCount = questions.length;

let surveyScript;
let surveyTemplate;
let $root;

let currentQuestion = 0;
let isFirstQuestion = true;

export function loadQuestion(question) {
    isFirstQuestion = (question === 0) ? true : false;
    
    let data = questions[question]; 
    data['isFirstQuestion'] = isFirstQuestion;
    $root.html(surveyTemplate(data));
}

function selectQuestion() {
    $(this).siblings().removeClass('selected');
    $(this).addClass('selected');
}

export function initSurvey($templateRoot, $templateId) {
    // Setup template
    $root = $templateRoot;
    surveyScript = $templateId.html();
    surveyTemplate = Handlebars.compile(surveyScript);
    
    // Setup event listeners
    $templateRoot.on('click', 'li', selectQuestion);
    $('.bottom-cta').on('click', function() {
        loadQuestion(currentQuestion + 1);
    });
    
    loadQuestion(0);
}