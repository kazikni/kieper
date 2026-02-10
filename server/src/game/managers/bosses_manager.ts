import { random, Vec2, WeightDefinition } from "common/engine/core.ts";
import { type Game } from "../other/game.ts";
import { AbstractBoss } from "../entitys/tank/boss.ts";
import { OriginalBoss } from "../entitys/tank/bosses/original_boss.ts";
import { Tanks } from "common/scripts/config/tanks_definition.ts";
interface BossSpawnDef extends WeightDefinition{
    boss:()=>AbstractBoss
}
export class BossesManager{
    bosses:AbstractBoss[]=[]
    game:Game

    bosses_limit:number=2

    boss_spawns:BossSpawnDef[]=[
        {
            weight:1,
            boss:()=>{
                const b=new OriginalBoss()
                b.set_definition(Tanks.getFromString("quad_backshot"))
                b.ai_data.kind=0
                return b
            },
        },
        {
            weight:1,
            boss:()=>{
                const b=new OriginalBoss()
                b.set_definition(Tanks.getFromString("octo_shot"))
                b.ai_data.kind=0
                return b
            },
        },
        {
            weight:1,
            boss:()=>{
                const b=new OriginalBoss()
                b.set_definition(Tanks.getFromString("evoker"))
                b.ai_data.kind=1

                b.tank_data.speed*=0.1
                return b
            },
        },
        {
            weight:1,
            boss:()=>{
                const b=new OriginalBoss()
                b.set_definition(Tanks.getFromString("mega_shot"))
                b.ai_data.kind=0
                return b
            },
        },
        {
            weight:1,
            boss:()=>{
                const b=new OriginalBoss()
                b.set_definition(Tanks.getFromString("scout"))
                b.ai_data.kind=0
                return b
            },
        },
    ]
    constructor(game:Game){
        this.game=game
    }
    add_boss(boss?:AbstractBoss,position?:Vec2){
        if(this.bosses.length>=this.bosses_limit||!boss)return undefined

        const ret=this.game.scene_2d.objects.add_object(boss,0) as AbstractBoss
        if(position)ret.position=position
        this.bosses.push(ret)

        return ret
    }
    generate_modifier(){
        let modifier=0

        const rn=random.float(0,1_000_000)
        if(rn<=1_000_000/1_000_000){
            modifier=4
        }else if(rn<=1_000_000/100_000){
            modifier=3
        }else if(rn<=1_000_000/10_000){
            modifier=2
        }else if(rn<=1_000_000/1_000){
            modifier=1
        }
        return modifier
    }
    generate_boss(pos:Vec2,spawns?:BossSpawnDef[]):AbstractBoss|undefined{
        const choose=random.weight2(spawns??this.boss_spawns)
        if(choose){
            const boss=choose.boss()
            boss.position=pos
            return boss
        }
    }
    spawn_boss(){
        const pos=this.game.arena.generate_spawn_pos()
        const shape=this.add_boss(this.generate_boss(pos),pos)
        return shape
    }
    dirty_time:number=1
    spawn_delay:number=0
    update(dt:number){
        if(this.bosses.length<=this.bosses_limit){
            if(this.spawn_delay<=0){
                this.spawn_delay=60*10*this.game.tps
                this.spawn_boss()
            }else{
                this.spawn_delay-=dt
            }
        }
        this.dirty_time-=dt
        if(this.dirty_time<=0){
            this.dirty_time=1
            for(let i=0;i<this.bosses.length;i++){
                if(!this.bosses[i].registred){
                    this.bosses.splice(i,1)
                    i--
                    continue
                }
            }
        }
    }
}