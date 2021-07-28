require('dotenv').config();
//import express from 'express';
const express = require('express');
//express for the website and pug to create the pages
const app = express();
const pug = require('pug');
bodyParser = require('body-parser');
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.set('view engine','pug');
app.use(express.static('public'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.set('view engine','pug');
var request = require("request");


//ffmpeg
var spawn = require('child_process').spawn;
spawn('ffmpeg',['-h']).on('error',function(m){
	console.error("FFMpeg not found in system cli; please install ffmpeg properly or make a softlink to ./!");
	process.exit(-1);
});
var ffmpeg_process, feedStream=false;


//media server
const NodeMediaServer = require('node-media-server');
 
const config = {
  rtmp: {
    port: 1935,
    chunk_size: 60000,
    gop_cache: true,
    ping: 30,
    ping_timeout: 60
  },
  http: {
    port: 8000,
    allow_origin: '*'
  }
};
 
var nms = new NodeMediaServer(config)
nms.run();



//apivideo



const apiVideoClient = require('@api.video/nodejs-client');


//if you chnage the key to sandbox or prod - make sure you fix the delegated toekn on the upload page
const apiVideoKey = process.env.apiProductionKey;
console.log("apiVideoKey",apiVideoKey);
	//list of the livestreams I care about
							//bbb						//SSTB
var livestreams = ["li6ndv3lbvrZELWxMKGzGg9V","li7e2ePBRYKY6AOfPU8HSt91"];
var streamKeys = ["1d1e7a11-14a6-4984-b6d4-0c9864aec3dd","a032875e-cacd-4d71-aa00-cadb770e4390"]
var videoUrls = ["https://cdn.api.video/vod/vi1UQBDAMqAPCRxB3dmw1thc/mp4/1080/source.mp4","https://cdn.api.video/vod/vilZMoYlOLYUdD4cUYtNLSf/mp4/360/source.mp4"];



app.get('/movie', (req, res) => {
	

	var movieChoice = req.query.movie;
	//the data for BBB and SSTB are in arrays. BBB at 0, SSTB at 1
	var counter=0;
	if(movieChoice ==="sstb"){
		counter =1;
	}
	
	//get data on both movies:
	const client = new apiVideoClient({ apiKey: apiVideoKey });
	let allLiveStreams = client.liveStreams.list();
	var videos =[{
		"name": "Big Buck Bunny",
		"livestream": "li6ndv3lbvrZELWxMKGzGg9V",
		"broadcasting":false, 
		"iframe":"",
		"thumbnail":"",
		"description": "Big Buck Bunny is a free and open source movie, created by Blender, and released under Creative Commons 3.0."

		},{
			"name": "Sita Sings the Blues",
			"livestream": "li7e2ePBRYKY6AOfPU8HSt91",
			"broadcasting":false,
			"iframe":"",
			"thumbnail":""
			,
		"description": "Sita Sings the Blues is a an open source movie, created by Nina Paley, and released under CC-BY-SA."
		}];

	
	allLiveStreams.then(function(liveList){
		//console.log(liveList);
		for(var i=0;i<liveList.length; i++){
			
			//set iframe thumbnail and broadcasting status for each video
			if(liveList[i].liveStreamId === videos[0].livestream){
				videos[0].broadcasting = liveList[i].broadcasting;
				videos[0].thumbnail = liveList[i].assets.thumbnail;
				videos[0].iframe = "iframe src='" +liveList[i].assets.player +"' width=\"100%\" height = \"100%\" frameborder=\"0\" scrolling=\"no\" allowfullscreen=\"true\"";
			}else if(liveList[i].liveStreamId === videos[1].livestream){
				videos[1].broadcasting = liveList[i].broadcasting;
				videos[1].thumbnail = liveList[i].assets.thumbnail;
				videos[1].iframe = "iframe src='" +liveList[i].assets.player +"' width=\"100%\" height = \"100%\" frameborder=\"0\" scrolling=\"no\" allowfullscreen=\"true\"";
			}

		}
		console.log(videos[counter]);
		


		return res.render('index', videos[counter]);

	}).catch((err) => {
		console.log(err);
	});



});

app.post ('/start', (req,res) => {
		//oj this will kick the video stream off
		console.log(req.body);
		var videoToStream = req.body.movie;
		//counter for array data BBB=0, SSTB =1 (more will go from here)
		var counter = 0;
		if(videoToStream==="sstb"){
			counter =1;
		}	
		console.log("video to stream:",videoToStream );
		var videoLink = videoUrls[counter];
		var rtmpDestination = "rtmp://broadcast.api.video/s/"+streamKeys[counter];
		
		var ops = [
			'-i', videoLink, 
			  '-preset', 'ultrafast', '-tune', 'zerolatency', 
				'-f', 'flv', rtmpDestination		
		];


		console.log("ops", ops);
		ffmpeg_process=spawn('ffmpeg', ops);
		//ffmpeg started
		console.log("video stream started");
		
		ffmpeg_process.stderr.on('data',function(d){
			console.log('ffmpeg_stderr',''+d);
		});
		
		//
		 res.sendStatus(200);
});



//testing on 3030
app.listen(process.env.PORT || 3030, () =>
  console.log('Example app listening on port 3030!'),
);
process.on('uncaughtException', function(err) {
    // handle the error safely
    console.log(err)
    // Note: after client disconnect, the subprocess will cause an Error EPIPE, which can only be caught this way.
});



	