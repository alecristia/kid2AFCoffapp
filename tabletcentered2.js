// Simple study demonstrating the use of a tablet-designed webpage. 
// Study is designed using simple JS/HTML/CSS, with data saves to a server
// controlled by call to a short php script.

//Based on script by Mike Frank and colleagues, distributed via https://github.com/langcog/tablet/tree/master/final_expt
//Initial adaptation by Page Piccinini
//Further adaptation by Alex Cristia <alecristia@gmail.com>

//DONE:
//declare minimum RT as a variable
//correct length N calculation (based on word list, not passed as a parameter)
//provide fixed positions for the dots during training
//add trial timer --> (1) repetition (2) timeout (no, human...)
//add trial-specific feedback (positive only)
//write into local file
//test in tablet

//TODO:
//move images further to the edges
//read in word list, word types, & images from separate file (rather than having the list embedded in the code)
//add function for "trial mode" (skip dot test, use just 2 trials)

// Overview: (i) Parameters (ii) Helper Functions (iii) Control Flow

// ---------------- PARAMETERS ------------------
//minimum time that must elapse between onset of word and click -- all clicks prior to this will be ignored
var minRT = 400;

//amount of wait time will leave silent until we repeat the prompt if no response has been recorded
var remTime = 3500;

//amount of white screen + silent time between trials ##USED TO BE 1500
var normalpause = 500;

//pause after picture chosen, to display red border around picture selected
var timeafterClick = 1000;


//an array of the target words used in the study; used for look-up purposes in pic1type, pic2type, and trialtype
var easyWords = ["balle", "banane"];
var moderateWords = [ "manteau", "voiture"];

//then put all words together in the right order
var allWords = ["balle", "manteau", "banane", "voiture"];

//length of test is determined by length of the word list 
var numTrials = allWords.length;



//******for handling sound; see helper function playPrompt(word) and playReward(word)
//playing the "touch" prompt
var audioSprite = $("#sound_player")[0];
var handler;

//playing the reward
var rewardSprite = $("#reward_player")[0];
var handler2;

// ---------------- HELPER ------------------

// show slide function
function showSlide(id) {
  $(".slide").hide(); //jquery - all elements with class of slide - hide
  $("#"+id).show(); //jquery - element with given id - show
}

//array shuffle function -- currently not used
shuffle = function (o) { //v1.0
    for (var j, x, i = o.length; i; j = parseInt(Math.random() * i), x = o[--i], o[i] = o[j], o[j] = x);
    return o;
}

//self-explanatory
getCurrentDate = function() {
	var currentDate = new Date();
	var day = currentDate.getDate();
	var month = currentDate.getMonth() + 1;
	var year = currentDate.getFullYear();
	return (month + "/" + day + "/" + year);
}

//self-explanatory
getCurrentTime = function() {
	var currentTime = new Date();
	var hours = currentTime.getHours();
	var minutes = currentTime.getMinutes();

	if (minutes < 10) minutes = "0" + minutes;
	return (hours + ":" + minutes);
}

//returns the word array; in the below order for list 1 and reversed for list 2
makeWordList = function(order,allWords) {
	var wordList = allWords;
	if (order === 2) {
		wordList.reverse();
	}
	return wordList;
}

//returns the image array; in the below order for list 1 and reversed with side-sway for list 2
makeImageArray = function(order) {
	//Trial 1 will be "balle" on left and "main" on right, trial two will be "gateau" on left and "manteau" on right, etc...
	var toSlice = allimages.length;
	var imageArray = allimages.slice(0, toSlice);

	//reverse the list so that the trials are reversed and the sides are swapped: trial 1 will be "voiture" 
	//on left and "poubelle" on right, etc...
	if (order === 2) {
		imageArray.reverse();
	}
	return imageArray;
}

//compute trial type, here based on words only but could be adapted to also take into account pic type
getTrialType = function(word) {
   	var trialtype;
   	if (easyWords.indexOf(word) === -1) {
  		trialtype = "difficult";
   	} else {
   		trialtype = "easy";
   	}
   	return trialtype;  
}


