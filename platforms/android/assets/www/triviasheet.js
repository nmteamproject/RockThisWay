var TriviaData = new Array(10);
createTwoDimensionalArray(2);

TriviaData[0][0] = "The Beatles were part of what?";
TriviaData[1][0] = "What Bealtes song was featured in The film 'Ferris Beullers day Off'?";
TriviaData[2][0] = "Which Beatle wrote Yellow Submarine?";
TriviaData[3][0] = "Where did The Beatles get their start?";
TriviaData[4][0] = "Who was the most recent Beatle to produce a song?";
TriviaData[5][0] = "What was The Bealtes' first album was called?";
TriviaData[6][0] = "What Year did The Beatles break up in?";
TriviaData[7][0] = "What was the name of The Beatles' Bassist?";
TriviaData[8][0] = "What was the Beatles' first hit?";
TriviaData[9][0] = "Who is called the 5th Beatle?";

// Answers
TriviaData[0][1] = "2";
TriviaData[1][1] = "1";
TriviaData[2][1] = "1";
TriviaData[3][1] = "1";
TriviaData[4][1] = "1";
TriviaData[5][1] = "1";
TriviaData[6][1] = "1";
TriviaData[7][1] = "2";
TriviaData[8][1] = "3";
TriviaData[9][1] = "1";

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

//Testing setup for possible multiple question type game.
//Would be Answer 1
TriviaData[0][3] = "Country";
TriviaData[1][3] = "Twist and Shout";
TriviaData[2][3] = "Ringo Starr";
TriviaData[3][3] = "Liverpool";
TriviaData[4][3] = "Paul McCartney";
TriviaData[5][3] = "My Bonnie";
TriviaData[6][3] = "1970";
TriviaData[7][3] = "Paul McCartney";
TriviaData[8][3] = "All You Need Is Love";
TriviaData[9][3] = "George Martin";

//Answer 2
TriviaData[0][4] = "The British Invasion";
TriviaData[1][4] = "Maxwell's Silver Hammer";
TriviaData[2][4] = "John Lennon";
TriviaData[3][4] = "Manchester";
TriviaData[4][4] = "Ringo Starr";
TriviaData[5][4] = "Abbey Road";
TriviaData[6][4] = "1965";
TriviaData[7][4] = "George Harrison";
TriviaData[8][4] = "Octopus's Garden";
TriviaData[9][4] = "Ringo Starr";
//Answer 3
TriviaData[0][5] = "Motown";
TriviaData[1][5] = "Hey Jude";
TriviaData[2][5] = "George Harrison";
TriviaData[3][5] = "New York City";
TriviaData[4][5] = "John Lennon";
TriviaData[5][5] = "Let It Be";
TriviaData[6][5] = "1975";
TriviaData[7][5] = "Ringo Starr";
TriviaData[8][5] = "Love Me Do";
TriviaData[9][5] = "Paul Harris";
//Answer 4
TriviaData[0][6] = "Indie Rock";
TriviaData[1][6] = "All You Need Is Love";
TriviaData[2][6] = "Paul McCartney";
TriviaData[3][6] = "London";
TriviaData[4][6] = "George Harrison";
TriviaData[5][6] = "Please Please Me";
TriviaData[6][6] = "1980";
TriviaData[7][6] = "John Lennon";
TriviaData[8][6] = "Yesterday";
TriviaData[9][6] = "Bob Dylan";

 function createTwoDimensionalArray(arraySize) {
            for (i = 0; i < TriviaData.length; ++i)
                TriviaData[i] = new Array(arraySize);
        }