var G=[0,0.8];
var particles=[];
var segments=[];
var boards=[];

function scale(vector,value){
	let newVector=[];
	for(let i=0;i<vector.length;i++){
		newVector[i]=vector[i]*value;
	}
	return newVector;
}

function distance(v1,v2){
	let dist=0;
	for(let i=0;i<v1.length;i++){
		dist+=Math.pow(v1[i]-v2[i],2);
	}
	return Math.sqrt(dist);
}

function createHangingBoards(topLeft, size, str){
	
	for(let i=0;i<str.length;i++){
		let x=topLeft[0]+size*3.5*i;
		let y=topLeft[1];
		console.log(x,y);
		if(str.charAt(i)==" "){
			continue;
		}
		let board=createHangingBoard(
			[x,y]
			,size,
			str.charAt(i));
			
		particles.add(board.p);
		segments.add(board.s);
		boards.add(board.b);
	}
	
}

function createHangingBoard(location,size,letter){
	let links=8;
	let p=[]
	let s=[]
	let b=[]
	let angle=0.2;
	//support
	for(let i=0;i<links;i++){
		let isFixed=true;
		if(i>0){
			isFixed=false;
		}
		p.push(new Particle([location[0]-size+i*size*0.6,location[1]],isFixed));
		p.push(new Particle([location[0]+size+i*size*0.6,location[1]],isFixed));
		if(i>0){
			s.push(new Segment(p[p.length-1],p[p.length-3]));
			s.push(new Segment(p[p.length-2],p[p.length-4]));
		}
	}
	p.push(new Particle([location[0]-size+(links-1)*size*0.6,location[1]+4*size*0.6],false));
	p.push(new Particle([location[0]+size+(links-1)*size*0.6,location[1]+4*size*0.6],false));
	s.push(new Segment(p[p.length-1],p[p.length-2],true));
	s.push(new Segment(p[p.length-4],p[p.length-3],true));
	s.push(new Segment(p[p.length-1],p[p.length-3],true));
	s.push(new Segment(p[p.length-2],p[p.length-4],true));
	s.push(new Segment(p[p.length-1],p[p.length-4],true));
	b.push(new Board([
		p[p.length-1],p[p.length-2],p[p.length-4],p[p.length-3]
	],letter));
	
	
	
	return {p:p,s:s,b:b};
}

Array.prototype.add=function(elements){
	for(let i=0;i<elements.length;i++){
		this.push(elements[i]);
	}
}

class Board{
	constructor(particles,letter){
		this.particles=particles;
		this.letter=letter;
	}
	
	draw(ctx){
		ctx.beginPath();
		ctx.fillStyle="white";
		ctx.moveTo(...this.particles[0].location);
		for(let i=1;i<this.particles.length;i++){
			ctx.lineTo(...this.particles[i].location);
		}
		ctx.fill();
		let center=averageParticleLocations(this.particles);
		let angle=Math.atan2(
			this.particles[0].location[1]-this.particles[1].location[1],
			this.particles[0].location[0]-this.particles[1].location[0]
		);
		
		ctx.save();
		ctx.translate(...center);
		ctx.rotate(angle);
		ctx.font = "20px Arial";
		ctx.fillStyle="black"
		ctx.textAlign="center"
		ctx.textBaseline="middle"
		
		ctx.fillText(this.letter
			, 0,0);	
		ctx.restore();
	}
}

function averageParticleLocations(particles){
	let avg=[0,0];
	for(let i=0;i<particles.length;i++){
		avg[0]+=particles[i].location[0];
		avg[1]+=particles[i].location[1];
	}
	avg[0]/=particles.length;
	avg[1]/=particles.length;
	return avg;
}
class Segment{
	constructor(particleA,particleB,isHidden){
		this.isHidden=isHidden;
		this.particleA=particleA;
		this.particleB=particleB;
		this.length=distance(particleA.location,
					particleB.location);
	}
	
	update(){
		let newLength=subtract(this.particleA.location,
					this.particleB.location);
		let magn=magnitude(newLength);
		
		let diff=magn-this.length;
		let norm=normalize(newLength);
		if(!this.particleA.isFixed && !this.particleB.isFixed ){
			this.particleA.location=add(
				this.particleA.location, scale(norm,-diff*0.5)
			)
			this.particleB.location=add(
				this.particleB.location, scale(norm,diff*0.5)
			)
		}else if(!this.particleA.isFixed){
			this.particleA.location=add(
				this.particleA.location, scale(norm,-diff)
			)
		}else{
			this.particleB.location=add(
				this.particleB.location, scale(norm,diff)
			)
		}
		
	}
	
