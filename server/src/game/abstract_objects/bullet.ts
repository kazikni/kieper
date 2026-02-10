import { NetStream, v2, v2m, Vec2 } from "common/engine/core.ts";
import { LivingEntity } from "./living_entity.ts";
import { GameColors, GameObjectType } from "common/scripts/config/constants.ts";
import { Tank } from "./tank.ts";
import { GameObject } from "../other/gameObject.ts";
import { BulletDefinition } from "common/scripts/config/entity_datas.ts";

export class AbstractBullet extends LivingEntity{
    override string_type="bullet"
    override number_type=GameObjectType.Bullet

    bullet_data={
        type:0,
        damage:1,
        max_distance:1,
        speed:1
    }
    ticks:number=0

    initial_position:Vec2
    maxDistance:number=0

    old_position:Vec2=v2.zero()

    owner?:Tank

    tticks:number=0

    speed:number=0

    hitTargets = new Set<number>()

    constructor(){
        super()
        this.initial_position=v2(0,0)
        this.health_data.visible=false

        this.physical_data.color=GameColors.Red
        this.physical_data.sides=1
        this.physical_data.radius=1
        this.netSync.deletion=false
    }
    set_definition(def:BulletDefinition,owner:Tank){
        this.bullet_data.damage=def.damage
        this.owner=owner

        this.physical_data.color=this.owner.physical_data.color??def.color
        if(def.radius)this.physical_data.radius=def.radius
        if(def.sides)this.physical_data.sides=def.sides

        this.bullet_data.damage=def.damage
        this.bullet_data.max_distance=def.distance??100
        this.bullet_data.speed=def.speed??1

        this.health_data.max_health=def.health
        this.health_data.health=def.health

        this.speed=this.bullet_data.speed
        this.maxDistance=this.bullet_data.max_distance
    }
    get_movement(rotation:number){
        return v2.scale(v2.from_RadAngle(rotation),this.speed)
    }
    set_movement(rotation:number){
        this.velocity=v2.scale(v2.from_RadAngle(rotation),this.speed)
        this.rotation=rotation
    }
    override create(args: Record<string, any>): void {
        super.create(args)

        if(this.bullet_data.type===2)this.netSync.deletion=true
    }
    override update(dt:number){
        super.update(dt)
        this.old_position=v2.clone(this.position)
        this.manager.cells.updateObject(this)
        const objs:GameObject[]=this.manager.cells.get_objects(this.hitbox,this.layer)
        const hitTargets:Set<number>=new Set()
        for(const obj of objs){
            if(obj.id===this.id)continue
            switch(obj.number_type){
                case GameObjectType.LivingEntity:
                case GameObjectType.Shape:
                case GameObjectType.Tank:{
                    if(this.owner!==obj){
                        const collision=obj.hitbox.overlapCollision(this.hitbox)
                        if (collision.length > 0) {
                            hitTargets.add(obj.id)
                            if(!this.hitTargets.has(obj.id)){
                                if(this.bullet_data.type!==2){
                                    this.hitTargets.add(obj.id)
                                }
                                const dmg = this.bullet_data.damage
                                this.piercing_damage({count:(obj as LivingEntity).health_data.health});
                                (obj as LivingEntity).piercing_damage({ count: dmg, owner:this.owner, source:this });

                                this.dirtyPart=true
                            }
                        }

                        for(const col of collision){
                            v2m.add(this.position,this.position,v2.scale(col.dir,4*dt))
                        }
                    }
                    break
                }
                case GameObjectType.Bullet:{
                    const collision=obj.hitbox.overlapCollision(this.hitbox)
                    if(this.bullet_data.type===2&&(obj as AbstractBullet).bullet_data.type===2){
                        for(const col of collision){
                            v2m.add(this.velocity,this.velocity,v2.scale(col.dir,col.pen*500*dt))
                        }
                    }
                    if(this.owner!==(obj as AbstractBullet).owner&&collision.length&&!(obj as AbstractBullet).health_data.dead){
                        this.piercing_damage({count:(obj as AbstractBullet).health_data.health})
                    }
                    break
                }
            }
        }
        if(this.bullet_data.type===2){
            this.hitTargets=hitTargets
        }
    }
    override encode(stream: NetStream, full: boolean,is_self:boolean): void {
        super.encode(stream,full,is_self)
        if(full){
            stream.writeUint8(this.bullet_data.type)
            if(this.bullet_data.type===1){
                stream.writeFloat32(this.speed)
                stream.writeFloat32(this.maxDistance)
                stream.writePos2(this.initial_position)
            }
        }
    }
}