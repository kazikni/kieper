import { LivingEntity } from "../abstract_objects/living_entity.ts";
import { GameObject } from "./gameObject.ts";
import { UpdatePacket } from "common/scripts/net/update_packet.ts"
import { ClientGame, AxisActionEvent, WebglRenderer, Client, ConnectPacket, Color, ColorM, Key, v2m, Vec2, v2, ActionEvent, Numeric, HideElement, ShowElement, BasicSocket, DisconnectPacket, MouseEvents, isMobile} from "common/engine/client.ts"
import { JoinPacket } from "common/scripts/net/join_packet.ts";
import { GameColors } from "common/scripts/config/constants.ts";
import { Player } from "../abstract_objects/player.ts";
import { Shape } from "../abstract_objects/shape.ts";
import { InputPacket } from "common/scripts/net/input_packet.ts";
import { JoinnedPacket } from "common/scripts/net/joinned_packet.ts";
import { Bullet } from "../abstract_objects/bullet.ts";
import { ConfigCasters, ConfigDefaultActions, ConfigDefaultValues } from "./config.ts";
import { AttributesManager } from "../ui/attributes.ts";
import { EvolutionsManager } from "../ui/evolutions.ts";
import { ScoreManager } from "../ui/score.ts";
import { SetSpectationPacket } from "common/scripts/net/set_spectation.ts";
import { PacketManager } from "common/scripts/net/packets_manager.ts"
import { MobileManager } from "../ui/mobile.ts";
const Themes:Record<string,Record<GameColors,Color>>={
    normal:{
        [GameColors.Blue]:ColorM.number(0x2288ff),
        [GameColors.Red]:ColorM.number(0xe81d26),
        [GameColors.Green]:ColorM.number(0x22ff33),
        [GameColors.Yellow]:ColorM.number(0xffff0d),

        [GameColors.Barrel]:ColorM.number(0x555555),

        [GameColors.Shiny]:ColorM.number(0x22ff75),
        [GameColors.Mythical]:ColorM.number(0xffff0d),
        [GameColors.Legendary]:ColorM.number(0xe81d26),
        [GameColors.BlackShape]:ColorM.number(0x000000),

        [GameColors.Egg]:ColorM.number(0xbbbbbb),
        [GameColors.Triangle]:ColorM.number(0xfccb0d),
        [GameColors.Square]:ColorM.number(0xec5632),
        [GameColors.Pentagon]:ColorM.number(0x4c22d5),
        [GameColors.Hexagon]:ColorM.number(0x2275aa),

        [GameColors.Guardian]:ColorM.number(0xFF00E1),
        [GameColors.OriginalBoss]:ColorM.number(0x666666),

        [GameColors.Grid]:ColorM.rgba(0,0,0,10),
        [GameColors.Background]:ColorM.rgba(190,190,200),

        [GameColors.Text]:ColorM.number(0x444444),
        [GameColors.HealthBarBackground]:ColorM.number(0x5f5f5f),
        [GameColors.HealthBar]:ColorM.number(0x22ff75),
    },
    dark:{
        [GameColors.Blue]:ColorM.number(0x2288ff),
        [GameColors.Red]:ColorM.number(0xe81d26),
        [GameColors.Green]:ColorM.number(0x22ff33),
        [GameColors.Yellow]:ColorM.number(0xffff0d),

        [GameColors.Barrel]:ColorM.number(0x555555),

        [GameColors.Shiny]:ColorM.number(0x22ff75),
        [GameColors.Mythical]:ColorM.number(0xffff00),
        [GameColors.Legendary]:ColorM.number(0xe81d26),
        [GameColors.BlackShape]:ColorM.number(0x000000),

        [GameColors.Egg]:ColorM.number(0xbbbbbb),
        [GameColors.Triangle]:ColorM.number(0xfccb0d),
        [GameColors.Square]:ColorM.number(0xec5632),
        [GameColors.Pentagon]:ColorM.number(0x4c22d5),
        [GameColors.Hexagon]:ColorM.number(0x2275aa),

        [GameColors.Guardian]:ColorM.number(0xFF00E1),
        [GameColors.OriginalBoss]:ColorM.number(0x444444),

        [GameColors.Grid]:ColorM.rgba(255, 255, 255,10),
        [GameColors.Background]:ColorM.rgba(10,10,10),

        [GameColors.Text]:ColorM.number(0x444444),
        [GameColors.HealthBarBackground]:ColorM.number(0x5f5f5f),
        [GameColors.HealthBar]:ColorM.number(0x22ff75),
    },
    classic:{
        [GameColors.Blue]:ColorM.number(0x00b2e1),
        [GameColors.Red]:ColorM.number(0xf14e54),
        [GameColors.Green]:ColorM.number(0x22ff33),
        [GameColors.Yellow]:ColorM.number(0xffff0d),

        [GameColors.Barrel]:ColorM.number(0x999999),

        [GameColors.Shiny]:ColorM.number(0x22ff75),
        [GameColors.Mythical]:ColorM.number(0xfccb0d),
        [GameColors.Legendary]:ColorM.number(0xe81d26),
        [GameColors.BlackShape]:ColorM.number(0x000000),

        [GameColors.Egg]:ColorM.number(0xbbbbbb),
        [GameColors.Triangle]:ColorM.number(0xfccb0d),
        [GameColors.Square]:ColorM.number(0xec5632),
        [GameColors.Pentagon]:ColorM.number(0x4c22d5),
        [GameColors.Hexagon]:ColorM.number(0x2275aa),

        [GameColors.Guardian]:ColorM.number(0xFF00E1),
        [GameColors.OriginalBoss]:ColorM.number(0x444444),

        [GameColors.Grid]:ColorM.rgba(0, 0, 0,10),
        [GameColors.Background]:ColorM.rgba(204,204,204),

        [GameColors.Text]:ColorM.number(0x444444),
        [GameColors.HealthBarBackground]:ColorM.number(0x5f5f5f),
        [GameColors.HealthBar]:ColorM.number(0x22ff75),
    }
}
export class Game extends ClientGame<GameObject>{
    global_line_width:number

