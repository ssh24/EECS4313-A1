'use strict';

const fs = require('graceful-fs');
const path = require('path');
const parser = require('xml2json');
const argv = require('yargs').argv;

let directory = path.resolve(__dirname, 'hbaseBugReport');

let bugCount = 0;
let openStatus = 0;
let closeStatus = 0;
let resolveStatus = 0;
let progressStatus = 0;
let reopenStatus = 0;
let patchStatus = 0;
let fileRead = 0;

let min, max;
let avg = 0;
let med = 0;
let total = 0;
let count = 0;
let resArray = [];

function median(values) {
    values.sort(function(a,b) {
        return a - b;
    });
    var half = Math.floor(values.length/2);
    if(values.length % 2)
        return values[half];
    else
        return (values[half-1] + values[half]) / 2.0;
}

if(argv.seconds) {
    let seconds = parseInt(argv.seconds, 10);

    let years = Math.floor(seconds / (52*7*3600*24));
    seconds  -= years*52*7*3600*24;
    let days = Math.floor(seconds / (3600*24));
    seconds  -= days*3600*24;
    let hrs   = Math.floor(seconds / 3600);
    seconds  -= hrs*3600;
    let mnts = Math.floor(seconds / 60);
    seconds  -= mnts*60;
    console.log(years+" years, " + days + " days, " + hrs  +" Hrs, " + mnts +
        " Minutes, "+seconds+" Seconds");
}

fs.readdir(directory, (err, files) => {
    files.forEach((file) => {
        fs.readFile(path.join(directory, file), function(err, data) {
            if(err) {
                throw err;
            }
            fileRead++;
            let json = parser.toJson(data);
            let type = JSON.parse(json)["rss"]["channel"]["item"]["type"]["$t"];
            let status = JSON.parse(json)["rss"]["channel"]["item"]
                ["status"]["$t"];

            if(argv.p1) {
                if(type === "Bug") {
                    bugCount++;
                    console.log('Bug count: %d/%d', bugCount, 
                        fileRead);
                }
            }
            if (argv.p2) {
                if(type === "Bug") {
                    if(argv.open) {
                        if(status === "Open") {
                            openStatus++;
                            console.log('Open bugs: %d/%d', openStatus, 
                                fileRead);
                        }
                    }
                    if(argv.closed) {
                        if(status === "Closed") {
                            closeStatus++;
                            console.log('Closed bugs: %d/%d', closeStatus, 
                                fileRead);
                        }
                    }
                    if(argv.resolved) {
                        if(status === "Resolved") {
                            resolveStatus++;
                            console.log('Resolved bugs: %d/%d', resolveStatus, 
                                fileRead);
                        }
                    }
                    if(argv.progress) {
                        if(status === "In Progress") {
                            progressStatus++;
                            console.log('In-progress bugs: %d/%d', progressStatus, 
                                fileRead);
                        }
                    }
                    if(argv.reopened) {
                        if(status === "Reopened") {
                            reopenStatus++;
                            console.log('Reopened bugs: %d/%d', reopenStatus, 
                                fileRead);
                        }
                    }
                    if(argv.patch) {
                        if(status === "Patch Available") {
                            patchStatus++;
                            console.log('Patch available bugs: %d/%d', patchStatus, 
                                fileRead);
                        }
                    }
                }
            }
            if (argv.p3) {
                if(type === "Bug" && (status === "Closed" || 
                    status === "Resolved")) {

                        let created = new Date(JSON.parse(json)["rss"]
                            ["channel"]["item"]["created"]);
                        let resolved = new Date(JSON.parse(json)["rss"]
                            ["channel"]["item"]["resolved"]);
                    
                        let diff = (resolved.getTime() - created.getTime()) 
                            / 1000;

                        resArray.push(diff);

                        if(count === 0) {
                            min = diff;
                            max = diff;
                        }

                        if(diff > max) {
                            max = diff;
                        }
                        if(diff < min) {
                            min = diff;
                        }
                        total += diff;
                        count ++;

                        avg = total / count;

                        med = median(resArray);


                        
                        console.log('Min: %d, Max: %d, Avg: %d, Median: %d', min, max, 
                            Math.round(avg * 10) / 10, Math.round(med * 10) / 10);
                        console.log('Count %d', count);
                    }
            }
        });
    });
});