	draw(ctx){
		if(this.isHidden){
			return;
		}
		ctx.beginPath();
		ctx.strokeStyle="black";
		ctx.lineWidth=2;
		const sub=subtract(this.particleA.location,
			this.particleB.location);
		const norm=normalize(sub);
		const delta=magnitude(sub)*0.1;
		const start=add(this.particleA.location,
			scale(norm,+delta));
		const end=add(this.particleB.location,
			scale(norm,-delta));

		const startOffset1=add(start,scale(flip(norm),delta*3));
		const startOffset2=add(start,scale(flip(norm),-delta*3));
		const endOffset1=add(end,scale(flip(norm),delta*3));
		const endOffset2=add(end,scale(flip(norm),-delta*3));
		ctx.moveTo(...start);
		ctx.bezierCurveTo(...startOffset1,
					...endOffset1,...end);
		ctx.bezierCurveTo(...endOffset2,
					...startOffset2,...start);
		ctx.stroke();
	}
}
class Particle{
	constructor(location,isFixed){
		this.isFixed=isFixed;
		this.location=location;
		if(Math.random()<0.2){
			this.oldLocation=
				[location[0]+(Math.random()-0.5)*12,
				location[1]+(Math.random()-0.5)*12];
		}else{
			this.oldLocation=location;
		}
		this.radius=2;
	}
	update(forces){
		if(this.isFixed){
			return;
		}
		let vel=subtract(this.location,this.oldLocation);
		let newLocation=add(this.location,vel);
		for(let i=0;i<forces.length;i++){
			newLocation=add(newLocation,forces[i]);
		}
		this.oldLocation=this.location;
		this.location=newLocation;
	}
	draw(ctx){
		ctx.beginPath();
		ctx.strokeStyle="black";
		ctx.lineWidth=10;
		if(this.color!=null){
			ctx.fillStyle=this.color;
		}
		ctx.arc(...this.location,this.radius,0,Math.PI*2);
		//ctx.stroke();
	}
}


function updateSegments(segments){
	for(let i=0;i<segments.length;i++){
		segments[i].update();
	}
}

function updateParticles(particles,forces){
	for(let i=0;i<particles.length;i++){
		particles[i].update(forces);
	}
}

function drawObjects(objects,ctx){
	for(let i=0;i<objects.length;i++){
		objects[i].draw(ctx);
	}
}

function normalize(v){
	return scale(v,1/magnitude(v));
}

function magnitude(v){
	let magn=0;
	for(let i=0;i<v.length;i++){
		magn+=v[i]*v[i];
	}
	return Math.sqrt(magn);
}

function flip(v){
	let newV=[v[1],v[0]];
	return newV;
}
function subtract(v1,v2){
	let newV=[];
	for(let i=0;i<v1.length;i++){
		newV[i]=v1[i]-v2[i];
	}
	return newV;
}

function add(v1,v2){
	let newV=[];
	for(let i=0;i<v1.length;i++){
		newV[i]=v1[i]+v2[i];
	}
	return newV;
}
function average(v1,v2){
	let newV=[];
	for(let i=0;i<v1.length;i++){
		newV[i]=(v1[i]+v2[i])/2;
	}
	return newV;
}


function getNearestParticle(particles, location){
	let minDist=Number.MAX_VALUE;
	let nearestParticle=null;
	for(let i=0;i<particles.length;i++){
		let dist=distance(particles[i].location,
						location);
		if(dist<minDist){
			minDist=dist;
			nearestParticle=particles[i];
		}
	}
	return nearestParticle;
}

function getMousePos(canvas, evt) {
	var rect = canvas.getBoundingClientRect();
	return [
	  Math.round(CANVAS_SIZE*(evt.clientX - rect.left)/(rect.right-rect.left)),
	  Math.round(CANVAS_SIZE*(evt.clientY - rect.top)/(rect.bottom-rect.top))
	];
}


const CANVAS_WIDTH = 480;
const CANVAS_HEIGHT = 620;

let snowBgCanvas;
let branchCanvas;
let snowFgCanvas;
let gameCanvas;

let crosshair = {
	image:new Image(),
	x:CANVAS_WIDTH/2,
	y:CANVAS_HEIGHT/2,
	size:CANVAS_WIDTH*0.1
}
crosshair.image.src="https://radufromfinland.com/projects/christmasgame/crosshair.png";

