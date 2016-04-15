var TriviaData = new Array(15);
createTwoDimensionalArray(3);

TriviaData[0][0] = "Taylor Swift\'s song \"Shake It Off\" is from her album \"Red\".";
TriviaData[1][0] = "I 100% know how all this code works.";
TriviaData[2][0] = "The Rock and Roll hall of fame is in Cleveland Ohio.";
TriviaData[3][0] = "Imagine RIT is on August 23rd.";
TriviaData[4][0] = "Paul McCartney is a member of The Eagles.";
TriviaData[5][0] = "This was coded by Brendan Kenny and a gay girl with blue hair.";
TriviaData[6][0] = "This app was built using Cordova.";
TriviaData[7][0] = "The Top Grossing Album of all time was made by Justin Beiber.";
TriviaData[8][0] = "The lead singer of fun. is Nate Ruess.";
TriviaData[9][0] = "The Who is a British Band";
TriviaData[10][0] = "Rochester is a bipoler city.";
TriviaData[11][0] = "Sharkrats are best rats.";
TriviaData[12][0] = "Female charr have fluffy-er tails.";
TriviaData[13][0] = "Japan has created a highly loved digital pop idol.";
TriviaData[14][0] = "Akira Yamaoka composed the music for all Silent Hill games.";

// Answers
TriviaData[0][1] = "false";
TriviaData[1][1] = "false";
TriviaData[2][1] = "true";
TriviaData[3][1] = "false";
TriviaData[4][1] = "false";
TriviaData[5][1] = "true";
TriviaData[6][1] = "true";
TriviaData[7][1] = "false";
TriviaData[8][1] = "true";
TriviaData[9][1] = "true";
TriviaData[10][1] = "true";
TriviaData[11][1] = "true";
TriviaData[12][1] = "true";
TriviaData[13][1] = "true";
TriviaData[14][1] = "false";

// Has question been asked
// -- necessary because we are asking in random order
TriviaData[0][2] = "no";
TriviaData[1][2] = "no";
TriviaData[2][2] = "no";
TriviaData[3][2] = "no";
TriviaData[4][2] = "no";
TriviaData[5][2] = "no";
TriviaData[6][2] = "no";
TriviaData[7][2] = "no";
TriviaData[8][2] = "no";
TriviaData[9][2] = "no";
TriviaData[10][2] = "no";
TriviaData[11][2] = "no";
TriviaData[12][2] = "no";
TriviaData[13][2] = "no";
TriviaData[14][2] = "no";




 function createTwoDimensionalArray(arraySize) {
            for (i = 0; i < TriviaData.length; ++i)
                TriviaData[i] = new Array(arraySize);
        }