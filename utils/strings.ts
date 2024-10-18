

/**
 * returns a modified version of `str` that 
 * - for negative `max`: is shortened to `|max|` characters with the middle part replaced by an ellipse, if needed
 * - for positive `max`: is expanded to have `max` characters by end-padding it with `padChar`, if needed 
 * If `max` is between -10 and 10, no change is applied to `str`
 */
export function adjustLength(str:string, max:number, padChar=' '):string {
   return (max>0 && str.length < max)
      ? str.padEnd(max, padChar) 
      : (max<0 && str.length > Math.abs(max))
         ? (Math.abs(max) > 3
            ? `${str.slice(0, (Math.abs(max)+1)/2-2)}...${str.slice(-Math.abs(max)/2+1)}`
            : `...`)
         : str
}