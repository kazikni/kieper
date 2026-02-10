import { GameColors, GameObjectType } from "common/scripts/config/constants.ts";
import { Shape } from "../../abstract_objects/shape.ts";
import { LivingEntity } from "../../abstract_objects/living_entity.ts";
import { CircleHitbox2D, Numeric, v2, v2m } from "common/engine/core.ts";
import { type GameObject } from "../../other/gameObject.ts";

export class Guardian extends Shape{
    target?:LivingEntity

    ai_data={
        view_distance:100,
    }
    possible_targets:[LivingEntity,number][]=[]
    constructor(){
        super()
        this.physical_data.sides=3
        this.physical_data.color=GameColors.Guardian
        this.physical_data.radius=1.12
        this.shape_data.anti_speed=900

        this.health_data.max_health=2
        this.health_data.health=2

        this.score_reward=10
    }
    override AI(dt: number): void {
        if(this.target){
            const angle=v2.lookTo(this.position,this.target.position)
            this.rotation=Numeric.lerp_rad(this.rotation,angle,Numeric.dt_expo_inter(3,dt))

            const dest_vel=v2.from_RadAngle(angle)
            v2m.scale(dest_vel,dest_vel,50)
            v2m.lerp(this.velocity,dest_vel,Numeric.dt_expo_inter(100,dt))
            if(this.target.health_data.dead||this.target.registred){
                this.target=undefined
            }
        }else if(this.possible_targets.length>0){
            const arr=this.possible_targets.sort((a,b)=>b[1]-a[1])
            this.target=arr[0][0] as LivingEntity
            this.possible_targets.length=0
        }else if(!this.target){
            const objects:GameObject[]=this.manager.cells.get_objects(new CircleHitbox2D(this.position,this.ai_data.view_distance),this.layer)
            for(const o of objects){
                const dist=v2.distance(o.position,this.position)
                if(o.id===this.id||o.destroyed||dist>=this.ai_data.view_distance)continue
                if([GameObjectType.Tank].includes(o.number_type)){
                    this.possible_targets.push([o as LivingEntity,100-dist*0.1])
                }
            }

            this.rotation+=this.rotation_speed*dt
            v2m.lerp(this.velocity,v2.zero,Numeric.dt_expo_inter(this.shape_data.anti_speed,dt))
        }
    }
}