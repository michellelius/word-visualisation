/*
  Name:        word-cloud.js
  Purpose:     Uses words processed from word-processing.js to make word clouds

  Author:      Michelle Liu
  Created:     13-Nov-2024
  Updated:     20-Nov-2024
*/

/**
 * @class WordCloud
 * @description Parent class visualising word cloud using processed words
 */
export class WordCloud {
    /** 
    * @constructor
    * @param {Array} words - list of words to be displayed in the word cloud
    * @param {String} containerId - ID of the HTML div container of where the word cloud will go
    * 
    */
    constructor(words, containerId) {
        this.words = words
        this.containerId = containerId
    }

    /** 
    * @method drawCloud
    * @description Public method defining word cloud characteristics using d3
    */
    drawCloud() {
        const width = 1200
        const height = 720

        const layout = d3.layout.cloud()
        
            .size([width, height])
            .words(this.words.map(word => ({ text: word, size: 20})))
            .padding(20)
            .fontSize(d => d.size)
            .spiral("archimedean")
            .on("end", this.#drawText.bind(this));

        layout.start();
    }

    /** 
    * @method drawText
    * @description Defines characteristics of the individual words in the word cloud, including size, style, position
    * 
    * @param {Object} words - Contains key "text" with value of a word, and key "size" with value of word size
    * @private
    */
    #drawText(words) {
        const width = 1200
        const height = 720 

        // Variety of word characteristics
        d3.select(this.containerId)
            .append("svg")
            .attr("width", width)
            .attr("height", height)
            .append("g")
            .attr("transform", `translate(${width / 2}, ${height / 2})`)
            .selectAll("text")
            .data(words)
            .enter().append("text")
            .style("font-size", d => `${d.size}px`)
            .style("fill", () => d3.schemeCategory10[Math.floor(Math.random() * 10)])
            .attr("text-anchor", "middle")
            .attr("transform", d => `translate(${d.x}, ${d.y})`)
            .text(d => d.text);
    }
}

/**
 * @class FemaleCloud
 * @extends WordCloud
 * @description Child class displaying word cloud of female indicator synonyms of dataset words
 */
export class FemaleCloud extends WordCloud {
    /** 
    * @constructor
    * @param {Array} words - Array of unique words to render in the word cloud
    * @param {String} containerId - ID of the HTML div container of where the word cloud will go
    * @param {String} apiKey - API key to access the Wordnik API
    *
    */
    constructor(words, containerId, apiKey) {
        super(words, containerId);
        this.apiKey = apiKey
        this.synonymsArray = []
    }

    /** 
    * @method getSynonyms
    * @description Uses relatedWords method from wordProcessing class to get synonyms 
    * 
    * @param {WordProcessing} wordProcessing - Instance of WordProcessing class needed to get desired methods
    */
    async getSynonyms(wordProcessing) {
        const synonyms = await wordProcessing.relatedWords(this.words, this.apiKey);
        this.synonymsArray = synonyms.flat();
    }

    /** 
    * @method renderSynonyms
    * @description Renders word cloud using synonyms gotten from above
    * 
    */
    renderSynonyms() {
        this.words = this.synonymsArray
        this.drawCloud()
    }
}

/**
 * @class MaleCloud
 * @extends WordCloud
 * @description Child class displaying word cloud of male indicators with varying sizes depending on word frequency
 */
export class MaleCloud extends WordCloud {
    /** 
    * @constructor
    * @param {Array} words - Array of unique words to render in the word cloud
    * @param {String} containerId - ID of the HTML div container of where the word cloud will go
    * @param {String} apiKey - API key to access the Wordnik API
    *
    */
    constructor(words, containerId, apiKey) {
        super(words, containerId);
        this.apiKey = apiKey;
        this.wordFrequencies = []; 
    }

    /** 
    * @method getFrequencies
    * @description Uses getWordFrequency method from wordProcessing class to get frequencies of general word usage 
    * 
    * @param {WordProcessing} wordProcessing - Instance of WordProcessing class needed to get desired methods
    */
    async getFrequencies(wordProcessing) {
        this.wordFrequencies = await wordProcessing.getWordFrequency(this.words);
        // Map word frequencies to words and return as object
        this.words = this.words.map(word => {
            const frequencyEntry = this.wordFrequencies.find(entry => entry.word === word);
            const frequencyObj = {text:word, size:0}

            if (frequencyEntry) {
                frequencyObj["frequency"] = frequencyEntry["frequency"];
            } else {
                frequencyObj["frequency"] = 0; // Default is 0 if no entry found
            }
            return frequencyObj
        });
    }

    /** 
    * @method filterFrequency
    * @description Filters words to only take words used above a certain threshold, so words will be commonly known
    * 
    * @param {Number} threshold - Minimum frequency needed for word to be included in word cloud
    */
    filterFrequency(threshold) {
        this.words = this.words.filter(word => word.frequency >= threshold);
    }

    // Draw cloud with font size based on frequency
    /** 
    * @method drawCloud
    * @description Overrides parent drawCloud method to make changes to font size based on word frequency
    * 
    * @override
    */
    drawCloud() {
        const width = 1200;
        const height = 720;

        // Max and min frequency to scale font sizes accordingly
        const maxFrequency = Math.max(...this.words.map(word => word.frequency));
        const minFrequency = Math.min(...this.words.map(word => word.frequency));

        // Set font size based on frequency
        const layout = d3.layout.cloud()
            .size([width, height])
            .words(this.words.map(word => ({
                text: word.text,
                size: this.#scaleFontSize(word.frequency, minFrequency, maxFrequency) 
            })))
            .padding(30)
            .fontSize(d => d.size)
            .spiral("rectangular")
            .on("end", this.#drawText.bind(this));

        layout.start();
    }

    /** 
    * @method scaleFontSize
    * @description Scales font size based on word frequency and according to minimum and maximum font sizes
    *     
    * @param {Number} frequency - frequency of word as previously determined in the getFrequencies method
    * @param {Number} minFrequency - smallest frequency of a word in the dataset
    * @param {Number} maxFrequency - largest frequency of a word in the dataset
    * @private
    */
    #scaleFontSize(frequency, minFrequency, maxFrequency) {
        const minSize = 10; 
        const maxSize = 42;
        // Smallest font size + a positive value of frequency difference x total size difference/total frequency difference
        return minSize + (frequency - minFrequency) * (maxSize - minSize) / (maxFrequency - minFrequency);
    }

    /** 
    * @method drawText
    * @description Defines characteristics of the individual words in the word cloud, including size, style, position
    * 
    * @param {Object} words - Contains key "text" with value of a word, and key "size" with value of word size
    * @private
    */
    #drawText(words) {
        const width = 1200;
        const height = 720;

        d3.select(this.containerId)
            .append("svg")
            .attr("width", width)
            .attr("height", height)
            .append("g")
            .attr("transform", `translate(${width / 2}, ${height / 2})`)
            .selectAll("text")
            .data(words)
            .enter().append("text")
            .style("font-size", d => `${d.size}px`)
            .style("fill", () => d3.schemeCategory10[Math.floor(Math.random() * 10)])
            .attr("text-anchor", "middle")
            .attr("transform", d => `translate(${d.x}, ${d.y})`)
            .text(d => d.text);
    }

    /** 
    * @method renderFrequency
    * @description Renders word cloud using frequency scaled font sizes
    */
    renderFrequency() {
        this.drawCloud();
    }
}
