import { CircleHitbox2D, NetStream, v2, v2m, Vec2 } from "common/engine/core.ts";
import { GameObject } from "../other/gameObject.ts";
import { HealthData, NameData, PhysicalData, PhysicalSubModel } from "common/scripts/config/entity_datas.ts"
import { GameColors, GameObjectType } from "common/scripts/config/constants.ts"
import { type UpdatePacket } from "common/scripts/net/update_packet.ts";
export interface DamageParams{
    count:number
    source?:LivingEntity
    owner?:LivingEntity
}
export class LivingEntity extends GameObject{
    override number_type=GameObjectType.LivingEntity
    override string_type: string="living_body"
    update_packet?:UpdatePacket

    physical_data:PhysicalData&{dirty:boolean,dirtyPart:boolean,old_scale?:number}={
        sides:3,
        radius:0.25,
        color:GameColors.Triangle,
        scale:1,
        dirty:true,
        dirtyPart:true,
    }
    killer?:LivingEntity
    health_data:HealthData&{dirty:boolean,damageable:boolean,destroy_on_die:boolean,last_damage:number}={
        health:1,
        max_health:1,
        dead:false,
        visible:false,
        dirty:true,
        damageable:false,
        regen:0,
        destroy_on_die:true,

        last_damage:0,
    }
    name_data:NameData&{dirty:boolean}={
        name:"Entity",
        visible:false,
        dirty:true,
    }
    rotation:number=0

    velocity:Vec2
    
    constructor(){
        super()
        this.velocity=v2.zero()
        this.netSync.deletion=true
    }
    override create(args: Record<string, any>): void {
        this.update_data()
    }
    update_data(){
        this.base_hitbox=new CircleHitbox2D(v2(0,0),this.physical_data.radius*this.physical_data.scale)
    }
    override update(dt: number): void {
        v2m.add_component(this.position,this.velocity.x*dt,this.velocity.y*dt)
        if(this.health_data.dead&&this.health_data.destroy_on_die)this.destroy()
        if(!this.physical_data.old_scale||this.physical_data.scale!==this.physical_data.old_scale){
            this.physical_data.old_scale=this.physical_data.scale
            this.update_data()
        }

        if(this.health_data.regen>0){
            const rt=Math.max(10-(this.health_data.regen*3),1)
            if(this.health_data.health!==this.health_data.max_health&&this.health_data.last_damage>=rt){
                const regen=(0.05+(this.health_data.regen/11))*this.health_data.max_health
                this.health_data.dirty=true
                this.dirtyPart=true
                this.health_data.health=Math.min(this.health_data.max_health,this.health_data.health+(regen*dt))
            }else if(this.health_data.last_damage<rt){
                this.health_data.last_damage+=dt
            }
        }
    }
    override net_update(){
        this.physical_data.dirty=false
        this.health_data.dirty=false
    }

    when_kill(obj:LivingEntity){}
    die(damage:DamageParams){
        if(this.health_data.dead)return
        this.health_data.health=0
        this.health_data.dead=true
        this.health_data.dirty=true
        this.dirtyPart=true
        this.netSync.deletion=false
        this.killer=damage.owner
        if(damage.owner)damage.owner.when_kill(this)
    }
    piercing_damage(damage:DamageParams){
        this.health_data.dirty=true
        this.dirtyPart=true

        this.health_data.health-=damage.count
        this.health_data.last_damage=0
        if(this.health_data.health<=0){
            this.die(damage)
        }
    }
    body_damage_in(other:LivingEntity,dt:number,body_damage:number,owner?:LivingEntity){
        other.piercing_damage({count:body_damage*dt*7,source:this,owner:owner??this})
    }

    add_physical_submodel(physical:PhysicalSubModel):PhysicalSubModel{
        if(physical.model_type===0){
            if(!this.physical_data.sub_models)this.physical_data.sub_models=[]
            this.physical_data.sub_models.push(physical)
        }else if(physical.model_type===1){
            if(!this.physical_data.sub_models)this.physical_data.sub_models=[]
            this.physical_data.sub_models.push(physical)
        }
        return physical
    }
    override encode(stream: NetStream, full: boolean,_is_self:boolean): void {
        stream.writeBooleanGroup(this.physical_data.dirty,this.physical_data.dirtyPart,this.health_data.dirty,this.name_data.dirty)
        stream.writePos2(this.position)
        stream.writeRad(this.rotation)
        if(this.physical_data.dirty||full){
            stream.writeFloat32(this.physical_data.radius)
            stream.writeUint8(this.physical_data.sides)
            stream.writeUint8(this.physical_data.color)
            stream.writeFloat(this.physical_data.scale,0,1000,2)

            stream.writeArray(this.physical_data.sub_models??[],(e)=>{
                stream.writeUint8(e.model_type)
                .writeUint8(e.color)
                .writeRad(e.rotation)
                .writeVec2(e.position,-100,-100,100,100,2)
                .writeInt8(e.zindex??0)
                if(e.model_type===0){
                    stream.writeFloat32(e.radius)
                    .writeUint8(e.sides)
                }else if(e.model_type===1){
                    stream.writePos2(e.size)
                }
            },2)
        }else{
            stream.writeFloat(this.physical_data.scale,0,1000,2)
        }
        if(this.health_data.dirty||full){
            const visible=this.health_data.damageable&&this.health_data.visible
            stream.writeBooleanGroup(this.health_data.dead,visible)
            if(visible){
                stream.writeFloat(this.health_data.health/this.health_data.max_health,0,1,1)
            }
        }
        if(this.name_data.dirty||full){
            stream.writeBooleanGroup(this.name_data.visible)
            if(this.name_data.visible)stream.writeString(this.name_data.name)
        }
    }
}