let images=[];
for(let i=1;i<=8;i++){
	images.push(new Image());
}
images[0].src="https://radufromfinland.com/projects/christmasgame/snowball.png";
images[1].src="https://radufromfinland.com/projects/christmasgame/bell.png";
images[2].src="https://radufromfinland.com/projects/christmasgame/bow.png";
images[3].src="https://radufromfinland.com/projects/christmasgame/cane.png";
images[4].src="https://radufromfinland.com/projects/christmasgame/gift.png";
images[5].src="https://radufromfinland.com/projects/christmasgame/man.png";
images[6].src="https://radufromfinland.com/projects/christmasgame/red.png";
images[7].src="https://radufromfinland.com/projects/christmasgame/yellow.png";
let next=3;
let score=0;

let items=[];

let gameOver=true;
let time=0;
let endTime=0;
let roundDuration=20; //seconds

const AUDIO_CONTEXT=new (AudioContext || webkitAudioContext || window.webkitAudioContext)();
			
const keys={
	DO:261.6, 
	RE:293.7, 
	MI:329.6, 
	FA:349.2, 
	SOL:392.0, 
	LA:440.0, 
	SI:493.9, 
	DO2:523.2
};

let advice=false;

function initializeCanvas(canvasID){
    const canvas = document.getElementById(canvasID);
    canvas.width = CANVAS_WIDTH;
    canvas.height = CANVAS_HEIGHT;
    return canvas;
}

  snowBgCanvas = initializeCanvas('canvasSnowBackground');
	branchCanvas = initializeCanvas('canvasTreeBranches');
	snowFgCanvas = initializeCanvas('canvasSnowForeground');
	gameCanvas = initializeCanvas('canvasGame');
	gameCanvas.style.cursor="none";
	
	addEventListeners(gameCanvas);
	
	createHangingBoards(
		[20,-35],
		CANVAS_WIDTH*0.0186,
		"Merry Christmas");
	
    const treeLocation = [CANVAS_WIDTH * 0.5, CANVAS_HEIGHT * 0.95];
    drawBranches(branchCanvas, treeLocation, 100, 0, 20);
	drawLeaves(branchCanvas);
	setInterval(function(){
		updateGame(gameCanvas);
		
		updateParticles(particles,[G]);
		updateSegments(segments);
		let ctx=gameCanvas.getContext("2d");
		drawObjects(particles,ctx);
		drawObjects(segments,ctx);
		drawObjects(boards,ctx);
		
		handleSnowflakes(snowBgCanvas);
		drawSnowBackground(snowBgCanvas);
	}, 1000/60);
	drawSnowForeground(snowFgCanvas);

	
function startGame(){
	gameOver=false;
  advice=false;
	endTime=roundDuration + new Date().getTime()/1000;
	items=[];
	score=0;
}
	
function updateTime(canvas){
	time=endTime-new Date().getTime()/1000;
	if(time<=0){
		gameOver=true;
		
		jingleBells();
	}
	
	let ctx=canvas.getContext("2d");
	ctx.beginPath();
	ctx.fillStyle="gray";
	ctx.fillRect(0,CANVAS_HEIGHT*0.9,
		CANVAS_WIDTH * time/roundDuration, CANVAS_HEIGHT*0.05);
}

function updateGame(canvas){
	clear(canvas);
	if(!gameOver){
		updateTime(canvas);
	}
	updateItems(canvas);
	showScore(canvas);
	showNext(canvas);
  if(advice){
    showAdvice(canvas);
  }
	drawCrosshair(canvas);
}

function updateItems(canvas){
	for(let i=0;i<items.length;i++){
		if(!items[i].stuck){
			items[i].size-=10;
			if(items[i].size<0){
				items.splice(i,1);
				i--;
			}
		}else if(items[i].falling){
			items[i].y+=10;
			if(items[i].y>CANVAS_HEIGHT){
				items.splice(i,1);
				i--;
			}
		}
	}
	
	for(let i=0;i<items.length;i++){
		if(items[i].size==50 &&
			hits(items[i],branchCanvas)&&
			!hits(items[i],snowFgCanvas)&&
			!items[i].stuck){
				if(items[i].image==images[0]){ //snowball
					nooooooo();
				}else{
					items[i].stuck=true;
					score++;
					stuckSound();
				}
		}
	}
	
	let ctx=canvas.getContext("2d");
	for(let i=0;i<items.length;i++){
		ctx.drawImage(items[i].image,
			items[i].x-items[i].size*0.5,
			items[i].y-items[i].size*0.5,
			items[i].size,
			items[i].size);
	}
}