    client?:Client

    neon_border:boolean=false
    colors:Record<GameColors,Color>=Themes.normal

    input:InputPacket=new InputPacket()

    has_active_entity:boolean=false
    spectating:boolean=false
    active_entity?:LivingEntity
    active_entity_id?:number
    active_entity_layer?:number

    menu=document.querySelector("#menu") as HTMLDivElement
    ui=document.querySelector("#ui") as HTMLDivElement

    map_size:Vec2=v2.new(100,100)
    map_center:Vec2=v2.new(50,50)
    map_center_pos:Vec2=v2.new(50,50)
    map_center_angle=0

    fps:number=0
    fps_view=document.querySelector("#fps-view") as HTMLSpanElement
    constructor(
        canvas:HTMLCanvasElement,
        objects:Array<new ()=>GameObject>=[]
    ){
        super(
            new WebglRenderer(canvas),
            [...objects,LivingEntity,Player,Shape,Bullet]
        )
        this.global_line_width=0.3

        this.renderer.background=this.colors[GameColors.Background]

        this.set_meter_size(10)

        this.save.default_actions=ConfigDefaultActions
        this.save.default_values=ConfigDefaultValues
        this.save.casters=ConfigCasters
        this.save.init("kieperio")

        this.ui_manager.add(new AttributesManager())
        this.ui_manager.add(new EvolutionsManager())
        this.ui_manager.add(new ScoreManager())
        this.ui_manager.add(new MobileManager())

        this.ui_manager.init()
    }
    border_color(color: Color): Color {
        const hsv = ColorM.rgb2hsv(color)

        const darkness = 1 - hsv.v

        const targetHue = 260

        const h = Numeric.lerp(hsv.h, targetHue, darkness * 0.6)

        const s = Numeric.clamp(hsv.s * (1 + darkness * 0.3), 0, 1)
        const v = Numeric.clamp(hsv.v * 0.4, 0, 1)

        return ColorM.hsv(h, s, v, hsv.a)
    }

    listeners_init(){
        this.input_manager.add_axis("movement",
            {
                keys:[Key.W],
                buttons:[]
            },
            {
                keys:[Key.S],
                buttons:[]
            },
            {
                keys:[Key.A],
                buttons:[]
            },
            {
                keys:[Key.D],
                buttons:[]
            }
        )
        this.input_manager.on("axis",(a:AxisActionEvent)=>{
            if(a.action==="movement"){
                this.input.movement=a.value
            }
        })
        this.input_manager.on("actiondown",(e:ActionEvent)=>{
            switch(e.action){
                case "fire":
                    this.input.firing=true
                    break
            }
            this.ui_manager.signal("action",e.action)
        })
        this.input_manager.on("actionup",(e:ActionEvent)=>{
            switch(e.action){
                case "fire":
                    this.input.firing=false
                    break
            }
        })
        this.input_manager.mouse.listener.on(MouseEvents.MouseMove,()=>{
            if(isMobile){
                //console.log()
            }else{
                const cam_c=v2.new(this.cam2d.width/2,this.cam2d.height/2)
                const mouse_p=v2.dscale(this.input_manager.mouse.position,this.cam2d.zoom)
                const angle=v2.lookTo(cam_c,mouse_p)
                const dist=v2.distance(cam_c,mouse_p)
                this.set_lookTo_angle(angle,dist)
            }
        })
        
        this.ui_manager.init()
    }
    override on_run(): void {
        this.cam2d.position=v2.new(0,0)
    }

