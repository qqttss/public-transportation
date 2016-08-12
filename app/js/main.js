import idb from 'idb';

if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/public-transportation/sw.js', {
        scope: '/public-transportation/'
    }).then(function(reg) {
        console.log('Registration succeeded. Scope is ' + reg.scope);
    }).catch(function(error) {
        console.log('Registration failed with ' + error);
    });
}

var departureStop = document.querySelector('#departure-stop');
var arrivalStop = document.querySelector('#arrival-stop');
var searchBtn = document.querySelector("#search-btn");

var dStop = document.querySelector("#d-stop");
var aStop = document.querySelector("#a-stop");
var searchedStop = document.querySelector(".searched-stops");
var searchNotice = document.querySelector(".search-notice");
var searchArrow = document.querySelector("#search-arrow");
var tripDate = document.querySelector("#trip-date");

var tripInfo = document.querySelector('#trips-table');

var dbVersion = 1;

var stops = [{
        stopName: "San Francisco",
        idOne: "70011",
        idTwo: "70012"
    }, {
        stopName: "22nd St",
        idOne: "70021",
        idTwo: "70022",
    }, {
        stopName: "Bayshore",
        idOne: "70031",
        idTwo: "70032"
    }, {
        stopName: "So. San Francisco",
        idOne: "70041",
        idTwo: "70042"
    }, {
        stopName: "San Bruno",
        idOne: "70051",
        idTwo: "70052"
    }, {
        stopName: "Millbrae",
        idOne: "70061",
        idTwo: "70062"
    }, {
        stopName: "Broadway",
        idOne: "70071",
        idTwo: "70072"
    }, {
        stopName: "Burlingame",
        idOne: "70081",
        idTwo: "70082"
    }, {
        stopName: "San Mateo",
        idOne: "70091",
        idTwo: "70092"
    }, {
        stopName: "Hayward Park",
        idOne: "70101",
        idTwo: "70102"
    }, {
        stopName: "Hillsdale",
        idOne: "70111",
        idTwo: "70112"
    }, {
        stopName: "Belmont",
        idOne: "70121",
        idTwo: "70122"
    }, {
        stopName: "San Carlos",
        idOne: "70131",
        idTwo: "70132"
    }, {
        stopName: "Redwood City",
        idOne: "70141",
        idTwo: "70142"
    }, {
        stopName: "Atherton",
        idOne: "70151",
        idTwo: "70152"
    }, {
        stopName: "Menlo Park",
        idOne: "70161",
        idTwo: "70162"
    }, {
        stopName: "Palo Alto",
        idOne: "70171",
        idTwo: "70172"
    }, {
        stopName: "California Ave",
        idOne: "70191",
        idTwo: "70192"
    }, {
        stopName: "San Antonio",
        idOne: "70201",
        idTwo: "70202"
    }, {
        stopName: "Mt View",
        idOne: "70211",
        idTwo: "70212"
    }, {
        stopName: "Sunnyvale",
        idOne: "70221",
        idTwo: "70222"
    }, {
        stopName: "Lawrence",
        idOne: "70231",
        idTwo: "70232"
    }, {
        stopName: "Santa Clara",
        idOne: "70241",
        idTwo: "70242"
    }, {
        stopName: "College Park",
        idOne: "70251",
        idTwo: "70252"
    }, {
        stopName: "San Jose Diridon",
        idOne: "70261",
        idTwo: "70262"
    }, {
        stopName: "Tamien",
        idOne: "70271",
        idTwo: "70272"
    }, {
        stopName: "Capitol",
        idOne: "70281",
        idTwo: "70282"
    }, {
        stopName: "Blossom Hill",
        idOne: "70291",
        idTwo: "70292"
    }, {
        stopName: "Morgan Hill",
        idOne: "70301",
        idTwo: "70302"
    }, {
        stopName: "San Martin",
        idOne: "70311",
        idTwo: "70312"
    }, {
        stopName: "Gilroy",
        idOne: "70321",
        idTwo: "70322"
    }, {
        stopName: "San Jose",
        idOne: "777402",
        idTwo: ""
    }, // special stop, no second stop id
    {
        stopName: "Tamien Station",
        idOne: "777403",
        idTwo: ""
    } // special stop, no second stop id
];

// pre-fill the date input field with today
var date = new Date();
var day = date.getDate();
var month = date.getMonth() + 1;
var year = date.getFullYear();
var today = year + "-" + (month < 10 ? "0" + month : month) + "-" + (day < 10 ? "0" + day : day);

