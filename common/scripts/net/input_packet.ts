import { Packet, v2, Vec2 } from "../../engine/core.ts";
import { NetStream } from "../../engine/core/net/stream.ts";

export class InputPacket extends Packet{
    override ID=3;
    override Name = "input"

    movement:Vec2=v2.zero()

    angle:number=0
    distance_to_pointer:number=0

    firing:boolean=false

    attribute:number=-1
    evolve_to:number=-1
    attribute_count:number=-1

    constructor(){
        super()
    }
    override encode(stream: NetStream): void {
        stream.writeBooleanGroup(this.firing)
        .writePos2(this.movement)
        .writeRad(this.angle)
        .writeFloat32(this.distance_to_pointer)
        .writeInt8(this.attribute)
        .writeInt8(this.attribute_count)
        .writeInt8(this.evolve_to)
    }
    override decode(stream: NetStream): void {
        const [firing] = stream.readBooleanGroup()
        this.firing=firing
        this.movement=stream.readPos2()
        this.angle=stream.readRad()
        this.distance_to_pointer=stream.readFloat32()
        this.attribute=stream.readInt8()
        this.attribute_count=stream.readInt8()
        this.evolve_to=stream.readInt8()
    }
}