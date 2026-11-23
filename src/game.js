(() => {
  "use strict";
  const $ = id => document.getElementById(id);
  const ui = {cash:$("cash"),battery:$("battery"),day:$("day"),mission:$("mission-text"),action:$("action-button"),wanted:$("wanted"),wantedLevel:$("wanted-level"),toast:$("toast"),loading:$("loading")};
  const held={up:false,down:false,left:false,right:false};
  const SAVE_KEY="baper-rasta-local-v1";
  const bn=n=>String(Math.floor(n)).replace(/\d/g,d=>"০১২৩৪৫৬৭৮৯"[d]);
  const initial={cash:50,battery:100,day:1,food:70,family:100,wanted:0,upgrades:0,rides:0};
  let state={...initial};
  try{const saved=JSON.parse(localStorage.getItem(SAVE_KEY)||"null");if(saved)state={...initial,...saved};}catch(e){}
  let sceneRef=null, toastTimer=null;
  function save(){try{localStorage.setItem(SAVE_KEY,JSON.stringify(state));}catch(e){}}
  function toast(message){ui.toast.textContent=message;ui.toast.classList.add("show");clearTimeout(toastTimer);toastTimer=setTimeout(()=>ui.toast.classList.remove("show"),2100);}
  function setMission(message){ui.mission.textContent=message;}
  function updateHud(){
    ui.cash.textContent="৳ "+bn(state.cash);
    ui.battery.textContent=bn(state.battery)+"%";
    ui.day.textContent=bn(state.day);
    ui.wanted.hidden=state.wanted<=0;
    ui.wantedLevel.textContent="★".repeat(Math.min(5,state.wanted));
  }
  function spend(amount){if(state.cash<amount){toast("মামা, পকেটে টাকা কম!");return false;}state.cash-=amount;return true;}
  function earn(amount,reason){state.cash+=amount;state.rides++;toast(reason+" +৳ "+bn(amount));save();updateHud();}
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
    if(p.kind==="home"){const cost=60;if(spend(cost)){state.day++;state.food=Math.max(35,state.food-18);state.battery=100;state.wanted=0;if(state.cash<80)state.family=Math.max(0,state.family-18);else state.family=Math.min(100,state.family+5);save();updateHud();toast("নতুন দিন শুরু! পরিবারের খরচ ৳ ৬০।");setMission("নতুন দিন "+bn(state.day)+": আজ অন্তত ৳ ১৫০ আয় করার চেষ্টা করুন।");}}
    if(p.kind==="police"){if(state.wanted>0){const fine=Math.min(state.cash,Math.max(50,state.wanted*60));state.cash-=fine;state.wanted=0;save();updateHud();toast("জরিমানা দিয়ে থানা থেকে ছাড়া পেলেন। ৳ "+bn(fine));}else toast("কোনো অভিযোগ নেই। সাবধানে রিকশা চালান!");}
  }
  class CityScene extends Phaser.Scene{
    constructor(){super("City");this.points=[];this.speed=155;this.lastWanted=0;}
    create(){
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
      [[850,930],[1600,1120],[420,1770]].forEach((v,i)=>{const car=this.add.rectangle(v[0],v[1],52,30,[0x4d80a0,0xc35c4e,0xd6b04c][i]).setStrokeStyle(3,0x26393a);car.setDepth(3);this.traffic.push({obj:car,dx:i%2?1:-1});});
      this.lastHud=0;ui.loading.style.display="none";
      setMission("হলুদ চিহ্নের কাছে গিয়ে যাত্রী তুলুন। E / SPACE চাপুন।");updateHud();
    }
    drawMap(W,H){
      const g=this.add.graphics();g.fillStyle(0x819a70,1);g.fillRect(0,0,W,H);
      g.fillStyle(0x59625c,1);[330,900,1470].forEach(y=>g.fillRect(0,y,W,150));[380,1040,1710,2300].forEach(x=>g.fillRect(x,0,135,H));
      g.lineStyle(3,0xe7dba9,.8);[405,975,1545].forEach(y=>{for(let x=0;x<W;x+=75)g.lineBetween(x,y,x+35,y)});[447,1107,1777,2367].forEach(x=>{for(let y=0;y<H;y+=75)g.lineBetween(x,y,x,y+35)});
      const colors=[0xc47d57,0xd8b77c,0xa4ad91,0xb76d5b,0xe2c99b,0x7898a0,0x9b829d];
      for(let y=25;y<H-130;y+=215)for(let x=20;x<W-150;x+=230){
        if((x>330&&x<540)||(y>300&&y<510))continue;
        const bx=x+((Math.floor(y/215)%2)*22),by=y+((Math.floor(x/230)%2)*16),c=colors[(Math.floor(x/230)+Math.floor(y/215))%colors.length];
        g.fillStyle(0x25342c,.25);g.fillRoundedRect(bx+8,by+10,154,128,8);g.fillStyle(c,1);g.fillRoundedRect(bx,by,154,128,7);
        g.fillStyle(0x594a3d,1);g.fillRect(bx+63,by+75,28,53);g.fillStyle(0x9ed1ce,1);g.fillRect(bx+18,by+24,28,25);g.fillRect(bx+108,by+24,28,25);g.fillStyle(0x725b45,1);g.fillRect(bx+12,by+5,130,9);
      }
      g.setDepth(0);
      for(let i=0;i<18;i++){const x=80+(i*137)%2400,y=160+(i*251)%1780;const tree=this.add.container(x,y);tree.add([this.add.ellipse(2,18,42,15,0x263d29,.25),this.add.circle(0,0,19,0x426d43),this.add.circle(-10,-8,12,0x5c884c),this.add.rectangle(0,17,7,20,0x725338)]);tree.setDepth(1);}
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
      c.add([this.add.ellipse(3,20,76,34,0x1b2a20,.32),this.add.circle(-27,19,11,0x202729).setStrokeStyle(4,0xc7c3b5),this.add.circle(27,19,11,0x202729).setStrokeStyle(4,0xc7c3b5),this.add.rectangle(0,2,49,48,0x15977e).setStrokeStyle(3,0x104c43),this.add.rectangle(0,-12,43,24,0xf0bd4c).setStrokeStyle(3,0x6c4a20),this.add.rectangle(0,-34,52,8,0x293439),this.add.circle(0,-21,9,0x8b4f30).setStrokeStyle(2,0xf2c99d),this.add.rectangle(0,-2,7,18,0x293439)]);c.setDepth(5);
    }
    drawPolice(c){c.add([this.add.circle(0,0,19,0x315e9b).setStrokeStyle(3,0x182f4c),this.add.circle(0,-4,8,0x9b5a39),this.add.rectangle(0,-15,18,5,0x1d2b38)]);c.setDepth(6);}
    update(time,delta){
      const k=this.keys,up=held.up||k.W.isDown||k.UP.isDown,down=held.down||k.S.isDown||k.DOWN.isDown,left=held.left||k.A.isDown||k.LEFT.isDown,right=held.right||k.D.isDown||k.RIGHT.isDown;
      let vx=(right?1:0)-(left?1:0),vy=(down?1:0)-(up?1:0),moving=vx!==0||vy!==0;
      if(moving&&state.battery>0){const l=Math.hypot(vx,vy);vx/=l;vy/=l;this.player.body.setVelocity(vx*this.speed,vy*this.speed);state.battery=Math.max(0,state.battery-delta*(.0013+this.speed*.000003));this.player.rotation=Math.atan2(vy,vx)+Math.PI/2;}
      else{this.player.body.setVelocity(0,0);state.battery=Math.min(100,state.battery+delta*.00025);}
      this.traffic.forEach(t=>{t.obj.x+=t.dx*delta*.035;if(t.obj.x>2500)t.obj.x=80;if(t.obj.x<50)t.obj.x=2480;});
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
  game.scene.getScene("City").events.once("create",function(){sceneRef=this;});
  updateHud();
})();