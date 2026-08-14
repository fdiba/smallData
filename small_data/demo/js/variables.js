var COLORS=["#ecf0f1", "#2c3e50", "#1abc9c", "#16a085"];

var VIZ_CAT = ["#1abc9c", "#9b59b6", "#2ecc71", "#d35400", "#16a085", "#e74c3c",
               "#3498db", "#e67e22", "#2980b9", "#c0392b", "#27ae60", "#8e44ad"];

var VIZ_CAT_MAX = 8;

var VIZ_CLICK = ["#1abc9c", "#e74c3c", "#16a085", "#d35400", "#2ecc71",
                 "#8e44ad", "#e67e22", "#9b59b6", "#27ae60", "#c0392b"];

var VIZ_SEQ = ["#1a7d70", "#22a692", "#2bbfa8", "#5ad4bf", "#93e5d5", "#ccf4ec"];

var VIZ_WORKS    = "#2ecc71";
var VIZ_ENTRANTS = "#3498db";

function vizTakeSlot(slots){
    var pris={}, k;
    for(k in slots){ if(Object.prototype.hasOwnProperty.call(slots, k)) pris[slots[k]]=true; }
    var s=0;
    while(pris[s]) s++;
    return s;
}

var VIZ_YEAR = ["#288b77", "#339cb1", "#78a5d8", "#b2afe4", "#d6c1e8", "#edd8f1"];

var VIZ_OV_WORKS   = "#2ecc71";
var VIZ_OV_NOWORKS = "#7f8c8d";

var VIZ_HILITE = "#f1c40f";
var VIZ_SURFACE = "#2c3e50";