//create dot pattern for training, ALTERNATIVE ONE: RANDOM PLACEMENT
createDotRandom = function(dotx, doty, i, tag) {
	var dots;
	if (tag === "smiley") {
		dots = ["smiley1", "smiley2", "smiley3", "smiley4", "smiley5"];
	} else {
		dots = [1, 2, 3, 4, 5];
	}

	var dot = document.createElement("img");
	dot.setAttribute("class", "dot");
	dot.id = "dot_" + dots[i];
	if (tag === "smiley") {
		dot.src = "fixed_objects/dot_" + "smiley" + ".jpg";
	} else {
		dot.src = "fixed_objects/dot_" + dots[i] + ".jpg";
	}


    var x = Math.floor(Math.random()*950);
    var y = Math.floor(Math.random()*540);

    var invalid = "true";

    //make sure dots do not overlap
    while (true) {
    	invalid = "true";
	   	for (j = 0; j < dotx.length ; j++) {
    		if (Math.abs(dotx[j] - x) + Math.abs(doty[j] - y) < 250) {
    			var invalid = "false";
    			break; 
    		}
		}
		if (invalid === "true") {
 			dotx.push(x);
  		  	doty.push(y);
  		  	break;	
  	 	}
  	 	x = Math.floor(Math.random()*400);
   		y = Math.floor(Math.random()*400);
	}

    dot.setAttribute("style","position:absolute;left:"+x+"px;top:"+y+"px;");
   	training.appendChild(dot);
}


//create dot pattern for training, ALTERNATIVE TWO: FIXED PLACEMENT
createDotFixed = function(dotx, doty, i, tag) {
	var dots;
	if (tag === "smiley") {
		dots = ["smiley1", "smiley2", "smiley3", "smiley4", "smiley5"];
	} else {
		dots = [1, 2, 3, 4, 5];
	}

	var dot = document.createElement("img");
	dot.setAttribute("class", "dot");
	dot.id = "dot_" + dots[i];
	if (tag === "smiley") {
		dot.src = "fixed_objects/dot_" + "smiley" + ".jpg";
	} else {
		dot.src = "fixed_objects/dot_" + dots[i] + ".jpg";
	}


    var x = dotx[i];
    var y = doty[i];

    dot.setAttribute("style","position:absolute;left:"+x+"px;top:"+y+"px;");
   	training.appendChild(dot);
}

//Handles audio; indexes into the sprite to play the prompt associated with a critical word 
playPrompt = function(word) {
	audioSprite.removeEventListener('timeupdate',handler);
	audioSprite.currentTime = spriteData[word].start;
	audioSprite.play();

	handler = function() {
	    if (this.currentTime >= spriteData[word].start + spriteData[word].length) {
	        this.pause();
	    }
	};
	audioSprite.addEventListener('timeupdate', handler, false);
}

playReward = function(word) {
	rewardSprite.removeEventListener('timeupdate',handler2);
	rewardSprite.currentTime = spriteRewardData[word].start;
	rewardSprite.play();

	handler2 = function() {
	    if (this.currentTime >= spriteRewardData[word].start + spriteRewardData[word].length) {
	        this.pause();
	    }
	};
	rewardSprite.addEventListener('timeupdate', handler2, false);
}

//trying out js save function http://bgrins.github.io/devtools-snippets/#console-save
//(function(console){

    console.save = function(olddata, filename){

        if(!data) {
            console.error('Console.save: No data')
            return;
        }

        if(!filename) filename = 'console.json'

        if(typeof data === "object"){
            data = JSON.stringify(data, undefined, 4)
        }

        var blob = new Blob([data], {type: 'text/json'}),
            e    = document.createEvent('MouseEvents'),
            a    = document.createElement('a')

        a.download = filename
        a.href = window.URL.createObjectURL(blob)
        a.dataset.downloadurl =  ['text/json', a.download, a.href].join(':')
        e.initMouseEvent('click', true, false, window, 0, 0, 0, 0, 0, false, false, false, false, 0, null)
        a.dispatchEvent(e)
    }