    override on_before_render(_dt: number): void {
        this.cam2d.ctx.stroke_style = this.colors[GameColors.Grid]
        this.cam2d.ctx.line_width = 0.1
        const grid_size=3
        this.cam2d.ctx.draw_grid(
            Math.floor(Math.max((this.cam2d.position.x-(this.cam2d.width/2))/grid_size,0)), Math.max(Math.floor((this.cam2d.position.y-(this.cam2d.height/2))/grid_size),0),
            Math.min((this.cam2d.position.x+(this.cam2d.width/2))/grid_size,this.map_size.x/grid_size),  Math.min((this.cam2d.position.y+(this.cam2d.height/2))/grid_size,this.map_size.y/grid_size),
            grid_size
        )
    }
    set_lookTo_angle(angle:number,dist:number){
        this.input.angle=angle
        this.input.distance_to_pointer=dist
        if(!this.spectating){
            if(this.active_entity)this.active_entity.rotation=angle
        }
    }
    ping_time:number=1
    override on_update(dt:number): void {
        if(dt===0||!this.client){
            this.fps_view.innerHTML=`FPS: 0<br/>Ping: 0`
        }else{
            this.fps_view.innerHTML=`FPS: ${Numeric.maxDecimals(1/dt,2)}<br/>Ping: ${this.client.ping}<br/>X: ${Math.floor(this.cam2d.position.x)}<br/>Y: ${Math.floor(this.cam2d.position.y)}`
        }
        let cam_pos=this.map_center_pos
        if(this.active_entity&&!this.active_entity.destroyed){
            cam_pos=this.active_entity.position

        }else if(this.has_active_entity&&this.active_entity_id){
            this.active_entity=this.scene_2d.objects.get_object(this.active_entity_id,this.active_entity_layer!) as Player
            if(this.active_entity)cam_pos=this.active_entity.position
        }else{
            this.map_center_angle=this.map_center_angle+0.01

            const rot=v2.from_RadAngle(this.map_center_angle)
            v2m.scale(rot,rot,10*dt)

            v2m.add(this.map_center_pos,this.map_center_pos,rot)
        }
        v2m.lerp(this.cam2d.position,cam_pos,Numeric.dt_expo_inter(10,dt))
        if(this.client){
            if(!this.spectating){
                this.client.emit(this.input)
                this.input.attribute=-1
                this.input.attribute_count=-1
                this.input.evolve_to=-1
            }
            this.ping_time-=dt
            if(this.ping_time<=0){
                this.ping_time=1
                this.client.send_ping()
            }
        }
    }
    show_menu(){
        ShowElement(this.menu,true)
        HideElement(this.ui,true)
    }
    hide_menu(){
        HideElement(this.menu,true)
        ShowElement(this.ui,true)
    }
    join(){
        if(!this.client)return
        const packet=new JoinPacket()
        packet.player_name=this.save.get_variable("cv_game_name")
        this.client.emit(packet)
        this.save.save("kieperio")
    }
    connect(url:string){
        const client=new Client(new WebSocket(url) as unknown as BasicSocket,PacketManager)
        this.set_client(client)
    }
    last_list:GameObject[]=[]
    set_client(client:Client){
        if(!client.opened)this.client=undefined
        this.client=client
        this.show_menu()
        client.on("update",(p:UpdatePacket)=>{
            const list=this.scene_2d.objects.proccess_list(p.objects!,true,this.last_list)
            this.last_list=list
            this.ui_manager.signal("update_private",p.priv)
        })
        client.on("connect",(_p:ConnectPacket)=>{
        })
        client.on("joinned",(p:JoinnedPacket)=>{
            this.map_size=p.map_size
            this.map_center=v2.dscale(p.map_size,2)
            this.map_center_pos=v2.clone(this.map_center)

            this.mainloop(true)
        })
        client.on("set_spectation",(p:SetSpectationPacket)=>{
            this.has_active_entity=p.has_object
            this.spectating=p.spectating
            this.active_entity_id=p.object_id
            this.active_entity_layer=p.object_layer

            this.ui_manager.signal("set_spectation",this.active_entity)
            this.active_entity=undefined

            if(this.spectating)this.show_menu()
            else this.hide_menu()
        })
        client.on("disconnect",(_p:DisconnectPacket)=>{
            this.show_menu()
            this.scene_2d.reset()
            this.stop()
            this.client=undefined
        })
    }
}