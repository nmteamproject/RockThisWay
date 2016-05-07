window.onload = loadWordBank;

var lyricNumber = 0;
var swapCount = 0;
var swapLyric;
var playingMusic = false;
var soundFile;
var timer = null;

//Vars for timer function
var conCount = 1;
var timeForGame = 0;
var finalScore = 0;
var staticTimerGrab = 0; //Grabs the time when the quiz completes and saves it off as a static int.

localStorage.lyricScore = 0;

// Timer for song length UI
function tick() {

    var songTime = (soundFile.currentTime / soundFile.duration) * 359;

    //document.getElementById("arc1").setAttribute("d", describeArc(57, 50, 37, 0, songTime));
}

function start() {
    tick();
    timer = setTimeout(start, 1000);
    timeForGame++;
}

function stop() {
    staticTimerGrab = timeForGame;
    clearTimeout(timer);
}

// Code to draw circle 
//function polarToCartesian(centerX, centerY, radius, angleInDegrees) {
//    var angleInRadians = (angleInDegrees - 90) * Math.PI / 180.0;
//
//    return {
//        x: centerX + (radius * Math.cos(angleInRadians)),
//        y: centerY + (radius * Math.sin(angleInRadians))
//    };
//}
//
//function describeArc(x, y, radius, startAngle, endAngle) {
//
//    var start = polarToCartesian(x, y, radius, endAngle);
//    var end = polarToCartesian(x, y, radius, startAngle);
//
//    var arcSweep = endAngle - startAngle <= 180 ? "0" : "1";
//
//    var d = [
//            "M", start.x, start.y,
//            "A", radius, radius, 0, arcSweep, 0, end.x, end.y
//        ].join(" ");
//
//    return d;
//}

// Adds lyric to answer key
function addLyric(clickedVal) {
    var lyric = "<button class='lyric' onclick='swap(this)' value='" + clickedVal + "'>" + clickedVal + "</button>";


    var currentLyrics = document.getElementById("lyrics").innerHTML;
    document.getElementById("lyrics").innerHTML = currentLyrics + "" + lyric;
}


// Called when user submits lyrics
function checkLyrics() {
    var fullString = document.getElementById("lyrics").querySelectorAll(".lyric");
    var answerLyrics;
    for (i = 0; i < fullString.length; i++) {
        if (fullString[i].style.display != "none") {
            answerLyrics = answerLyrics + " " + fullString[i].value;
        }
    }

    var answer = answerLyrics.substr(10, answerLyrics.length);

    if (answer == correctLyrics[lyricNumber]) {
        soundFile.pause();
        document.getElementById('playMusicButton').innerHTML = "<img src='images/lyricGameUI/lyricPlayButton.png' height='70px'>";
        document.getElementById("lyrics").innerHTML = answer;
        document.getElementById("wordBank").innerHTML = "You got the Correct answer!";
        document.getElementById("sumbitLyricsButton").innerHTML = "Next";
        document.getElementById("sumbitLyricsButton").setAttribute('onclick', 'nextLyrics()');

    } else {
        if (document.getElementById("lyrics").innerHTML != "") {
//            document.getElementById("lyrics").style.backgroundImage = "url('data:image/svg+xml;utf8,<svg xmlns=\"http://www.w3.org/2000/svg\"><text x=\"35%\" y=\"55%\" font-size=\"20\" fill=\"#636363\">Incorrect, Try again</text></svg>')";
        }
        loadWordBank();
    }
}

// Plays music segment
function playMusic(song) {
    if (playingMusic == true) {
        stop();
        soundFile.pause();
        document.getElementById('playMusicButton').innerHTML = "<img src='../images/lyricGameUI/lyricPlayButton.png' height='70px'>";
        playingMusic = false;
    } else {
        start();
        soundFile.play();
        playingMusic = true;
        document.getElementById('playMusicButton').innerHTML = "<img src='../images/lyricGameUI/lyricPauseButton.png' height='70px'>";
    }
}


// Loads the page and word bank | Also called to reset Word Bank
function loadWordBank() {
    //Makes Dragging UI
    //document.getElementById("lyrics").style.border = "3px solid #636363";
    Sortable.create(lyrics, {
        group: 'foo',
        onStart: function (evt) {
           // document.getElementById("lyrics").style.border = "3px dashed #636363";
        },

        // dragging ended
        onEnd: function (evt) {
           // document.getElementById("lyrics").style.border = "3px solid #636363";


        }
    });
    Sortable.create(wordBank, {
        group: 'foo',
        onStart: function (evt) {
            //document.getElementById("lyrics").style.border = "3px dashed #636363";
        },

        // dragging ended
        onEnd: function (evt) {
            //document.getElementById("lyrics").style.border = "3px solid #636363";

            if (document.getElementById("lyrics").innerHTML != "") {
//                document.getElementById("lyrics").style.backgroundImage = "url('data:image/svg+xml;utf8,<svg xmlns=\"http://www.w3.org/2000/svg\"><text x=\"35%\" y=\"55%\" font-size=\"20\" fill=\"#c1c1c1\"></text></svg>')";
            }

        }
    });
    document.getElementById("lyrics").innerHTML = "";

    soundFile = new Audio('songs/' + musicCollection[lyricNumber] + '.mp3');

    document.getElementById("playMusicButton").value = musicCollection[lyricNumber];
    document.getElementById("song").innerHTML = songs[lyricNumber].song;
    document.getElementById("artist").innerHTML = songs[lyricNumber].artist;

    var bank = eval("lyricCollection" + lyricNumber);
    var fullBank = "";

    for (i = 0; i < bank.length; i++) {
        fullBank += "<button class='lyric' onclick='this.style.display=&quot;none&quot;; [addLyric(this.value)];' value='" + bank[i] + "'>" + bank[i] + "</button> "
    }

    document.getElementById("wordBank").innerHTML = fullBank;
}

function nextLyrics() {

    lyricNumber++;

    if (lyricNumber != 3) {
        loadWordBank();
        document.getElementById('verse').innerHTML = "Complete the lyrics";
        document.getElementById("sumbitLyricsButton").innerHTML = "Submit";
        document.getElementById("sumbitLyricsButton").setAttribute('onclick', 'checkLyrics()');
    } else {
        if (staticTimerGrab < 135) {
            var tempInt2 = 135 - timeForGame;
            localStorage.lyricScore = tempInt2;
        } else {
            localStorage.lyricScore = 0;
        }
        document.getElementById("sumbitLyricsButton").innerHTML = "Finish";
        document.getElementById("sumbitLyricsButton").setAttribute('onclick', 'finish()');
    }
}

function finish() {
    document.location = "gameend.html";
}

function showLyrics() {
    document.getElementById('verse').innerHTML = songs[lyricNumber].verse;
}

function returnToPlan() {
    document.location = "yourday.html";
}

//setInterval(function () {
//    if (soundFile.paused) {
//        playingMusic = false;
//        document.getElementById('playMusicButton').innerHTML = "<img src='../images/lyricGameUI/lyricPlayButton.png' height='70px'>";
//    }
//}, 500);