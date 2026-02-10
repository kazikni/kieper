import { LivingEntity } from "../abstract_objects/living_entity.ts";
import { GameObject } from "./gameObject.ts";
import { AbstractServerGame, Client, OfflineClientsManager } from "common/engine/core/net/server_base.ts";
import { JoinPacket } from "common/scripts/net/join_packet.ts";
import { Player, update_net } from "../abstract_objects/player.ts";
import { Shape } from "../abstract_objects/shape.ts";
import { ShapeManager } from "../managers/shape_manager.ts";
import { Arena } from "./arena.ts";
import { InputPacket } from "common/scripts/net/input_packet.ts";
import { GameDataBase } from "common/engine/server.ts";
import { DisconnectPacket, ID } from "common/engine/core.ts";
import { JoinnedPacket } from "common/scripts/net/joinned_packet.ts";
import { SetSpectationPacket } from "common/scripts/net/set_spectation.ts";
import { BossesManager } from "../managers/bosses_manager.ts";
export interface GameData extends GameDataBase{
    
}
export interface GameConfig{
    
}
export interface PlayerConn{
    spectating?:LivingEntity
    player:boolean
    main_player?:Player
    client:Client
    view_objects:GameObject[]
}
export class Game extends AbstractServerGame<GameObject>{
    player_clients:Record<number,PlayerConn>={}

    shapes:ShapeManager=new ShapeManager(this)
    bosses:BossesManager=new BossesManager(this)

    arena:Arena
    constructor(tps:number,id:ID,clients:OfflineClientsManager){
        super(tps,id,clients,[LivingEntity,Shape])

        this.scene_2d.objects.add_layer(0)
        this.arena=new Arena(this)

        this.ntps=25
    }

    override on_update(dt: number): void {
        this.shapes.update(dt)
        this.bosses.update(dt)
    }
    override on_run(): void {
    }
    override on_stop(): void {
        super.on_stop()
    }
    override net_update(full:boolean){
        for(const k of Object.keys(this.player_clients)){
            const cp=this.player_clients[k as unknown as number]
            if(cp.player&&cp.main_player&&(cp.main_player.destroyed||cp.main_player.health_data.dead)){
                cp.spectating=cp.main_player.killer
                cp.player=false

                const set_spectation=new SetSpectationPacket()
                set_spectation.object_id=cp.spectating?.id??0
                set_spectation.object_layer=cp.spectating?.layer??0
                set_spectation.has_object=cp.spectating!==undefined
                set_spectation.spectating=true

                cp.client.emit(set_spectation)
                cp.view_objects=[]
            }else if(cp.spectating&&!cp.player&&(cp.spectating.destroyed||cp.spectating.health_data.dead)){
                const set_spectation=new SetSpectationPacket()

                cp.spectating=cp.spectating.killer
                cp.player=false

                set_spectation.object_id=cp.spectating?.id??0
                set_spectation.object_layer=cp.spectating?.layer??0
                set_spectation.has_object=cp.spectating!==undefined
                set_spectation.spectating=true

                cp.client.emit(set_spectation)
                cp.view_objects=[]
            }
            const r=update_net(cp.client,this,cp.spectating,cp.main_player,cp.view_objects)

            cp.view_objects=r[1]
            cp.client.emit(r[0])
        }
        super.net_update(full)
    }
    activate_player(player:Player,client:Client,p:JoinPacket){
        player.name_data.name=p.player_name??"Player"

        this.player_clients[client.ID].spectating=player
        this.player_clients[client.ID].main_player=player
        this.player_clients[client.ID].player=true

        const packet=new SetSpectationPacket()
        packet.object_id=player.id
        packet.object_layer=player.layer
        packet.has_object=true
        packet.spectating=false
        client.emit(packet)
    }
    override handle_connection(client: Client, username: string): void {
        const joinned=new JoinnedPacket()
        joinned.map_size=this.arena.size

        this.player_clients[client.ID]={
            spectating:undefined,
            player:false,
            main_player:undefined,
            client:client,
            view_objects:[],
        }

        client.emit(joinned)
        client.on("join",(p:JoinPacket)=>{
            if(this.player_clients[client.ID].main_player&&this.player_clients[client.ID].player)return
            const player=new Player(client)
            this.scene_2d.objects.add_object(player,0)
            console.log("Player Connected Name: ",p.player_name,"Client ID: ",client.ID,"Player ID: ",player.id)
            this.activate_player(player,client,p)
        })
        client.on("input",(p:InputPacket)=>{
            if(this.player_clients[client.ID]&&this.player_clients[client.ID].main_player){
                this.player_clients[client.ID].main_player!.process_input(p)
            }
        })
        client.on("disconnect",(p:DisconnectPacket)=>{
            if(this.player_clients[client.ID]){
                if(this.player_clients[client.ID].main_player)this.player_clients[client.ID].main_player!.health_data.dead=true
                delete this.player_clients[client.ID]
            }
        })
    }
}