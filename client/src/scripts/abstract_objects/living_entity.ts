import { ColorM, Camera2D, Model2D, model2d, v2, NetStream, CircleHitbox2D, Vec2, v2m, Numeric, Color, Frame, ImageModel2D } from "common/engine/client.ts";
import { GameObject } from "../main/gameObject.ts";
import { GameColors, GameObjectType } from "common/scripts/config/constants.ts"
import { NameData, PhysicalData, PhysicalSubModel } from "common/scripts/config/entity_datas.ts"
interface PhysicalBodyModel{
    model:Model2D
    scale:Vec2
    border_scale:Vec2
    angle:number
    offset:Vec2
    color:Color
    border:Color
}
export class LivingEntity extends GameObject{
    override number_type: number=GameObjectType.LivingEntity
    override string_type: string="living_body"
    physical_data:PhysicalData&{interpolation:boolean,secundary_scale:number,active:boolean,tint:Color}={
        sides:3,
        radius:0.25,
        scale:1,
        secundary_scale:1,
        color:GameColors.Triangle,
        interpolation:true,
        active:false,
        tint:ColorM.clone(ColorM.default.white),
    }

    name_data:NameData&{frame?:Frame}={
        name:"entity",
        visible:false
    }
    rotation:number=0

    dest_position?:Vec2
    dest_rotation?:number

    health_data={
        dead:false,
        visible:false,
        health:1,
        health_dest:1,
    }

    private _color:Color=ColorM.default.white
    private _border_color:Color=ColorM.default.white
    private _body_models:PhysicalBodyModel[]=[]

