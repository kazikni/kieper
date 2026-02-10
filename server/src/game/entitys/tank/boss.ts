import { GameObjectType } from "common/scripts/config/constants.ts";
import { type LivingEntity } from "../../abstract_objects/living_entity.ts";
import { Tank } from "../../abstract_objects/tank.ts";
import { type GameObject } from "../../other/gameObject.ts";
import { CircleHitbox2D, Numeric, v2, v2m } from "common/engine/core.ts";

export class AbstractBoss extends Tank{
    target?:LivingEntity
    possible_targets:[LivingEntity,number][]=[]

    ai_data={
        kind:0,
        view_distance:100,

        turn_speed:0.25,
    }
    constructor(){
        super()
    }
    override update(dt: number): void {
        this.ai(dt)
        if(this.target){
            if(this.target.health_data.dead||this.target.destroyed||v2.distance(this.target.position,this.position)>=this.ai_data.view_distance){
                this.target=undefined
            }
        }else if(this.possible_targets.length>0){
            const arr=this.possible_targets.sort((a,b)=>b[1]-a[1])
            this.target=arr[0][0] as LivingEntity
            this.possible_targets.length=0
        }else if(!this.target){
            const objects:GameObject[]=this.manager.cells.get_objects(new CircleHitbox2D(this.position,this.ai_data.view_distance),this.layer)
            for(const o of objects){
                if(o.id===this.id||o.destroyed||v2.distance(o.position,this.position)>=this.ai_data.view_distance)continue
                if([GameObjectType.Tank,GameObjectType.Shape].includes(o.number_type)){
                    const t=this.possible_target(o as LivingEntity)
                    this.possible_targets.push([o as LivingEntity,t])
                }
            }
        }

        super.update(dt)
    }
    ai(dt: number): void {
        switch(this.ai_data.kind){
            case 0:
                if(this.target){
                    this.tank_data.firing=true
                    const angle=v2.lookTo(this.position,this.target.position)
                    this.rotation=Numeric.lerp_rad(this.rotation,angle,Numeric.dt_expo_inter(4,dt))
                    this.movement=v2.from_RadAngle(angle)
                }else{
                    this.movement=v2.zero
                    this.tank_data.firing=false
                }
                break
            case 1:
                this.rotation+=this.ai_data.turn_speed*dt

                if(this.movement.x==0||this.movement.y==0){
                    this.movement=v2.random(-1,1)
                }else{
                    const md=v2.scale(this.movement,100)
                    v2m.add(md,md,this.position)
                    if(md.x<=0||md.y<=0||md.x>=this.game.arena.size.x||md.y>=this.game.arena.size.y){
                        v2m.zero(this.movement)
                    }
                }
                this.tank_data.firing=true
                if(this.target){
                    const angle=v2.lookTo(this.position,this.target.position)
                    this.tank_data.firing_angle=angle
                    this.tank_data.distance_to_pointer=v2.distance(this.target.position,this.position)
                }else{
                    this.tank_data.firing_angle=0
                    this.tank_data.distance_to_pointer=0
                }
                break
            case 2:
                if(this.target){
                    this.tank_data.firing=true
                    const angle=v2.lookTo(this.position,this.target.position)
                    this.rotation=Numeric.lerp_rad(this.rotation,angle,Numeric.dt_expo_inter(3,dt))
                    this.movement=v2.from_RadAngle(angle)
                }else{
                    this.movement=v2.zero
                    this.tank_data.firing=false
                }
                break
        }
    }
    possible_target(obj:LivingEntity):number{
        return 100-(v2.distance(obj.position,this.position)/100)+(obj.number_type===GameObjectType.Tank?1:0)
    }
}