//})(console)


//CONTROL FLOW

//PRELOAD ALL IMAGES//---------------------------
//declare in the order they'll be used, left, right (reversed for order 2)
var allimages = ["balle", "main",
				"gateau", "manteau",
				"chaussette", "banane",
				"voiture", "poubelle" ];
//for critical trials 
var images = new Array();
for (i = 0; i<allimages.length; i++) {
	images[i] = new Image();
	images[i].src = "exp_objects/" + allimages[i] + ".png";
}

//for dot game
var dots = ["dot_1", "dot_2", "dot_3", "dot_4", "dot_5", "x", "dot_smiley"];
for (i = 0; i<dots.length; i++) {
	images[i] = new Image();
	images[i].src = "fixed_objects/" + dots[i] + ".jpg";
}
//-----------------------------------------------


showSlide("instructions");

// MAIN EXPERIMENT
var experiment = {

	subid: "",
		//inputed at beginning of experiment
	trialnum: 0,
		//trial number
	order: 1,
		//whether child received list 1 or list 2
	word: "",
		//word that child is queried on
	pic1: "",
		//the name of the picture on the left
	pic2: "",
		//the name of the picture on the right
	side: "",
		//whether the child picked the left (L) or the right (R) picture
	chosenpic: "",
		//the name of the picture the child picked
	response: "",
		//whether the response was the correct response (Y) or the incorrect response (N)
	trialtype: "",
		//whether the trial was using a difficult or easy word
	date: getCurrentDate(),
		//the date of the experiment
	timestamp: getCurrentTime(),
		//the time that the trial was completed at 
	reactiontime: 0,
	//TODO : add reaction time variable ***** 

	preStudy: function() {
		document.body.style.background = "#f3f3f3 url('fixed_objects/LSCP-01-Campagne.jpg') no-repeat top center"
		$("#prestudy").hide();
		setTimeout(function () {
			experiment.next();
		}, normalpause);
	},

	//sets up and allows participants to play "the dot game"
	training: function(dotgame) {
		var allDots = ["dot_1", "dot_2", "dot_3", "dot_4", "dot_5", 
						"dot_smiley1", "dot_smiley2", "dot_smiley3", 
						"dot_smiley4", "dot_smiley5"];
		var xcounter = 0;
		var dotCount = 5;

		//preload sound
		if (dotgame === 0) {
			audioSprite.play();
			audioSprite.pause();
		}


		if (dotgame === 0) {
		    var dotx = [100, 150, 200, 250, 300];
		    var doty =  [100, 150, 200, 250, 350];
// 		    var dotx = [100, 200, 500, 1000, 900];
// 		    var doty =  [100, 500, 300, 100, 500];
			for (i = 0; i < dotCount; i++) {
				createDotFixed(dotx, doty, i, "");
			}
		} else {
		    var dotx = [100, 150, 200, 250, 300];
		    var doty =  [100, 150, 200, 250, 350];
// 		    var dotx = [250, 100, 500, 1050, 950];
// 		    var doty =  [50, 550, 300, 50, 550];
			for (i = 0; i < dotCount; i++) {
				createDotFixed(dotx, doty, i, "smiley");
			}
		}
		showSlide("training");
		$('.dot').bind('click touchstart', function(event) {
	    	var dotID = $(event.currentTarget).attr('id');

	    	//only count towards completion clicks on dots that have not yet been clicked
	    	if (allDots.indexOf(dotID) === -1) {
	    		return;
	    	}
	    	allDots.splice(allDots.indexOf(dotID), 1);
	    	document.getElementById(dotID).src = "fixed_objects/x.jpg";
	    	xcounter++
	    	if (xcounter === dotCount) {
	    		setTimeout(function () {
	    			$("#training").hide();
	    			if (dotgame === 0) {		
	    				//hide old x marks before game begins again
	    				var dotID;
	    				for (i = 1; i <= dotCount; i++) {
	    					dotID = "dot_" + i;
	    					training.removeChild(document.getElementById(dotID));
	    				}
						experiment.training();
						dotgame++; 
					} else {
						//document.body.style.background = "black";
						setTimeout(function() {
							showSlide("prestudy");
							//experiment.next();
						}, normalpause*2);
					}
				}, normalpause*2);
			}
	    });	   
	},


	//Checks to see whether the experimenter inputted appropriate values before moving on with the experiment
	checkInput: function() {
		//subject ID
  		if (document.getElementById("subjectID").value.length < 1) {
			$("#checkMessage").html('<font color="red">You must input a subject ID</font>');
			return;
		}
  		experiment.subid = document.getElementById("subjectID").value;

		//list
		if (document.getElementById("order").value !== "1" && document.getElementById("order").value !== "2") { //|| document.getElementById("order").value !== "2") {
			$("#checkMessage").html('<font color="red">For list, you must choose either a 1 or 2</font>');
			return;
		}
		experiment.order = parseInt(document.getElementById("order").value);
		experiment.training(0);
	},


	//the end of the experiment, where the background becomes completely white
    end: function () {
    	setTimeout(function () {
    		$("#stage").fadeOut();
    	}, normalpause);
    	showSlide("finished");
    	document.body.style.background = "white";
    },


	//concatenates all experimental variables into a string which represents one "row" of data in the eventual csv, to live in the server
	processOneRow: function(olddata) {
		var dataforRound =  experiment.subid; 
		dataforRound += "," + experiment.order + "," + experiment.trialnum + "," + experiment.word;
		dataforRound += "," + experiment.pic1 + "," + experiment.pic2 ;
		dataforRound += "," + experiment.side + "," + experiment.chosenpic + "," + experiment.response + "," + experiment.trialtype;
		dataforRound += "," + experiment.date + "," + experiment.timestamp + "," + experiment.reactiontime + "\n";
		$.post("tabletstudysave.php", {postresult_string : dataforRound});	
		olddata = olddata + dataforRound;
		
		//$.twFile.save("test.txt", olddata);

//////////STUFF THAT DID NOT WORK
// http://stackoverflow.com/questions/5349921/local-javascript-write-to-local-file
// 		var fso  = new ActiveXObject("Scripting.FileSystemObject");
//    		var txtFile = fso.CreateTextFile("TestFile.txt", true);
//    		txtFile.WriteLine("This is a test");
//    		txtFile.Close();
//http://stackoverflow.com/questions/8693289/how-to-write-localstorage-data-to-a-text-file-in-chrome
// var myString = localStorage.YOUR_VALUE;
// chrome.downloads.download({
//     url: "data:text/plain," + myString,
//     filename: "data.txt",
//     conflictAction: "uniquify", // or "overwrite" / "prompt"
//     saveAs: false, // true gives save-as dialogue
// }, function(downloadId) {
//     console.log("Downloaded item with ID", downloadId);
// });
//https://gist.github.com/Arahnoid/9925725
// 		var txtFile = "test.txt";
// 		var file = new File(txtFile);
// 		file.open("w"); // open file with write access
// 		file.writeln(olddata);
// 		file.close();
		return olddata;
	},
	


	// MAIN DISPLAY FUNCTION
  	next: function() {

		//returns the list of all words to use in the study - list dependent
  	    var wordList = makeWordList(experiment.order,allWords);
  	    
  		//returns the list of all images to use in the study - list dependent
		var imageArray = makeImageArray(experiment.order);

		var objects_html = "";
		var counter = 1;
		var olddata = "";
 					
    
		//HTML for the first object on the left
		leftname = "exp_objects/" + imageArray[0] + ".png";
		objects_html += '<table align = "center" cellpadding="60"><tr></tr><tr><td align="center"><img class="pic" src="' + leftname +  '"alt="' + leftname + '" id= "leftPic"/></td>';
	
		//HTML for the first object on the right
		rightname = "exp_objects/" + imageArray[1] + ".png";
		objects_html += '<td align="center"><img class="pic" src="' + rightname +  '"alt="' + rightname + '" id= "rightPic"/></td>';
		
		//project the first set of images
		objects_html += '</tr></table>';
		$("#objects").html(objects_html); 
		$("#stage").fadeIn();

		//play the first prompt
		var startTime = (new Date()).getTime();
		playPrompt(wordList[0]);
		
		//click disable for the first slide
		var clickDisabled = true;
		setTimeout(function() {clickDisabled = false;}, (spriteData[wordList[0]].onset - spriteData[wordList[0]].start)*1000 + minRT);

		//set timer for reminders 1 and 2 for first slide, which will happen remTime after prompt offset
		reminder = setTimeout(function(){ playPrompt(wordList[0]); } , remTime + spriteData[wordList[0]].length);
		reminder2 = setTimeout(function(){ playPrompt(wordList[0]); } , remTime*2 + spriteData[wordList[0]].length);

		$('.pic').bind('click touchstart', function(event) {
			clearTimeout(reminder);
			clearTimeout(reminder2);

			if (clickDisabled) return;
			
			//disable subsequent clicks once the participant has made their choice
			clickDisabled = true; 

			//time the participant clicked - the time the audio began - the amount of time between the beginning of the audio and the 
			//onset of the word 
			experiment.reactiontime = (new Date()).getTime() - startTime - (spriteData[wordList[0]].onset-spriteData[wordList[0]].start)*1000; 

			experiment.trialnum = counter;
			experiment.word = wordList[0];
			experiment.pic1 = imageArray[0];
			experiment.pic2 = imageArray[1];

			//Was the picture clicked on the right or the left?
			var picID = $(event.currentTarget).attr('id');
			if (picID === "leftPic") {
				experiment.side = "L";
				experiment.chosenpic = imageArray[0];
			} else {
				experiment.side = "R";
				experiment.chosenpic = imageArray[1];
			}
			
			//If the child picked the picture that matched with the word, then they were correct. If they did not, they were not correct.
			if (experiment.chosenpic === experiment.word) {
				experiment.response = "Y";
				playReward(wordList[0]);
			} else {
				experiment.response = "N"
			}
	
			//what kind of trial was this?
			experiment.trialtype = getTrialType(experiment.word, imageArray[0], imageArray[1]);
	
			//Add one to the counter and process the data to be saved; the child completed another "round" of the experiment
			olddata = experiment.processOneRow(olddata);
	    	counter++;
	
			$(document.getElementById(picID)).css('margin', "-8px");
			$(document.getElementById(picID)).css('border', "solid 8px red");
	
			//remove the pictures from the image array that have been used, and the word from the wordList that has been used
			imageArray.splice(0, 2);
			wordList.splice(0, 1);

		
			setTimeout(function() {
				$("#stage").fadeOut();

				//there are no more trials for the experiment to run
				if (counter === numTrials + 1) {
					experiment.end();
					return;
				}	


				//move on to the next round after either the normal amount of time between critical rounds
				setTimeout(function() {		
					//and repeat projection, click disabling, timing, & reminders for slides 2+	
					document.getElementById("leftPic").src = "exp_objects/" + imageArray[0] + ".png";
					document.getElementById("rightPic").src = "exp_objects/" + imageArray[1] + ".png";


					$(document.getElementById(picID)).css('border', "none"); 
					$(document.getElementById(picID)).css('margin', "0px");

					$("#stage").fadeIn();

					setTimeout(function() {clickDisabled = false;}, (spriteData[wordList[0]].onset-spriteData[wordList[0]].start)*1000 + 300);

					startTime = (new Date()).getTime();
					playPrompt(wordList[0]);
					
					reminder = setTimeout(function(){ playPrompt(wordList[0]); } , remTime + spriteData[wordList[0]].length);
					reminder2 = setTimeout(function(){ playPrompt(wordList[0]); } , remTime*2 + spriteData[wordList[0]].length);

					},  normalpause); 
			}, timeafterClick);
	    });
    },
}
