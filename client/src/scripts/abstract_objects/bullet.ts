import { NetStream } from "common/engine/core/net/stream.ts";
import { LivingEntity } from "./living_entity.ts";
import { GameObjectType } from "common/scripts/config/constants.ts";
import { v2, v2m, Vec2 } from "common/engine/core.ts";

export class Bullet extends LivingEntity{
    override number_type: GameObjectType=GameObjectType.Bullet
    override string_type: string="bullet"

    velocity:Vec2=v2.zero()

    max_distance:number=100

    bullet_type:number=0

    initial_position:Vec2=v2.zero()
    constructor(){
        super()
        this.physical_data.interpolation=false
    }
    override update(dt: number): void {
        super.update(dt)
        if(this.bullet_type===1){
            if(v2.distance(this.initial_position,this.position)>this.max_distance){
                this.health_data.dead=true
            }
            v2m.add_component(this.position,this.velocity.x*dt,this.velocity.y*dt)
        }
        if(this.game.active_entity&&v2.distance(this.position,this.game.active_entity.position)>=3000)this.destroy()
    }
    override decode(stream: NetStream, full: boolean): void {
        super.decode(stream,full)
        if(full){
            const bt=stream.readUint8()
            this.bullet_type=bt
            if(bt===1){
                this.velocity=v2.scale(v2.from_RadAngle(this.rotation),stream.readFloat32())
                this.max_distance=stream.readFloat32()
                this.initial_position=stream.readPos2()
            }
        }
    }
}