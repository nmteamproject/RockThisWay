window.onload = startQuestion;

localStorage.atcScore = 0;

var questionNumber = 0;
var questionID = eval("q" + questionNumber + "Answers");
var strikes = 0;
var numberCorrect = 0;
var totalScore = 0;

var asking = true;
var next = false;
var moveon = false;

document.getElementById("submit").addEventListener("click", function(){
    if (asking){
        submit();
    }else if (next){
        startQuestion();
    }else if (moveon){
        document.location = "gameend.html"
    }
    
});


function startQuestion() {

    if (questionNumber == 3) {
        document.location = "user.html";
    }
    
    document.getElementById('submit').innerHTML = "Submit";
    
    asking = true;
    next = false;
    document.getElementById('question').innerHTML = questions[questionNumber];
    questionID = eval("q" + questionNumber + "Answers");
    var questionList = "";

    for (var i = 0; i < questionID.length; i++) {
        questionList += "<div class='crowdQuestion' id='crowdQ" + i + "'>" + (i + 1) + "</div>";
    }
    document.getElementById('questionAnswers').innerHTML = questionList;
}

function submit() {

    var correct = false;
    var answer = document.getElementById('answer').value.toLowerCase();
    for (var i = 0; i < questionID.length; i++) {
        if (answer.toLowerCase() == questionID[i].answer.toLowerCase()) {
            var correctResponse = "crowdQ" + i;

            document.getElementById(correctResponse).innerHTML = "<div class='answerText'>" + questionID[i].answer + "</div> &nbsp <div class='answerPoints'>" + questionID[i].points + "</div>";

            document.getElementById(correctResponse).classList.add('animated');
            document.getElementById(correctResponse).classList.add('flipInY');
            document.getElementById(correctResponse).classList.remove('crowdQuestion');
            document.getElementById(correctResponse).classList.add('correctAnswer');
            numberCorrect++;
            correct = true;
            var newPoints = parseInt(questionID[i].points);

            totalScore += parseInt(newPoints);
            localStorage.atcScore = parseInt(totalScore);
        }
    }

    if (correct == false) {
        strikes++;
        document.getElementById('answer').style.border = "1px solid #ff0000";
    }

    if (strikes == 3) {
        for (var i = 0; i < questionID.length; i++) {
            var correctResponse = "crowdQ" + i;

            document.getElementById(correctResponse).innerHTML = "<div class='answerText'>" + questionID[i].answer + "</div> &nbsp <div class='answerPoints'>" + questionID[i].points + "</div>";
            document.getElementById(correctResponse).classList = "correctAnswer animated flipInY";


        }

        document.getElementById('strikes').innerHTML = "You got 3 strikes!";
        prepareMoveOn();

    }

    if (numberCorrect == questionID.length) {
        document.getElementById('strikes').innerHTML = "You got them all!";
        prepareMoveOn();
    }

}

function prepareMoveOn() {
    strikes = 0;
    numberCorrect = 0;
    clearAnswer();
    questionNumber++;
    if (questionNumber != 3) {
        document.getElementById('submit').innerHTML = "Next";
        asking = false;
        next = true;
    } else {
        document.getElementById('submit').innerHTML = "Finish";
        asking = false;
        next = false;
        moveon = true;
    }


}

function clearAnswer() {
    document.getElementById('answer').value = "";
    document.getElementById('answer').style.border = "1px solid #acacac";
}