    get collidable():boolean{
        return !this.health_data.dead
    }
    constructor(){
        super()
    }
    override update(dt: number): void {
        if(this.physical_data.interpolation){
            if(this.dest_position)v2m.lerp(this.position,this.dest_position,Numeric.dt_expo_inter(9,dt))
            if(this.dest_rotation&&(this.game.active_entity!==this||this.game.spectating)){
                this.rotation=Numeric.lerp_rad(this.rotation,this.dest_rotation,Numeric.dt_expo_inter(9,dt))
            }
        }
        if(this.health_data.dead){
            if(this._color.a<=0){
                this.destroy()
            }
            this._color.a-=dt*4
            this._border_color.a-=dt*4
            this.physical_data.secundary_scale+=5*dt
        }else{
            this.health_data.health=Numeric.lerp(this.health_data.health,this.health_data.health_dest,Numeric.dt_expo_inter(5,dt))
        }
        if(!this.physical_data.active){
            this.destroy()
        }
    }
    override render(camera: Camera2D, dt: number): void {
        camera.ctx.line_inner=0.5
        camera.ctx.line_outer=0.5
        camera.ctx.line_width=this.game.global_line_width
        for(const m of this._body_models){
            camera.ctx.fill_style=m.border
            const pos=v2.scale(m.offset,this.physical_data.secundary_scale)
            v2m.rotate_RadAngle(pos,this.rotation)
            v2m.add(pos,pos,this.position)
            camera.ctx.fill_model(m.model,pos,v2.scale(m.border_scale,this.physical_data.secundary_scale),this.rotation+m.angle)
            camera.ctx.fill_style=m.color
            camera.ctx.fill_model(m.model,pos,v2.scale(m.scale,this.physical_data.secundary_scale),this.rotation+m.angle)
        }
        if(this.health_data.visible&&this.health_data.health>0&&this.health_data.health<1){
            const w=(this.physical_data.scale*this.physical_data.radius)+4
            const x=this.position.x-w/2
            const y=this.position.y+(this.physical_data.scale*this.physical_data.radius)+2
            camera.ctx.fill_style=this.game.colors[GameColors.HealthBarBackground]
            camera.ctx.fill_rect(x,y,w,0.5)
            camera.ctx.fill_style=this.game.colors[GameColors.HealthBar]
            camera.ctx.fill_rect(x,y,w*this.health_data.health,0.5)
        }
        if(this.name_data.frame){
            const model=new Float32Array(16)
            ImageModel2D(v2.one,0,v2.new(.5,.5),this.name_data.frame.frame_size!,this.game.cam2d.meter_size,v2(this.position.x,this.position.y-(this.physical_data.scale*this.physical_data.radius)-2),{min:v2(0,0),max:v2(0,0)},model)
            camera.ctx.draw_frame2d(this.name_data.frame,model)
        }
    }
    override create(args: Record<string, any>): void {
        this.update_physical_data()
    }
    async update_name_data(){
        if(this.name_data.frame){
            this.name_data.frame.free()
            this.name_data.frame=undefined
        }
        if(this.name_data.visible)this.name_data.frame=await this.game.resources.render_text(this.name_data.name,40,ColorM.rgba2hex(this.game.colors[GameColors.Text]))
    }
    private update_physical_data(){
        this._color=ColorM.clone(this.game.colors[this.physical_data.color])
        this._border_color=this.game.border_color(this._color)

        if(this.game.neon_border){
            const col=this._color
            this._color=this._border_color
            this._border_color=col
        }
        this.base_hitbox=new CircleHitbox2D(v2(0,0),this.physical_data.radius)
        this._body_models.length=0
        
        if(this.physical_data){
            const radius=this.physical_data.radius*this.physical_data.scale
            const m={
                model:model2d.regular_shape(this.physical_data.sides,1),
                scale:v2(radius,radius),
                border_scale:v2(radius,radius),
                angle:0,
                offset:v2.zero,
                color:this._color,
                border:this._border_color
            }
            v2m.sub_component(m.scale,this.game.global_line_width,this.game.global_line_width)
            for(const p of this.physical_data.sub_models??[]){
                if(p.zindex!>=0)continue
                this._create_sub_model(p)
            }
            this._body_models.push(m)
            for(const p of this.physical_data.sub_models??[]){
                if(p.zindex!<0)continue
                this._create_sub_model(p)
            }
        }
    }
    _create_sub_model(p:PhysicalSubModel){
        const m:Record<string,any>={
            angle:p.rotation,
            offset:v2.scale(p.position,this.physical_data.scale),
            color:this._color,
            border:this._border_color
        }
        if(p.model_type==0){
            const radius=p.radius*this.physical_data.scale
            m.scale=v2(radius,radius)
            m.border_scale=v2(radius,radius)
            m.model=model2d.regular_shape(p.sides,1)
            v2m.sub_component(m.scale,this.game.global_line_width,this.game.global_line_width)
        }else if(p.model_type==1){
            m.model=model2d.rect(v2(-0.5,-0.5),v2(0.5,0.5))
            m.scale=v2.scale(p.size,this.physical_data.scale)
            m.border_scale=v2(m.scale.x,m.scale.y)
            v2m.sub_component(m.scale,this.game.global_line_width*2,this.game.global_line_width*2)
        }
        if(p.color>0){
            m.color=ColorM.clone(this.game.colors[(p.color-1) as GameColors])
            m.border=this.game.border_color(m.color)
        }
        this._body_models.push(m as PhysicalBodyModel)
    }
    override decode(stream: NetStream, full: boolean): void {
        const [physical_dirty,physical_dirty_part,health_dirty,name_dirty]=stream.readBooleanGroup()
        this.dest_position=stream.readPos2()
        this.dest_rotation=stream.readRad()
        if(full||physical_dirty){
            this.physical_data.radius=stream.readFloat32()
            this.physical_data.sides=stream.readUint8()
            this.physical_data.color=stream.readUint8()
            this.physical_data.scale=stream.readFloat(0,1000,2)

            this.physical_data.sub_models=stream.readArray(()=>{
                const ret:Record<string,any>={
                    model_type:stream.readUint8(),
                    color:stream.readUint8(),
                    rotation:stream.readRad(),
                    position:stream.readVec2(-100,-100,100,100,2),
                    zindex:stream.readInt8()
                }

                if(ret.model_type===0){
                    ret.radius=stream.readFloat32()
                    ret.sides=stream.readUint8()
                }else if(ret.model_type===1){
                    ret.size=stream.readPos2()
                }
                return ret
            },2) as PhysicalSubModel[]

            this.physical_data.active=true
            this.update_physical_data()
        }else if(physical_dirty_part){
            this.physical_data.scale=stream.readFloat(0,1000,2)
            this.update_physical_data()
        }
        if(full||health_dirty){
            const [dead,visible]=stream.readBooleanGroup()
            this.health_data.visible=visible
            if(dead){
                this.health_data.dead=dead
                this.net_sync.enabled.deletion=false
            }

            if(visible){
                this.health_data.health_dest=stream.readFloat(0,1,1)
            }
        }
        if(full||name_dirty){
            const [visible]=stream.readBooleanGroup()
            this.name_data.visible=visible
            if(visible)this.name_data.name=stream.readString()
            this.update_name_data()
        }if(!this.physical_data.interpolation||full){
            this.position=this.dest_position
            if(!(this.game.active_entity===this&&!this.game.spectating)){
                this.rotation=this.dest_rotation
            }
        }
    }
}