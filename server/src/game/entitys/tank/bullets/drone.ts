import { Numeric, v2, v2m, Vec2 } from "common/engine/core.ts";
import { AbstractBullet } from "../../../abstract_objects/bullet.ts";

export class Drone extends AbstractBullet{
    target?:Vec2
    constructor(){
        super()
        this.bullet_data.type=2
    }
    override update(dt:number){
        super.update(dt)

        if(this.owner&&this.owner.tank_data.firing){
            this.target=v2.from_RadAngle(this.owner.tank_data.firing_angle)
            v2m.scale(this.target,this.target,this.owner.tank_data.distance_to_pointer)
            v2m.add(this.target,this.target,this.owner.position)
        }else{
            this.target=this.owner?.position
        }
        if(this.target){
            const angle=v2.lookTo(this.position,this.target)
            this.rotation=Numeric.lerp_rad(this.rotation,angle,1/(1+dt*100))
            const move=this.get_movement(this.rotation)

            v2m.lerp(this.velocity,move,1/(1+dt*1000))
        }
        this.dirtyPart=true
    }
}