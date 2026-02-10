import { type GameObject } from "../other/gameObject.ts";
import { InputPacket } from "common/scripts/net/input_packet.ts";
import { Client, Numeric, random, RectHitbox2D, v2, Vec2 } from "common/engine/core.ts";
import { Tank } from "./tank.ts";
import { DamageParams, LivingEntity } from "./living_entity.ts";
import { GameColors, GameConstant, GameObjectType, PlayerAttributes, PlayerAttributesMult, zero_player_attributes } from "common/scripts/config/constants.ts";
import { Shape } from "./shape.ts";
import { Tanks } from "common/scripts/config/tanks_definition.ts";
import { TankDefinition } from "common/scripts/config/entity_datas.ts";
import { UpdatePacket } from "common/scripts/net/update_packet.ts";
import { type Game } from "../other/game.ts";
const max_level=50
export function update_net(client:Client,game:Game,entity?:LivingEntity,self?:LivingEntity,view_objects:GameObject[]=[]):[UpdatePacket,GameObject[]]{
    const up=new UpdatePacket()
    up.priv.score=0
    up.priv.attributes=zero_player_attributes
    up.priv.evolutions=[]
    if(client&&client.opened){
        if(entity){
            if(entity.number_type===GameObjectType.Tank&&entity instanceof Player){
                up.priv.score=entity.score_data.score

                up.priv.attributes=entity.attributes
                up.priv.evolutions=entity.possible_evolutions

                const objs:GameObject[]=get_objects(game,entity.position,entity.layer,v2.new(100,60))
                const rr=game.scene_2d.objects.encode_list(objs,view_objects,undefined)

                up.objects=rr.strm
                entity.client.emit(up)
                return [up,rr.last]
            }else if([GameObjectType.Shape,GameObjectType.Tank,GameObjectType.Shape].includes(entity.number_type)){
                const objs=get_objects(game,entity.position,entity.layer,v2.new(100,60))
                const o=game.scene_2d.objects.encode_list(objs,view_objects,undefined)

                up.objects=o.strm
                return [up,o.last]
            }
        }else{
            const objs=get_objects(game,v2.dscale(game.arena.size,2),0,v2.new(150,150))
            const o=game.scene_2d.objects.encode_list(objs,view_objects)
            up.objects=o.strm
            return [up,o.last]
        }
    }
    return [up,[]]
}
export function get_objects(game:Game,pos:Vec2,layer:number,size:Vec2){
    const min=v2.sub(pos,size)
    const max=v2.add(pos,size)
    const camera_hb=new RectHitbox2D(min,max)

    const objs=game.scene_2d.cells.get_objects(camera_hb,layer)
    return objs
}
export class Player extends Tank{
    client:Client

    score_data={
        score:0,
        level:1,
    }

    used_attributes:number=0

    possible_evolutions:number[]=[]

