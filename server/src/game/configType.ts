import { HostConfig } from "common/engine/core.ts";

export interface Config{
    game?:{
        host:HostConfig
    }
}