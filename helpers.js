/**
 * Utility function for creating ISO-compliant dates
 */
exports.ISODateString = function(d) {
        function pad(n){
            return n<10 ? '0'+n : n;
        }
        if (typeof d === "string") d = new Date(d);
        return d.getUTCFullYear()+'-'
        + pad(d.getUTCMonth()+1)+'-'
        + pad(d.getUTCDate())+'T'
        + pad(d.getUTCHours())+':'
        + pad(d.getUTCMinutes())+':'
        + pad(d.getUTCSeconds())+'+00:00';
};