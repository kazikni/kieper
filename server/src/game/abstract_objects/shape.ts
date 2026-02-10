import { LivingEntity } from "./living_entity.ts";
import { GameColors, GameObjectType } from "common/scripts/config/constants.ts";
import { type GameObject } from "../other/gameObject.ts";
import { type ShapeManager } from "../managers/shape_manager.ts";
import { Angle, Numeric, random, v2, v2m } from "common/engine/core.ts";

export class Shape extends LivingEntity{
    override number_type: GameObjectType=GameObjectType.Shape
    override string_type: string="shape"

    shape_data={
        rotation:0.5,
        orbit:0.3,
        velocity:1,
        anti_speed:3,

        mitose_chance:0.05,
        transmutation_time:-1,

        rarity_level:0,
        rarity_kind:0,
        rarity_rotation:Math.PI/2
    }

    damage_data={
        body_damage:1
    }

    rotation_speed:number=0
    orbit_dir=0
    orbit_rotation=0;

    shape_manager!:ShapeManager

    score_reward:number=0

    constructor(){
        super()

        const acc=random.float(0,1)
        this.shape_data.rotation=0.5+acc
        this.shape_data.velocity=0.5+acc*5
        this.shape_data.orbit=random.float(1,0.15)

        this.rotation=random.rad()

        this.health_data.damageable=true
        this.health_data.visible=true
        this.health_data.regen=0.9
    }
    override create(args: Record<string, any>): void {
        super.create(args)
        this.orbit_dir=Math.random()<=0.5?this.shape_data.orbit:-this.shape_data.orbit
        this.rotation_speed=Math.random()<=0.5?this.shape_data.rotation:-this.shape_data.rotation
        this.orbit_rotation=random.rad()
    }
    mitose(){
        if(this.destroyed)return
        const child = new (this.constructor as typeof Shape)()
        child.rotation=this.rotation
        if(Math.random()<=0.2)child.set_data(this.shape_data.rarity_level)
        return this.shape_manager.add_shape(child,this.position)
    }
    transmutate(){
        this.dirtyPart=true
        this.die({count:this.health_data.health})
    }
    AI(dt:number){
        this.rotation=Angle.loop_rad(this.rotation+(this.rotation_speed*dt))
        this.orbit_rotation=Angle.loop_rad(this.orbit_rotation+(this.orbit_dir*dt))
        v2m.add(this.position,this.position,v2.scale(v2.from_RadAngle(this.orbit_rotation),this.shape_data.velocity*dt))
        v2m.lerp(this.velocity,v2.zero,Numeric.dt_expo_inter(this.shape_data.anti_speed,dt))
    }
    override update(dt: number): void {
        super.update(dt)

        if(this.shape_data.transmutation_time!==-1){
            this.shape_data.transmutation_time-=dt
            if(this.shape_data.transmutation_time<=0&&!this.destroyed){
                this.transmutate()
            }
        }

        this.AI(dt)

        const objects:GameObject[]=this.manager.cells.get_objects(this.hitbox,this.layer)
        for(const obj of objects){
            if(obj.id===this.id||obj.destroyed)continue
            switch(obj.number_type){
                case GameObjectType.Tank:{
                    const collision=this.hitbox.overlapCollision(obj.hitbox)
                    if(collision.length){
                        for(const col of collision){
                            v2m.sub(this.velocity,this.velocity,v2.scale(col.dir,1))
                        }
                        this.body_damage_in((obj as LivingEntity),dt,this.damage_data.body_damage)
                    }
                    break
                }
                case GameObjectType.LivingEntity:
                case GameObjectType.Shape:{
                    const collision=this.hitbox.overlapCollision(obj.hitbox)
                    for(const col of collision){
                        v2m.sub(this.velocity,this.velocity,v2.scale(col.dir,900*dt))
                    }
                    break
                }
            }
        }
        this.dirtyPart=true
        this.position=this.base_hitbox.clamp(this.position,v2.zero,this.game.arena.size)
        this.manager.cells.updateObject(this)
    }
    set_data(rarity_level:number,modifier_kind:number=0){
        switch(modifier_kind){
            case 1: //Shiny
                this.physical_data.color=GameColors.Shiny
                this.score_reward*=10
                break
            case 2: //Mythical
                this.physical_data.color=GameColors.Mythical
                this.score_reward*=20
                this.health_data.max_health*=2
                break
            case 3: //Legendary
                this.physical_data.color=GameColors.Legendary
                this.score_reward*=40
                this.health_data.max_health*=2
                break
            case 4: //Black
                this.physical_data.color=GameColors.BlackShape
                this.score_reward*=100
                this.health_data.max_health*=20
                break

        }
        if(this.shape_data.rarity_level<=rarity_level){
            this.shape_data.rarity_level=rarity_level
            switch(this.shape_data.rarity_level){
                //Gamma
                case 1:
                    this.health_data.max_health*=4
                    this.score_reward*=5
                    break
                // Beta
                case 2:
                    this.health_data.max_health*=8
                    this.score_reward*=10
                    break
                // Alpha
                case 3:
                    this.health_data.max_health*=16
                    this.score_reward*=20
                    break
            }
            switch(this.shape_data.rarity_kind){
                case 0:
                    switch(this.shape_data.rarity_level){
                    //Gamma
                    case 1:
                        this.physical_data.radius*=1.5
                        this.add_physical_submodel({
                            model_type:0,
                            color:0,
                            position:v2.zero(),
                            radius:this.physical_data.radius/2,
                            rotation:this.shape_data.rarity_rotation*2,
                            sides:this.physical_data.sides
                        })
                        break
                    case 2:
                        this.physical_data.radius*=2.5
                        this.add_physical_submodel({
                            model_type:0,
                            color:0,
                            position:v2.zero,
                            radius:this.physical_data.radius/2,
                            rotation:this.shape_data.rarity_rotation*2,
                            sides:this.physical_data.sides
                        })
                        this.add_physical_submodel({
                            model_type:0,
                            color:0,
                            position:v2.zero,
                            radius:this.physical_data.radius/4,
                            rotation:0,
                            sides:this.physical_data.sides
                        })
                        break
                    case 3:
                        this.physical_data.radius*=3.5
                        this.add_physical_submodel({
                            model_type:0,
                            color:0,
                            position:v2.zero,
                            radius:this.physical_data.radius/2,
                            rotation:this.shape_data.rarity_rotation*2,
                            sides:this.physical_data.sides
                        })
                        this.add_physical_submodel({
                            model_type:0,
                            color:0,
                            position:v2.zero,
                            radius:this.physical_data.radius/4,
                            rotation:0,
                            sides:this.physical_data.sides
                        })
                        this.add_physical_submodel({
                            model_type:0,
                            color:0,
                            position:v2.zero,
                            radius:this.physical_data.radius/8,
                            rotation:this.shape_data.rarity_rotation*2,
                            sides:this.physical_data.sides
                        })
                        break
                    }
                    break
                case 2:
                    switch(this.shape_data.rarity_level){
                        case 1:
                            this.add_physical_submodel({
                                model_type:0,
                                color:0,
                                position:v2.zero,
                                radius:this.physical_data.radius,
                                rotation:this.shape_data.rarity_rotation,
                                sides:this.physical_data.sides
                            })
                            this.physical_data.radius*=1.2
                            break
                        case 2:
                            this.add_physical_submodel({
                                model_type:0,
                                color:0,
                                position:v2.zero,
                                radius:this.physical_data.radius*1.2,
                                rotation:this.shape_data.rarity_rotation,
                                sides:this.physical_data.sides
                            })
                            this.add_physical_submodel({
                                model_type:0,
                                color:0,
                                position:v2.zero,
                                radius:this.physical_data.radius,
                                rotation:0,
                                sides:this.physical_data.sides
                            })
                            this.physical_data.radius*=1.4
                            break
                        case 3:
                            this.add_physical_submodel({
                                model_type:0,
                                color:0,
                                position:v2.zero,
                                radius:this.physical_data.radius*1.4,
                                rotation:this.shape_data.rarity_rotation,
                                sides:this.physical_data.sides
                            })
                            this.add_physical_submodel({
                                model_type:0,
                                color:0,
                                position:v2.zero,
                                radius:this.physical_data.radius*1.2,
                                rotation:0,
                                sides:this.physical_data.sides
                            })
                            this.add_physical_submodel({
                                model_type:0,
                                color:0,
                                position:v2.zero,
                                radius:this.physical_data.radius,
                                rotation:this.shape_data.rarity_rotation,
                                sides:this.physical_data.sides
                            })
                            this.physical_data.radius*=1.6
                            break
                    }
                    break
            }
        }
        this.health_data.health=this.health_data.max_health
        this.update_data()
    }
}