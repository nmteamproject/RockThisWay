var TriviaData = new Array(15);
createTwoDimensionalArray(3);

TriviaData[0][0] = "The Beatles were not part of the 'British Invasion'.";
TriviaData[1][0] = "The film 'Ferris Beullers day Off' featured the Bealtes' 'Hey Jude'.";
TriviaData[2][0] = "Ringo Starr was the most popular Beatles' song writer.";
TriviaData[3][0] = "The Beatles were known for their short hair.";
TriviaData[4][0] = "Paul McCartney is a member of The Eagles.";
TriviaData[5][0] = "The Bealtes' first album was called 'My Bonnie'.";
TriviaData[6][0] = "The Beatles broke up in 1970.";
TriviaData[7][0] = "The Beatles' Bassist was named George Harrison.";
TriviaData[8][0] = "'Love Me Do' was the Beatles' first hit.";
TriviaData[9][0] = "George Martin is called the 5th Beatle";

// Answers
TriviaData[0][1] = "1";
TriviaData[1][1] = "1";
TriviaData[2][1] = "1";
TriviaData[3][1] = "1";
TriviaData[4][1] = "1";
TriviaData[5][1] = "1";
TriviaData[6][1] = "1";
TriviaData[7][1] = "1";
TriviaData[8][1] = "1";
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
TriviaData[0][3] = "1";
TriviaData[1][3] = "1";
TriviaData[2][3] = "1";
TriviaData[3][3] = "1";
TriviaData[4][3] = "1";
TriviaData[5][3] = "1";
TriviaData[6][3] = "1";
TriviaData[7][3] = "1";
TriviaData[8][3] = "1";
TriviaData[9][3] = "1";

//Answer 2
TriviaData[0][4] = "2";
TriviaData[1][4] = "2";
TriviaData[2][4] = "2";
TriviaData[3][4] = "2";
TriviaData[4][4] = "2";
TriviaData[5][4] = "2";
TriviaData[6][4] = "2";
TriviaData[7][4] = "2";
TriviaData[8][4] = "2";
TriviaData[9][4] = "2";
//Answer 3
TriviaData[0][5] = "3";
TriviaData[1][5] = "3";
TriviaData[2][5] = "3";
TriviaData[3][5] = "3";
TriviaData[4][5] = "3";
TriviaData[5][5] = "3";
TriviaData[6][5] = "3";
TriviaData[7][5] = "3";
TriviaData[8][5] = "3";
TriviaData[9][5] = "3";
//Answer 4
TriviaData[0][6] = "4";
TriviaData[1][6] = "4";
TriviaData[2][6] = "4";
TriviaData[3][6] = "4";
TriviaData[4][6] = "4";
TriviaData[5][6] = "4";
TriviaData[6][6] = "4";
TriviaData[7][6] = "4";
TriviaData[8][6] = "4";
TriviaData[9][6] = "4";

 function createTwoDimensionalArray(arraySize) {
            for (i = 0; i < TriviaData.length; ++i)
                TriviaData[i] = new Array(arraySize);
        }