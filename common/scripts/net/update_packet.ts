import { UpdatePacketBase } from "../../engine/core.ts";
import { NetStream } from "../../engine/core/net/stream.ts";

export interface PrivateUpdateData{
    attributes:Record<number,number>
    evolutions:number[]
    score:number
}
export class UpdatePacket extends UpdatePacketBase<PrivateUpdateData>{
    ID=2
    Name="update"
    constructor(priv:PrivateUpdateData={attributes:{},evolutions:[],score:0}){
        super(priv)
    }
    override encode_private(stream: NetStream): void {
        stream.writeUint32(this.priv.score)
        stream.writeNumberDict(this.priv.attributes,(e)=>{
            stream.writeUint8(e)
        },1)
        stream.writeArray(this.priv.evolutions,(i)=>stream.writeUint16(i),1)
    }
    override decode_private(stream: NetStream): void {
        this.priv.score=stream.readUint32()
        this.priv.attributes=stream.readNumberDict(()=>{
            return stream.readUint8()
        },1)
        this.priv.evolutions=stream.readArray(()=>stream.readUint16(),1)
    }
}