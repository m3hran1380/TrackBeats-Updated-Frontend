import CryptoJS from 'crypto-js';


// following function calculates the averagePace using the provided average speed as an argument.
export const avgPace = (avgSpeed) => {
    
    let minPerKM = Math.floor((1000/avgSpeed) / 60);
    let remainingSeconds = Math.round((1000/avgSpeed) % 60);
    if (!(remainingSeconds % 60)) {
        remainingSeconds = 0;
        minPerKM += 1;
    }
    
    // convert the seconds to string:
    remainingSeconds = remainingSeconds.toString();
    
    // if the number of seconds is 1 digit append a 0 before them.
    if (remainingSeconds.length === 1) {
        remainingSeconds = `0${remainingSeconds}`;
    }

    return [minPerKM, remainingSeconds];
}

// following function receives a velocity stream as an input and calcualtes its average and returns it.
export const avgSpeed = (speedStream) => {
    return (speedStream.reduce((a, b) => a + b) / speedStream.length).toFixed(2);
}


// following function recieves time in seconds and returns it in minutes and seconds:
export const convertToMinSec = (seconds) => {
    const timeMin = Math.floor(seconds / 60);
    let timeSec = Math.floor(seconds % 60);

    timeSec = timeSec.toString();

    if (timeSec.length === 1) {
        timeSec = `0${timeSec}`;
    }

    return [timeMin, timeSec];
}



// this function uses a binary search algorithm to find the index of the matching number or closest matching number to the provided value in the array.
export const findIndex = (array, number) => {
    let startIndex = 0;
    let endIndex = array.length - 1;
    let midIndex, diff;

    while (startIndex <= endIndex) {
        midIndex = Math.floor((startIndex + endIndex) / 2);
        diff = array[midIndex] - number;

        if (diff === 0) {
            return midIndex;
        } else if (diff > 0) {
            endIndex = midIndex - 1;
        } else {
            startIndex = midIndex + 1;
        }
    }

    // no exact match found, return the index of the closest number
    if (Math.abs(array[startIndex] - number) < Math.abs(array[endIndex] - number)) {
        return startIndex;
    } else {
        return endIndex;
    }
}


// the following functions will be used to encrypt and decrypt the session ID using AES encryption
export const encrypt = (plainText) => {
    return CryptoJS.AES.encrypt(plainText, process.env.REACT_APP_AES_SECRET_KEY).toString();
};
  
export const decrypt = (cipherText) => {
    const bytes = CryptoJS.AES.decrypt(cipherText, process.env.REACT_APP_AES_SECRET_KEY);
    return bytes.toString(CryptoJS.enc.Utf8);
};