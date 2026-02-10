import { Packet } from "../../engine/core.ts";
import { NetStream } from "../../engine/core/net/stream.ts";

export class SetSpectationPacket extends Packet{
    override ID=5
    override Name = "set_spectation"

    spectating:boolean=false
    has_object:boolean=true
    object_id:number=0
    object_layer:number=0
    constructor(){
        super()
    }
    override encode(stream: NetStream): void {
        stream.writeBooleanGroup(this.has_object,this.spectating)
        if(this.has_object){

            stream.writeID(this.object_id)
            stream.writeUint8(this.object_layer)
        }
    }
    override decode(stream: NetStream): void {
        const bg=stream.readBooleanGroup()
        this.has_object=bg[0]
        this.spectating=bg[1]
        if(this.has_object){
            this.object_id=stream.readID()
            this.object_layer=stream.readInt8()
        }
    }
}