function nooooooo(){
	for(let i=0;i<items.length;i++){
		items[i].falling=true;
	}
	score=0;
	failSound();
}

function hits(item,canvas){
	const ctx=canvas.getContext("2d");
	let imageData=ctx.getImageData(item.x, item.y, 1, 1);
	let alpha=imageData.data[3];
	if(alpha==0){
		return false;
	}
	return true;
}

function showScore(canvas){
	let ctx=canvas.getContext("2d");
	ctx.font="20px Arial";
	ctx.fillStyle="black";
	ctx.textAlign="left";
	ctx.fillText("Score: "+score,10,80);
}

function showNext(canvas){
	let ctx=canvas.getContext("2d");
	ctx.font="20px Arial";
	ctx.fillStyle="black";
	ctx.textAlign="right";
	ctx.fillText("Next ",CANVAS_WIDTH-10,80);
	
	let size=45;
	ctx.drawImage(images[next],
		CANVAS_WIDTH-30-size*0.5,
		100-size*0.5,
		size,
		size);
}

function showAdvice(canvas){
	let ctx=canvas.getContext("2d");
	ctx.font="20px Arial";
	ctx.fillStyle="black";
	ctx.textAlign="center";
	ctx.fillText("Click to Play again",CANVAS_WIDTH/2,100);
}

function drawCrosshair(canvas){
	let ctx=canvas.getContext("2d");
	
	ctx.drawImage(crosshair.image,
		crosshair.x-crosshair.size*0.5,
		crosshair.y-crosshair.size*0.5,
		crosshair.size,
		crosshair.size);
}

function addEventListeners(canvas){
	canvas.addEventListener('mousedown', function(event){
		fire();
	});
	canvas.addEventListener('mousemove', function(event){
		const loc=getCursorPosition(canvas,event);
		crosshair.x=loc.x;
		crosshair.y=loc.y;
	});
}

function fire(){
	if(!gameOver){
		items.push({
			x:crosshair.x,
			y:crosshair.y,
			size:150,
			image:images[next],
			stuck:false
		});
		next=Math.floor(Math.random()*images.length);
		cannonNoise();
	}else if(advice){
    startGame();
  }
}

function getCursorPosition(canvas, event){
	const rect=canvas.getBoundingClientRect();
	return {
		x:event.clientX-rect.left,
		y:event.clientY-rect.top
	}
}

function drawLeaves(branchCanvas){
	const ctx=branchCanvas.getContext("2d");
	const imageData=ctx.getImageData(0,0,
		CANVAS_WIDTH, CANVAS_HEIGHT);
	const data=imageData.data;
	
	let branchPixels=[];
	for(let y=0;y<CANVAS_HEIGHT;y++){
		for(let x=0;x<CANVAS_WIDTH;x++){
			let red=data[4*(y*CANVAS_WIDTH+x)+0];
			let green=data[4*(y*CANVAS_WIDTH+x)+1];
			let blue=data[4*(y*CANVAS_WIDTH+x)+2];
			let alpha=data[4*(y*CANVAS_WIDTH+x)+3];
			if(alpha>0 && y< CANVAS_HEIGHT*0.95-100){
				branchPixels.push([x,y]);
			}
		}
	}
	var cnt=1;
	for(let i=0;i<branchPixels.length;i++){
   setTimeout(function(){
     cnt++;
		if(Math.random()<0.30){
			let loc=branchPixels[i];
			loc[0]+=(Math.random()-0.5)*10;
			loc[1]+=(Math.random()-0.5)*10;
			ctx.beginPath();
			let green=255*(CANVAS_HEIGHT-loc[1])/CANVAS_HEIGHT;
			ctx.fillStyle="rgba(0,"+green+",0,0.4)";
			ctx.save();
			ctx.translate(...loc);
			ctx.rotate(Math.random()*Math.PI*2);
			ctx.arc(0,0,5,0,Math.PI);
			ctx.fill();
			ctx.restore();
		}
     if(cnt==branchPixels.length){
       startGame()
     }
   },20+i/20+Math.random()*1000);
	}
            
}

function drawBranches(canvas, start, len, angle, branchWidth){
    const ctx = canvas.getContext('2d');
    ctx.beginPath();
    ctx.save();
    ctx.lineWidth = branchWidth;
    ctx.translate(...start);
    ctx.rotate(angle * Math.PI/180);

    ctx.moveTo(0, 0);
    ctx.lineTo(0, -len);
    ctx.stroke();
    
    if (len > 10){
        drawBranches(canvas, [0, -len], len * 0.5, 35, branchWidth * 0.7);
        drawBranches(canvas, [0, -len], len * 0.5, -35, branchWidth * 0.7);
        drawBranches(canvas, [0, -len], len * 0.8, 0, branchWidth * 0.7);
    }
    ctx.restore();
}

