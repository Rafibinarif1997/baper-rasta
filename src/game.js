(() => {
  const cashEl = document.getElementById("cash");
  const batteryEl = document.getElementById("battery");
  const missionEl = document.getElementById("mission-text");
  const workButton = document.getElementById("work-button");
  const held = { up:false, down:false, left:false, right:false };
  let cash = 50, battery = 100, nearPassenger = null;

  class CityScene extends Phaser.Scene {
    constructor(){ super("CityScene"); }
    create(){
      const W=2400,H=1800;
      this.physics.world.setBounds(0,0,W,H);
      this.cameras.main.setBounds(0,0,W,H);
      this.drawCity(W,H);
      this.add.text(70,70,"ঢাকা শহর",{fontFamily:"sans-serif",fontSize:"30px",color:"#fff3c4",stroke:"#29402d",strokeThickness:6}).setDepth(2);
      this.add.text(74,110,"পুরান ঢাকা · সকাল ৮টা",{fontFamily:"sans-serif",fontSize:"14px",color:"#ffffff"}).setDepth(2);

      this.player=this.add.container(420,420);
      const shadow=this.add.ellipse(3,13,66,34,0x18251b,.28);
      const hood=this.add.rectangle(0,0,48,64,0x159b83).setStrokeStyle(3,0x103c37);
      const seat=this.add.rectangle(0,-3,29,30,0xf2bd45).setStrokeStyle(2,0x684b20);
      const front=this.add.rectangle(0,-34,36,10,0x292f32);
      const wheel1=this.add.circle(-25,22,9,0x20272a).setStrokeStyle(3,0xb8b6a8);
      const wheel2=this.add.circle(25,22,9,0x20272a).setStrokeStyle(3,0xb8b6a8);
      const rider=this.add.circle(0,-12,10,0x8a4c2b).setStrokeStyle(2,0xf0c79b);
      this.player.add([shadow,hood,seat,front,wheel1,wheel2,rider]);
      this.physics.add.existing(this.player);
      this.player.body.setSize(38,48).setCollideWorldBounds(true);
      this.player.body.setMaxVelocity(210,210);
      this.cameras.main.startFollow(this.player,true,.09,.09);
      this.cameras.main.setZoom(1.05);

      this.passengers=[];
      [[720,430],[1120,760],[1680,420],[1890,1190],[540,1320],[1360,1450]].forEach((p,i)=>{
        const marker=this.add.container(p[0],p[1]);
        const halo=this.add.circle(0,0,22,0xf6ca57,.25);
        const person=this.add.circle(0,-3,9,0x8a4c2b).setStrokeStyle(2,0xffe0b0);
        const body=this.add.rectangle(0,12,15,19,0x386b9b).setStrokeStyle(1,0x183b55);
        const label=this.add.text(0,-34,"যাত্রী",{fontSize:"12px",color:"#fff",backgroundColor:"#17332b",padding:{x:5,y:3}}).setOrigin(.5);
        marker.add([halo,body,person,label]);
        marker.setDepth(4);
        this.passengers.push({x:p[0],y:p[1],object:marker,active:true});
      });
      this.keys=this.input.keyboard.addKeys("W,A,S,D,UP,DOWN,LEFT,RIGHT");
      this.input.keyboard.on("keydown-SPACE",()=>this.takePassenger());
      this.input.keyboard.on("keydown-ENTER",()=>this.takePassenger());
      this.updateHud();
      missionEl.textContent="হলুদ চিহ্নের কাছে যান, তারপর ‘যাত্রী নিন’ চাপুন।";
    }
    drawCity(W,H){
      const g=this.add.graphics();
      g.fillStyle(0x78966c,1);g.fillRect(0,0,W,H);
      // Main roads
      g.fillStyle(0x59615b,1);
      [300,850,1400].forEach(y=>g.fillRect(0,y,W,150));
      [360,980,1600,2150].forEach(x=>g.fillRect(x,0,130,H));
      g.lineStyle(3,0xe8dca4,.75);
      [375,925,1475].forEach(y=>{for(let x=0;x<W;x+=70)g.lineBetween(x,y,x+35,y)});
      [425,1045,1665,2215].forEach(x=>{for(let y=0;y<H;y+=70)g.lineBetween(x,y,x,y+35)});
      // Blocks and buildings
      const colors=[0xc47e56,0xd7b77b,0x9eaa91,0xb76d5b,0xe0c99b,0x7897a0];
      for(let y=35;y<H-120;y+=210){
        for(let x=30;x<W-130;x+=230){
          if((x>300&&x<510)||(y>280&&y<470))continue;
          const bx=x+((y/210)%2)*25, by=y+((x/230)%2)*18;
          g.fillStyle(0x26372d,.25);g.fillRoundedRect(bx+8,by+10,150,125,8);
          g.fillStyle(colors[Math.floor((x+y)/230)%colors.length],1);g.fillRoundedRect(bx,by,150,125,7);
          g.fillStyle(0x594b3d,1);g.fillRect(bx+60,by+72,28,53);
          g.fillStyle(0x9dd4d0,1);g.fillRect(bx+18,by+24,27,25);g.fillRect(bx+105,by+24,27,25);
          g.fillStyle(0x725b45,1);g.fillRect(bx+12,by+5,126,9);
        }
      }
      // Tea stall
      g.fillStyle(0x3a3026,1);g.fillRoundedRect(600,540,150,80,6);
      g.fillStyle(0xd64d3f,1);g.fillRect(590,525,170,18);
      this.add.text(675,565,"চায়ের দোকান",{fontSize:"15px",color:"#fff4d0",fontStyle:"bold"}).setOrigin(.5).setDepth(2);
      this.add.text(675,590,"চা ১০ টাকা",{fontSize:"11px",color:"#ffe6a0"}).setOrigin(.5).setDepth(2);
      // Garage
      g.fillStyle(0x354b50,1);g.fillRoundedRect(1080,540,165,95,6);
      g.fillStyle(0xe4b94f,1);g.fillRect(1070,525,185,18);
      this.add.text(1162,575,"রিকশা গ্যারেজ",{fontSize:"14px",color:"#fff4d0",fontStyle:"bold"}).setOrigin(.5).setDepth(2);
      // Police outpost
      g.fillStyle(0x9eb8bd,1);g.fillRoundedRect(1740,850,170,110,6);
      g.fillStyle(0x28527a,1);g.fillRect(1730,835,190,20);
      this.add.text(1825,890,"পুলিশ ফাঁড়ি",{fontSize:"15px",color:"#18334b",fontStyle:"bold"}).setOrigin(.5).setDepth(2);
      g.setDepth(0);
    }
    takePassenger(){
      if(!nearPassenger){missionEl.textContent="আগে হলুদ চিহ্নের কাছে যান, মামা!";return;}
      nearPassenger.active=false;nearPassenger.object.destroy();
      const fare=20+Math.floor(Math.random()*31);
      cash+=fare;this.updateHud();
      missionEl.textContent="ভাড়া পেয়েছেন ৳ "+fare+"! আরেকজন যাত্রী খুঁজুন।";
      nearPassenger=null;
    }
    updateHud(){
      cashEl.textContent="৳ "+cash;
      batteryEl.textContent=Math.round(battery)+"%";
    }
    update(_,delta){
      const k=this.keys, speed=150;
      const up=held.up||k.W.isDown||k.UP.isDown, down=held.down||k.S.isDown||k.DOWN.isDown;
      const left=held.left||k.A.isDown||k.LEFT.isDown, right=held.right||k.D.isDown||k.RIGHT.isDown;
      let vx=(right?1:0)-(left?1:0), vy=(down?1:0)-(up?1:0);
      const moving=vx!==0||vy!==0;
      if(moving&&battery>0){
        const len=Math.hypot(vx,vy);vx/=len;vy/=len;
        this.player.body.setVelocity(vx*speed,vy*speed);
        battery=Math.max(0,battery-delta*.0018);
      }else{
        this.player.body.setVelocity(0,0);
        battery=Math.min(100,battery+delta*.00035);
      }
      this.player.rotation=0;
      let closest=null,dist=Infinity;
      this.passengers.forEach(p=>{if(!p.active)return;const d=Phaser.Math.Distance.Between(this.player.x,this.player.y,p.x,p.y);if(d<dist){dist=d;closest=p;}});
      nearPassenger=dist<85?closest:null;
      if(nearPassenger){missionEl.textContent="যাত্রী কাছে! ‘যাত্রী নিন’ চাপুন (Space)।";}
      else if(!moving&&battery<20){missionEl.textContent="ব্যাটারি কম! একটু থামলে চার্জ বাড়বে।";}
      this.updateHud();
    }
  }

  const game=new Phaser.Game({type:Phaser.AUTO,parent:"game-container",backgroundColor:"#78966c",scale:{mode:Phaser.Scale.RESIZE,width:"100%",height:"100%"},physics:{default:"arcade",arcade:{debug:false}},scene:[CityScene],render:{antialias:false,pixelArt:true,roundPixels:true}});
  document.querySelectorAll("[data-key]").forEach(btn=>{
    const key=btn.dataset.key;
    const on=()=>held[key]=true,off=()=>held[key]=false;
    btn.addEventListener("pointerdown",e=>{e.preventDefault();btn.setPointerCapture(e.pointerId);on();});
    ["pointerup","pointercancel","lostpointercapture"].forEach(ev=>btn.addEventListener(ev,off));
  });
  workButton.addEventListener("click",()=>{const scene=game.scene.getScene("CityScene");if(scene&&scene.takePassenger)scene.takePassenger();});
  window.addEventListener("blur",()=>Object.keys(held).forEach(k=>held[k]=false));
})();