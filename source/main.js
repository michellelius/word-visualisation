/*
  Name:        main.js
  Purpose:     Sorts data and creates new instances of imported classes

  Author:      Michelle Liu
  Created:     13-Nov-2024
  Updated:     20-Nov-2024
*/

/** 
    * Improves performance of canvas to render word clouds by setting "willReadFrequently" option to "true". Code referenced [1].
    * 
    * @returns {HTMLElement} - new and enhanced HTML element for the canvas
    * 
    */
(function () {
    const originalCreateElement = document.createElement;
    document.createElement = function (tagName) {
        const element = originalCreateElement.call(this, tagName);
        if (tagName.toLowerCase() === 'canvas') {
            const originalGetContext = element.getContext;
            element.getContext = function (contextType, options) {
                if (contextType === '2d') {
                    options = { ...options, willReadFrequently: true };
                }
                return originalGetContext.call(this, contextType, options);
            };
        }
        return element;
    };
})();

// Importing classes needed from other files
import { WordProcessing } from "./word-processing.js";
import { WordCloud, FemaleCloud, MaleCloud} from "./word-cloud.js";

// New instance of WordProcessing created 
const wordProcessing = new WordProcessing('https://api.wordnik.com/v4/word.json', 'https://api.datamuse.com/words')

// Loads unicef database csv then, extracts data and uses it to parse data to classes
d3.queue().defer(d3.csv, "assets/unicef-data.csv")
.awaitAll(function(error, results) {
    if (error) throw error

    // Parsing data to get only words
    const csvData = results[0]
    const words = csvData
        .map(row => row["indicator_name"] 
        .toLowerCase()
        // Replacing any non-alpha characters with spaces
        .replace(/[^a-zA-Z\s]/g, ' ') 
        // Removes spaces, leaving only words
        .split(/\s+/)                
        )                         
        .filter(word => word)

    // Accessing RiTa and creating lists of words for the three different word clouds
    const verbs = Array.from(new Set(words.flat())).filter(word => RiTa.isVerb(word));
    const femaleWords = Array.from(new Set(words.filter(array => array.includes('female')).flat()));
    const maleWords = Array.from(new Set(words.filter(array => array.includes('male')).flat()));
    
    // Filtering word lists once more, then creating multiple instances of parent and child classes in an asynchronous functions because it needs to access API
    (async()=> {
    const filteredFemale1 = (await wordProcessing.filterWords(femaleWords, 10))
    const filteredFemale2 = (await wordProcessing.filterWords(femaleWords, 20))
    // Instances and accessing API with API key
    const femaleCloud1 = new FemaleCloud(filteredFemale1, "#female-cloud", "x549l5rzmenzla9h1yv2snh8k58fbtsr5wgu9e6uvdyvm7c9r");
    const femaleCloud2 = new FemaleCloud(filteredFemale2, "#female-cloud", "x549l5rzmenzla9h1yv2snh8k58fbtsr5wgu9e6uvdyvm7c9r")
    // More word processing after accessing API
    await femaleCloud1.getSynonyms(wordProcessing);
    femaleCloud1.renderSynonyms();
  
    const randomMale = (await wordProcessing.shuffleArray(maleWords));
    // Instances and accessing API with API key
    const maleCloud1 = new MaleCloud(randomMale, "#male-cloud", "x549l5rzmenzla9h1yv2snh8k58fbtsr5wgu9e6uvdyvm7c9r");
    const maleCloud2 = new MaleCloud(maleWords, "#male-cloud", "x549l5rzmenzla9h1yv2snh8k58fbtsr5wgu9e6uvdyvm7c9r");
    await maleCloud1.getFrequencies(wordProcessing);
    maleCloud1.filterFrequency(10); 
    maleCloud1.renderFrequency()
    })()

    // Instance of parent class and creating word cloud
    const verbsCloud = new WordCloud(verbs, "#verbs-cloud");
    verbsCloud.drawCloud()
})