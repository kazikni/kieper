import { Packet } from "../../engine/core.ts";
import { NetStream } from "../../engine/core/net/stream.ts";

export class JoinPacket extends Packet{
    override ID=1;
    override Name = "join"

    player_name:string=""
    constructor(){
        super()
    }
    override encode(stream: NetStream): void {
        stream.writeStringSized(30,this.player_name)
    }
    override decode(stream: NetStream): void {
        this.player_name=stream.readStringSized(30)
    }
}