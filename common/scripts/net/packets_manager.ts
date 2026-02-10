import { PacketsManager } from "../../engine/core.ts";
import { InputPacket } from "./input_packet.ts";
import { JoinPacket } from "./join_packet.ts";
import { JoinnedPacket } from "./joinned_packet.ts";
import { SetSpectationPacket } from "./set_spectation.ts";
import { UpdatePacket } from "./update_packet.ts";

export const PacketManager:PacketsManager=new PacketsManager()
PacketManager.add_packet(JoinPacket)
PacketManager.add_packet(UpdatePacket)
PacketManager.add_packet(InputPacket)
PacketManager.add_packet(JoinnedPacket)
PacketManager.add_packet(SetSpectationPacket)