import {ClientGameObject2D} from "common/engine/client.ts"
import { type Game } from "./game.ts";
export abstract class GameObject extends ClientGameObject2D{
    declare game:Game
}