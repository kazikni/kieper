import { GameColors, GameObjectType } from "common/scripts/config/constants.ts";
import { DamageParams, LivingEntity } from "./living_entity.ts";
import { cloneDeep, Numeric, v2, v2m, Vec2 } from "common/engine/core.ts";
import { type GameObject } from "../other/gameObject.ts";
import { Barrel } from "../entitys/tank/barrel.ts";
import { TankDefinition } from "common/scripts/config/entity_datas.ts";

export class Tank extends LivingEntity{
    override number_type: GameObjectType=GameObjectType.Tank
    override string_type: string="tank"

    tank_data={
        speed:25,
        firing:false,
        firing_angle:0,
        distance_to_pointer:0,
    }
    movement:Vec2=v2.zero()

    old_pos?:Vec2
    damage_data={
        body_damage:1,

        reload:1,
        bullet_damage:1,
        bullet_speed:1,
        bullet_health:1,
    }
    
    barrels:Barrel[]=[]

    score_reward:number=0

    def!:TankDefinition

    constructor(){
        super()
        this.physical_data.color=GameColors.Red
        this.physical_data.sides=1
        this.physical_data.radius=2

        this.health_data.regen=1
        this.health_data.health=10
        this.health_data.max_health=10
        this.health_data.visible=true
        this.health_data.damageable=true

        this.name_data.name="Tank"
        this.name_data.visible=true

        this.position=v2(0,0)
    }
    add_barrel(barrel:Barrel){
        barrel.begin(this)
        this.barrels.push(barrel)
    }
    process_object(obj:GameObject){}
    override update(dt:number){
        super.update(dt)
        let speed=this.tank_data.speed
        if(this.movement.x!==0||this.movement.y!==0){
            const move=v2.normalizeSafe(this.movement)
            v2m.scale(move,move,speed)
            v2m.lerp(this.velocity,move,Numeric.dt_expo_inter(6,dt))
        }else{
            v2m.lerp(this.velocity,v2.zero,Numeric.dt_expo_inter(3,dt))
        }
        if(!this.old_pos||this.position.x!==this.old_pos.x||this.position.y!==this.old_pos.y){
            this.old_pos=v2.clone(this.position)
            this.position=this.base_hitbox.clamp(this.position,v2.zero,this.game.arena.size)
            this.net_sync.part=true
        }
        const objects:GameObject[]=this.manager.cells.get_objects(this.hitbox,this.layer)
        for(const obj of objects){
            if(obj.id===this.id)continue
            this.process_object(obj)
            switch(obj.number_type){
                case GameObjectType.LivingEntity:
                case GameObjectType.Shape:
                case GameObjectType.Tank:{
                    const collision=this.hitbox.overlap_collision(obj.hitbox)
                    if(collision){
                        v2m.sub(this.velocity,this.velocity,v2.scale(collision.dir,v2.len(v2.add((obj as LivingEntity).velocity,this.velocity))*dt))
                        this.body_damage_in((obj as LivingEntity),dt,this.damage_data.body_damage,this)
                    }
                    break
                }
            }
        }
        for(const b of this.barrels){
            b.tick(dt)
        }
    }
    clear_bullets(damage:DamageParams={count:0}){
        for(const barrel of this.barrels){
            for(const bullet of barrel.bullets){
                bullet.die(damage)
            }
        }
    }
    override die(damage: DamageParams): void {
        super.die(damage)
        this.clear_bullets(damage)
    }
    revive(){
        if(!this.destroyed)return
        this.manager.registry(this)
        this.health_data.health=this.health_data.max_health
        this.health_data.dead=false
    }
    process_tank(tank:TankDefinition):TankDefinition{
        return tank
    }
    set_definition(tank:TankDefinition){
        tank=cloneDeep(tank)
        tank=this.process_tank(tank)
        this.barrels.length=0
        if(this.physical_data.sub_models)this.physical_data.sub_models.length=0

        this.physical_data.radius=tank.physical.radius??2
        this.physical_data.sides=tank.physical.sides??1

        if(!tank.tank.speed)tank.tank.speed=20
        if(!tank.tank.health)tank.tank.health=10
        this.tank_data.speed=tank.tank.speed
        const old_health=this.health_data.max_health
        this.health_data.max_health=tank.tank.health
        this.health_data.health=this.health_data.max_health*(this.health_data.health/old_health)
        for(const b of tank.barrels){
            this.add_barrel(new Barrel(b))
        }
        this.def=tank

        this.net_sync.full=true
    }
}