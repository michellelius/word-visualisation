/*
  Name:        word-processing.js
  Purpose:     Applies different sorting methods and API functions to words from database

  Author:      Michelle Liu
  Created:     13-Nov-2024
  Updated:     20-Nov-2024
*/

/**
 * @class WordProcessing
 * @description Renders world map with colours determined using configured data
 */
export class WordProcessing {
    /** 
    * @constructor
    * @param {String} wordnikBaseUrl - base URL of the Wordnik API to access API functions
    * @param {String} datamuseBaseUrl - base URL of the Datamuse API to access API functions
    * 
    */
    constructor(wordnikBaseUrl, datamuseBaseUrl) {
        this.wordnikBaseUrl = wordnikBaseUrl
        this.datamuseBaseUrl = datamuseBaseUrl
    }
    /** 
    * @method filterWords
    * @description Public method filtering a word list to only include unique values and to be a specific length.
    * 
    * @param {Array} wordArray - full, unsorted array of words to filter
    * @param {Number} sliceSize - maximum number of unique words in the array
    */
    async filterWords(wordArray, sliceSize) {
        const uniqueWords = (Array.from(new Set(wordArray))).slice(0,sliceSize);
        return uniqueWords
    }

    /** 
    * @method shuffleArray
    * @description Public method randomly shuffling an array of words to produce different word clouds each time
    * 
    * @param {Array} wordArray - array of unique words to shuffle
    */
    async shuffleArray(wordArray) {
        for (let i = wordArray.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [wordArray[i], wordArray[j]] = [wordArray[j], wordArray[i]]; 
        }
        return wordArray;
    }

    /** 
    * @method relatedWords
    * @description Public method to get synonyms of words using Wordnik API
    * 
    * @param {Array} words - array of unique words to get synonyms of
    * @param {String} apiKey - API key to access the Wordnik API
    */
    async relatedWords(words, apiKey) {
        const synonyms = []
    
        for (const word of words) {
            try {
                // Creating link to API using apiBase, key provided and relatedWords function
                const response = await fetch(`${this.wordnikBaseUrl}/${word}/relatedWords?useCanonical=true&api_key=${apiKey}`);
                console.log("Response for", word, response);
                // Checks that a valid response is given and appends to synonyms array, otherwise prints error message to console
                if (response.ok) {
                    const data = await response.json();

                    for (let i = 0; i < data.length; i++) {
                        if (data[i]["relationshipType"] == "synonym"){
                            synonyms.push(data[i]["words"])
                        }
                    }
                } else {
                    console.error(`Failed to fetch related words for "${word}":`, response.statusText);
                }
            } catch (error) {
                console.error(`Failed to fetch related words for "${word}":`, error);
            }
        }
    
        return synonyms;
    }

    /** 
    * @method getWordFrequency
    * @description Public method to get frequency of usage of words in a list using the Datamuse API
    * 
    * @param {Array} words - array of unique words to get frequencies of
    */
    async getWordFrequency(words) {
        //  Creating link to API using base link and API frequency function
        const frequencies = await Promise.all(words.map(async (word) => {
            const response = await fetch(`${this.datamuseBaseUrl = 'https://api.datamuse.com/words'}?sp=${encodeURIComponent(word)}&md=f`);
            const data = await response.json();
            const result = {}
            // Checks that a valid response is given and records frequency, otherwise prints error message to console
            if (data.length > 0) {
                result["word"] = word
                result["frequency"] = data[0].score
                return result
            } else {
                result["word"] = word
                result["frequency"] = 0
                return result
            }
        }));
    
        return frequencies;
    }
}
