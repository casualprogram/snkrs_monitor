/**
 * @description  - This function is responsible for delaying the execution of the code.
 * @param {*} ms - The number of milliseconds to delay
 * @returns 
 */

export default function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}