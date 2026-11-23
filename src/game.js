(() => {
  "use strict";
  const $ = id => document.getElementById(id);
  const ui = {cash:$("cash"),battery:$("battery"),day:$("day"),food:$("food"),family:$("family"),mission:$("mission-text"),action:$("action-button"),wanted:$("wanted"),wantedLevel:$("wanted-level"),toast:$("toast"),loading:$("loading")};
  const held={up:false,down:false,left:false,right:false};
  const SAVE_KEY="baper-rasta-local-v1";
  const bn=n=>String(Math.floor(n)).replace(/\d/g,d=>"০১২৩৪৫৬৭৮৯"[d]);
  const initial={cash:50,battery:100,day:1,food:70,family:100,wanted:0,upgrades:0,rides:0,dailyIncome:0};
  let state={...initial};
  try{const saved=JSON.parse(localStorage.getItem(SAVE_KEY)||"null");if(saved)state={...initial,...saved};}catch(e){}
  let sceneRef=null, toastTimer=null;
  function save(){try{localStorage.setItem(SAVE_KEY,JSON.stringify(state));}catch(e){}}
  function toast(message){ui.toast.textContent=message;ui.toast.classList.add("show");clearTimeout(toastTimer);toastTimer=setTimeout(()=>ui.toast.classList.remove("show"),2100);}
  function setMission(message){ui.mission.textContent=message;}
  function updateHud(){
    ui.cash.textContent="৳ "+bn(state.cash);
    ui.battery.textContent=bn(state.battery)+"%";
    ui.day.textContent=bn(state.day);ui.food.textContent=bn(state.food)+"%";ui.family.textContent=bn(state.family)+"%";
    ui.wanted.hidden=state.wanted<=0;
    ui.wantedLevel.textContent="★".repeat(Math.min(5,state.wanted));
  }
  function spend(amount){if(state.cash<amount){toast("মামা, পকেটে টাকা কম!");return false;}state.cash-=amount;return true;}
  function earn(amount,reason){state.cash+=amount;state.rides++;state.dailyIncome=(state.dailyIncome||0)+amount;toast(reason+" +৳ "+bn(amount));save();updateHud();}
  function nearbyAction(){if(!sceneRef||!sceneRef.player)return null;let best=null,dist=Infinity;
    sceneRef.points.forEach(p=>{if(!p.active)return;const d=Phaser.Math.Distance.Between(sceneRef.player.x,sceneRef.player.y,p.x,p.y);if(d<dist){best=p;dist=d;}});
    return dist<105?best:null;
  }
  function interact(){
    if(!sceneRef)return;
    const p=nearbyAction();
    if(!p){setMission("কাছাকাছি কোনো জায়গা নেই। হলুদ চিহ্ন বা যাত্রীর কাছে যান।");return;}
    if(p.kind==="passenger"){p.active=false;p.object.destroy();sceneRef.points=sceneRef.points.filter(x=>x!==p);const fare=25+Math.floor(Math.random()*36)+state.upgrades*5;earn(fare,"ভাড়া পেয়েছেন");setMission("ভালো কামাই হয়েছে! পরের যাত্রী খুঁজুন।");}
    if(p.kind==="tea"){if(spend(10)){state.food=Math.min(100,state.food+8);state.family=Math.min(100,state.family+2);toast("এক কাপ চা খেলেন। খরচ ৳ ১০");save();updateHud();}}
    if(p.kind==="hotel"){if(spend(35)){state.food=Math.min(100,state.food+35);state.family=Math.min(100,state.family+4);toast("ভাত-তরকারি খেয়ে শক্তি ফিরে পেলেন!");save();updateHud();}}
    if(p.kind==="garage"){const price=100+state.upgrades*100;if(spend(price)){state.upgrades++;state.battery=100;sceneRef.speed=155+state.upgrades*22;toast("রিকশা আপগ্রেড সম্পন্ন! নতুন স্পিড "+bn(sceneRef.speed));save();updateHud();}}
    if(p.kind==="home"){const cost=60;if(spend(cost)){state.day++;state.food=Math.max(35,state.food-18);state.battery=100;state.wanted=0;if((state.dailyIncome||0)<150)state.family=Math.max(0,state.family-18);else state.family=Math.min(100,state.family+5);state.dailyIncome=0;save();updateHud();toast("নতুন দিন শুরু! পরিবারের খরচ ৳ ৬০।");setMission("নতুন দিন "+bn(state.day)+": আজ অন্তত ৳ ১৫০ আয় করার চেষ্টা করুন।");}}
    if(p.kind==="police"){if(state.wanted>0){const fine=Math.min(state.cash,Math.max(50,state.wanted*60));state.cash-=fine;state.wanted=0;save();updateHud();toast("জরিমানা দিয়ে থানা থেকে ছাড়া পেলেন। ৳ "+bn(fine));}else toast("কোনো অভিযোগ নেই। সাবধানে রিকশা চালান!");}
  }
  class CityScene extends Phaser.Scene{
    constructor(){super("City");this.points=[];this.speed=155;this.lastWanted=0;}
    create(){
      sceneRef=this;
      const W=2600,H=2100;this.physics.world.setBounds(0,0,W,H);this.cameras.main.setBounds(0,0,W,H);
      this.drawMap(W,H);this.addLandmarks();
      this.player=this.add.container(500,480);this.drawRickshaw(this.player);
      this.physics.add.existing(this.player);this.player.body.setSize(43,55).setCollideWorldBounds(true);this.player.body.setMaxVelocity(250,250);
      this.cameras.main.startFollow(this.player,true,.10,.10);this.cameras.main.setZoom(Math.min(1.15,Math.max(.78,this.scale.width/850)));
      this.keys=this.input.keyboard.addKeys("W,A,S,D,UP,DOWN,LEFT,RIGHT,SPACE,E");
      this.input.keyboard.on("keydown-SPACE",interact);this.input.keyboard.on("keydown-E",interact);
      this.passengerLocations=[[780,460],[1220,820],[1820,500],[2050,1420],[600,1540],[1450,1740],[2300,920],[950,1120]];
      this.passengerLocations.forEach((v,i)=>this.addPoint(v[0],v[1],"passenger","যাত্রী",0xf3c451));
      this.police=this.add.container(1900,900);this.drawPolice(this.police);this.police.setVisible(false);this.physics.add.existing(this.police);this.police.body.setCircle(20);this.police.body.setEnable(false);
      this.traffic=[];
      [[850,930],[1600,1120],[420,1770],[1950,330],[1300,1470]].forEach((v,i)=>{
        const car=this.add.container(v[0],v[1]);
        car.add([this.add.ellipse(0,13,72,24,0x202522,.35),
          this.add.rectangle(0,0,62,30,[0x477b91,0xa94e42,0xc39b42,0x47705b,0xb7b4a8][i]).setStrokeStyle(2,0x29332f),
          this.add.rectangle(0,-1,29,24,0x263d45),this.add.rectangle(0,-1,22,18,0x8daeb0),
          this.add.rectangle(-27,-9,5,8,0xf3e5b5),this.add.rectangle(27,-9,5,8,0xf3e5b5),
          this.add.rectangle(-27,10,5,7,0xc64a3d),this.add.rectangle(27,10,5,7,0xc64a3d),
          this.add.rectangle(-19,-16,13,5,0x202523),this.add.rectangle(19,-16,13,5,0x202523),
          this.add.rectangle(-19,16,13,5,0x202523),this.add.rectangle(19,16,13,5,0x202523)]);
        car.setDepth(4);this.traffic.push({obj:car,dx:i%2?1:-1,base:v[1],vertical:i===3});
      });
      this.pedestrians=[];
      [[260,280],[590,510],[850,850],[1250,880],[1500,1380],[2050,1520],[700,1640],[2200,760],[1120,280],[1830,1190]].forEach((v,i)=>this.addPedestrian(v[0],v[1],i));
      this.lastHud=0;this.lastCrash=0;ui.loading.style.display="none";
      setMission("হলুদ চিহ্নের কাছে গিয়ে যাত্রী তুলুন। E / SPACE চাপুন।");updateHud();
    }
    drawMap(W,H){
      const g=this.add.graphics();
      // Dusty earth, drainage edges and worn asphalt
      g.fillStyle(0x777b68,1);g.fillRect(0,0,W,H);
      for(let i=0;i<1900;i++){const x=(i*97)%W,y=(i*193)%H;g.fillStyle(i%3?0x92907a:0x626b5c,.18);g.fillCircle(x,y,1+(i%3));}
      const roadsY=[330,900,1470],roadsX=[380,1040,1710,2300];
      roadsY.forEach(y=>{
        g.fillStyle(0x4b504e,1);g.fillRect(0,y,W,150);
        g.fillStyle(0x686b63,1);g.fillRect(0,y,W,7);g.fillRect(0,y+143,W,7);
        g.fillStyle(0x3c4240,1);g.fillRect(0,y+12,W,126);
        g.lineStyle(2,0xc2b78e,.5);for(let x=0;x<W;x+=110)g.lineBetween(x,y+75,x+48,y+75);
        g.lineStyle(2,0x9a9a85,.35);g.lineBetween(0,y+10,W,y+10);g.lineBetween(0,y+140,W,y+140);
      });
      roadsX.forEach(x=>{
        g.fillStyle(0x4b504e,1);g.fillRect(x,0,135,H);g.fillStyle(0x3c4240,1);g.fillRect(x+8,0,119,H);
        g.lineStyle(2,0xc2b78e,.45);for(let y=0;y<H;y+=110)g.lineBetween(x+67,y,x+67,y+48);
        g.lineStyle(2,0x9a9a85,.35);g.lineBetween(x+5,0,x+5,H);g.lineBetween(x+130,0,x+130,H);
      });
      // Footpaths, drains and irregular alleys
      roadsY.forEach(y=>{g.fillStyle(0xb0a48a,1);g.fillRect(0,y-15,W,14);g.fillRect(0,y+151,W,14);g.lineStyle(2,0x454c47,.6);g.lineBetween(0,y-1,W,y-1);g.lineBetween(0,y+151,W,y+151);});
      roadsX.forEach(x=>{g.fillStyle(0xb0a48a,1);g.fillRect(x-15,0,14,H);g.fillRect(x+136,0,14,H);});
      // Dense old Dhaka buildings with roofs, balconies, windows and shadows
      const walls=[0xb77c62,0xc5aa83,0x9caa98,0xb98b75,0xd0bd98,0x84989b,0xa68c9f,0xc4a16e];
      let seed=41;const rnd=()=>{seed=(seed*9301+49297)%233280;return seed/233280;};
      for(let y=22;y<H-120;y+=185)for(let x=18;x<W-130;x+=194){
        if((x>290&&x<560&&y>260&&y<560)||(x>380&&x<535&&y>1120&&y<1370))continue;
        const bx=x+Math.floor(rnd()*24),by=y+Math.floor(rnd()*18),w=125+Math.floor(rnd()*44),h=112+Math.floor(rnd()*45),wall=walls[Math.floor(rnd()*walls.length)];
        g.fillStyle(0x202923,.36);g.fillRoundedRect(bx+9,by+13,w,h,4);
        g.fillStyle(0x343d39,1);g.fillRect(bx-5,by-8,w+10,13);
        g.fillStyle(wall,1);g.fillRect(bx,by,w,h);
        g.fillStyle(0x786b58,.8);g.fillRect(bx+5,by+5,w-10,5);
        // roof tin patches and water tanks
        g.fillStyle(0x65716e,1);g.fillRect(bx+8,by+10,w-16,8);
        if(rnd()>.45){g.fillStyle(0x6d7772,1);g.fillRect(bx+w-35,by+15,24,20);g.fillStyle(0x9ca8a0,1);g.fillRect(bx+w-33,by+12,20,4);}
        // window rows
        const rows=Math.max(2,Math.floor((h-28)/31));
        for(let r=0;r<rows;r++)for(let c=0;c<3;c++){
          const wx=bx+13+c*((w-42)/3),wy=by+25+r*31;
          g.fillStyle(0x514f47,1);g.fillRect(wx-2,wy-2,25,19);
          g.fillStyle(rnd()>.18?0x78999a:0x453f36,1);g.fillRect(wx,wy,21,15);
          g.lineStyle(2,0xddd0b1,.8);g.lineBetween(wx+10,wy,wx+10,wy+15);
          if(rnd()>.55){g.fillStyle(0x5b5e50,1);g.fillRect(wx-3,wy+16,27,3);}
        }
        // doorway and signboard
        g.fillStyle(0x514237,1);g.fillRect(bx+w/2-12,by+h-35,24,35);
        g.fillStyle(0xe0c16d,1);g.fillRect(bx+8,by+h-19,w-16,8);
        g.fillStyle(0x6c5441,1);g.fillRect(bx+10,by+h-18,w-20,2);
      }
      // roadside stalls, drain covers and street lamps
      for(let i=0;i<28;i++){const x=55+(i*173)%2450,y=250+(i*311)%1700;g.fillStyle(0x343d39,.8);g.fillRect(x,y,20,5);g.fillStyle(0x8d8771,.8);g.fillRect(x+3,y+2,14,2);}
      for(let i=0;i<24;i++){const x=70+(i*211)%2450,y=180+(i*277)%1750;const lamp=this.add.container(x,y);lamp.add([this.add.ellipse(0,9,18,7,0x222923,.25),this.add.rectangle(0,-3,3,28,0x444b45),this.add.rectangle(0,-18,16,5,0xd2c28e)]);lamp.setDepth(2);}
      for(let i=0;i<34;i++){const x=60+(i*137)%2460,y=150+(i*251)%1800;if([330,900,1470].some(r=>Math.abs(y-r)<95)||[380,1040,1710,2300].some(r=>Math.abs(x-r)<95))continue;const tree=this.add.container(x,y);tree.add([this.add.ellipse(2,18,42,15,0x263d29,.3),this.add.rectangle(0,15,8,22,0x725338),this.add.circle(0,0,20,0x315b3b),this.add.circle(-10,-7,12,0x477447),this.add.circle(10,-5,11,0x3c6a40)]);tree.setDepth(2);}
    }
    addLandmarks(){
      this.shop(650,560,160,88,0xd84f40,"চায়ের দোকান","চা · ৳ ১০","tea");
      this.shop(1150,560,180,100,0x365a68,"ভাতের হোটেল","ভাত · ৳ ৩৫","hotel");
      this.shop(1740,850,180,110,0x2d6280,"পুলিশ ফাঁড়ি","থানা","police");
      this.shop(1110,1210,190,105,0xdda83d,"রিকশা গ্যারেজ","আপগ্রেড","garage");
      this.shop(440,1240,180,110,0x9b644d,"মামার বাসা","বাড়ি","home");
      this.add.text(515,1190,"বস্তি এলাকা",{fontFamily:"Hind Siliguri",fontSize:"20px",color:"#fff1c8",stroke:"#31402b",strokeThickness:5}).setDepth(2);
    }
    shop(x,y,w,h,color,title,sub,kind){
      const c=this.add.container(x,y);c.add([this.add.ellipse(4,h/2+9,w+12,18,0x26372a,.25),this.add.rectangle(0,0,w,h,color).setStrokeStyle(4,0x293a35),this.add.rectangle(0,-h/2+10,w+16,18,0x493e31),this.add.rectangle(0,10,25,45,0x624934),this.add.text(0,-15,title,{fontFamily:"Hind Siliguri",fontSize:"17px",fontStyle:"bold",color:"#fff7df",stroke:"#293a35",strokeThickness:3}).setOrigin(.5),this.add.text(0,29,sub,{fontFamily:"Hind Siliguri",fontSize:"12px",color:"#fff1c8"}).setOrigin(.5)]);c.setDepth(2);
      this.addPoint(x,y+75,kind,title,color);
    }
    addPoint(x,y,kind,label,color){
      const o=this.add.container(x,y);o.add([this.add.circle(0,0,24,color,.20),this.add.circle(0,0,12,color).setStrokeStyle(3,0xffffff),this.add.text(0,-38,label,{fontFamily:"Hind Siliguri",fontSize:"13px",fontStyle:"bold",color:"#fff",stroke:"#20322b",strokeThickness:4}).setOrigin(.5)]);o.setDepth(4);this.points.push({x,y,kind,label,object:o,active:true});
    }
    drawRickshaw(c){
      // Detailed Bangladeshi pedal rickshaw: steel frame, passenger hood, seat and spokes
      c.add([this.add.ellipse(2,25,92,37,0x17211d,.34),
        this.add.circle(-31,22,13,0x202426).setStrokeStyle(4,0xb8b8ad),this.add.circle(31,22,13,0x202426).setStrokeStyle(4,0xb8b8ad),
        this.add.circle(-31,22,5,0x858b83),this.add.circle(31,22,5,0x858b83),
        this.add.line(-31,22,0,-2,0xc4bda7).setLineWidth(3),this.add.line(31,22,0,-2,0xc4bda7).setLineWidth(3),
        this.add.rectangle(0,5,53,42,0x147a68).setStrokeStyle(3,0x243c36),
        this.add.rectangle(0,-15,49,28,0xd7a83e).setStrokeStyle(3,0x654d27),
        this.add.rectangle(0,-31,58,8,0x253a39),this.add.rectangle(-24,-23,5,24,0x263d3b),this.add.rectangle(24,-23,5,24,0x263d3b),
        this.add.triangle(0,-48,-29,-30,29,-30,0,-65,0xc84d43).setStrokeStyle(2,0x713b32),
        this.add.triangle(0,-43,-24,-31,24,-31,0,-57,0xe6b74e),
        this.add.circle(0,-19,9,0x8d5339).setStrokeStyle(2,0xe3b88d),
        this.add.rectangle(0,-4,8,17,0x273b39),this.add.rectangle(-5,15,18,4,0x303c3a),
        this.add.rectangle(0,0,2,50,0xd7c58b,.7)]);
      c.setDepth(5);
    }
    addPedestrian(x,y,i){
      const palette=[0x3e7180,0xb56b43,0x56734c,0x8b6387,0xb49a55,0x557e83];
      const p=this.add.container(x,y);
      p.add([this.add.ellipse(1,12,18,8,0x20251f,.25),this.add.rectangle(0,5,10,13,palette[i%palette.length]).setStrokeStyle(1,0x3a3b32),this.add.circle(0,-5,5,0x986746),this.add.arc(0,-7,6,Math.PI,Math.PI*2,false,0x292c29).setStrokeStyle(2,0x292c29),this.add.rectangle(-3,14,3,8,0x393c39),this.add.rectangle(3,14,3,8,0x393c39)]);
      p.setDepth(5);this.pedestrians.push({obj:p,originX:x,originY:y,phase:i*1.7,dir:i%2?1:-1});
    }
    drawPolice(c){c.add([this.add.circle(0,0,19,0x315e9b).setStrokeStyle(3,0x182f4c),this.add.circle(0,-4,8,0x9b5a39),this.add.rectangle(0,-15,18,5,0x1d2b38)]);c.setDepth(6);}
    update(time,delta){
      const k=this.keys,up=held.up||k.W.isDown||k.UP.isDown,down=held.down||k.S.isDown||k.DOWN.isDown,left=held.left||k.A.isDown||k.LEFT.isDown,right=held.right||k.D.isDown||k.RIGHT.isDown;
      let vx=(right?1:0)-(left?1:0),vy=(down?1:0)-(up?1:0),moving=vx!==0||vy!==0;
      if(moving&&state.battery>0){const l=Math.hypot(vx,vy);vx/=l;vy/=l;state.food=Math.max(0,state.food-delta*.00012);const hungerPenalty=state.food<15?0.72:1;this.player.body.setVelocity(vx*this.speed*hungerPenalty,vy*this.speed*hungerPenalty);state.battery=Math.max(0,state.battery-delta*(.0013+this.speed*.000003));this.player.rotation=Math.atan2(vy,vx)+Math.PI/2;}
      else{this.player.body.setVelocity(0,0);state.battery=Math.min(100,state.battery+delta*.00025);}
      this.traffic.forEach(t=>{
        if(t.vertical){t.obj.y+=t.dx*delta*.025;if(t.obj.y>1980)t.obj.y=100;if(t.obj.y<80)t.obj.y=1970;}
        else{t.obj.x+=t.dx*delta*.035;if(t.obj.x>2500)t.obj.x=80;if(t.obj.x<50)t.obj.x=2480;}
        const hit=Phaser.Math.Distance.Between(this.player.x,this.player.y,t.obj.x,t.obj.y)<43;
        if(hit&&moving&&time-this.lastCrash>3500){this.lastCrash=time;state.wanted=Math.min(5,state.wanted+1);state.family=Math.max(0,state.family-2);this.player.body.setVelocity(-vx*90,-vy*90);toast("দুর্ঘটনা! গাড়ির ক্ষতি হয়েছে—পুলিশের নজরে পড়েছেন।");this.cameras.main.shake(220,.004);save();updateHud();}
      });
      this.pedestrians.forEach(p=>{
        p.phase+=delta*.001;
        p.obj.x=p.originX+Math.sin(p.phase)*23*p.dir;
        p.obj.y=p.originY+Math.cos(p.phase*.7)*9;
        const near=Phaser.Math.Distance.Between(this.player.x,this.player.y,p.obj.x,p.obj.y);
        if(near<25&&moving&&time-this.lastCrash>3000){this.lastCrash=time;state.wanted=Math.min(5,state.wanted+1);state.family=Math.max(0,state.family-3);this.player.body.setVelocity(-vx*70,-vy*70);toast("পথচারীর সঙ্গে ধাক্কা! পুলিশি ঝামেলা হতে পারে।");this.cameras.main.shake(240,.004);save();updateHud();}
      });
      const p=nearbyAction();if(p)ui.action.textContent=p.kind==="passenger"?"যাত্রী নিন":p.kind==="garage"?"রিকশা আপগ্রেড":p.kind==="home"?"বাসায় যান":p.kind==="police"?"থানায় কথা বলুন":p.kind==="tea"?"চা খান":"ভাত খান";else ui.action.textContent="কাজ করুন";
      if(state.wanted>0){this.police.setVisible(true);this.police.body.setEnable(true);const angle=Phaser.Math.Angle.Between(this.police.x,this.police.y,this.player.x,this.player.y);this.physics.moveToObject(this.police,this.player,70+state.wanted*13);if(Phaser.Math.Distance.Between(this.police.x,this.police.y,this.player.x,this.player.y)<42){const fine=Math.min(state.cash,Math.max(50,state.wanted*60));state.cash-=fine;state.wanted=0;this.police.body.setVelocity(0,0);this.police.setPosition(1900,900);toast("পুলিশ ধরেছে! জরিমানা ৳ "+bn(fine));save();updateHud();}else if(time-this.lastWanted>45000){state.wanted=Math.max(0,state.wanted-1);this.lastWanted=time;}}
      else{this.police.setVisible(false);this.police.body.setEnable(false);}
      if(time-this.lastHud>700){updateHud();save();this.lastHud=time;}
    }
  }
  const config={type:Phaser.AUTO,parent:"game-container",backgroundColor:"#819a70",scale:{mode:Phaser.Scale.RESIZE,width:"100%",height:"100%"},physics:{default:"arcade",arcade:{debug:false}},render:{antialias:false,pixelArt:true,roundPixels:true},scene:[CityScene]};
  const game=new Phaser.Game(config);
  ui.action.addEventListener("click",interact);
  $("horn-button").addEventListener("click",()=>{if(sceneRef){toast("পোঁ পোঁ! রাস্তা ছাড়েন মামা!");sceneRef.cameras.main.shake(65,.0015);}});
  $("reset-button").addEventListener("click",()=>{if(confirm("সব অগ্রগতি মুছে নতুন করে শুরু করবেন?")){localStorage.removeItem(SAVE_KEY);location.reload();}});
  document.querySelectorAll("[data-key]").forEach(btn=>{const key=btn.dataset.key;btn.addEventListener("pointerdown",e=>{e.preventDefault();btn.setPointerCapture(e.pointerId);held[key]=true;});["pointerup","pointercancel","lostpointercapture"].forEach(ev=>btn.addEventListener(ev,()=>held[key]=false));});
  window.addEventListener("blur",()=>Object.keys(held).forEach(k=>held[k]=false));
  game.events.on("ready",()=>{});
  game.scene.start("City");
  game.events.on("step",()=>{});
  updateHud();
})();