    on_die?:(killer?:LivingEntity)=>void
    attributes:Record<PlayerAttributes,number>={
        [PlayerAttributes.MaxHealth]:0,
        [PlayerAttributes.HealthRegen]:0,
        [PlayerAttributes.MoveSpeed]:0,
        [PlayerAttributes.BodyDamage]:0,
        [PlayerAttributes.BulletDamage]:0,
        [PlayerAttributes.BulletHealth]:0,
        [PlayerAttributes.BulletSpeed]:0,
        [PlayerAttributes.Reload]:0,
    }
    constructor(client:Client){
        super()
        this.client=client

        this.score_reward=100
    }
    override create(args: Record<string, any>): void {
        super.create(args)
        this.set_definition(Tanks.getFromString("initial"))
        this.position=this.game.arena.generate_spawn_pos()
        //this.position=v2.dscale(this.game.arena.size,2)

        this.physical_data.color=random.choose([GameColors.Red,GameColors.Blue,GameColors.Green,GameColors.Yellow])
    }
    process_input(p:InputPacket){
        if(!p.movement)return
        this.movement=p.movement
        this.rotation=p.angle
        this.tank_data.firing_angle=p.angle
        this.tank_data.firing=p.firing
        this.tank_data.distance_to_pointer=p.distance_to_pointer
        if(p.attribute!==-1&&p.attribute_count!==-1){
            this.add_attribute(p.attribute,p.attribute_count)
        }
        if(p.evolve_to!==-1){
            this.evolve_to(p.evolve_to)
        }
    }
    override update(dt:number){
        super.update(dt)
    }
    override die(damage: DamageParams): void {
        super.die(damage)
        if(this.on_die)this.on_die(damage.owner)
    }
    override when_kill(obj: LivingEntity): void {
        if(obj.number_type===GameObjectType.Shape||obj.number_type===GameObjectType.Tank){
            this.give_score((obj as Shape).score_reward)
        }
    }
    override process_tank(tank: TankDefinition): TankDefinition {
        //@ts-ignore
        if(this.def&&this.def.idString!="initial"){
            if(!tank.tank.evolution)tank.tank.evolution=[]
            tank.tank.evolution.push({level:max_level,id:"initial"})
        }
        return tank
    }
    evolve_to(evolve:number){
        this.clear_bullets()
        const ev=(this.def.tank.evolution??[])[evolve]
        if(ev&&this.score_data.level>=ev.level){
            this.set_definition(Tanks.getFromString(ev.id))
            this.update_attributes()
        }
    }
    add_attribute(attr:PlayerAttributes,count:number){
        count=Math.min(count,(this.score_data.level)-this.used_attributes)
        this.attributes[attr]=Math.min(this.attributes[attr]+count,10)
        this.update_attributes()
    }
    update_attributes(){
        this.health_data.max_health=this.def.tank.health!*(1+(0.3*(this.score_data.level/max_level)))
        this.tank_data.speed=this.def.tank.speed!*(1-(0.3*(this.score_data.level/max_level)))

        this.health_data.max_health*=1+(PlayerAttributesMult[PlayerAttributes.MaxHealth]*this.attributes[PlayerAttributes.MaxHealth])
        this.health_data.regen*=1+(PlayerAttributesMult[PlayerAttributes.HealthRegen]*this.attributes[PlayerAttributes.HealthRegen])

        this.damage_data.body_damage=1+((PlayerAttributesMult[PlayerAttributes.BodyDamage]*this.attributes[PlayerAttributes.BodyDamage]))

        this.tank_data.speed*=1+(PlayerAttributesMult[PlayerAttributes.MoveSpeed]*this.attributes[PlayerAttributes.MoveSpeed])

        this.damage_data.bullet_damage=1+((PlayerAttributesMult[PlayerAttributes.BulletDamage]*this.attributes[PlayerAttributes.BulletDamage]))
        this.damage_data.bullet_health=1+((PlayerAttributesMult[PlayerAttributes.BulletHealth]*this.attributes[PlayerAttributes.BulletHealth]))
        this.damage_data.bullet_speed=1+((PlayerAttributesMult[PlayerAttributes.BulletSpeed]*this.attributes[PlayerAttributes.BulletSpeed]))
        this.damage_data.reload=1+((PlayerAttributesMult[PlayerAttributes.Reload]*this.attributes[PlayerAttributes.Reload]))

        this.used_attributes=0
        for(const k of Object.keys(this.attributes)){
            this.used_attributes+=this.attributes[k as unknown as PlayerAttributes]
        }

        this.possible_evolutions.length=0
        for(const e of this.def.tank.evolution??[]){
            if(this.score_data.level>=e.level){
                this.possible_evolutions.push(Tanks.getFromString(e.id).idNumber!)
            }
        }
    }
    give_score(score:number){
        this.score_data.score+=score*this.game.arena.settings.score_multiplier
        this.update_score()
    }
    update_score(){
        const old_level=this.score_data.level
        this.score_reward=(this.score_data.score/4)+100
        this.score_data.level=Math.min(Numeric.level.calc(this.score_data.score,GameConstant.level_base,GameConstant.level_increse)+1,max_level)
        if(old_level!=this.score_data.level){
            this.physical_data.scale=1+(0.6*(this.score_data.level/max_level))
            this.physical_data.dirtyPart=true
            this.update_attributes()
        }
    }
}