const snowflakes = new Image();
snowflakes.src = 'http://cs.uef.fi/~radum/youtube/christmasgame/snowflakes.png';
class Snowflake {
	constructor(){
		this.x = Math.random() * CANVAS_WIDTH;
		this.y = Math.random() * CANVAS_HEIGHT;
		this.size = Math.random() * 60 + 40;
		this.speed = Math.random() * 0.5 + 0.2;
		this.frameX = Math.floor(Math.random() * 4);
		this.frameY = Math.floor(Math.random() * 4);
		this.frameSize = 250;
		this.angle = 0;
		this.spin = Math.random() > 0.5 ? 0.2 : -0.2;
	}
	update(){
		this.y += this.speed;
		if (this.y - this.size > CANVAS_HEIGHT) this.y = 0 - this.size;
		this.angle += this.spin;
	}
	draw(canvas){
		const ctx = canvas.getContext('2d');
		ctx.save();
		ctx.translate(this.x, this.y);
		ctx.rotate(this.angle * Math.PI/180);
		ctx.drawImage(snowflakes, 
			this.frameX * this.frameSize, this.frameY * this.frameSize, 
			this.frameSize, this.frameSize, 
			0 - this.size/2, 0 - this.size/2, 
			this.size, this.size);
		ctx.restore();
	}
}
const particlesArray = [];
for (let i = 0; i < 20; i++){
	particlesArray.push(new Snowflake);
}
function handleSnowflakes(canvas){
	clear(canvas);
	for (let i = 0; i < particlesArray.length; i++){
		particlesArray[i].update();
		particlesArray[i].draw(canvas);
	}
}
function clear(canvas){
	const ctx = canvas.getContext('2d');
	ctx.clearRect(0, 0, canvas.width, canvas.height);
}
function drawSnowBackground(canvas){
	const ctx = canvas.getContext('2d');
	ctx.beginPath();
	ctx.moveTo(0, CANVAS_HEIGHT);
	ctx.lineTo(0, CANVAS_WIDTH - 20);
	ctx.fillStyle = 'white';
	ctx.strokeStyle = 'lightblue';
	ctx.quadraticCurveTo(CANVAS_WIDTH, CANVAS_WIDTH - 30, 
		CANVAS_WIDTH, CANVAS_HEIGHT);
	ctx.fill();
	ctx.stroke();
	ctx.beginPath();
	ctx.moveTo(CANVAS_WIDTH, CANVAS_HEIGHT);
	ctx.lineTo(CANVAS_WIDTH, CANVAS_WIDTH - 30);
	ctx.quadraticCurveTo(0, CANVAS_WIDTH + 20, 0, CANVAS_HEIGHT);
	ctx.stroke();
	ctx.fill();
}
function drawSnowForeground(canvas){
	const ctx = canvas.getContext('2d');
	ctx.beginPath();
	ctx.moveTo(0, CANVAS_HEIGHT);
	ctx.lineTo(0, CANVAS_WIDTH + 20);
	ctx.fillStyle = 'white';
	ctx.strokeStyle = 'lightblue';
	ctx.quadraticCurveTo(CANVAS_WIDTH, CANVAS_WIDTH + 50, CANVAS_WIDTH + 20, CANVAS_HEIGHT);
	ctx.stroke();
	ctx.fill();
}

function playNote(key,duration,offset){
	var osc = AUDIO_CONTEXT.createOscillator(); // Create oscillator node
	var envelope = AUDIO_CONTEXT.createGain()
		
	osc.connect(envelope)
	
	envelope.connect(AUDIO_CONTEXT.destination)
	osc.frequency.value = key;

	osc.type = 'triangle';
	envelope.gain.setValueAtTime(0, AUDIO_CONTEXT.currentTime+offset/1000);
	envelope.gain.linearRampToValueAtTime(0.5, AUDIO_CONTEXT.currentTime + 0.1 + offset/1000);
		
	osc.start(AUDIO_CONTEXT.currentTime +offset/1000);
	
	envelope.gain.exponentialRampToValueAtTime(0.001, 
			AUDIO_CONTEXT.currentTime + duration/1000 +offset/1000);

	osc.stop(AUDIO_CONTEXT.currentTime + duration/1000 +offset/1000);

	setTimeout(function(){
		osc.disconnect();
	},duration+offset);
}

