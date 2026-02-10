import { BarrelData, PhysicalSubModel } from "common/scripts/config/entity_datas.ts";
import { type Tank } from "../../abstract_objects/tank.ts";
import { GameColors } from "common/scripts/config/constants.ts";
import { Angle, random, v2, v2m, Vec2 } from "common/engine/core.ts";
import { Bullet } from "./bullets/bullet.ts";
import { AbstractBullet } from "../../abstract_objects/bullet.ts";
import { Drone } from "./bullets/drone.ts";

export class Barrel{
    tank!:Tank
    
    data:BarrelData
    shoot_time:number=0
    
    position!:Vec2
    rotation:number=0
    bullets:AbstractBullet[]=[]
    world_position():Vec2{
        const wp=v2.rotate_RadAngle(this.position,this.tank.rotation)
        v2m.scale(wp,wp,this.tank.physical_data.scale)
        v2m.add(wp,wp,this.tank.position)
        return wp
    }
    world_rotation(){
        return this.rotation+this.tank.rotation
    }
    model!:PhysicalSubModel
    
    constructor(data:BarrelData){
        this.data=data
    }
    begin(tank:Tank){
        this.tank=tank
        if(!this.data.physical.size)this.data.physical.size=v2.new(3.5,1.5)
        this.position=v2.new(this.data.physical.size.x/2,0)
        v2m.add(this.position,this.position,this.data.physical.position??v2.zero)
        const direction=this.data.physical.direction??0
        const rotation=this.data.physical.rotation??0
        v2m.rotate_DegAngle(this.position,this.data.physical.direction??0)
        v2m.add(this.position,this.position,this.data.physical.offset??v2.zero)
        this.rotation=Angle.deg2rad(rotation+direction)
        this.model=tank.add_physical_submodel({
            model_type:1,
            color:(this.data.physical.color??GameColors.Barrel)+1,
            position:this.position,
            rotation:this.rotation,
            size:this.data.physical.size,
            zindex:-1
        })
    }
    create_bullet():AbstractBullet{
        let b:AbstractBullet
        switch(this.data.shoot.bullet.type??"bullet"){
            case "bullet":
                b=new Bullet()
                break
            case "drone":
                b=new Drone()
                break
        }
        b.physical_data.scale=this.tank.physical_data.scale
        b.set_definition(this.data.shoot.bullet,this.tank)

        b.bullet_data.damage*=this.tank.damage_data.bullet_damage
        b.bullet_data.speed*=this.tank.damage_data.bullet_speed
        b.speed=b.bullet_data.speed
        b.health_data.max_health*=this.tank.damage_data.bullet_health
        b.health_data.health=b.health_data.max_health

        return b
    }
    shoot(){
        const b=this.create_bullet()
        const pos=this.world_position()
        const rot=this.world_rotation()
        const spread=Angle.deg2rad(this.data.shoot.spread??0)
        b.position=pos
        b.set_movement(rot+random.float(-spread,spread))
        this.tank.manager.add_object(b,this.tank.layer)

        if(this.data.shoot.recoil){
            v2m.add(this.tank.velocity,this.tank.velocity,v2.scale(v2.from_RadAngle(rot),this.data.shoot.recoil*-5))
        }
        this.bullets.push(b)
    }
    tick(dt:number){
        if(this.shoot_time<=0&&this.tank.tank_data.firing){
            for(let i=0;i<this.bullets.length;i++){
                if(this.bullets[i].destroyed){
                    this.bullets.splice(i,1)
                    i--
                    continue
                }
            }
            if(!this.data.shoot.limit||this.bullets.length<this.data.shoot.limit){
                this.shoot_time=this.data.shoot.delay
                this.shoot()
            }
        }
        this.shoot_time-=dt*this.tank.damage_data.reload
    }
}