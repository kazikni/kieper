import { Packet, v2, Vec2 } from "../../engine/core.ts";
import { NetStream } from "../../engine/core/net/stream.ts";

export class JoinnedPacket extends Packet{
    override ID=4
    override Name = "joinned"

    map_size:Vec2=v2.zero()
    constructor(){
        super()
    }
    override encode(stream: NetStream): void {
        stream.writePos2(this.map_size)
    }
    override decode(stream: NetStream): void {
        this.map_size=stream.readPos2()
    }
}