tripDate.value = today;

// open indexedDB
var dbPromise = idb.open('trip-db', dbVersion, function(db) {
    var tripObjectStore = db.createObjectStore("storeOne", {
        autoIncrement: true
    });
});

// acquire departure stop name and arrival stop name
searchBtn.addEventListener('click', handleRequest, false);

function handleRequest() {

    var departureStopName = departureStop.value;
    var arrivalStopName = arrivalStop.value;
    var departureId = matchStopIds(departureStopName); // each stop name have two ids
    var arrivalId = matchStopIds(arrivalStopName); // each stop name have two ids
    var tripDateValue = tripDate.value;

    //  the trip date the users want to search (it falls within Weekday, Saturday, or Sunday)
    var tripWeekday = "";

    tripWeekday = calculateWeekday(tripDateValue);

    console.log("tripWeekday:");
    console.log(tripWeekday);

    // reset the departure and rrrival inout fields
    document.querySelector('#departure-stop').value = "";
    document.querySelector('#arrival-stop').value = "";

    if (departureStopName === "" || arrivalStopName === "") {
        searchNotice.innerHTML = " Please input departure and arrival stops!";
        searchedStop.style.display = "block";
        dStop.innerHTML = "";
        aStop.innerHTML = "";
        searchArrow.style.display = "none";
        tripInfo.innerHTML = "";

    }

    if (departureStopName === arrivalStopName && departureStopName !== "") {
        dStop.innerHTML = departureStopName;
        aStop.innerHTML = arrivalStopName;
        searchNotice.innerHTML = "Departure and arrival stop cannot be the same!";
        searchArrow.style.display = "inline-block";
        searchedStop.style.display = "block";
        tripInfo.innerHTML = "";
    }

    if (departureStopName !== arrivalStopName && departureStopName !== "" && arrivalStopName !== "") {
        dStop.innerHTML = departureStopName;
        aStop.innerHTML = arrivalStopName;

        searchArrow.style.display = "inline-block";
        searchedStop.style.display = "block";

        // perform searching trips
        searchTrips(departureId, arrivalId, tripWeekday);
    }

}

// match stop ids by their name
function matchStopIds(stopName) {
    // search ids by a stop name
    var stopId = {};
    for (var i = 0; i < stops.length; i++) {
        if (stopName === stops[i].stopName) {
            stopId = stops[i];
        }
    }
    return stopId;
}

// calculate weekday by input date. Here weekday has only "Saturday", "Sunday" and "Weekday"
function calculateWeekday(tripDateValue) {
    var tripWeekDayNum = (new Date(tripDateValue)).getDay();
    var tripWeekday = "";

    if (tripWeekDayNum >= 0 && tripWeekDayNum <= 4) {
        tripWeekday = "Weekday";
    }
    if (tripWeekDayNum == 5) {
        tripWeekday = "Saturday";
    }
    if (tripWeekDayNum == 6) {
        tripWeekday = "Sunday";
    }

    return tripWeekday;
}

// search trips first in local indexedDb. If no, fetch them from data/GTFS
function searchTrips(departureId, arrivalId, tripWeekday) {

    // search local database first for desired trips
    dbPromise.then(function(db) {
        var tx = db.transaction("storeOne", "readwrite");
        var store = tx.objectStore("storeOne");

        store.getAll().then(function(tripMessages) {
            var tripFound = [];

            for (var message in tripMessages) {
                if ((tripMessages[message].departure.stopId === departureId.idOne ||
                        tripMessages[message].departure.stopId === departureId.idTwo) &&
                    (tripMessages[message].arrival.stopId === arrivalId.idOne ||
                        tripMessages[message].arrival.stopId === arrivalId.idTwo) &&
                    tripWeekday === tripMessages[message].serviceId) {

                    tripFound.push(tripMessages[message]);
                }
            }

            if (tripFound.length === 0) {
                // Since no trips found in local indexedDB,
                // so need to fetch trip info from /data/GFTS/stop_times.txt
                getTrips(departureId, arrivalId, tripWeekday);
            } else {
                // If found, display the trips
                console.log("Display trips obtained from local database:");
                console.log(tripFound);

                // display trips found
                displayTrips(tripFound);
            }
        });
    });
}