function jingleBells(){
	const step=300;
	
	let slowness=0.6;
	if(score<10){
		slowness=1.5;
	}
	if(score<20){
		slowness=1;
	}
	playNote(keys.MI,step,0*slowness);
	playNote(keys.MI,step,step*slowness);
	playNote(keys.MI,step*2,step*2*slowness);
	playNote(keys.MI,step,step*4*slowness);
	playNote(keys.MI,step,step*5*slowness);
	playNote(keys.MI,step*2,step*6*slowness);
	playNote(keys.MI,step,step*8*slowness);
	playNote(keys.SOL,step,step*9*slowness);
	playNote(keys.DO,step*1.5,step*10*slowness);
	playNote(keys.RE,step*0.5,step*11.5*slowness);
	playNote(keys.MI,step*4,step*12*slowness);
  setTimeout(function(){
    advice=true;
  },step*12*slowness);
}

function cannonNoise(){
	const duration=500;
	var osc = AUDIO_CONTEXT.createOscillator(); // Create oscillator node
	var envelope = AUDIO_CONTEXT.createGain()
		
	osc.connect(envelope)
	
	envelope.connect(AUDIO_CONTEXT.destination)
	osc.frequency.value = 400;

	osc.type = 'sine';
	envelope.gain.setValueAtTime(0, AUDIO_CONTEXT.currentTime);
	envelope.gain.linearRampToValueAtTime(0.5, AUDIO_CONTEXT.currentTime + 0.1 );
	osc.frequency.linearRampToValueAtTime(100, AUDIO_CONTEXT.currentTime + duration/1000);
		
	osc.start(AUDIO_CONTEXT.currentTime );
	
	envelope.gain.exponentialRampToValueAtTime(0.001, 
			AUDIO_CONTEXT.currentTime + duration/1000 );

	osc.stop(AUDIO_CONTEXT.currentTime + duration/1000 );

	setTimeout(function(){
		osc.disconnect();
	},duration);
}

function stuckSound(){
	const duration=200;
	var osc = AUDIO_CONTEXT.createOscillator(); // Create oscillator node
	var envelope = AUDIO_CONTEXT.createGain()
		
	osc.connect(envelope)
	
	envelope.connect(AUDIO_CONTEXT.destination)
	osc.frequency.value = 200;

	osc.type = 'sine';
	envelope.gain.setValueAtTime(0, AUDIO_CONTEXT.currentTime);
	envelope.gain.linearRampToValueAtTime(0.5, AUDIO_CONTEXT.currentTime + 0.1 );
	osc.frequency.linearRampToValueAtTime(900, AUDIO_CONTEXT.currentTime + duration/1000);
		
	osc.start(AUDIO_CONTEXT.currentTime );
	
	envelope.gain.exponentialRampToValueAtTime(0.001, 
			AUDIO_CONTEXT.currentTime + duration/1000 );

	osc.stop(AUDIO_CONTEXT.currentTime + duration/1000 );

	setTimeout(function(){
		osc.disconnect();
	},duration);
}

function failSound(){
	const duration=400;
	var osc = AUDIO_CONTEXT.createOscillator(); // Create oscillator node
	var osc2 = AUDIO_CONTEXT.createOscillator(); // Create oscillator node
	var envelope = AUDIO_CONTEXT.createGain()
		
	osc.connect(envelope)
	osc2.connect(envelope)
	
	envelope.connect(AUDIO_CONTEXT.destination)
	osc.frequency.value = 200;
	osc2.frequency.value = 300;

	osc.type = 'sine';
	osc2.type = 'sine';
	envelope.gain.setValueAtTime(0, AUDIO_CONTEXT.currentTime);
	envelope.gain.linearRampToValueAtTime(0.5, AUDIO_CONTEXT.currentTime + 0.1 );
		
	osc.start(AUDIO_CONTEXT.currentTime );
	osc2.start(AUDIO_CONTEXT.currentTime );
	
	envelope.gain.exponentialRampToValueAtTime(0.001, 
			AUDIO_CONTEXT.currentTime + duration/1000 );

	osc.stop(AUDIO_CONTEXT.currentTime + duration/1000 );
	osc2.stop(AUDIO_CONTEXT.currentTime + duration/1000 );

	setTimeout(function(){
		osc.disconnect();
		osc2.disconnect();
	},duration);
}

