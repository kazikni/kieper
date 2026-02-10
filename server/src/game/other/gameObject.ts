import { BaseGameObject2D } from "common/engine/core.ts";
import { type Game } from "./game.ts";
export abstract class GameObject extends BaseGameObject2D{
    declare game:Game
}