//  display the found trips
function displayTrips(tripsFound) {
    var tripTemplate = Handlebars.compile(document.getElementById("trip-entry").innerHTML);
    var tripSum = "";

    for (var i = 0; i < tripsFound.length; i++) {
        tripSum += tripTemplate(tripsFound[i]);
    }
    tripInfo.innerHTML = tripSum;
}

// fetch desired trips info from /data/GTFS/
function getTrips(departureId, arrivalId, tripWeekday) {

    //console.log("departureStopName and arrivalStopName:");
    //console.log(departureId);
    //console.log(arrivalId);

    // fetch trips.txt first
    fetch('data/GTFS/trips.txt').then(function(response) {
        return response.text();
    }).then(function(result) {
        var serviceData;
        var dataItem;
        var tripService = []; // trips with service availablility info (available on Saturday, SUnday or Weekday)
        var serviceItem = [];
        var index = 0,
            i = 0;

        serviceData = result.split("\n");
        for (i = 0; i < serviceData.length; i++) {
            dataItem = serviceData[i].split(",");

            if (typeof dataItem[1] !== "undefined") {
                tripService[index] = {};
                serviceItem = dataItem[1].split("-");
                tripService[index].serviceId = serviceItem[3];
                tripService[index].tripId = dataItem[2];
                index++;
            }
        }

        return tripService;
    }).then(function(tripService) {

        fetch('data/GTFS/stop_times.txt').then(function(response) {

            return response.text();

        }).then(function(result) {

            var data = result.split('\n').slice(1);
            var index = 0;
            var tripData = []; // for all the trips
            var aTime = []; // for arrival times
            var dTime = []; // for departure times
            var tripElement = {};
            var dataElement;
            for (var i = 0; i < data.length; i++) {
                dataElement = data[i].split(',');
                if (typeof dataElement[1] !== "undefined" && typeof dataElement[2] !== "undefined") {
                    tripData[index] = {};
                    tripData[index].tripId = dataElement[0];
                    tripData[index].arrTime = dataElement[1];
                    aTime[index] = dataElement[1];
                    tripData[index].aTimeNum = 0;
                    tripData[index].aTimeNum = convertToTime(aTime[index].split(":"));
                    tripData[index].departTime = dataElement[2];
                    dTime[index] = dataElement[2];
                    tripData[index].dTimeNum = 0;
                    tripData[index].dTimeNum = convertToTime(dTime[index].split(":"));
                    tripData[index].stopId = dataElement[3];
                    tripData[index].sequence = dataElement[4];
                    tripData[index].pickupType = dataElement[5];
                    tripData[index].dropoffType = dataElement[6];
                    index++;
                }
            }

            // search trips matching departure and arrival stop ids separately
            var tripDeparture = []; // trips containg departure stop ids
            var tripArrival = []; // trips containg arrival stop ids
            for (var j = 0; j < tripData.length; j++) {

                if (tripData[j].stopId === departureId.idOne ||
                    tripData[j].stopId === departureId.idTwo) {
                    tripDeparture.push(tripData[j]);
                }
                if (tripData[j].stopId === arrivalId.idOne ||
                    tripData[j].stopId === arrivalId.idTwo) {
                    tripArrival.push(tripData[j]);
                }
            }

            /// search trips matching both the departure and arrival stop
            var tripFound = [];
            var count = 0;
            for (var k = 0; k < tripDeparture.length; k++) {
                for (var m = 0; m < tripArrival.length; m++) {
                    if (tripDeparture[k].tripId === tripArrival[m].tripId &&
                        parseInt(tripDeparture[k].sequence, 10) < parseInt(tripArrival[m].sequence, 10)) { //latter condition exclude return trips that between the two stops

                        tripFound[count] = {};
                        tripFound[count].departure = tripDeparture[k];
                        tripFound[count].arrival = tripArrival[m];
                        count++;
                    }
                }
            }

            // calculate trip duration and add service id for each trip
            tripFound.forEach(function(element) {
                element.duration = 0;
                element.serviceId = "";
                element.duration = converToString(element.arrival.aTimeNum - element.departure.aTimeNum);
                tripService.forEach(function(serviceItem) {
                    if (element.departure.tripId === serviceItem.tripId) {
                        element.serviceId = serviceItem.serviceId;
                    }
                });
            });

            var tripsFinal = []; // trips with their serivce vailability mtaching input date
            index = 0;
            for (i = 0; i < tripFound.length; i++) {
                if (tripWeekday === tripFound[i].serviceId) {
                    tripsFinal[index] = tripFound[i];
                    index++;
                }
            }

            // console.log("trips found as follows:\n");
            // console.log(tripFound);

            //console.log("matched trips found as follows:\n");
            //console.log(tripsFinal);

            // sort found trips and return them
            return sortTrips(tripsFinal);

        }).then(function(tripsFinal) {

            if (tripsFinal.length === 0) {
                searchNotice.innerHTML = "Trips are not available today!";
                tripInfo.innerHTML = "";
            }

            if (tripsFinal.length !== 0) {
                searchNotice.innerHTML = "Trips are available today!";

                dbPromise.then(function(db) {
                    var tx = db.transaction("storeOne", "readwrite");
                    var storeOne = tx.objectStore("storeOne");

                    // add fetch trips to local database
                    for (var i = 0; i < tripsFinal.length; i++) {
                        storeOne.add(tripsFinal[i]);
                    }
                });

                //console.log("Display trips fetched from data/GTFS");
                displayTrips(tripsFinal);
            }

        }); //  end fetch('./data/GTFS/stop_times.txt')

    }); //  end fetch('./data/GTFS/trips.txt')

}

