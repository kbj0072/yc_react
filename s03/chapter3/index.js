import lodash from "lodash";

const arr = [1, 1, 1, 2, 2, 1, 1, 4, 4, 3, 2];
const uniqueArr = lodash.uniqBy(arr); // Using lodash to get unique values

console.log(uniqueArr); // [1, 2, 4, 3]
