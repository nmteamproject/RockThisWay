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
TriviaData[10][0] = "Every Beatle sang at least one of their songs.";
TriviaData[11][0] = "The Beatles' Drummer was named Ringo Starr.";
TriviaData[12][0] = "Band originally was named the Blackjacks.";
TriviaData[13][0] = "John Lennon was the original Beatle.";
TriviaData[14][0] = "The Beatles formed their band in Liverpool.";

// Answers
TriviaData[0][1] = "false";
TriviaData[1][1] = "false";
TriviaData[2][1] = "false";
TriviaData[3][1] = "false";
TriviaData[4][1] = "false";
TriviaData[5][1] = "true";
TriviaData[6][1] = "true";
TriviaData[7][1] = "true";
TriviaData[8][1] = "true";
TriviaData[9][1] = "true";
TriviaData[10][1] = "true";
TriviaData[11][1] = "true";
TriviaData[12][1] = "true";
TriviaData[13][1] = "true";
TriviaData[14][1] = "true";

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