function sortTrips(tripsFound) {
    var sortedTrips = [];
    var tripTime;
    var i, j;
    var leng;

    for (i = 0; i < tripsFound.length; i++) {
        tripTime = tripsFound[i].arrival.arrTime.split(':');

        leng = tripTime.length;
        sortedTrips[i] = {};
        sortedTrips[i].sortTime = 0;
        for (j = 0; j < leng; j++) {
            sortedTrips[i].sortTime += parseInt(tripTime[j], 10) * Math.pow(60, (leng - (j + 1)));
            sortedTrips[i].trip = tripsFound[i];
        }
        //console.log(sortedTrips[i]);
    }

    //console.log("sorted trips:");
    var arrtemp = quickSort(sortedTrips, 0, sortedTrips.length - 1);

    var result = [];
    arrtemp.forEach(function(element, i) {
        result[i] = element.trip;
        //console.log(element.sortTime + result[i]);
    });
    return result;
}


function swap(myArray, firstIndex, secondIndex) {
    var temp = myArray[firstIndex].sortTime;
    myArray[firstIndex].sortTime = myArray[secondIndex].sortTime;
    myArray[secondIndex].sortTime = temp;
}

function partition(myArray, left, right) {

    var pivot = myArray[Math.floor((right + left) / 2)].sortTime,
        i = left,
        j = right;


    while (i <= j) {

        while (myArray[i].sortTime < pivot) {
            i++;
        }

        while (myArray[j].sortTime > pivot) {
            j--;
        }

        if (i <= j) {
            swap(myArray, i, j);
            i++;
            j--;
        }
    }

    return i;
}

function quickSort(myArray, left, right) {

    if (myArray.length < 2) return myArray;

    left = (typeof left !== "number" ? 0 : left);

    right = (typeof right !== "number" ? myArray.length - 1 : right);

    var index = partition(myArray, left, right);

    if (left < index - 1) {
        quickSort(myArray, left, index - 1);
    }

    if (index < right) {
        quickSort(myArray, index, right);
    }

    return myArray;

}

// convert time of seconds to string like 3h42m30s
function converToString(time) {
    var timeString = "";
    var hours = 0;
    var minutes = 0;
    var seconds = 0;

    seconds = time % 60;
    minutes = Math.floor((time % 3600) / 60);
    hours = Math.floor(time / 3600);

    timeString = (hours > 0 ? hours + "h" : "") + (minutes > 0 ? minutes + "m" : "") + (seconds > 0 ? seconds + "s" : "");

    return timeString;
}

// convert time string to time of seconds
function convertToTime(timeArray) {
    var timeSecond = 0;
    var leng, j = 0;

    leng = timeArray.length;

    for (j = 0; j < leng; j++) {
        timeSecond += parseInt(timeArray[j], 10) * Math.pow(60, (leng - (j + 1)));
    }
    return timeSecond;
}

/*
trip = {
    duration: "",
    serviceId: "";
    departure: {
        arrTime: ,
        aTimeNum: ,
        departTime: ,
        dTimeNum: ,
        stopId: ,
        sequence: ,
        pickupType: ,
        dropoffType:
    },
    arrival: {
        arrTime: ,
        aTimeNum: ,
        departTime: ,
        dTimeNum: ,
        stopId: ,
        sequence: ,
        pickupType: ,
        dropoffType:
    }
}
*/
